
import { Reagent } from '@/api/entities';
import { ReagentBatch } from '@/api/entities';
import { InventoryTransaction } from '@/api/entities';
import { CompletedInventoryCount } from '@/api/entities';
import { InventoryCountDraft } from '@/api/entities';

/**
 * Processes inventory entries for a single reagent, updating batches,
 * creating transactions, and updating reagent summary data.
 * It also returns a snapshot of the processed batches for the completed count record.
 *
 * @param {Reagent} reagent The reagent entity being processed.
 * @param {Array<Object>} entries An array of entry objects for this reagent (from meaningfulEntries).
 *                                Each entry should have { batch_number, expiry_date, quantity }.
 * @param {string} userId The ID of the user performing the count, used for new batch creation.
 * @returns {Promise<Object>} An object containing success status, error message (if any),
 *                            and reagentEntriesSnapshot for the completed count record.
 */
const processReagentEntry = async (reagent, entries, userId) => {
  console.log(`Processing reagent ${reagent.name} (ID: ${reagent.id}) with ${entries.length} entries`);

  // This will hold the data needed for completedCountData.entries[reagent.id]
  const reagentEntrySnapshot = {
    reagent_name_snapshot: reagent.name,
    batches: {}
  };

  try {
    // Get current active batches for this reagent
    const currentBatches = await ReagentBatch.filter({
      reagent_id: reagent.id,
      status: 'active'
    });

    // Map current batches by batch_number for quick lookup and to track processed batches
    // Using batch_number as key for currentBatchMap to quickly find existing ones by number
    const currentBatchMap = new Map();
    for (const batch of currentBatches) {
        currentBatchMap.set(batch.batch_number, batch);
    }
    const processedBatchNumbers = new Set();

    // Process each entry from the count
    for (const entry of entries) {
      const batchNumber = entry.batch_number?.trim();
      const expiryDate = entry.expiry_date;
      const countedQuantity = parseInt(entry.quantity) || 0;

      if (!batchNumber) {
        console.warn(`Skipping entry with empty batch number for reagent ${reagent.id}`);
        continue;
      }

      // Mark this batch number as processed in the current count
      processedBatchNumbers.add(batchNumber);

      const batchKey = `${batchNumber}_${expiryDate}`; // Use a composite key for the snapshot to handle different expiry dates for same batch number

      // Find existing batch with this batch number
      const existingBatch = currentBatchMap.get(batchNumber);
      let previousQuantity = 0;

      if (existingBatch) {
        previousQuantity = existingBatch.current_quantity || 0;
        // Update existing batch
        await ReagentBatch.update(existingBatch.id, {
          current_quantity: countedQuantity,
          expiry_date: expiryDate || existingBatch.expiry_date, // Preserve existing expiry if new one is not provided
          status: countedQuantity > 0 ? 'active' : 'consumed'
        });
        console.log(`Updated batch ${existingBatch.id} (${batchNumber}) with quantity ${countedQuantity}`);

      } else if (countedQuantity > 0) {
        // Create new batch - CRITICAL FIX: Include reagent_id
        const newBatchData = {
          reagent_id: reagent.id, // CRITICAL FIX: Add missing reagent_id
          catalog_item_id: reagent.catalog_item_id,
          batch_number: batchNumber,
          expiry_date: expiryDate,
          current_quantity: countedQuantity,
          initial_quantity: countedQuantity, // Initial quantity is the same as current for new batches from count
          status: 'active',
          received_date: new Date().toISOString().split('T')[0],
          received_by: userId || 'inventory_count_system'
        };

        const newBatch = await ReagentBatch.create(newBatchData);
        console.log(`Created new batch ${newBatch.id} (${batchNumber})`);
      }

      // Populate snapshot data for this entry regardless of update or creation
      // This is crucial for reconstructing the completed_count_data.entries
      reagentEntrySnapshot.batches[batchKey] = {
        batch_number_snapshot: batchNumber,
        expiry_date_snapshot: expiryDate,
        counted_quantity: countedQuantity,
        previous_quantity: previousQuantity
      };
    }

    // Handle batches that were not present in the new count entries
    // These should be set to zero quantity and 'consumed' status if they were active
    for (const batch of currentBatches) {
      if (!processedBatchNumbers.has(batch.batch_number)) {
        console.log(`Batch ${batch.batch_number} (${batch.id}) was not counted, setting quantity to 0`);
        if (batch.current_quantity > 0) { // Only update if it had a positive quantity
          await ReagentBatch.update(batch.id, {
            current_quantity: 0,
            status: 'consumed'
          });
        }

        // Add to snapshot if not already added from the current count entries
        const batchKey = `${batch.batch_number}_${batch.expiry_date}`;
        if (!reagentEntrySnapshot.batches[batchKey]) { // Ensure we don't overwrite if it was somehow processed (unlikely but safe)
          reagentEntrySnapshot.batches[batchKey] = {
            batch_number_snapshot: batch.batch_number,
            expiry_date_snapshot: batch.expiry_date,
            counted_quantity: 0,
            previous_quantity: batch.current_quantity || 0 // Store its previous quantity before being zeroed out
          };
        }
      }
    }

    // Update reagent totals AFTER all batch changes are done
    // This function will re-calculate total_quantity, active_batches_count, nearest_expiry_date etc.
    await updateReagentTotals(reagent);

    // Create a summary inventory transaction for the whole reagent count
    // Fetch the updated reagent data to get accurate final totals for the transaction notes
    const updatedReagent = await Reagent.get(reagent.id); 
    const transactionData = {
      reagent_id: reagent.id,
      transaction_type: 'count_update',
      quantity: updatedReagent.total_quantity_all_batches, // Total quantity after count
      notes: `ספירת מלאי: עודכן מלאי כולל ל-${updatedReagent.total_quantity_all_batches} יחידות ב-${updatedReagent.active_batches_count} אצוות פעילות`
    };
    await InventoryTransaction.create(transactionData);
    console.log(`Created summary inventory transaction for reagent ${reagent.id}`);

    return {
      success: true,
      reagentEntriesSnapshot: reagentEntrySnapshot
    };

  } catch (error) {
    console.error(`Error processing reagent ${reagent.id}:`, error);
    return {
      success: false,
      error: error.message,
      reagentEntriesSnapshot: null // No valid snapshot on error
    };
  }
};

