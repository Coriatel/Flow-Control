import prisma from '../utils/prisma';
import { reagentService } from './reagentService';
import { AppError } from '../middleware/errorHandler';
import { BatchStatus, TransactionType } from '../types';

export interface CountEntry {
  reagentId: string;
  batchNumber?: string;
  countedQuantity: number;
  expiryDate?: Date;
  notes?: string;
}

export interface ReplenishmentData {
  reagentId: string;
  name: string;
  supplier: string;
  currentQuantity: number;
  averageUsage: number;
  monthsOfStock: number;
  suggestedQuantity: number;
  targetMonths: number;
}

class InventoryService {
  /**
   * Get or create current draft
   */
  async getCurrentDraft(userId?: string) {
    let draft = await prisma.inventoryCountDraft.findFirst({
      where: { status: 'DRAFT' },
      include: { entries: true },
      orderBy: { startedAt: 'desc' },
    });

    if (!draft) {
      draft = await prisma.inventoryCountDraft.create({
        data: {
          startedById: userId,
          status: 'DRAFT',
        },
        include: { entries: true },
      });
    }

    return draft;
  }

  /**
   * Save count entries to draft
   */
  async saveCountEntries(
    draftId: string,
    entries: CountEntry[]
  ): Promise<void> {
    // Delete existing entries for this draft
    await prisma.inventoryCountEntry.deleteMany({
      where: { countDraftId: draftId },
    });

    // Create new entries
    await prisma.inventoryCountEntry.createMany({
      data: entries.map((entry) => ({
        countDraftId: draftId,
        reagentId: entry.reagentId,
        batchNumber: entry.batchNumber,
        countedQuantity: entry.countedQuantity,
        expiryDate: entry.expiryDate,
        notes: entry.notes,
      })),
    });

    // Update draft status
    await prisma.inventoryCountDraft.update({
      where: { id: draftId },
      data: { status: 'IN_PROGRESS' },
    });
  }

