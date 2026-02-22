import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { dispenseService } from '../services/dispenseService';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/disposal/partial - Record partial disposal of in-use item (quarter-based)
 * portionDisposed: 0.25 | 0.50 | 0.75 | 1.00
 */
router.post('/partial', asyncHandler(async (req, res) => {
  const { batchId, portionDisposed, reason, notes } = req.body;

  if (!batchId || portionDisposed === undefined || !reason) {
    return res.status(400).json({ success: false, error: 'batchId, portionDisposed, and reason are required' });
  }

  const result = await dispenseService.recordPartialDisposal({
    batchId,
    portionDisposed: Number(portionDisposed),
    reason,
    notes,
    disposedById: (req as any).user?.id,
  });

  res.status(201).json({ success: true, data: result });
}));

/**
 * GET /api/disposal/history - View disposal history
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { batchId, reagentId, limit, offset } = req.query;

  const result = await dispenseService.getDisposalHistory({
    batchId: batchId as string,
    reagentId: reagentId as string,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });

  res.json({ success: true, data: result.disposals, meta: { total: result.total } });
}));

export default router;
