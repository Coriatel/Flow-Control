import prisma from "../utils/prisma";
import {
  AvailabilityState,
  DispenseResult,
  InventoryQualityError,
} from "../contracts/inventoryQuality";
import {
  DispenseInventoryInput,
  LinkBatchCoaInput,
  QualityDecisionInput,
} from "../validation/inventoryQuality";
import { updateReagentAggregates } from "./reagentAggregates";

type TransactionClient = any;

const DISPENSE_SOURCE_TYPE = "dispense_request";
const INVENTORY_HOLDING_STATUSES = [
  "ACTIVE",
  "INCOMING",
  "ON_HOLD",
  "EXPIRED",
];

const advisoryLock = async (tx: TransactionClient, namespace: string, value: string) => {
  const key = `flow-control:${namespace}:${value}`;
  await tx.$executeRaw`
    SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))
  `;
};

const serializableTransaction = async <T>(
  operation: (tx: TransactionClient) => Promise<T>,
): Promise<T> => {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error: any) {
      if (error?.code !== "P2034") throw error;
      if (attempt === maxAttempts) {
        throw new InventoryQualityError(
          "Concurrent inventory change; retry the request",
          "RETRYABLE_CONFLICT",
          409,
          { retryable: true },
        );
      }
    }
  }
  throw new InventoryQualityError(
    "Concurrent inventory change; retry the request",
    "RETRYABLE_CONFLICT",
    409,
    { retryable: true },
  );
};

const isExpired = (batch: any, now = new Date()) =>
  batch.status === "EXPIRED" || new Date(batch.expiryDate).getTime() <= now.getTime();

const blockedReasonsFor = (batch: any, now = new Date()): string[] => {
  const reasons: string[] = [];
  if (isExpired(batch, now)) reasons.push("BATCH_EXPIRED");
  if (batch.qcStatus === "REJECTED") reasons.push("QA_REJECTED");
  if (batch.status === "ON_HOLD" || batch.qcStatus === "REQUIRES_REVIEW") {
    reasons.push("BATCH_ON_HOLD");
  }
  if (batch.qcStatus === "PENDING") reasons.push("PENDING_QA");
  if (batch.status !== "ACTIVE") reasons.push("BATCH_NOT_ACTIVE");
  if (!batch.coaDocumentUrl) reasons.push("COA_MISSING");
  if (Number(batch.currentQuantity) <= 0) reasons.push("NO_STOCK");
  if (
    Number(batch.currentQuantity) > 0 &&
    Number(batch.currentQuantity) - Number(batch.reservedQuantity || 0) <= 0
  ) {
    reasons.push("NO_AVAILABLE_STOCK");
  }
  return [...new Set(reasons)];
};

const availabilityStateFor = (batch: any, now = new Date()): AvailabilityState => {
  if (
    batch.status === "CONSUMED" ||
    batch.status === "DESTROYED" ||
    Number(batch.currentQuantity) <= 0
  ) {
    return "consumed";
  }
  if (isExpired(batch, now)) return "expired";
  if (batch.qcStatus === "REJECTED") return "rejected";
  if (batch.status === "ON_HOLD" || batch.qcStatus === "REQUIRES_REVIEW") {
    return "held";
  }
  if (batch.qcStatus !== "APPROVED" || !batch.coaDocumentUrl) return "pending_qa";
  return "released";
};

const availableQuantityFor = (batch: any, now = new Date()) =>
  blockedReasonsFor(batch, now).length === 0
    ? Math.max(
        0,
        Number(batch.currentQuantity) - Number(batch.reservedQuantity || 0),
      )
    : 0;

const calculateOnOrderQuantity = async (
  reagentId: string,
  client: TransactionClient = prisma,
) => {
  const items = await client.orderItem.findMany({
    where: {
      reagentId,
      order: {
        status: {
          in: ["DRAFT", "PENDING_SAP", "APPROVED", "PARTIALLY_RECEIVED"],
        },
      },
    },
    select: { requestedQuantity: true, receivedQuantity: true },
  });
  return items.reduce(
    (sum: number, item: any) =>
      sum +
      Math.max(
        0,
        Number(item.requestedQuantity) - Number(item.receivedQuantity || 0),
      ),
    0,
  );
};

