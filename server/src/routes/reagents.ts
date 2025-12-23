import { Router, Request, Response } from 'express';
import { reagentService } from '../services';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, Category, StockStatus } from '../types';

const router = Router();

/**
 * GET /api/reagents
 * Get all reagents with optional filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { category, supplierId, stockStatus, search } = req.query;

    const data = await reagentService.getAll({
      category: category as Category | undefined,
      supplierId: supplierId as string | undefined,
      stockStatus: stockStatus as StockStatus | undefined,
      search: search as string | undefined,
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
 * GET /api/reagents/grouped
 * Get reagents grouped by supplier and category
 */
router.get(
  '/grouped',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await reagentService.getBySupplierAndCategory();
    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/reagents/:id
 * Get single reagent with batches
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await reagentService.getById(id);

    if (!data) {
      throw new AppError('Reagent not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * POST /api/reagents
 * Create new reagent
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      name,
      catalogNumber,
      category,
      supplierId,
      isConsumable,
      requiresBatches,
      notes,
      manualMonthlyUsage,
    } = req.body;

    if (!name || !supplierId) {
      throw new AppError('Name and supplierId are required', 400);
    }

    const data = await reagentService.create({
      name,
      catalogNumber,
      category,
      supplierId,
      isConsumable,
      requiresBatches,
      notes,
      manualMonthlyUsage,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Reagent created successfully',
    };
    res.status(201).json(response);
  })
);

/**
 * PUT /api/reagents/:id
 * Update reagent
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    const data = await reagentService.update(id, updateData);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Reagent updated successfully',
    };
    res.json(response);
  })
);

/**
 * DELETE /api/reagents/:id
 * Soft delete reagent
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await reagentService.delete(id);

    const response: ApiResponse = {
      success: true,
      message: 'Reagent deleted successfully',
    };
    res.json(response);
  })
);

export default router;
