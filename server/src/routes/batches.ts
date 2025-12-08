import { Router, Request, Response } from 'express';
import { batchService } from '../services';
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
    const { reagentId, status, expiringWithinDays } = req.query;

    const data = await batchService.getAll({
      reagentId: reagentId as string | undefined,
      status: status as BatchStatus | undefined,
      expiringWithinDays: expiringWithinDays
        ? parseInt(expiringWithinDays as string)
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
    const { reagentId, batchNumber, expiryDate, initialQuantity, receivedDate, notes } =
      req.body;

    if (!reagentId || !batchNumber || !expiryDate || initialQuantity === undefined) {
      throw new AppError(
        'reagentId, batchNumber, expiryDate, and initialQuantity are required',
        400
      );
    }

    const data = await batchService.create({
      reagentId,
      batchNumber,
      expiryDate: new Date(expiryDate),
      initialQuantity: parseFloat(initialQuantity),
      receivedDate: receivedDate ? new Date(receivedDate) : undefined,
      notes,
    });

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
    const { currentQuantity, status, notes } = req.body;

    const data = await batchService.update(id, {
      currentQuantity:
        currentQuantity !== undefined ? parseFloat(currentQuantity) : undefined,
      status,
      notes,
    });

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
