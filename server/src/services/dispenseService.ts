import prisma from "../utils/prisma";
import { batchService } from "./batchService";
import { barcodeService } from "./barcodeService";
import { TransactionType } from "../types";

export interface DispenseInput {
  reagentId: string;
  batchId: string;
  quantity: number;
  dispensedById?: string;
  scanMethod?: string;
  rawScanData?: string;
  purpose?: string;
  notes?: string;
}

export interface DispenseByScanInput {
  rawScanData: string;
  quantity: number;
  dispensedById?: string;
  purpose?: string;
  notes?: string;
}

export interface PartialDisposalInput {
  batchId: string;
  portionDisposed: number; // 0.25, 0.50, 0.75, 1.00
  reason: string;
  notes?: string;
  disposedById?: string;
}

const VALID_PORTIONS = [0.25, 0.5, 0.75, 1.0];

export const dispenseService = {
  /**
   * Dispense item from inventory
   * Deducts from batch, creates events and transactions
   */
  async dispenseItem(input: DispenseInput) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id: input.batchId },
      include: { reagent: true },
    });

    if (!batch) {
      throw new Error("אצווה לא נמצאה");
    }

    if (batch.reagentId !== input.reagentId) {
      throw new Error("האצווה לא שייכת לריאגנט המבוקש");
    }

    if (batch.status !== "ACTIVE") {
      throw new Error(`לא ניתן להוציא מאצווה בסטטוס ${batch.status}`);
    }

    if (batch.currentQuantity < input.quantity) {
      throw new Error(`כמות לא מספיקה. זמין: ${batch.currentQuantity}`);
    }

    const newQuantity = batch.currentQuantity - input.quantity;
    const newStatus = newQuantity <= 0 ? "IN_USE" : "ACTIVE";

    // Update batch quantity and status
    await prisma.reagentBatch.update({
      where: { id: input.batchId },
      data: {
        currentQuantity: newQuantity,
        status: newStatus,
      },
    });

    // Create dispense event
    const dispenseEvent = await prisma.dispenseEvent.create({
      data: {
        reagentId: input.reagentId,
        batchId: input.batchId,
        quantity: input.quantity,
        dispensedById: input.dispensedById,
        scanMethod: input.scanMethod || "MANUAL",
        rawScanData: input.rawScanData,
        purpose: input.purpose,
        notes: input.notes,
      },
    });

    // Create inventory transaction
    await prisma.inventoryTransaction.create({
      data: {
        reagentId: input.reagentId,
        batchId: input.batchId,
        transactionType: TransactionType.CONSUMPTION,
        quantityDelta: -input.quantity,
        sourceType: "dispense",
        sourceId: dispenseEvent.id,
        performedById: input.dispensedById,
        notes: `הוצאה מהמלאי - אצווה ${batch.batchNumber}`,
      },
    });

    // Update reagent aggregates
    await batchService.updateReagentAggregates(input.reagentId);

    return {
      ...dispenseEvent,
      batch: { ...batch, currentQuantity: newQuantity, status: newStatus },
      reagent: batch.reagent,
    };
  },

  /**
   * Dispense by scanning barcode - parse, identify, dispense
   */
  async dispenseByScan(input: DispenseByScanInput) {
    // Parse barcode
    const parsed = await barcodeService.parseBarcodeData(input.rawScanData);

    if (!parsed.lotNumber && !parsed.catalogNumber) {
      throw new Error("לא ניתן לזהות מספר אצווה או מספר קטלוגי מהברקוד");
    }

    // Find matching batch
    const whereClause: any = {};
    if (parsed.lotNumber) {
      whereClause.batchNumber = parsed.lotNumber;
    }

    const batches = await prisma.reagentBatch.findMany({
      where: {
        ...whereClause,
        status: "ACTIVE",
        currentQuantity: { gt: 0 },
      },
      include: {
        reagent: true,
      },
    });

    if (batches.length === 0) {
      throw new Error("לא נמצאה אצווה פעילה תואמת לברקוד");
    }

    // If catalog number available, narrow down
    let matchedBatch = batches[0];
    if (parsed.catalogNumber && batches.length > 1) {
      const catalogMatch = batches.find(
        (b) => b.reagent.catalogNumber === parsed.catalogNumber,
      );
      if (catalogMatch) matchedBatch = catalogMatch;
    }

    return this.dispenseItem({
      reagentId: matchedBatch.reagentId,
      batchId: matchedBatch.id,
      quantity: input.quantity,
      dispensedById: input.dispensedById,
      scanMethod: parsed.formatName === "GS1" ? "BARCODE" : "QR",
      rawScanData: input.rawScanData,
      purpose: input.purpose,
      notes: input.notes,
    });
  },

  /**
   * Get dispense history with filters
   */
  async getHistory(
    filters: {
      reagentId?: string;
      batchId?: string;
      dispensedById?: string;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const where: any = {};
    if (filters.reagentId) where.reagentId = filters.reagentId;
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.dispensedById) where.dispensedById = filters.dispensedById;
    if (filters.fromDate || filters.toDate) {
      where.dispensedAt = {};
      if (filters.fromDate) where.dispensedAt.gte = filters.fromDate;
      if (filters.toDate) where.dispensedAt.lte = filters.toDate;
    }

    const [events, total] = await Promise.all([
      prisma.dispenseEvent.findMany({
        where,
        include: {
          reagent: { include: { supplier: true } },
          batch: true,
        },
        orderBy: { dispensedAt: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.dispenseEvent.count({ where }),
    ]);

    return { events, total };
  },

  /**
   * Get all items currently in use (batches with IN_USE status)
   */
  async getInUseItems() {
    const batches = await prisma.reagentBatch.findMany({
      where: { status: "IN_USE" },
      include: {
        reagent: { include: { supplier: true } },
        dispenseEvents: {
          orderBy: { dispensedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    const now = new Date();
    return batches.map((batch) => {
      const lastDispense = batch.dispenseEvents[0];
      const daysUntilExpiry = Math.ceil(
        (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        ...batch,
        daysUntilExpiry,
        isExpired: daysUntilExpiry <= 0,
        dispensedAt: lastDispense?.dispensedAt,
        dispensedById: lastDispense?.dispensedById,
        dispensedQuantity: lastDispense?.quantity,
      };
    });
  },

  /**
   * Return an in-use item back to inventory (admin only - undo dispense)
   */
  async returnToInventory(batchId: string, performedById?: string) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id: batchId },
    });

    if (!batch) throw new Error("אצווה לא נמצאה");
    if (batch.status !== "IN_USE") throw new Error('האצווה לא בסטטוס "בשימוש"');

    // Get last dispense event to know original quantity
    const lastDispense = await prisma.dispenseEvent.findFirst({
      where: { batchId },
      orderBy: { dispensedAt: "desc" },
    });

    const returnQuantity = lastDispense?.quantity || batch.initialQuantity;

    await prisma.reagentBatch.update({
      where: { id: batchId },
      data: {
        currentQuantity: returnQuantity,
        status: "ACTIVE",
      },
    });

    await prisma.inventoryTransaction.create({
      data: {
        reagentId: batch.reagentId,
        batchId,
        transactionType: TransactionType.ADJUSTMENT,
        quantityDelta: returnQuantity,
        performedById,
        notes: `החזרה למלאי - אצווה ${batch.batchNumber}`,
      },
    });

    await batchService.updateReagentAggregates(batch.reagentId);

    return { success: true, batchId, returnedQuantity: returnQuantity };
  },

  /**
   * Record partial disposal of an in-use item (quarter-based)
   */
  async recordPartialDisposal(input: PartialDisposalInput) {
    if (!VALID_PORTIONS.includes(input.portionDisposed)) {
      throw new Error("חלק ההשלכה חייב להיות 0.25, 0.50, 0.75, או 1.00");
    }

    const batch = await prisma.reagentBatch.findUnique({
      where: { id: input.batchId },
    });

    if (!batch) throw new Error("אצווה לא נמצאה");

    const allowedStatuses = ["IN_USE", "ACTIVE", "EXPIRED"];
    if (!allowedStatuses.includes(batch.status)) {
      throw new Error(`לא ניתן להשמיד אצווה בסטטוס ${batch.status}`);
    }

    // For IN_USE batches, get original dispensed quantity from last dispense event
    // For ACTIVE/EXPIRED batches, use current quantity directly
    let originalQuantity: number;
    if (batch.status === "IN_USE") {
      const lastDispense = await prisma.dispenseEvent.findFirst({
        where: { batchId: input.batchId },
        orderBy: { dispensedAt: "desc" },
      });
      originalQuantity = lastDispense?.quantity || batch.initialQuantity;
    } else {
      originalQuantity = batch.currentQuantity;
    }

    const disposal = await prisma.partialDisposal.create({
      data: {
        reagentId: batch.reagentId,
        batchId: input.batchId,
        portionDisposed: input.portionDisposed,
        originalQuantity,
        reason: input.reason,
        notes: input.notes,
        disposedById: input.disposedById,
      },
    });

    // If full disposal, mark batch as DESTROYED
    if (input.portionDisposed === 1.0) {
      await prisma.reagentBatch.update({
        where: { id: input.batchId },
        data: { status: "DESTROYED" },
      });
    }

    const wasteQuantity = originalQuantity * input.portionDisposed;
    const actualConsumption = originalQuantity - wasteQuantity;

    return {
      ...disposal,
      wasteQuantity,
      actualConsumption,
      batchNumber: batch.batchNumber,
    };
  },

  /**
   * Get disposal history
   */
  async getDisposalHistory(
    filters: {
      batchId?: string;
      reagentId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const where: any = {};
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.reagentId) where.reagentId = filters.reagentId;

    const [disposals, total] = await Promise.all([
      prisma.partialDisposal.findMany({
        where,
        include: {
          reagent: true,
          batch: true,
        },
        orderBy: { disposedAt: "desc" },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      prisma.partialDisposal.count({ where }),
    ]);

    return { disposals, total };
  },
};
