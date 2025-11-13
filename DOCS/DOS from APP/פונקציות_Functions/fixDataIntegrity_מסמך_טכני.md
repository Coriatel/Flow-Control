# מסמך טכני - תיקון שלמות נתונים

**תאריך עדכון:** 10.11.2025
**גרסה:** 1.0
**נתיב:** functions/fixDataIntegrity.js

---

# מסמך טכני - fixDataIntegrity

## Implementation

```javascript
async function fixDataIntegrity({ dry_run = true }) {
  const fixes = [];
  
  // 1. Fix orphaned DeliveryItems
  const allDeliveries = await Delivery.list();
  const validDeliveryIds = new Set(allDeliveries.map(d => d.id));
  const allDeliveryItems = await DeliveryItem.list();
  
  for (const item of allDeliveryItems) {
    if (!validDeliveryIds.has(item.delivery_id)) {
      if (!dry_run) {
        await DeliveryItem.delete(item.id);
      }
      fixes.push({
        type: 'orphaned_delivery_item',
        action: 'deleted',
        item_id: item.id
      });
    }
  }
  
  // 2. Fix Reagent summaries
  const reagents = await Reagent.list();
  for (const r of reagents) {
    const batches = await ReagentBatch.filter({ 
      reagent_id: r.id, 
      status: 'active' 
    });
    
    const actualTotal = batches.reduce((sum, b) => sum + b.current_quantity, 0);
    
    if (actualTotal !== r.total_quantity_all_batches) {
      if (!dry_run) {
        await Reagent.update(r.id, {
          total_quantity_all_batches: actualTotal,
          active_batches_count: batches.length
        });
      }
      fixes.push({
        type: 'incorrect_summary',
        reagent_id: r.id,
        old_value: r.total_quantity_all_batches,
        new_value: actualTotal
      });
    }
  }
  
  // 3. Fix negative quantities
  const negativeBatches = await ReagentBatch.filter({
    current_quantity: { $lt: 0 }
  });
  
  for (const batch of negativeBatches) {
    if (!dry_run) {
      await ReagentBatch.update(batch.id, { current_quantity: 0 });
      await InventoryTransaction.create({
        reagent_id: batch.reagent_id,
        transaction_type: 'inventory_correction',
        quantity: -batch.current_quantity,
        batch_number: batch.batch_number,
        notes: 'תיקון כמות שלילית אוטומטי'
      });
    }
    fixes.push({
      type: 'negative_quantity',
      batch_id: batch.id,
      corrected_from: batch.current_quantity
    });
  }
  
  return {
    dry_run,
    fixes_count: fixes.length,
    fixes
  };
}
```