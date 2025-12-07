import prisma from '../utils/prisma';
import { BatchStatus, TransactionType } from '../generated/prisma';

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
   * Get all batches with optional filters
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
      where.status = 'ACTIVE';
    }

    const batches = await prisma.reagentBatch.findMany({
      where,
      include: {
        reagent: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });

    return batches;
  },

  /**
   * Get batch by ID
   */
  async getById(id: string) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id },
      include: {
        reagent: {
          include: {
            supplier: true,
          },
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 50,
        },
      },
    });

    return batch;
  },

  /**
   * Create a new batch (when receiving reagent)
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
        status: 'ACTIVE',
        notes: data.notes,
      },
      include: {
        reagent: true,
      },
    });

    // Create receiving transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: data.reagentId,
        batchId: batch.id,
        transactionType: 'RECEIVE',
        quantity: data.initialQuantity,
        notes: `קבלת אצווה ${data.batchNumber}`,
      },
    });

    // Update reagent aggregates
    await this.updateReagentAggregates(data.reagentId);

    return batch;
  },

  /**
   * Update batch
   */
  async update(id: string, data: UpdateBatchInput) {
    const batch = await prisma.reagentBatch.update({
      where: { id },
      data,
      include: {
        reagent: true,
      },
    });

    // Update reagent aggregates
    await this.updateReagentAggregates(batch.reagentId);

    return batch;
  },

  /**
   * Withdraw quantity from batch
   */
  async withdraw(input: WithdrawInput) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id: input.batchId },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (batch.status !== 'ACTIVE') {
      throw new Error('Cannot withdraw from inactive batch');
    }

    const currentQty = Number(batch.currentQuantity);
    if (input.quantity > currentQty) {
      throw new Error(
        `Insufficient quantity. Available: ${currentQty}, Requested: ${input.quantity}`
      );
    }

    const newQuantity = currentQty - input.quantity;
    const newStatus = newQuantity === 0 ? 'CONSUMED' : 'ACTIVE';

    // Update batch
    const updatedBatch = await prisma.reagentBatch.update({
      where: { id: input.batchId },
      data: {
        currentQuantity: newQuantity,
        status: newStatus as BatchStatus,
      },
      include: {
        reagent: true,
      },
    });

    // Create withdrawal transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: batch.reagentId,
        batchId: batch.id,
        transactionType: 'WITHDRAW',
        quantity: -input.quantity,
        performedBy: input.performedBy,
        notes: input.notes,
      },
    });

    // Update reagent aggregates
    await this.updateReagentAggregates(batch.reagentId);

    return updatedBatch;
  },

  /**
   * Mark batch as expired
   */
  async markExpired(id: string) {
    const batch = await prisma.reagentBatch.update({
      where: { id },
      data: {
        status: 'EXPIRED',
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
      throw new Error('Batch not found');
    }

    const qtyToDestroy = destroyedQuantity || Number(batch.currentQuantity);

    const updatedBatch = await prisma.reagentBatch.update({
      where: { id },
      data: {
        status: 'DESTROYED',
        currentQuantity: 0,
      },
    });

    // Create disposal transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: batch.reagentId,
        batchId: batch.id,
        transactionType: 'DISPOSE',
        quantity: -qtyToDestroy,
        notes: notes || 'השמדת אצווה',
      },
    });

    await this.updateReagentAggregates(batch.reagentId);

    return updatedBatch;
  },

  /**
   * Get batches expiring soon for a category
   */
  async getExpiringSoon(daysThreshold: number, category?: string) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const where: any = {
      expiryDate: {
        lte: futureDate,
        gte: new Date(),
      },
      status: 'ACTIVE',
    };

    if (category) {
      where.reagent = {
        category,
      };
    }

    const batches = await prisma.reagentBatch.findMany({
      where,
      include: {
        reagent: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    return batches;
  },

  /**
   * Update reagent aggregate fields after batch changes
   */
  async updateReagentAggregates(reagentId: string) {
    const activeBatches = await prisma.reagentBatch.findMany({
      where: {
        reagentId,
        status: 'ACTIVE',
      },
      orderBy: { expiryDate: 'asc' },
    });

    const totalQuantity = activeBatches.reduce(
      (sum, b) => sum + Number(b.currentQuantity),
      0
    );

    await prisma.reagent.update({
      where: { id: reagentId },
      data: {
        totalQuantity,
        activeBatchesCount: activeBatches.length,
        nearestExpiryDate: activeBatches[0]?.expiryDate || null,
      },
    });
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
        status: 'ACTIVE',
      },
    });

    for (const batch of expiredBatches) {
      await prisma.reagentBatch.update({
        where: { id: batch.id },
        data: { status: 'EXPIRED' },
      });

      await this.updateReagentAggregates(batch.reagentId);
    }

    return expiredBatches.length;
  },
};
