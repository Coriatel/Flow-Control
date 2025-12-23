import { Router, Request, Response } from 'express';
import { inventoryService } from '../services';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/inventory/count/draft
 * Get current count draft
 */
router.get(
  '/count/draft',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await inventoryService.getCurrentDraft();
    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * POST /api/inventory/count/draft
 * Save count entries to draft
 */
router.post(
  '/count/draft',
  asyncHandler(async (req: Request, res: Response) => {
    const { draftId, entries } = req.body;

    if (!draftId || !entries || !Array.isArray(entries)) {
      throw new AppError('draftId and entries array are required', 400);
    }

    await inventoryService.saveCountEntries(draftId, entries);

    const response: ApiResponse = {
      success: true,
      message: 'Draft saved successfully',
    };
    res.json(response);
  })
);

/**
 * POST /api/inventory/count/complete
 * Complete inventory count
 */
router.post(
  '/count/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const { draftId } = req.body;

    if (!draftId) {
      throw new AppError('draftId is required', 400);
    }

    const completedId = await inventoryService.completeCount(draftId);

    const response: ApiResponse = {
      success: true,
      data: { completedId },
      message: 'Inventory count completed successfully',
    };
    res.json(response);
  })
);

/**
 * GET /api/inventory/count/history
 * Get count history
 */
router.get(
  '/count/history',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await inventoryService.getCountHistory(limit);

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/inventory/replenishment
 * Calculate replenishment suggestions
 */
router.get(
  '/replenishment',
  asyncHandler(async (req: Request, res: Response) => {
    const targetMonths = parseInt(req.query.targetMonths as string) || 3;
    const data = await inventoryService.calculateReplenishment(targetMonths);

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/inventory/transactions/:reagentId
 * Get transactions for a reagent
 */
router.get(
  '/transactions/:reagentId',
  asyncHandler(async (req: Request, res: Response) => {
    const { reagentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const data = await inventoryService.getTransactions(reagentId, {
      limit,
      offset,
    });

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

export default router;
