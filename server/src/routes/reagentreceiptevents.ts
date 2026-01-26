import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * NOTE: ReagentReceiptEvent model does not exist in Prisma schema yet.
 * This route acts as a compatibility stub to avoid 404s from the frontend.
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: [],
      meta: { total: 0 },
    };
    res.json(response);
  })
);

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const response: ApiResponse = {
      success: true,
      data: req.body || {},
      message: 'Reagent receipt event accepted (stub)',
    };
    res.status(201).json(response);
  })
);

router.post(
  '/bulk',
  asyncHandler(async (req: Request, res: Response) => {
    const items = Array.isArray(req.body) ? req.body : req.body?.items || [];
    const response: ApiResponse = {
      success: true,
      data: { count: Array.isArray(items) ? items.length : 0 },
      message: 'Reagent receipt events accepted (stub)',
    };
    res.status(201).json(response);
  })
);

export default router;
