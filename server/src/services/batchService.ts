import prisma from "../utils/prisma";
import { BatchStatus, TransactionType } from "../types";
import { updateReagentAggregates } from "./reagentAggregates";

export interface BatchFilters {
  reagentId?: string;
  status?: BatchStatus;
  expiringWithinDays?: number;
}

export interface CreateBatchInput {
  reagentId: string;
  batchNumber: string;
  expiryDate: Date;
  initialQuantity: number;
  receivedDate?: Date;
  notes?: string;
}

export interface UpdateBatchInput {
  currentQuantity?: number;
  status?: BatchStatus;
  notes?: string;
}

export interface WithdrawInput {
  batchId: string;
  quantity: number;
  performedBy?: string;
  notes?: string;
}

export const batchService = {
  /**
   * Get all batches with optional filters (simplified for basic pg client)
   */
  async getAll(filters: BatchFilters = {}) {
    const where: any = {};

    if (filters.reagentId) {
      where.reagentId = filters.reagentId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
      where.expiryDate = {
        lte: futureDate,
      };
      where.status = "ACTIVE";
    }

    const batches = await prisma.reagentBatch.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    });

    // Manually add reagent and supplier info
    const results = [];
    for (const batch of batches) {
      const reagent = await prisma.reagent.findUnique({
        where: { id: batch.reagentId },
      });
      let supplier = null;
      if (reagent?.supplierId) {
        supplier = await prisma.supplier.findUnique({
          where: { id: reagent.supplierId },
        });
      }
      results.push({
        ...batch,
        reagent: reagent ? { ...reagent, supplier } : null,
      });
    }

    return results;
  },

  /**
   * Get batch by ID (simplified for basic pg client)
   */
  async getById(id: string) {
    const batch = await prisma.reagentBatch.findUnique({ where: { id } });
    if (!batch) return null;

    const reagent = await prisma.reagent.findUnique({
      where: { id: batch.reagentId },
    });

    let supplier = null;
    if (reagent?.supplierId) {
      supplier = await prisma.supplier.findUnique({
        where: { id: reagent.supplierId },
      });
    }

    const transactions = await prisma.inventoryTransaction.findMany({
      where: { batchId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return {
      ...batch,
      reagent: reagent ? { ...reagent, supplier } : null,
      transactions,
    };
  },

  /**
   * Create a new batch (simplified for basic pg client)
   */
  async create(data: CreateBatchInput) {
    const batch = await prisma.reagentBatch.create({
      data: {
        reagentId: data.reagentId,
        batchNumber: data.batchNumber,
        expiryDate: data.expiryDate,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        receivedDate: data.receivedDate || new Date(),
        status: "ACTIVE",
        generalNotes: data.notes,
      },
    });

    // Create receiving transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: data.reagentId,
        batchId: batch.id,
        transactionType: TransactionType.RECEIPT,
        quantityDelta: data.initialQuantity,
        notes: `קבלת אצווה ${data.batchNumber}`,
      },
    });

    // Update reagent aggregates
    await this.updateReagentAggregates(data.reagentId);

    // Get reagent for return value
    const reagent = await prisma.reagent.findUnique({
      where: { id: data.reagentId },
    });

    return { ...batch, reagent };
  },

  /**
   * Update batch (simplified for basic pg client)
   */
  async update(id: string, data: UpdateBatchInput) {
    const batch = await prisma.reagentBatch.update({
      where: { id },
      data,
    });

    // Update reagent aggregates
    await this.updateReagentAggregates(batch.reagentId);

    const reagent = await prisma.reagent.findUnique({
      where: { id: batch.reagentId },
    });

    return { ...batch, reagent };
  },

  /**
   * Withdraw quantity from batch (simplified for basic pg client)
   */
  async withdraw(input: WithdrawInput) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id: input.batchId },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    if (batch.status !== "ACTIVE") {
      throw new Error("Cannot withdraw from inactive batch");
    }

    const currentQty = Number(batch.currentQuantity);
    if (input.quantity > currentQty) {
      throw new Error(
        `Insufficient quantity. Available: ${currentQty}, Requested: ${input.quantity}`,
      );
    }

    const newQuantity = currentQty - input.quantity;
    const newStatus = newQuantity === 0 ? "CONSUMED" : "ACTIVE";

    // Update batch
    const updatedBatch = await prisma.reagentBatch.update({
      where: { id: input.batchId },
      data: {
        currentQuantity: newQuantity,
        status: newStatus as BatchStatus,
      },
    });

    // Create withdrawal transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: batch.reagentId,
        batchId: batch.id,
        transactionType: TransactionType.WITHDRAWAL,
        quantityDelta: -input.quantity,
        performedById: input.performedBy,
        notes: input.notes,
      },
    });

    // Update reagent aggregates
    await this.updateReagentAggregates(batch.reagentId);

    const reagent = await prisma.reagent.findUnique({
      where: { id: batch.reagentId },
    });

    return { ...updatedBatch, reagent };
  },

  /**
   * Mark batch as expired
   */
  async markExpired(id: string) {
    const batch = await prisma.reagentBatch.update({
      where: { id },
      data: {
        status: "EXPIRED",
      },
    });

    await this.updateReagentAggregates(batch.reagentId);

    return batch;
  },

  /**
   * Mark batch as destroyed/disposed
   */
  async markDestroyed(id: string, destroyedQuantity?: number, notes?: string) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    const qtyToDestroy = destroyedQuantity || Number(batch.currentQuantity);

    const updatedBatch = await prisma.reagentBatch.update({
      where: { id },
      data: {
        status: "DESTROYED",
        currentQuantity: 0,
      },
    });

    // Create disposal transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: batch.reagentId,
        batchId: batch.id,
        transactionType: TransactionType.DESTRUCTION,
        quantityDelta: -qtyToDestroy,
        notes: notes || "השמדת אצווה",
      },
    });

    await this.updateReagentAggregates(batch.reagentId);

    return updatedBatch;
  },

  /**
   * Get batches expiring soon for a category (simplified for basic pg client)
   */
  async getExpiringSoon(daysThreshold: number, category?: string) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);
    const today = new Date();

    // Get all active batches expiring within threshold
    const batches = await prisma.reagentBatch.findMany({
      where: {
        expiryDate: { lte: futureDate },
        status: "ACTIVE",
      },
      orderBy: { expiryDate: "asc" },
    });

    // Filter by expiry >= today and optionally by category
    const results = [];
    for (const batch of batches) {
      if (batch.expiryDate < today) continue;

      const reagent = await prisma.reagent.findUnique({
        where: { id: batch.reagentId },
      });

      if (!reagent) continue;

      // Filter by category if specified
      if (category && reagent.category !== category) continue;

      let supplier = null;
      if (reagent.supplierId) {
        supplier = await prisma.supplier.findUnique({
          where: { id: reagent.supplierId },
        });
      }

      results.push({
        ...batch,
        reagent: { ...reagent, supplier },
      });
    }

    return results;
  },

  /**
   * Update reagent aggregate fields after batch changes (delegates to canonical implementation)
   */
  async updateReagentAggregates(reagentId: string) {
    await updateReagentAggregates(reagentId);
  },

  /**
   * Process expired batches (scheduled job)
   */
  async processExpiredBatches() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiredBatches = await prisma.reagentBatch.findMany({
      where: {
        expiryDate: {
          lt: today,
        },
        status: "ACTIVE",
      },
    });

    for (const batch of expiredBatches) {
      await prisma.reagentBatch.update({
        where: { id: batch.id },
        data: { status: "EXPIRED" },
      });

      await this.updateReagentAggregates(batch.reagentId);
    }

    return expiredBatches.length;
  },
};