const calculateSuggestion = (reagent: any, onOrderQuantity: number) => {
  const physicalQuantity = Number(reagent.totalQuantity || 0);
  const projected = physicalQuantity + onOrderQuantity;
  const min = Number(reagent.minStockLevel || 0);
  const max = Number(reagent.maxStockLevel || 0);
  if (min > 0) {
    return projected < min ? Math.ceil((max > min ? max : min) - projected) : 0;
  }
  const usage = Number(
    reagent.useManualUsage
      ? reagent.manualMonthlyUsage || 0
      : reagent.averageMonthlyUsage || 0,
  );
  return Math.max(0, Math.ceil(usage * 3 - projected));
};

const movementSignature = (input: DispenseInventoryInput) => ({
  reagentId: input.reagentId,
  batchId: input.batchId,
  quantity: input.quantity,
  purpose: input.purpose,
  scanMethod: input.scanMethod,
});

const signaturesEqual = (left: any, right: any) =>
  left?.reagentId === right.reagentId &&
  left?.batchId === right.batchId &&
  Number(left?.quantity) === Number(right.quantity) &&
  left?.purpose === right.purpose &&
  left?.scanMethod === right.scanMethod;

const parseMovementMetadata = (notes?: string | null) => {
  if (!notes) return null;
  try {
    return JSON.parse(notes);
  } catch {
    return null;
  }
};

const inventorySummary = async (
  reagentId: string,
  client: TransactionClient = prisma,
) => {
  const [reagent, batches] = await Promise.all([
    client.reagent.findUniqueOrThrow({ where: { id: reagentId } }),
    client.reagentBatch.findMany({
      where: {
        reagentId,
        status: { in: INVENTORY_HOLDING_STATUSES },
        currentQuantity: { gt: 0 },
      },
    }),
  ]);
  return {
    reagent,
    physicalQuantity: batches.reduce(
      (sum: number, batch: any) => sum + Number(batch.currentQuantity),
      0,
    ),
    availableQuantity: batches.reduce(
      (sum: number, batch: any) => sum + availableQuantityFor(batch),
      0,
    ),
  };
};

const buildDispenseResult = async (
  movement: any,
  metadata: any,
  idempotentReplay: boolean,
  client: TransactionClient = prisma,
): Promise<DispenseResult> => {
  const batch = await client.reagentBatch.findUniqueOrThrow({
    where: { id: movement.batchId },
  });
  const summary = await inventorySummary(movement.reagentId, client);
  const onOrderQuantity = await calculateOnOrderQuantity(movement.reagentId, client);
  return {
    idempotentReplay,
    dispenseEventId: metadata.dispenseEventId,
    movementId: movement.id,
    batch: {
      id: batch.id,
      beforeQuantity: Number(metadata.beforeQuantity),
      currentQuantity: Number(batch.currentQuantity),
      status: batch.status,
      qcStatus: batch.qcStatus,
    },
    inventory: {
      reagentId: movement.reagentId,
      physicalQuantity: summary.physicalQuantity,
      availableQuantity: summary.availableQuantity,
      stockStatus: summary.reagent.currentStockStatus,
    },
    replenishment: {
      suggestedQuantity: calculateSuggestion(summary.reagent, onOrderQuantity),
      onOrderQuantity,
    },
    auditActivityId: metadata.auditActivityId,
    createdAt: movement.createdAt,
  };
};

