import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { dispenseService } from "../services/dispenseService";
import prisma from "../utils/prisma";
import { TransactionType } from "../types";
import { batchService } from "../services/batchService";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/disposal/destruction-candidates
 * Returns batches that are EXPIRED or expiring within 30 days
 */
router.get(
  "/destruction-candidates",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const candidates = await prisma.reagentBatch.findMany({
      where: {
        OR: [
          { status: "EXPIRED" },
          {
            status: "ACTIVE",
            expiryDate: { lte: thirtyDaysFromNow },
          },
        ],
        currentQuantity: { gt: 0 },
      },
      include: {
        reagent: {
          select: { id: true, name: true, catalogNumber: true },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    const data = candidates.map((batch) => {
      const daysUntilExpiry = batch.expiryDate
        ? Math.ceil(
            (batch.expiryDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 999;
      return {
        id: batch.id,
        reagentId: batch.reagentId,
        reagentName: batch.reagent.name,
        catalogNumber: batch.reagent.catalogNumber,
        batchNumber: batch.batchNumber,
        currentQuantity: batch.currentQuantity,
        expiryDate: batch.expiryDate,
        status: batch.status,
        daysUntilExpiry,
        isExpired: daysUntilExpiry <= 0,
      };
    });

    res.json({ success: true, data });
  }),
);

/**
 * POST /api/disposal/bulk-destroy
 * Bulk destroy expired/near-expiry batches
 */
router.post(
  "/bulk-destroy",
  asyncHandler(async (req, res) => {
    const { items } = req.body;
    const userId = (req as any).user?.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "items array is required" });
    }

    const processed: string[] = [];
    const failed: { batchId: string; error: string }[] = [];

    // Process each item in its own transaction for independent atomicity
    for (const item of items) {
      try {
        const { batchId, quantity, reason, wasteFraction, notes } = item;

        await prisma.$transaction(async (tx) => {
          const batch = await tx.reagentBatch.findUnique({
            where: { id: batchId },
            include: { reagent: true },
          });

          if (!batch) {
            throw new Error("אצווה לא נמצאה");
          }

          const destroyQty = quantity || batch.currentQuantity;

          // Update batch status to DESTROYED, set quantity to 0
          await tx.reagentBatch.update({
            where: { id: batchId },
            data: {
              status: "DESTROYED",
              currentQuantity: 0,
            },
          });

          // Create inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              reagentId: batch.reagentId,
              batchId,
              transactionType: TransactionType.DESTRUCTION,
              quantityDelta: -destroyQty,
              performedById: userId,
              notes: `השמדה - ${reason || "פגי תוקף"}${notes ? ` | ${notes}` : ""}`,
            },
          });
        });

        processed.push(item.batchId);
      } catch (err: any) {
        failed.push({ batchId: item.batchId, error: err.message });
      }
    }

    // Update reagent aggregates for all affected reagents
    const affectedReagentIds = new Set<string>();
    for (const batchId of processed) {
      const batch = await prisma.reagentBatch.findUnique({
        where: { id: batchId },
      });
      if (batch) affectedReagentIds.add(batch.reagentId);
    }
    for (const reagentId of affectedReagentIds) {
      await batchService.updateReagentAggregates(reagentId);
    }

    res.json({ success: true, data: { processed: processed.length, failed } });
  }),
);

/**
 * POST /api/disposal/partial - Record partial disposal of in-use item (quarter-based)
 * portionDisposed: 0.25 | 0.50 | 0.75 | 1.00
 */
router.post(
  "/partial",
  asyncHandler(async (req, res) => {
    const { batchId, portionDisposed, reason, notes } = req.body;

    if (!batchId || portionDisposed === undefined || !reason) {
      return res.status(400).json({
        success: false,
        error: "batchId, portionDisposed, and reason are required",
      });
    }

    const result = await dispenseService.recordPartialDisposal({
      batchId,
      portionDisposed: Number(portionDisposed),
      reason,
      notes,
      disposedById: (req as any).user?.id,
    });

    res.status(201).json({ success: true, data: result });
  }),
);

/**
 * GET /api/disposal/history - View disposal history
 */
router.get(
  "/history",
  asyncHandler(async (req, res) => {
    const { batchId, reagentId, limit, offset } = req.query;

    const result = await dispenseService.getDisposalHistory({
      batchId: batchId as string,
      reagentId: reagentId as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json({
      success: true,
      data: result.disposals,
      meta: { total: result.total },
    });
  }),
);

export default router;
