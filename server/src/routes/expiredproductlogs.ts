import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

const mapExpiredLog = (log: any) => {
  const actionTaken = log.actionTaken ? String(log.actionTaken).toLowerCase() : null;
  return {
    id: log.id,
    reagent_id: log.reagentId,
    batch_id: log.batchId,
    batch_number_snapshot: log.batch?.batchNumber || null,
    reagent_name_snapshot: log.batch?.reagent?.name || null,
    original_expiry_date: log.batch?.expiryDate?.toISOString() || null,
    action_taken: actionTaken,
    quantity_affected: Number(log.quantity) || 0,
    action_notes: log.notes || null,
    documented_date: log.handledAt?.toISOString() || null,
    documented_by_user_id: log.handledById || null,
    created_date: log.createdAt?.toISOString() || null,
  };
};

const resolveBatchId = async (reagentId?: string, batchId?: string, batchNumber?: string) => {
  if (batchId) return batchId;
  if (!batchNumber) return null;

  if (reagentId) {
    const match = await prisma.reagentBatch.findFirst({
      where: {
        reagentId,
        batchNumber,
      },
    });
    return match?.id || null;
  }

  const fallback = await prisma.reagentBatch.findFirst({
    where: { batchNumber },
  });
  return fallback?.id || null;
};

/**
 * GET /api/expiredproductlogs
 * List expired product logs
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { reagent_id, batch_id } = req.query;

    const logs = await prisma.expiredProductLog.findMany({
      where: {
        ...(reagent_id ? { reagentId: reagent_id as string } : {}),
        ...(batch_id ? { batchId: batch_id as string } : {}),
      },
      include: {
        batch: {
          include: {
            reagent: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response: ApiResponse = {
      success: true,
      data: logs.map(mapExpiredLog),
      meta: { total: logs.length },
    };
    res.json(response);
  })
);

/**
 * GET /api/expiredproductlogs/:id
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const log = await prisma.expiredProductLog.findUnique({
      where: { id },
      include: { batch: { include: { reagent: true } } },
    });

    if (!log) {
      throw new AppError('Expired product log not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data: mapExpiredLog(log),
    };
    res.json(response);
  })
);

/**
 * POST /api/expiredproductlogs
 * Create expired product log
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};

    const reagentId = body.reagent_id || body.reagentId;
    const batchNumber = body.batch_number_snapshot || body.batch_number || body.batchNumber;
    const batchId = await resolveBatchId(reagentId, body.batch_id || body.batchId, batchNumber);

    if (!reagentId) {
      throw new AppError('reagent_id is required', 400);
    }

    if (!batchId) {
      throw new AppError('batch_id or batch_number_snapshot is required', 400);
    }

    const quantity = Number(body.quantity_affected ?? body.quantity ?? 0);
    const actionTaken = body.action_taken || body.actionTaken || 'other';

    const handledAt = body.documented_date ? new Date(body.documented_date) : (body.handledAt ? new Date(body.handledAt) : undefined);

    const created = await prisma.expiredProductLog.create({
      data: {
        reagentId,
        batchId,
        quantity,
        actionTaken,
        handledById: body.documented_by_user_id || body.handledById || null,
        handledAt: handledAt || undefined,
        reason: body.reason || null,
        notes: body.action_notes || body.notes || null,
      },
      include: { batch: { include: { reagent: true } } },
    });

    const response: ApiResponse = {
      success: true,
      data: mapExpiredLog(created),
    };
    res.status(201).json(response);
  })
);

/**
 * PUT /api/expiredproductlogs/:id
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};

    const updated = await prisma.expiredProductLog.update({
      where: { id },
      data: {
        quantity: body.quantity_affected ?? body.quantity,
        actionTaken: body.action_taken || body.actionTaken,
        handledById: body.documented_by_user_id || body.handledById || undefined,
        handledAt: body.documented_date ? new Date(body.documented_date) : undefined,
        reason: body.reason || undefined,
        notes: body.action_notes || body.notes || undefined,
      },
      include: { batch: { include: { reagent: true } } },
    });

    const response: ApiResponse = {
      success: true,
      data: mapExpiredLog(updated),
    };
    res.json(response);
  })
);

/**
 * DELETE /api/expiredproductlogs/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.expiredProductLog.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      message: 'Expired product log deleted',
    };
    res.json(response);
  })
);

export default router;
