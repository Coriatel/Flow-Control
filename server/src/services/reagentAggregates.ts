import prisma from '../utils/prisma';
import { StockStatus } from '../types';

/**
 * Canonical reagent aggregates updater.
 * Call this after EVERY stock-changing action (receipt, dispense, destroy, expire, count adjustment).
 * Updates: totalQuantity, activeBatchesCount, nearestExpiryDate, monthsOfStock, currentStockStatus, averageMonthlyUsage.
 *
 * Accepts an optional Prisma transaction client (`tx`). When called inside a $transaction,
 * pass the tx object so the aggregates update is atomic with the surrounding writes.
 */
export async function updateReagentAggregates(
  reagentId: string,
  tx?: any
): Promise<void> {
  const client = tx || prisma;

  const physicalBatches = await client.reagentBatch.findMany({
    where: {
      reagentId,
      status: { in: ['ACTIVE', 'INCOMING', 'ON_HOLD', 'EXPIRED'] },
      currentQuantity: { gt: 0 },
    },
    orderBy: { expiryDate: 'asc' },
  });
  const activeBatches = physicalBatches.filter(
    (batch: any) => batch.status === 'ACTIVE'
  );

  // Round A defines the reagent aggregate as physical on-hand. QA and expiry
  // affect availability, but must not make stock disappear from physical totals.
  const totalQuantity = physicalBatches.reduce(
    (sum: number, b: any) => sum + Number(b.currentQuantity),
    0
  );
  const activeBatchesCount = activeBatches.length;
  const nearestExpiryDate = activeBatches[0]?.expiryDate || null;

  // Fetch reagent to determine which usage figure to use
  const reagent = await client.reagent.findUnique({ where: { id: reagentId } });
  if (!reagent) return;

  // Calculate rolling average monthly usage from consumption history
  const averageMonthlyUsage = await calculateAverageUsage(reagentId, client);

  // Determine effective monthly usage (manual override or calculated)
  const effectiveUsage =
    reagent.useManualUsage && Number(reagent.manualMonthlyUsage || 0) > 0
      ? Number(reagent.manualMonthlyUsage)
      : averageMonthlyUsage;

  // Calculate months of stock and status.
  // Hybrid policy: when a per-reagent minimum stock level (minStockLevel) is set,
  // it is the reorder point — below it the reagent is CRITICAL (must order),
  // within 25% above it LOW. Otherwise fall back to months-of-stock thresholds.
  let monthsOfStock: number | null = null;
  let currentStockStatus: string = StockStatus.NORMAL;

  if (effectiveUsage > 0) {
    monthsOfStock = totalQuantity / effectiveUsage;
  }

  const minLevel = Number(reagent.minStockLevel ?? 0);

  if (totalQuantity === 0) {
    currentStockStatus = StockStatus.OUT_OF_STOCK;
    monthsOfStock = 0;
  } else if (minLevel > 0) {
    if (totalQuantity < minLevel) {
      currentStockStatus = StockStatus.CRITICAL;
    } else if (totalQuantity < minLevel * 1.25) {
      currentStockStatus = StockStatus.LOW;
    }
  } else if (effectiveUsage > 0 && monthsOfStock !== null) {
    if (monthsOfStock < 1) {
      currentStockStatus = StockStatus.CRITICAL;
    } else if (monthsOfStock < 2) {
      currentStockStatus = StockStatus.LOW;
    }
  }

  await client.reagent.update({
    where: { id: reagentId },
    data: {
      totalQuantity,
      activeBatchesCount,
      nearestExpiryDate,
      currentStockStatus,
      monthsOfStock,
      averageMonthlyUsage,
    },
  });
}

/**
 * Calculate rolling average monthly usage from InventoryTransaction records.
 * Uses a window of min 3 months, expanding up to 6 months when data is available.
 * Considers CONSUMPTION, WITHDRAWAL, DESTRUCTION, and ADJUSTMENT (negative) transaction types.
 */
async function calculateAverageUsage(
  reagentId: string,
  client: any
): Promise<number> {
  const now = new Date();

  // Look back up to 6 months
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  // Fetch all stock-out transactions in the last 6 months
  const transactions = await client.inventoryTransaction.findMany({
    where: {
      reagentId,
      createdAt: { gte: sixMonthsAgo },
      transactionType: {
        in: ['CONSUMPTION', 'WITHDRAWAL', 'DESTRUCTION', 'TRANSFER_OUT'],
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Also include negative ADJUSTMENTs (inventory count decreases)
  const adjustments = await client.inventoryTransaction.findMany({
    where: {
      reagentId,
      createdAt: { gte: sixMonthsAgo },
      transactionType: 'ADJUSTMENT',
      quantityDelta: { lt: 0 },
    },
  });

  const allOutflows = [...transactions, ...adjustments];

  if (allOutflows.length === 0) {
    return 0;
  }

  // Sum absolute outflow quantities
  const totalOutflow = allOutflows.reduce(
    (sum, t) => sum + Math.abs(Number(t.quantityDelta)),
    0
  );

  // Determine the effective window in months
  const earliestTx = allOutflows.reduce(
    (earliest, t) => (t.createdAt < earliest ? t.createdAt : earliest),
    allOutflows[0].createdAt
  );

  const msElapsed = now.getTime() - new Date(earliestTx).getTime();
  const monthsElapsed = msElapsed / (30.44 * 24 * 60 * 60 * 1000); // average days per month

  // Require minimum 3 months of data for meaningful average.
  // If less than 3 months of data, extrapolate from available period.
  const effectiveMonths = Math.max(monthsElapsed, 1); // at least 1 month to avoid division by zero
  const windowMonths = Math.min(effectiveMonths, 6);

  // Filter to only include transactions within the effective window
  const windowStart = new Date(now);
  windowStart.setMonth(windowStart.getMonth() - Math.ceil(windowMonths));

  const windowOutflow = allOutflows
    .filter((t) => new Date(t.createdAt) >= windowStart)
    .reduce((sum, t) => sum + Math.abs(Number(t.quantityDelta)), 0);

  const average = windowOutflow / windowMonths;

  // Round to 2 decimal places
  return Math.round(average * 100) / 100;
}
