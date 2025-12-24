import { Router } from 'express';
import { PrismaClient } from '../generated/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All withdrawal routes require authentication
router.use(authenticate);

/**
 * GET /api/withdrawals
 * Get all withdrawal requests
 */
router.get('/', asyncHandler(async (req, res) => {
  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: { isDeleted: false },
    include: {
      items: {
        include: {
          reagent: true,
          batch: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: withdrawals
  });
}));

/**
 * GET /api/withdrawals/:id
 * Get withdrawal by ID
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          reagent: true,
          batch: true
        }
      }
    }
  });

  if (!withdrawal || withdrawal.isDeleted) {
    throw new AppError('Withdrawal request not found', 404);
  }

  res.json({
    success: true,
    data: withdrawal
  });
}));

/**
 * POST /api/withdrawals
 * Create new withdrawal request
 */
router.post('/', asyncHandler(async (req, res) => {
  const data = req.body;

  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      ...data,
      items: data.items ? {
        create: data.items
      } : undefined
    },
    include: {
      items: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Withdrawal request created successfully',
    data: withdrawal
  });
}));

/**
 * PUT /api/withdrawals/:id
 * Update withdrawal request
 */
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data,
    include: {
      items: true
    }
  });

  res.json({
    success: true,
    message: 'Withdrawal request updated successfully',
    data: withdrawal
  });
}));

/**
 * DELETE /api/withdrawals/:id
 * Soft delete withdrawal request
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.withdrawalRequest.update({
    where: { id },
    data: { isDeleted: true }
  });

  res.json({
    success: true,
    message: 'Withdrawal request deleted successfully'
  });
}));

/**
 * POST /api/withdrawals/:id/approve
 * Approve withdrawal request
 */
router.post('/:id/approve', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date()
    },
    include: {
      items: true
    }
  });

  res.json({
    success: true,
    message: 'Withdrawal request approved successfully',
    data: withdrawal
  });
}));

export default router;
