import { Router, Request, Response } from 'express';
import { batchService } from '../services';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { ApiResponse, BatchStatus } from '../types';
import { authorize } from '../middleware/auth';
import { safeParse } from '../middleware/validate';
import {
  linkBatchCoaSchema,
  qualityDecisionSchema,
  qualityListQuerySchema,
} from '../validation/inventoryQuality';
import { inventoryQualityService } from '../services/inventoryQualityService';
import { isInventoryQualityError } from '../contracts/inventoryQuality';

const router = Router();

/**
 * GET /api/batches
 * Get all batches with optional filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const reagentId = (req.query.reagentId || req.query.reagent_id) as string | undefined;
    const statusRaw = (req.query.status as string | undefined) || undefined;
    const status = statusRaw ? statusRaw.toUpperCase() : undefined;
    const expiringWithinDays = req.query.expiringWithinDays || req.query.expiring_within_days;

    const data = await batchService.getAll({
      reagentId,
      status: status as BatchStatus | undefined,
      expiringWithinDays: expiringWithinDays
        ? parseInt(expiringWithinDays as string, 10)
        : undefined,
    });

    const response: ApiResponse = {
      success: true,
      data,
      meta: { total: data.length },
    };
    res.json(response);
  })
);

/**
 * GET /api/batches/expiring
 * Get batches expiring within specified days
 */
router.get(
  '/expiring',
  asyncHandler(async (req: Request, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const category = req.query.category as string | undefined;

    const data = await batchService.getExpiringSoon(days, category);

    res.json({
      success: true,
      data,
      meta: { daysThreshold: days, total: data.length },
    });
  })
);

/**
 * GET /api/batches/quality
 * Stable, authoritative quality and availability view for operational tables.
 */
router.get(
  '/quality',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = safeParse(qualityListQuerySchema, req.query);
    if (parsed.success === false) throw new AppError(parsed.error, 400);
    const result = await inventoryQualityService.listQualityBatches(parsed.data);
    res.json({
      success: true,
      data: result.rows,
      items: result.rows,
      meta: {
        total: result.total,
        filteredTotal: result.total,
        page: parsed.data.page,
        pageSize: parsed.data.limit,
        sort: [],
        filters: [
          parsed.data.reagentId && { field: 'reagentId', value: parsed.data.reagentId },
          parsed.data.search && { field: 'search', value: parsed.data.search },
          parsed.data.status && { field: 'status', value: parsed.data.status },
          parsed.data.qcStatus && { field: 'qcStatus', value: parsed.data.qcStatus },
          parsed.data.expiryFrom && {
            field: 'expiryFrom',
            value: parsed.data.expiryFrom.toISOString(),
          },
          parsed.data.expiryTo && {
            field: 'expiryTo',
            value: parsed.data.expiryTo.toISOString(),
          },
        ].filter(Boolean),
        asOf: new Date().toISOString(),
      },
    });
  }),
);

/**
 * GET /api/batches/:id
 * Get batch by ID with transactions
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await batchService.getById(id);

    if (!data) {
      throw new AppError('Batch not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * POST /api/batches
 * Create new batch (receive reagent)
 */
router.post(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(410).json({
      success: false,
      error: 'Batches with stock must be created by an authoritative delivery receipt',
      code: 'AUTHORITATIVE_RECEIPT_REQUIRED',
    });
  })
);

