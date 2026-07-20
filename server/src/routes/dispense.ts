import { Router } from 'express';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { dispenseService } from '../services/dispenseService';
import { validateBody } from '../middleware/validate';
import {
  dispenseHistoryQuerySchema,
  dispenseInventorySchema,
} from '../validation/inventoryQuality';
import { inventoryQualityService } from '../services/inventoryQualityService';
import { isInventoryQualityError } from '../contracts/inventoryQuality';
import { safeParse } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/dispense - Dispense item from inventory
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER', 'USER'),
  validateBody(dispenseInventorySchema),
  asyncHandler(async (req, res) => {
    try {
      const result = await inventoryQualityService.dispense(
        req.body,
        req.user?.id,
      );
      res
        .status(result.idempotentReplay ? 200 : 201)
        .json({ success: true, data: result });
    } catch (error: any) {
      if (isInventoryQualityError(error)) {
        return res.status(error.statusCode).json({
          success: false,
          error: error.message,
          code: error.code,
          ...error.details,
        });
      }
      if (error?.code === 'P2034') {
        return res.status(409).json({
          success: false,
          error: 'Concurrent inventory change; retry the request',
          code: 'RETRYABLE_CONFLICT',
          retryable: true,
        });
      }
      throw error;
    }
  }),
);

/**
 * POST /api/dispense/by-scan - Scan barcode to identify + dispense
 */
router.post('/by-scan', asyncHandler(async (req, res) => {
  res.status(410).json({
    success: false,
    error:
      'Parse the scan with /api/barcode/parse, then use canonical POST /api/dispense',
    code: 'LEGACY_STOCK_OUT_RETIRED',
  });
}));

/**
 * GET /api/dispense/history - View dispense history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const parsed = safeParse(dispenseHistoryQuerySchema, req.query);
  if (parsed.success === false) throw new AppError(parsed.error, 400);
  const { reagentId, batchId, dispensedById, fromDate, toDate } = parsed.data;
  const pageSize = parsed.data.limit;
  const page = parsed.data.offset === undefined
    ? parsed.data.page
    : Math.floor(parsed.data.offset / pageSize) + 1;
  const result = await inventoryQualityService.getDispenseHistory({
    reagentId,
    batchId,
    dispensedById,
    fromDate,
    toDate,
    page,
    limit: pageSize,
  });

  res.json({
    success: true,
    data: result.rows,
    items: result.rows,
    meta: {
      total: result.total,
      filteredTotal: result.total,
      page,
      pageSize,
      sort: [{ field: 'createdAt', direction: 'desc' }],
      filters: [
        reagentId && { field: 'reagentId', value: reagentId },
        batchId && { field: 'batchId', value: batchId },
        dispensedById && { field: 'dispensedById', value: dispensedById },
        fromDate && { field: 'fromDate', value: fromDate.toISOString() },
        toDate && { field: 'toDate', value: toDate.toISOString() },
      ].filter(Boolean),
      asOf: new Date().toISOString(),
    },
  });
}));

/**
 * GET /api/dispense/in-use - List all items currently "in use"
 */
router.get('/in-use', asyncHandler(async (_req, res) => {
  const items = await dispenseService.getInUseItems();
  res.json({ success: true, data: items });
}));

/**
 * POST /api/dispense/:id/return - Return item to inventory (ADMIN only)
 */
router.post('/:id/return', authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await dispenseService.returnToInventory(id, (req as any).user?.id);
  res.json({ success: true, data: result });
}));

export default router;
