import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { dispenseService } from '../services/dispenseService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/dispense - Dispense item from inventory
 */
router.post('/', asyncHandler(async (req, res) => {
  const { reagentId, batchId, quantity, scanMethod, rawScanData, purpose, notes } = req.body;

  if (!reagentId || !batchId || !quantity) {
    return res.status(400).json({ success: false, error: 'reagentId, batchId, and quantity are required' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ success: false, error: 'quantity must be positive' });
  }

  const result = await dispenseService.dispenseItem({
    reagentId,
    batchId,
    quantity: Number(quantity),
    dispensedById: (req as any).user?.id,
    scanMethod,
    rawScanData,
    purpose,
    notes,
  });

  res.status(201).json({ success: true, data: result });
}));

/**
 * POST /api/dispense/by-scan - Scan barcode to identify + dispense
 */
router.post('/by-scan', asyncHandler(async (req, res) => {
  const { rawScanData, quantity, purpose, notes } = req.body;

  if (!rawScanData || !quantity) {
    return res.status(400).json({ success: false, error: 'rawScanData and quantity are required' });
  }

  const result = await dispenseService.dispenseByScan({
    rawScanData,
    quantity: Number(quantity),
    dispensedById: (req as any).user?.id,
    purpose,
    notes,
  });

  res.status(201).json({ success: true, data: result });
}));

/**
 * GET /api/dispense/history - View dispense history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { reagentId, batchId, dispensedById, fromDate, toDate, limit, offset } = req.query;

  const result = await dispenseService.getHistory({
    reagentId: reagentId as string,
    batchId: batchId as string,
    dispensedById: dispensedById as string,
    fromDate: fromDate ? new Date(fromDate as string) : undefined,
    toDate: toDate ? new Date(toDate as string) : undefined,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });

  res.json({ success: true, data: result.events, meta: { total: result.total } });
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
