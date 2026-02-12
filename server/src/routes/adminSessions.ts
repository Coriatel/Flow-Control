import { Router } from 'express';

import { prisma } from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Admin-only
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/', asyncHandler(async (_req, res) => {
  const sessions = await prisma.$queryRaw<any[]>`
    SELECT
      rt.id,
      rt.user_id,
      u.email,
      rt.created_at,
      rt.expires_at,
      rt.revoked_at,
      rt.ip,
      rt.user_agent,
      rt.device_label
    FROM inventory.refresh_tokens rt
    JOIN inventory.app_users u ON u.id = rt.user_id
    ORDER BY rt.created_at DESC
    LIMIT 200
  `;

  res.json({
    success: true,
    data: sessions,
  });
}));

router.post('/:id/revoke', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const now = new Date();

  const updated = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE inventory.refresh_tokens
    SET revoked_at = ${now}
    WHERE id = ${id}
      AND revoked_at IS NULL
    RETURNING id
  `;

  if (updated.length === 0) {
    throw new AppError('Session not found or already revoked', 404);
  }

  res.json({
    success: true,
    message: 'Session revoked',
  });
}));

export default router;
