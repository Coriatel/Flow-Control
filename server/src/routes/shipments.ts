import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse, ShipmentStatus } from '../types';

const router = Router();

// All shipment routes require authentication
router.use(authenticate);

/**
 * GET /api/shipments
 * Get all shipments with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, destinationHospital, fromDate, toDate } = req.query;

  const where: any = {};

  if (status) {
    where.status = status as ShipmentStatus;
  }

  if (destinationHospital) {
    where.destinationHospital = {
      contains: destinationHospital as string,
      mode: 'insensitive'
    };
  }

  if (fromDate || toDate) {
    where.shipmentDate = {};
    if (fromDate) {
      where.shipmentDate.gte = new Date(fromDate as string);
    }
    if (toDate) {
      where.shipmentDate.lte = new Date(toDate as string);
    }
  }

  const shipments = await prisma.shipment.findMany({
    where,
    include: {
      items: {
        include: {
          reagent: {
            select: {
              id: true,
              name: true,
              catalogNumber: true
            }
          }
        }
      }
    },
    orderBy: { shipmentDate: 'desc' }
  });

  const response: ApiResponse = {
    success: true,
    data: shipments,
    meta: { total: shipments.length }
  };
  res.json(response);
}));

/**
 * GET /api/shipments/pending
 * Get pending shipments that need to be sent
 */
router.get('/pending', asyncHandler(async (req: Request, res: Response) => {
  const shipments = await prisma.shipment.findMany({
    where: {
      status: 'DRAFT'
    },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    },
    orderBy: { shipmentDate: 'asc' }
  });

  const response: ApiResponse = {
    success: true,
    data: shipments
  };
  res.json(response);
}));

/**
 * GET /api/shipments/:id
 * Get shipment by ID with full details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: shipment
  };
  res.json(response);
}));

/**
 * POST /api/shipments
 * Create new shipment
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { destinationHospital, destinationDepartment, shipmentDate, items, notes } = req.body;

  if (!destinationHospital) {
    throw new AppError('destinationHospital is required', 400);
  }

  if (!shipmentDate) {
    throw new AppError('shipmentDate is required', 400);
  }

  // Generate shipment number
  const count = await prisma.shipment.count();
  const shipmentNumber = `SHP-${String(count + 1).padStart(6, '0')}`;

  const shipment = await prisma.shipment.create({
    data: {
      shipmentNumber,
      destinationHospital,
      destinationDepartment,
      shipmentDate: new Date(shipmentDate),
      status: 'DRAFT',
      notes,
      items: items && items.length > 0 ? {
        create: items.map((item: any) => ({
          reagentId: item.reagentId,
          batchId: item.batchId,
          quantity: item.quantity
        }))
      } : undefined
    },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: shipment,
    message: 'Shipment created successfully'
  };
  res.status(201).json(response);
}));

/**
 * PUT /api/shipments/:id
 * Update shipment
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { destinationHospital, destinationDepartment, shipmentDate, notes, documentUrl } = req.body;

  const existing = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only update shipments in DRAFT status', 400);
  }

  const shipment = await prisma.shipment.update({
    where: { id },
    data: {
      destinationHospital,
      destinationDepartment,
      shipmentDate: shipmentDate ? new Date(shipmentDate) : undefined,
      notes,
      documentUrl
    },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: shipment,
    message: 'Shipment updated successfully'
  };
  res.json(response);
}));

/**
 * POST /api/shipments/:id/send
 * Send shipment - deducts from inventory
 */