const mapQualityRow = (batch: any) => {
  const blockedReasons = blockedReasonsFor(batch);
  const order = batch.delivery?.order;
  return {
    id: batch.id,
    reagent: {
      id: batch.reagent.id,
      name: batch.reagent.name,
      catalogNumber: batch.reagent.catalogNumber,
    },
    supplier: {
      id: batch.reagent.supplier.id,
      name: batch.reagent.supplier.name,
    },
    batchNumber: batch.batchNumber,
    expiryDate: batch.expiryDate,
    receivedDate: batch.receivedDate,
    initialQuantity: Number(batch.initialQuantity),
    currentQuantity: Number(batch.currentQuantity),
    reservedQuantity: Number(batch.reservedQuantity || 0),
    availableQuantity: availableQuantityFor(batch),
    status: batch.status,
    qcStatus: batch.qcStatus,
    availabilityState: availabilityStateFor(batch),
    coa: batch.coaDocumentUrl ? { url: batch.coaDocumentUrl } : null,
    delivery: batch.delivery
      ? { id: batch.delivery.id, number: batch.delivery.deliveryNumber }
      : null,
    order: order
      ? {
          id: order.id,
          number: order.permanentNumber || order.tempNumber,
        }
      : null,
    canDispense: blockedReasons.length === 0,
    blockedReasons,
    updatedAt: batch.updatedAt,
  };
};

