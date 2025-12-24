import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All delivery routes require authentication
router.use(authenticate);

/**
 * GET /api/deliveries
 * Get all deliveries
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const deliveries = await prisma.delivery.findMany({
    where: { isDeleted: false },
    include: {
      supplier: true,
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
    data: deliveries
  });
}));

/**
 * GET /api/deliveries/:id
 * Get delivery by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          reagent: true,
          batch: true
        }
      }
    }
  });

  if (!delivery || delivery.isDeleted) {
    throw new AppError('Delivery not found', 404);
  }

  res.json({
    success: true,
    data: delivery
  });
}));

/**
 * POST /api/deliveries
 * Create new delivery
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  const delivery = await prisma.delivery.create({
    data: {
      ...data,
      items: data.items ? {
        create: data.items
      } : undefined
    },
    include: {
      supplier: true,
      items: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'Delivery created successfully',
    data: delivery
  });
}));

/**
 * PUT /api/deliveries/:id
 * Update delivery
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const delivery = await prisma.delivery.update({
    where: { id },
    data,
    include: {
      supplier: true,
      items: true
    }
  });

  res.json({
    success: true,
    message: 'Delivery updated successfully',
    data: delivery
  });
}));

/**
 * DELETE /api/deliveries/:id
 * Soft delete delivery
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.delivery.update({
    where: { id },
    data: { isDeleted: true }
  });

  res.json({
    success: true,
    message: 'Delivery deleted successfully'
  });
}));

export default router;