  /**
   * Complete inventory count and update inventory
   */
  async completeCount(draftId: string, userId?: string): Promise<string> {
    const draft = await prisma.inventoryCountDraft.findUnique({
      where: { id: draftId },
      include: { entries: true },
    });

    if (!draft) {
      throw new AppError('Draft not found', 404);
    }

    if (draft.entries.length === 0) {
      throw new AppError('No entries in draft', 400);
    }

    // Start transaction
    return prisma.$transaction(async (tx) => {
      // Group entries by reagent
      const entriesByReagent = new Map<string, CountEntry[]>();
      for (const entry of draft.entries) {
        const list = entriesByReagent.get(entry.reagentId) || [];
        list.push({
          reagentId: entry.reagentId,
          batchNumber: entry.batchNumber || undefined,
          countedQuantity: Number(entry.countedQuantity),
          expiryDate: entry.expiryDate || undefined,
        });
        entriesByReagent.set(entry.reagentId, list);
      }

      // Process each reagent
      for (const [reagentId, entries] of entriesByReagent) {
        for (const entry of entries) {
          if (entry.batchNumber) {
            // Update existing batch or create new one
            const existingBatch = await tx.reagentBatch.findFirst({
              where: {
                reagentId,
                batchNumber: entry.batchNumber,
              },
            });

            if (existingBatch) {
              const delta = entry.countedQuantity - Number(existingBatch.currentQuantity);

              await tx.reagentBatch.update({
                where: { id: existingBatch.id },
                data: { currentQuantity: entry.countedQuantity },
              });

              // Log transaction
              await tx.inventoryTransaction.create({
                data: {
                  reagentId,
                  batchId: existingBatch.id,
                  transactionType: 'ADJUSTMENT',
                  quantityDelta: delta,
                  sourceType: 'inventory_count',
                  sourceId: draftId,
                  performedById: userId,
                  notes: 'Inventory count adjustment',
                },
              });
            } else if (entry.expiryDate) {
              // Create new batch
              const newBatch = await tx.reagentBatch.create({
                data: {
                  reagentId,
                  batchNumber: entry.batchNumber,
                  expiryDate: entry.expiryDate,
                  initialQuantity: entry.countedQuantity,
                  currentQuantity: entry.countedQuantity,
                  receivedDate: new Date(),
                  status: 'ACTIVE',
                },
              });

              await tx.inventoryTransaction.create({
                data: {
                  reagentId,
                  batchId: newBatch.id,
                  transactionType: 'ADJUSTMENT',
                  quantityDelta: entry.countedQuantity,
                  sourceType: 'inventory_count',
                  sourceId: draftId,
                  performedById: userId,
                  notes: 'New batch from inventory count',
                },
              });
            }
          }
        }

        // Update reagent aggregates
        await this.updateReagentAggregates(tx, reagentId);
      }

      // Create completed count record
      const completed = await tx.completedInventoryCount.create({
        data: {
          countDate: draft.startedAt,
          totalReagentsCounted: entriesByReagent.size,
          totalBatchesCounted: draft.entries.length,
          completedById: userId,
        },
      });

      // Mark draft as completed
      await tx.inventoryCountDraft.update({
        where: { id: draftId },
        data: { status: 'COMPLETED' },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId,
          action: 'inventory_count',
          entityType: 'inventory_count',
          entityId: completed.id,
          details: {
            reagentsCount: entriesByReagent.size,
            batchesCount: draft.entries.length,
          },
        },
      });

      return completed.id;
    });
  }

  /**
   * Get inventory count history
   */
  async getCountHistory(limit = 10) {
    return prisma.completedInventoryCount.findMany({
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Calculate replenishment suggestions
   */
  async calculateReplenishment(targetMonths = 3): Promise<ReplenishmentData[]> {
    const reagents = await prisma.reagent.findMany({
      where: {
        isDeleted: false,
        OR: [
          { averageMonthlyUsage: { gt: 0 } },
          { manualMonthlyUsage: { gt: 0 } },
        ],
      },
      include: {
        supplier: { select: { name: true } },
      },
    });

    return reagents
      .map((r) => {
        const avgUsage = r.useManualUsage
          ? Number(r.manualMonthlyUsage || 0)
          : Number(r.averageMonthlyUsage || 0);

        const currentQty = Number(r.totalQuantity);
        const monthsOfStock = avgUsage > 0 ? currentQty / avgUsage : 999;
        const targetQty = avgUsage * targetMonths;
        const suggestedQty = Math.max(0, targetQty - currentQty);

        return {
          reagentId: r.id,
          name: r.name,
          supplier: r.supplier.name,
          currentQuantity: currentQty,
          averageUsage: avgUsage,
          monthsOfStock: Math.round(monthsOfStock * 10) / 10,
          suggestedQuantity: Math.ceil(suggestedQty),
          targetMonths,
        };
      })
      .filter((r) => r.suggestedQuantity > 0)
      .sort((a, b) => a.monthsOfStock - b.monthsOfStock);
  }

  /**
   * Get transactions for a reagent
   */
  async getTransactions(
    reagentId: string,
    options?: { limit?: number; offset?: number }
  ) {
    return prisma.inventoryTransaction.findMany({
      where: { reagentId },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: {
        batch: { select: { batchNumber: true } },
      },
    });
  }

  /**
   * Update reagent aggregates (internal helper)
   */
  private async updateReagentAggregates(tx: any, reagentId: string) {
    const batches = await tx.reagentBatch.findMany({
      where: {
        reagentId,
        status: 'ACTIVE',
      },
      orderBy: { expiryDate: 'asc' },
    });

    const totalQuantity = batches.reduce(
      (sum: number, b: any) => sum + Number(b.currentQuantity),
      0
    );

    const reagent = await tx.reagent.findUnique({ where: { id: reagentId } });
    const monthlyUsage = reagent?.useManualUsage
      ? Number(reagent.manualMonthlyUsage || 0)
      : Number(reagent?.averageMonthlyUsage || 0);

    let stockStatus = 'NORMAL';
    let monthsOfStock = null;

    if (totalQuantity === 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (monthlyUsage > 0) {
      monthsOfStock = totalQuantity / monthlyUsage;
      if (monthsOfStock < 1) stockStatus = 'CRITICAL';
      else if (monthsOfStock < 2) stockStatus = 'LOW';
    }

    await tx.reagent.update({
      where: { id: reagentId },
      data: {
        totalQuantity,
        activeBatchesCount: batches.length,
        nearestExpiryDate: batches[0]?.expiryDate || null,
        currentStockStatus: stockStatus,
        monthsOfStock,
      },
    });
  }
}

export const inventoryService = new InventoryService();