export const inventoryQualityService = {
  async getDispenseHistory(filters: {
    reagentId?: string;
    batchId?: string;
    dispensedById?: string;
    fromDate?: Date;
    toDate?: Date;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.reagentId) where.reagentId = filters.reagentId;
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.dispensedById) where.dispensedById = filters.dispensedById;
    if (filters.fromDate || filters.toDate) {
      where.dispensedAt = {
        ...(filters.fromDate ? { gte: filters.fromDate } : {}),
        ...(filters.toDate ? { lte: filters.toDate } : {}),
      };
    }

    const [events, total] = await Promise.all([
      prisma.dispenseEvent.findMany({
        where,
        include: {
          reagent: { include: { supplier: true } },
          batch: true,
        },
        orderBy: { dispensedAt: "desc" },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.dispenseEvent.count({ where }),
    ]);
    const eventIds = events.map((event: any) => event.id);
    const movements =
      eventIds.length === 0
        ? []
        : await prisma.inventoryTransaction.findMany({
            where: {
              sourceType: DISPENSE_SOURCE_TYPE,
              reagentId: { in: [...new Set(events.map((event: any) => event.reagentId))] },
            },
          });
    const movementByEventId = new Map<string, any>();
    for (const movement of movements) {
      const metadata = parseMovementMetadata(movement.notes);
      if (metadata?.dispenseEventId && eventIds.includes(metadata.dispenseEventId)) {
        movementByEventId.set(metadata.dispenseEventId, movement);
      }
    }
    const userIds = [
      ...new Set(
        events
          .map((event: any) => event.dispensedById)
          .filter((id: string | null): id is string => Boolean(id)),
      ),
    ];
    const users =
      userIds.length === 0
        ? []
        : await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true },
          });
    const userById = new Map(users.map((user: any) => [user.id, user]));

    return {
      rows: events.map((event: any) => ({
        id: event.id,
        createdAt: event.dispensedAt,
        reagent: {
          id: event.reagent.id,
          name: event.reagent.name,
          catalogNumber: event.reagent.catalogNumber,
        },
        batch: {
          id: event.batch.id,
          batchNumber: event.batch.batchNumber,
        },
        quantity: Number(event.quantity),
        purpose: event.purpose,
        scanMethod: event.scanMethod,
        performedBy: event.dispensedById
          ? userById.get(event.dispensedById) || {
              id: event.dispensedById,
              name: null,
            }
          : null,
        movementId: movementByEventId.get(event.id)?.id || null,
        notes: event.notes,
      })),
      total,
    };
  },

  async listQualityBatches(filters: {
    reagentId?: string;
    search?: string;
    status?: string;
    qcStatus?: string;
    expiryFrom?: Date;
    expiryTo?: Date;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.reagentId) where.reagentId = filters.reagentId;
    if (filters.status) where.status = filters.status.toUpperCase();
    if (filters.qcStatus) where.qcStatus = filters.qcStatus.toUpperCase();
    if (filters.expiryFrom || filters.expiryTo) {
      where.expiryDate = {
        ...(filters.expiryFrom ? { gte: filters.expiryFrom } : {}),
        ...(filters.expiryTo ? { lte: filters.expiryTo } : {}),
      };
    }
    if (filters.search) {
      where.OR = [
        { batchNumber: { contains: filters.search, mode: "insensitive" } },
        { reagent: { name: { contains: filters.search, mode: "insensitive" } } },
        {
          reagent: {
            catalogNumber: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }
    const [rows, total] = await Promise.all([
      prisma.reagentBatch.findMany({
        where,
        include: {
          reagent: { include: { supplier: true } },
          delivery: { include: { order: true } },
        },
        orderBy: [{ expiryDate: "asc" }, { batchNumber: "asc" }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.reagentBatch.count({ where }),
    ]);
    return { rows: rows.map(mapQualityRow), total };
  },

  async getCurrentInventory(reagentId?: string) {
    const reagents = await prisma.reagent.findMany({
      where: {
        isDeleted: false,
        ...(reagentId ? { id: reagentId } : {}),
      },
      include: {
        supplier: true,
        batches: {
          where: {
            status: { in: INVENTORY_HOLDING_STATUSES },
            currentQuantity: { gt: 0 },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return Promise.all(
      reagents.map(async (reagent: any) => {
        const physicalQuantity = reagent.batches.reduce(
          (sum: number, batch: any) => sum + Number(batch.currentQuantity),
          0,
        );
        const availableQuantity = reagent.batches.reduce(
          (sum: number, batch: any) => sum + availableQuantityFor(batch),
          0,
        );
        const pendingQaQuantity = reagent.batches
          .filter((batch: any) => availabilityStateFor(batch) === "pending_qa")
          .reduce(
            (sum: number, batch: any) => sum + Number(batch.currentQuantity),
            0,
          );
        const heldQuantity = reagent.batches
          .filter((batch: any) => availabilityStateFor(batch) === "held")
          .reduce(
            (sum: number, batch: any) => sum + Number(batch.currentQuantity),
            0,
          );
        const expiredQuantity = reagent.batches
          .filter((batch: any) => availabilityStateFor(batch) === "expired")
          .reduce(
            (sum: number, batch: any) => sum + Number(batch.currentQuantity),
            0,
          );
        const onOrderQuantity = await calculateOnOrderQuantity(reagent.id);
        return {
          reagentId: reagent.id,
          name: reagent.name,
          catalogNumber: reagent.catalogNumber,
          supplier: { id: reagent.supplier.id, name: reagent.supplier.name },
          physicalQuantity,
          availableQuantity,
          pendingQaQuantity,
          heldQuantity,
          expiredQuantity,
          minStockLevel: reagent.minStockLevel,
          maxStockLevel: reagent.maxStockLevel,
          stockStatus: reagent.currentStockStatus,
          replenishment: {
            onOrderQuantity,
            suggestedQuantity: calculateSuggestion(reagent, onOrderQuantity),
            policy: Number(reagent.minStockLevel || 0) > 0 ? "MIN_MAX" : "USAGE",
          },
        };
      }),
    );
  },

  async linkCoa(
    batchId: string,
    input: LinkBatchCoaInput,
    performedById?: string,
  ) {
    return serializableTransaction(
      async (tx) => {
        await advisoryLock(tx, "request", input.clientRequestId);
        await advisoryLock(tx, "batch", batchId);
        const batch = await tx.reagentBatch.findUnique({ where: { id: batchId } });
        if (!batch) throw new InventoryQualityError("Batch not found", "BATCH_UNAVAILABLE", 404);
        const existingAudit = await tx.activityLog.findFirst({
          where: {
            action: "coa_linked",
            entityType: "reagent_batch",
            entityId: batchId,
            details: { contains: `"clientRequestId":"${input.clientRequestId}"` },
          },
          orderBy: { createdAt: "desc" },
        });
        if (existingAudit) {
          const existingDetails = parseMovementMetadata(existingAudit.details);
          if (existingDetails?.documentUrl === input.documentUrl) {
            return {
              batchId,
              coa: { url: input.documentUrl },
              idempotentReplay: true,
              auditActivityId: existingAudit.id,
            };
          }
          throw new InventoryQualityError(
            "clientRequestId was already used with different COA input",
            "IDEMPOTENCY_CONFLICT",
          );
        }

        await tx.reagentBatch.update({
          where: { id: batchId },
          data: { coaDocumentUrl: input.documentUrl },
        });
        const audit = await tx.activityLog.create({
          data: {
            userId: performedById,
            action: "coa_linked",
            entityType: "reagent_batch",
            entityId: batchId,
            details: JSON.stringify({
              clientRequestId: input.clientRequestId,
              documentUrl: input.documentUrl,
            }),
          },
        });
        return {
          batchId,
          coa: { url: input.documentUrl },
          idempotentReplay: false,
          auditActivityId: audit.id,
        };
      },
    );
  },

  async decideQuality(
    batchId: string,
    input: QualityDecisionInput,
    performedById?: string,
  ) {
    return serializableTransaction(
      async (tx) => {
        await advisoryLock(tx, "request", input.clientRequestId);
        await advisoryLock(tx, "batch", batchId);
        const batch = await tx.reagentBatch.findUnique({ where: { id: batchId } });
        if (!batch) throw new InventoryQualityError("Batch not found", "BATCH_UNAVAILABLE", 404);
        if (["CONSUMED", "DESTROYED"].includes(batch.status)) {
          throw new InventoryQualityError(
            "Consumed or destroyed batch cannot change QA state",
            "INVALID_QUALITY_TRANSITION",
          );
        }

        if (input.decision === "APPROVE") {
          if (!batch.coaDocumentUrl) {
            throw new InventoryQualityError(
              "A linked COA is required before QA approval",
              "COA_REQUIRED",
            );
          }
          if (isExpired(batch) || Number(batch.currentQuantity) <= 0) {
            throw new InventoryQualityError(
              "Expired or empty batch cannot be approved",
              "INVALID_QUALITY_TRANSITION",
            );
          }
        }

        const target =
          input.decision === "APPROVE"
            ? { status: "ACTIVE", qcStatus: "APPROVED" }
            : input.decision === "HOLD"
              ? { status: "ON_HOLD", qcStatus: "REQUIRES_REVIEW" }
              : { status: "ON_HOLD", qcStatus: "REJECTED" };
        const action =
          input.decision === "APPROVE"
            ? "qa_approved"
            : input.decision === "HOLD"
              ? "qa_held"
              : "qa_rejected";

        const existingAudit = await tx.activityLog.findFirst({
          where: {
            action: { in: ["qa_approved", "qa_held", "qa_rejected"] },
            entityType: "reagent_batch",
            entityId: batchId,
            details: { contains: `"clientRequestId":"${input.clientRequestId}"` },
          },
          orderBy: { createdAt: "desc" },
        });
        if (existingAudit) {
          const existingDetails = parseMovementMetadata(existingAudit.details);
          if (
            existingDetails?.decision === input.decision &&
            existingDetails?.notes === input.notes &&
            batch.status === target.status &&
            batch.qcStatus === target.qcStatus
          ) {
            return {
              batch,
              availabilityState: availabilityStateFor(batch),
              canDispense: blockedReasonsFor(batch).length === 0,
              idempotentReplay: true,
              auditActivityId: existingAudit.id,
            };
          }
          throw new InventoryQualityError(
            "clientRequestId was already used with a different QA decision",
            "IDEMPOTENCY_CONFLICT",
          );
        }

        const updated = await tx.reagentBatch.update({
          where: { id: batchId },
          data: {
            ...target,
            qcNotes: input.notes,
          },
        });
        await updateReagentAggregates(updated.reagentId, tx);
        const audit = await tx.activityLog.create({
          data: {
            userId: performedById,
            action,
            entityType: "reagent_batch",
            entityId: batchId,
            details: JSON.stringify({
              clientRequestId: input.clientRequestId,
              decision: input.decision,
              notes: input.notes,
              previousStatus: batch.status,
              previousQcStatus: batch.qcStatus,
              status: updated.status,
              qcStatus: updated.qcStatus,
              coaDocumentUrl: updated.coaDocumentUrl,
            }),
          },
        });
        return {
          batch: updated,
          availabilityState: availabilityStateFor(updated),
          canDispense: blockedReasonsFor(updated).length === 0,
          idempotentReplay: false,
          auditActivityId: audit.id,
        };
      },
    );
  },

  async dispense(input: DispenseInventoryInput, performedById?: string) {
    return serializableTransaction(
      async (tx) => {
        await advisoryLock(tx, "request", input.clientRequestId);

        const replayMovement = await tx.inventoryTransaction.findFirst({
          where: {
            sourceType: DISPENSE_SOURCE_TYPE,
            sourceId: input.clientRequestId,
          },
          orderBy: { createdAt: "asc" },
        });
        if (replayMovement) {
          const metadata = parseMovementMetadata(replayMovement.notes);
          if (!metadata || !signaturesEqual(metadata.signature, movementSignature(input))) {
            throw new InventoryQualityError(
              "clientRequestId was already used with different input",
              "IDEMPOTENCY_CONFLICT",
            );
          }
          return buildDispenseResult(replayMovement, metadata, true, tx);
        }

        await advisoryLock(tx, "batch", input.batchId);
        const batch = await tx.reagentBatch.findUnique({
          where: { id: input.batchId },
        });
        if (!batch || batch.reagentId !== input.reagentId) {
          throw new InventoryQualityError(
            "Batch is unavailable for the requested reagent",
            "BATCH_UNAVAILABLE",
            409,
            { blockedReasons: ["BATCH_NOT_FOUND"] },
          );
        }

        const blockedReasons = blockedReasonsFor(batch);
        if (blockedReasons.length > 0) {
          throw new InventoryQualityError(
            "Batch is unavailable for stock-out",
            "BATCH_UNAVAILABLE",
            409,
            { blockedReasons },
          );
        }
        const availableQuantity = availableQuantityFor(batch);
        if (input.quantity > availableQuantity) {
          throw new InventoryQualityError(
            "Requested quantity exceeds available stock",
            "INSUFFICIENT_STOCK",
            409,
            { availableQuantity },
          );
        }

        const beforeQuantity = Number(batch.currentQuantity);
        const currentQuantity = beforeQuantity - input.quantity;
        const updatedBatch = await tx.reagentBatch.update({
          where: { id: batch.id },
          data: {
            currentQuantity,
            status: currentQuantity === 0 ? "CONSUMED" : "ACTIVE",
          },
        });
        const event = await tx.dispenseEvent.create({
          data: {
            reagentId: input.reagentId,
            batchId: input.batchId,
            quantity: input.quantity,
            dispensedById: performedById,
            scanMethod: input.scanMethod,
            rawScanData: input.rawScanData,
            purpose: input.purpose,
            notes: input.notes,
          },
        });
        const audit = await tx.activityLog.create({
          data: {
            userId: performedById,
            action: "stock_dispensed",
            entityType: "reagent_batch",
            entityId: batch.id,
            details: JSON.stringify({
              clientRequestId: input.clientRequestId,
              reagentId: input.reagentId,
              batchId: input.batchId,
              quantity: input.quantity,
              beforeQuantity,
              currentQuantity,
              dispenseEventId: event.id,
            }),
          },
        });
        const movement = await tx.inventoryTransaction.create({
          data: {
            reagentId: input.reagentId,
            batchId: input.batchId,
            transactionType: "CONSUMPTION",
            quantityDelta: -input.quantity,
            sourceType: DISPENSE_SOURCE_TYPE,
            sourceId: input.clientRequestId,
            performedById,
            notes: JSON.stringify({
              signature: movementSignature(input),
              beforeQuantity,
              dispenseEventId: event.id,
              auditActivityId: audit.id,
            }),
          },
        });
        await updateReagentAggregates(input.reagentId, tx);
        return buildDispenseResult(
          movement,
          {
            signature: movementSignature(input),
            beforeQuantity,
            dispenseEventId: event.id,
            auditActivityId: audit.id,
          },
          false,
          tx,
        );
      },
    );
  },
};