/**
 * PUT /api/batches/:id
 * Update batch
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const protectedFields = [
      'currentQuantity',
      'current_quantity',
      'status',
      'qcStatus',
      'qc_status',
      'coaDocumentUrl',
      'coa_document_url',
    ];
    if (protectedFields.some((field) => body[field] !== undefined)) {
      throw new AppError(
        'Quantity, status, QA, and COA changes require an authoritative workflow endpoint',
        410,
      );
    }

    const updateData: any = {};
    if (body.currentQuantity !== undefined || body.current_quantity !== undefined) {
      const value = body.currentQuantity ?? body.current_quantity;
      updateData.currentQuantity = parseFloat(value);
    }
    if (body.initialQuantity !== undefined || body.initial_quantity !== undefined) {
      const value = body.initialQuantity ?? body.initial_quantity;
      updateData.initialQuantity = parseFloat(value);
    }
    if (body.reservedQuantity !== undefined || body.reserved_quantity !== undefined) {
      const value = body.reservedQuantity ?? body.reserved_quantity;
      updateData.reservedQuantity = parseFloat(value);
    }
    if (body.status !== undefined) {
      updateData.status = String(body.status).toUpperCase();
    }
    if (body.expiry_date !== undefined || body.expiryDate !== undefined) {
      const value = body.expiryDate ?? body.expiry_date;
      updateData.expiryDate = value ? new Date(value) : undefined;
    }
    if (body.manufacture_date !== undefined || body.manufactureDate !== undefined) {
      const value = body.manufactureDate ?? body.manufacture_date;
      updateData.manufactureDate = value ? new Date(value) : undefined;
    }
    if (body.received_date !== undefined || body.receivedDate !== undefined) {
      const value = body.receivedDate ?? body.received_date;
      updateData.receivedDate = value ? new Date(value) : undefined;
    }
    if (body.storage_location !== undefined || body.storageLocation !== undefined) {
      updateData.storageLocation = body.storageLocation ?? body.storage_location;
    }
    if (body.storage_conditions !== undefined || body.storageConditions !== undefined) {
      updateData.storageConditions = body.storageConditions ?? body.storage_conditions;
    }
    if (body.qc_status !== undefined || body.qcStatus !== undefined) {
      const value = body.qcStatus ?? body.qc_status;
      updateData.qcStatus = value ? String(value).toUpperCase() : undefined;
    }
    if (body.qc_notes !== undefined || body.qcNotes !== undefined) {
      updateData.qcNotes = body.qcNotes ?? body.qc_notes;
    }
    if (body.coa_document_url !== undefined || body.coaDocumentUrl !== undefined) {
      updateData.coaDocumentUrl = body.coaDocumentUrl ?? body.coa_document_url;
    }
    if (body.notes !== undefined || body.general_notes !== undefined) {
      updateData.generalNotes = body.notes ?? body.general_notes;
    }

    const data = await prisma.reagentBatch.update({
      where: { id },
      data: updateData,
      include: { reagent: true },
    });

    await batchService.updateReagentAggregates(data.reagentId);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Batch updated successfully',
    };
    res.json(response);
  })
);

const sendQualityError = (res: Response, error: unknown) => {
  if (!isInventoryQualityError(error)) return false;
  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    code: error.code,
    ...error.details,
  });
  return true;
};

/**
 * POST /api/batches/:id/coa
 * Link COA evidence to one exact batch.
 */
router.post(
  '/:id/coa',
  authorize('ADMIN', 'MANAGER'),
  validateBody(linkBatchCoaSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await inventoryQualityService.linkCoa(
        req.params.id,
        req.body,
        req.user?.id,
      );
      res.json({ success: true, data });
    } catch (error) {
      if (sendQualityError(res, error)) return;
      throw error;
    }
  }),
);

/**
 * POST /api/batches/:id/quality-decision
 * Backend-authoritative release, hold, or reject transition.
 */
router.post(
  '/:id/quality-decision',
  authorize('ADMIN', 'MANAGER'),
  validateBody(qualityDecisionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await inventoryQualityService.decideQuality(
        req.params.id,
        req.body,
        req.user?.id,
      );
      res.json({ success: true, data });
    } catch (error) {
      if (sendQualityError(res, error)) return;
      throw error;
    }
  }),
);

/**
 * POST /api/batches/:id/withdraw
 * Retired: laboratory stock-out has one canonical transactional endpoint.
 */
router.post(
  '/:id/withdraw',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(410).json({
      success: false,
      error: 'Use POST /api/dispense for laboratory stock-out',
      code: 'LEGACY_STOCK_OUT_RETIRED',
    });
  })
);

/**
 * POST /api/batches/:id/mark-expired
 * Mark batch as expired
 */
router.post(
  '/:id/mark-expired',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await batchService.markExpired(id);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Batch marked as expired',
    };
    res.json(response);
  })
);

/**
 * POST /api/batches/:id/destroy
 * Mark batch as destroyed/disposed
 */
router.post(
  '/:id/destroy',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, notes } = req.body;

    const data = await batchService.markDestroyed(
      id,
      quantity ? parseFloat(quantity) : undefined,
      notes
    );

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Batch marked as destroyed',
    };
    res.json(response);
  })
);

export default router;