router.post('/:id/send', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sentBy } = req.body;

  const existing = await prisma.shipment.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only send shipments in DRAFT status', 400);
  }

  if (existing.items.length === 0) {
    throw new AppError('Cannot send shipment with no items', 400);
  }

  // Process each item - deduct from batches
  for (const item of existing.items) {
    if (item.batchId) {
      // Deduct from specific batch
      const batch = await prisma.reagentBatch.findUnique({
        where: { id: item.batchId }
      });

      if (!batch) {
        throw new AppError(`Batch ${item.batchId} not found`, 404);
      }

      if (Number(batch.currentQuantity) < Number(item.quantity)) {
        throw new AppError(`Insufficient quantity in batch ${batch.batchNumber}`, 400);
      }

      await prisma.reagentBatch.update({
        where: { id: item.batchId },
        data: {
          currentQuantity: { decrement: item.quantity }
        }
      });

      // Create inventory transaction
      await prisma.inventoryTransaction.create({
        data: {
          reagentId: item.reagentId,
          batchId: item.batchId,
          transactionType: 'TRANSFER_OUT',
          quantityDelta: -Number(item.quantity),
          sourceType: 'shipment',
          sourceId: id,
          performedById: sentBy || req.user?.id,
          notes: `Shipped to ${existing.destinationHospital} (${existing.shipmentNumber})`
        }
      });

      // Update reagent totals
      await prisma.reagent.update({
        where: { id: item.reagentId },
        data: {
          totalQuantity: { decrement: item.quantity }
        }
      });
    } else {
      // No specific batch - find available batches and deduct FIFO
      let remainingQuantity = Number(item.quantity);
      const batches = await prisma.reagentBatch.findMany({
        where: {
          reagentId: item.reagentId,
          status: 'ACTIVE',
          currentQuantity: { gt: 0 }
        },
        orderBy: { expiryDate: 'asc' } // FIFO by expiry date
      });

      for (const batch of batches) {
        if (remainingQuantity <= 0) break;

        const deductAmount = Math.min(remainingQuantity, Number(batch.currentQuantity));

        await prisma.reagentBatch.update({
          where: { id: batch.id },
          data: {
            currentQuantity: { decrement: deductAmount }
          }
        });

        // Create inventory transaction
        await prisma.inventoryTransaction.create({
          data: {
            reagentId: item.reagentId,
            batchId: batch.id,
            transactionType: 'TRANSFER_OUT',
            quantityDelta: -deductAmount,
            sourceType: 'shipment',
            sourceId: id,
            performedById: sentBy || req.user?.id,
            notes: `Shipped to ${existing.destinationHospital} (${existing.shipmentNumber})`
          }
        });

        remainingQuantity -= deductAmount;
      }

      if (remainingQuantity > 0) {
        throw new AppError(`Insufficient quantity available for ${item.reagent.name}`, 400);
      }

      // Update reagent totals
      await prisma.reagent.update({
        where: { id: item.reagentId },
        data: {
          totalQuantity: { decrement: item.quantity }
        }
      });
    }
  }

  // Update shipment status
  const shipment = await prisma.shipment.update({
    where: { id },
    data: { status: 'SENT' },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: shipment,
    message: 'Shipment sent successfully'
  };
  res.json(response);
}));

/**
 * POST /api/shipments/:id/confirm-received
 * Confirm shipment was received at destination
 */
router.post('/:id/confirm-received', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { receivedNotes } = req.body;

  const existing = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'SENT') {
    throw new AppError('Can only confirm received shipments that are SENT', 400);
  }

  const shipment = await prisma.shipment.update({
    where: { id },
    data: {
      status: 'RECEIVED',
      notes: existing.notes
        ? `${existing.notes}\n\nReceived notes: ${receivedNotes || 'Confirmed received'}`
        : receivedNotes || 'Confirmed received'
    },
    include: {
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: shipment,
    message: 'Shipment confirmed as received'
  };
  res.json(response);
}));

/**
 * POST /api/shipments/:id/cancel
 * Cancel shipment
 */
router.post('/:id/cancel', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const existing = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only cancel shipments in DRAFT status', 400);
  }

  const shipment = await prisma.shipment.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: existing.notes
        ? `${existing.notes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`
    },
    include: {
      items: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: shipment,
    message: 'Shipment cancelled'
  };
  res.json(response);
}));

/**
 * POST /api/shipments/:id/items
 * Add item to shipment
 */
router.post('/:id/items', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reagentId, batchId, quantity } = req.body;

  if (!reagentId || !quantity || quantity <= 0) {
    throw new AppError('reagentId and positive quantity are required', 400);
  }

  const existing = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only add items to shipments in DRAFT status', 400);
  }

  // Validate batch if provided
  if (batchId) {
    const batch = await prisma.reagentBatch.findUnique({
      where: { id: batchId }
    });

    if (!batch) {
      throw new AppError('Batch not found', 404);
    }

    if (batch.reagentId !== reagentId) {
      throw new AppError('Batch does not belong to the specified reagent', 400);
    }

    if (Number(batch.currentQuantity) < quantity) {
      throw new AppError('Insufficient quantity in batch', 400);
    }
  }

  const item = await prisma.shipmentItem.create({
    data: {
      shipmentId: id,
      reagentId,
      batchId,
      quantity
    },
    include: {
      reagent: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: item,
    message: 'Item added to shipment'
  };
  res.status(201).json(response);
}));

/**
 * PUT /api/shipments/:id/items/:itemId
 * Update shipment item
 */
router.put('/:id/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const { id, itemId } = req.params;
  const { batchId, quantity } = req.body;

  const existing = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only update items in shipments in DRAFT status', 400);
  }

  const item = await prisma.shipmentItem.update({
    where: { id: itemId },
    data: {
      batchId,
      quantity
    },
    include: {
      reagent: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: item,
    message: 'Item updated'
  };
  res.json(response);
}));

/**
 * DELETE /api/shipments/:id/items/:itemId
 * Remove item from shipment
 */
router.delete('/:id/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const { id, itemId } = req.params;

  const existing = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Shipment not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only remove items from shipments in DRAFT status', 400);
  }

  await prisma.shipmentItem.delete({
    where: { id: itemId }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Item removed from shipment'
  };
  res.json(response);
}));

export default router;
