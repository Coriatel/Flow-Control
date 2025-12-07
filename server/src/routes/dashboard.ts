import { Router, Request, Response } from 'express';
import { dashboardService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/dashboard
 * Get all dashboard data
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getDashboardData();
    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/dashboard/expiring
 * Get expiring reagents
 */
router.get(
  '/expiring',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getExpiringReagents();
    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/dashboard/low-stock
 * Get low stock reagents
 */
router.get(
  '/low-stock',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getLowStockReagents();
    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/dashboard/statistics
 * Get dashboard statistics
 */
router.get(
  '/statistics',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await dashboardService.getStatistics();
    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

export default router;
