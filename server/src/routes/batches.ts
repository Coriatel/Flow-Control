import { Router, Request, Response } from 'express';
import { batchService } from '../services';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, BatchStatus } from '../types';

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
  asyncHandler(async (req: Request, res: Response) => {
    const body = req.body || {};
    const reagentId = body.reagentId || body.reagent_id;
    const batchNumber = body.batchNumber || body.batch_number;
    const expiryDateRaw = body.expiryDate || body.expiry_date;
    const initialQuantityRaw = body.initialQuantity ?? body.initial_quantity ?? body.currentQuantity ?? body.current_quantity;

    if (!reagentId || !batchNumber || initialQuantityRaw === undefined) {
      throw new AppError(
        'reagentId/reagent_id, batchNumber/batch_number, and initialQuantity/currentQuantity are required',
        400
      );
    }

    const initialQuantity = parseFloat(initialQuantityRaw);
    if (Number.isNaN(initialQuantity)) {
      throw new AppError('initialQuantity must be a valid number', 400);
    }

    const expiryDate = expiryDateRaw ? new Date(expiryDateRaw) : null;
    if (!expiryDate || Number.isNaN(expiryDate.getTime())) {
      throw new AppError('expiryDate is required and must be a valid date', 400);
    }

    const currentQuantityRaw = body.currentQuantity ?? body.current_quantity;
    const currentQuantity = currentQuantityRaw !== undefined
      ? parseFloat(currentQuantityRaw)
      : initialQuantity;

    const data = await prisma.reagentBatch.create({
      data: {
        reagentId,
        batchNumber,
        expiryDate,
        manufactureDate: body.manufacture_date ? new Date(body.manufacture_date) : undefined,
        initialQuantity,
        currentQuantity,
        reservedQuantity: body.reserved_quantity ?? body.reservedQuantity ?? 0,
        receivedDate: body.receivedDate ? new Date(body.receivedDate) : (body.received_date ? new Date(body.received_date) : new Date()),
        deliveryId: body.delivery_id || body.deliveryId || null,
        status: body.status ? String(body.status).toUpperCase() : 'ACTIVE',
        qcStatus: body.qc_status ? String(body.qc_status).toUpperCase() : (body.qcStatus ? String(body.qcStatus).toUpperCase() : undefined),
        qcNotes: body.qc_notes || body.qcNotes || null,
        coaDocumentUrl: body.coa_document_url || body.coaDocumentUrl || null,
        storageLocation: body.storage_location || body.storageLocation || null,
        storageConditions: body.storage_conditions || body.storageConditions || null,
        generalNotes: body.notes || body.general_notes || null,
      },
      include: { reagent: true },
    });

    await batchService.updateReagentAggregates(reagentId);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Batch created successfully',
    };
    res.status(201).json(response);
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

/**
 * POST /api/batches/:id/withdraw
 * Withdraw quantity from batch
 */
router.post(
  '/:id/withdraw',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, performedBy, notes } = req.body;

    if (!quantity || quantity <= 0) {
      throw new AppError('Valid quantity is required', 400);
    }

    const data = await batchService.withdraw({
      batchId: id,
      quantity: parseFloat(quantity),
      performedBy,
      notes,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Withdrawal completed successfully',
    };
    res.json(response);
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
