import { Router, Request, Response } from 'express';
import { reagentService } from '../services';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { createReagentSchema, updateReagentSchema } from '../validation/schemas';
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
  validateBody(createReagentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await reagentService.create(req.body);

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
  validateBody(updateReagentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await reagentService.update(id, req.body);

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
