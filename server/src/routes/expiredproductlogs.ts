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
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Expiry evidence is immutable and created by workflow services only',
    });
  })
);

/**
 * PUT /api/expiredproductlogs/:id
 */
router.put(
  '/:id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Expiry evidence is immutable',
    });
  })
);

/**
 * DELETE /api/expiredproductlogs/:id
 */
router.delete(
  '/:id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(405).json({
      success: false,
      error: 'Expiry evidence is immutable',
    });
  })
);

export default router;
