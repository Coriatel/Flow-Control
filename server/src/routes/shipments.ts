import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All shipment routes require authentication
router.use(authenticate);

/**
 * GET /api/shipments
 * Get all shipments
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const shipments = await prisma.shipment.findMany({
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
    data: shipments
  });
}));

/**
 * GET /api/shipments/:id
 * Get shipment by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const shipment = await prisma.shipment.findUnique({
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

  if (!shipment || shipment.isDeleted) {
    throw new AppError('Shipment not found', 404);
  }

  res.json({
    success: true,
    data: shipment
  });
}));

/**
 * POST /api/shipments
 * Create new shipment
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  const shipment = await prisma.shipment.create({
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
    message: 'Shipment created successfully',
    data: shipment
  });
}));

/**
 * PUT /api/shipments/:id
 * Update shipment
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const shipment = await prisma.shipment.update({
    where: { id },
    data,
    include: {
      items: true
    }
  });

  res.json({
    success: true,
    message: 'Shipment updated successfully',
    data: shipment
  });
}));

/**
 * DELETE /api/shipments/:id
 * Soft delete shipment
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.shipment.update({
    where: { id },
    data: { isDeleted: true }
  });

  res.json({
    success: true,
    message: 'Shipment deleted successfully'
  });
}));

export default router;