// Server-side processing for inventory count completion
export async function processCompletedCount(payload, { runOnServer = true } = {}) {
  const { meaningfulEntries, currentDraftId, userId } = payload;

  console.log("processCompletedCount: Starting server-side processing", {
    meaningfulEntriesCount: Object.keys(meaningfulEntries || {}).length,
    currentDraftId,
    userId,
    runOnServer
  });

  try {
    // Get all reagents in the system
    const allReagents = await Reagent.list();
    console.log(`Found ${allReagents.length} reagents in system`);

    if (!Array.isArray(allReagents) || allReagents.length === 0) {
      throw new Error("No reagents found in system");
    }

    // Filter out invalid reagents (missing required fields)
    const validReagents = allReagents.filter(reagent => {
      const isValid = reagent.catalog_item_id && reagent.catalog_number && reagent.name;
      if (!isValid) {
        console.warn(`Skipping invalid reagent ${reagent.id}: missing required fields`);
      }
      return isValid;
    });

    console.log(`Processing ${validReagents.length} valid reagents out of ${allReagents.length} total`);

    // Create completed count record first
    const completedCountData = {
      count_date: new Date().toISOString().split('T')[0],
      csv_generated: true,
      reagent_updates_completed: false,
      reagents_updated_count: 0,
      reagents_total_count: validReagents.length,
      entries: {} // This will be populated by processReagentEntry results
    };

    let processedCount = 0;
    let errors = [];

    // Process each valid reagent
    for (const reagent of validReagents) {
      try {
        // Pass the reagent object, the entries for it (or empty array if none), and the userId
        const entriesForReagent = meaningfulEntries[reagent.id] || [];
        const result = await processReagentEntry(reagent, entriesForReagent, userId);

        if (result.success) {
          processedCount++;
          // If successful, store the generated snapshot in completedCountData.entries
          if (result.reagentEntriesSnapshot) {
            completedCountData.entries[reagent.id] = result.reagentEntriesSnapshot;
          }
        } else {
          // If processing failed for this reagent, add to errors
          errors.push(`Failed to process ${reagent.name}: ${result.error}`);
        }

        // Rate limiting to prevent server overload
        if (processedCount % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

      } catch (reagentError) {
        console.error(`Error processing reagent ${reagent.id}:`, reagentError);
        errors.push(`Failed to process ${reagent.name}: ${reagentError.message}`);
      }
    }

    // Create the completed count record with the accumulated entries
    const completedCount = await CompletedInventoryCount.create(completedCountData);
    console.log(`Created completed count record: ${completedCount.id}`);

    // Update completion status
    await CompletedInventoryCount.update(completedCount.id, {
      reagent_updates_completed: true,
      reagents_updated_count: processedCount,
      reagents_total_count: validReagents.length
    });

    // Clean up draft
    if (currentDraftId) {
      try {
        await InventoryCountDraft.delete(currentDraftId);
        console.log(`Deleted draft: ${currentDraftId}`);
      } catch (draftError) {
        console.warn("Error cleaning up draft:", draftError);
      }
    }

    const success = errors.length < validReagents.length / 2; // Success if less than half failed

    return {
      success,
      message: success
        ? `ספירת מלאי הושלמה בהצלחה! עודכנו ${processedCount} פריטים מתוך ${validReagents.length}.`
        : `ספירת מלאי הושלמה עם שגיאות. עודכנו ${processedCount} פריטים מתוך ${validReagents.length}.`,
      errors,
      processedCount,
      totalCount: validReagents.length,
      completedCountId: completedCount.id
    };

  } catch (error) {
    console.error("Critical error in processCompletedCount:", error);
    return {
      success: false,
      message: `שגיאה קריטית בעיבוד ספירת המלאי: ${error.message}`,
      errors: [error.message],
      processedCount: 0,
      totalCount: 0
    };
  }
}

// Update reagent summary fields
async function updateReagentTotals(reagent) {
  try {
    // Get current reagent data to preserve all fields
    const currentReagent = await Reagent.get(reagent.id);

    // Get all active batches
    const activeBatches = await ReagentBatch.filter({
      reagent_id: reagent.id,
      status: 'active'
    });

    // Calculate totals
    const totalQuantity = activeBatches.reduce((sum, batch) => sum + (batch.current_quantity || 0), 0);
    const activeBatchesCount = activeBatches.length;

    // Find nearest expiry date
    const validExpiryDates = activeBatches
      .map(batch => batch.expiry_date)
      .filter(date => date)
      .map(date => new Date(date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b);

    const nearestExpiryDate = validExpiryDates.length > 0
      ? validExpiryDates[0].toISOString().split('T')[0]
      : null;

    // Preserve the oldest batch date if it exists, or set it to nearest expiry if no other
    let oldestBatchDate = currentReagent.oldest_batch_date;
    if (!oldestBatchDate && nearestExpiryDate) {
        oldestBatchDate = nearestExpiryDate;
    } else if (nearestExpiryDate && oldestBatchDate && new Date(nearestExpiryDate) < new Date(oldestBatchDate)) {
        oldestBatchDate = nearestExpiryDate; // Update if a new, earlier expiry is found
    }

    // Update with ALL required fields preserved
    const updateData = {
      // Required fields from the currentReagent snapshot
      name: currentReagent.name,
      category: currentReagent.category,
      supplier: currentReagent.supplier,
      catalog_item_id: currentReagent.catalog_item_id,
      catalog_number: currentReagent.catalog_number,

      // Updated calculated fields
      total_quantity_all_batches: totalQuantity,
      active_batches_count: activeBatchesCount,
      nearest_expiry_date: nearestExpiryDate,
      oldest_batch_date: oldestBatchDate, // Update oldest batch date
      last_count_date: new Date().toISOString().split('T')[0], // Set last count date to now
      current_stock_status: totalQuantity > 0 ? 'in_stock' : 'out_of_stock',
      available_quantity: Math.max(0, totalQuantity - (currentReagent.reservation_quantity || 0)),

      // Preserve all other existing fields
      ...(currentReagent.item_number !== undefined && { item_number: currentReagent.item_number }),
      ...(currentReagent.notes && { notes: currentReagent.notes }),
      ...(currentReagent.custom_storage_location && { custom_storage_location: currentReagent.custom_storage_location }),
      ...(currentReagent.custom_min_stock !== undefined && { custom_min_stock: currentReagent.custom_min_stock }),
      ...(currentReagent.custom_max_stock !== undefined && { custom_max_stock: currentReagent.custom_max_stock }),
      ...(currentReagent.is_critical !== undefined && { is_critical: currentReagent.is_critical }),
      ...(currentReagent.alternative_reagents && { alternative_reagents: currentReagent.alternative_reagents }),
      ...(currentReagent.reservation_quantity !== undefined && { reservation_quantity: currentReagent.reservation_quantity || 0 }),
      ...(currentReagent.average_monthly_usage !== undefined && { average_monthly_usage: currentReagent.average_monthly_usage || 0 }),
      ...(currentReagent.reorder_suggestion !== undefined && { reorder_suggestion: currentReagent.reorder_suggestion || false }),
      ...(currentReagent.suggested_order_quantity !== undefined && { suggested_order_quantity: currentReagent.suggested_order_quantity || 0 }),
      ...(currentReagent.last_transaction_date && { last_transaction_date: currentReagent.last_transaction_date })
    };

    await Reagent.update(reagent.id, updateData);
    console.log(`Updated reagent totals for ${reagent.name}: ${totalQuantity} units in ${activeBatchesCount} batches`);

  } catch (error) {
    console.error(`Error updating totals for reagent ${reagent.id}:`, error);
    throw error;
  }
}


// For retrying failed inventory count updates (for Dashboard usage)
export async function retryProcessCompletedCount(payload) {
  const { completedCountId, userId } = payload;

  try {
    console.log(`Retrying inventory count processing for completed count: ${completedCountId}`);

    // Get the completed count data
    const completedCount = await CompletedInventoryCount.get(completedCountId);
    if (!completedCount || !completedCount.entries) {
      throw new Error("Completed count not found or has no entries");
    }

    // Get all reagents
    const allReagents = await Reagent.list();

    let processedCount = 0;
    let errors = [];

    // Process each reagent based on the completed count entries
    for (const reagent of allReagents) {
      try {
        if (completedCount.entries[reagent.id]) {
          const entryData = completedCount.entries[reagent.id];
          // Transform the stored snapshot format into the `entries` array format expected by processReagentEntry
          const transformedEntries = Object.values(entryData.batches).map(batch => ({
            batch_number: batch.batch_number_snapshot,
            expiry_date: batch.expiry_date_snapshot,
            quantity: batch.counted_quantity
          }));
          // Use the unified processReagentEntry function for retries
          const result = await processReagentEntry(reagent, transformedEntries, userId);
          if (result.success) {
            processedCount++;
          } else {
            errors.push(`Failed to retry ${reagent.name}: ${result.error}`);
          }
        } else {
          // If a reagent is not found in the completed count entries, it implies a zero count.
          // Call processReagentEntry with an empty array to zero out its batches.
          const result = await processReagentEntry(reagent, [], userId);
          if (result.success) {
            processedCount++;
          } else {
            errors.push(`Failed to retry zeroing out ${reagent.name}: ${result.error}`);
          }
        }

        // Rate limiting
        if (processedCount % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

      } catch (reagentError) {
        console.error(`Error retrying reagent ${reagent.id}:`, reagentError);
        errors.push(`Failed to retry ${reagent.name}: ${reagentError.message}`);
      }
    }

    // Update completion status
    await CompletedInventoryCount.update(completedCountId, {
      reagent_updates_completed: true,
      reagents_updated_count: processedCount,
      reagents_total_count: allReagents.length
    });

    return {
      success: errors.length < allReagents.length / 2,
      message: `עדכון חוזר הושלם: ${processedCount} פריטים עודכנו מתוך ${allReagents.length}.`,
      errors,
      processedCount,
      totalCount: allReagents.length
    };

  } catch (error) {
    console.error("Error in retryProcessCompletedCount:", error);
    return {
      success: false,
      message: `שגיאה בעדכון חוזר: ${error.message}`,
      errors: [error.message]
    };
  }
}
