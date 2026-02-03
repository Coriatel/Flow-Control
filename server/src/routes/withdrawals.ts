import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createWithdrawalSchema, updateWithdrawalSchema, approveWithdrawalSchema, addWithdrawalItemSchema } from '../validation/schemas';
import { ApiResponse, WithdrawalStatus } from '../types';

const router = Router();

// All withdrawal routes require authentication
router.use(authenticate);

/**
 * GET /api/withdrawals
 * Get all withdrawal requests with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { supplierId, status, frameworkOrderId, fromDate, toDate } = req.query;

  const where: any = {};

  if (supplierId) {
    where.supplierId = supplierId as string;
  }

  if (status) {
    where.status = status as WithdrawalStatus;
  }

  if (frameworkOrderId) {
    where.frameworkOrderId = frameworkOrderId as string;
  }

  if (fromDate || toDate) {
    where.requestDate = {};
    if (fromDate) {
      where.requestDate.gte = new Date(fromDate as string);
    }
    if (toDate) {
      where.requestDate.lte = new Date(toDate as string);
    }
  }

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where,
    include: {
      supplier: true,
      frameworkOrder: {
        select: {
          id: true,
          validFrom: true,
          validTo: true,
          order: {
            select: {
              tempNumber: true,
              permanentNumber: true
            }
          }
        }
      },
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
    orderBy: { requestDate: 'desc' }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawals,
    meta: { total: withdrawals.length }
  };
  res.json(response);
}));

/**
 * GET /api/withdrawals/pending
 * Get pending withdrawal requests that need attention
 */
router.get('/pending', asyncHandler(async (req: Request, res: Response) => {
  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      status: {
        in: ['DRAFT', 'SUBMITTED']
      }
    },
    include: {
      supplier: true,
      items: {
        include: {
          reagent: true
        }
      }
    },
    orderBy: { requestDate: 'asc' }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawals
  };
  res.json(response);
}));

/**
 * GET /api/withdrawals/:id
 * Get withdrawal request by ID with full details
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      supplier: true,
      frameworkOrder: {
        include: {
          order: true,
          items: true
        }
      },
      items: {
        include: {
          reagent: true
        }
      },
      deliveries: {
        include: {
          items: true
        }
      }
    }
  });

  if (!withdrawal) {
    throw new AppError('Withdrawal request not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: withdrawal
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals
 * Create new withdrawal request
 */
router.post('/', validateBody(createWithdrawalSchema), asyncHandler(async (req: Request, res: Response) => {
  const { supplierId, frameworkOrderId, items, requesterNotes } = req.body;

  // Get supplier for snapshot
  const supplier = await prisma.supplier.findUnique({
    where: { id: supplierId }
  });

  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // If frameworkOrderId provided, validate it exists or resolve it from order id
  let resolvedFrameworkOrderId = frameworkOrderId;
  if (frameworkOrderId) {
    let frameworkOrder: any = await prisma.frameworkOrder.findUnique({
      where: { id: frameworkOrderId },
      include: { items: true }
    });

    if (!frameworkOrder) {
      const order = await prisma.order.findUnique({
        where: { id: frameworkOrderId },
        include: { items: true }
      });

      if (!order) {
        throw new AppError('Framework order not found', 404);
      }

      const normalizedOrderType = order.orderType ? order.orderType.toUpperCase() : '';
      if (normalizedOrderType !== 'FRAMEWORK') {
        throw new AppError('Framework order not found', 404);
      }

      const orderItems = Array.isArray(order.items) ? order.items : [];
      const totalAllocated = orderItems.reduce((sum, item: any) => {
        return sum + (Number(item.requestedQuantity) || 0);
      }, 0);

      const validFrom = order.orderDate ? new Date(order.orderDate) : new Date();
      const validTo = new Date(validFrom);
      validTo.setFullYear(validTo.getFullYear() + 1);

      frameworkOrder = await prisma.frameworkOrder.create({
        data: {
          orderId: order.id,
          validFrom,
          validTo,
          maxTotalQuantity: totalAllocated,
          availableQuantity: totalAllocated
        }
      });

      if (orderItems.length > 0) {
        await prisma.frameworkOrderItem.createMany({
          data: orderItems.map((item: any) => {
            const allocated = Number(item.requestedQuantity) || 0;
            return {
              frameworkOrderId: frameworkOrder!.id,
              reagentId: item.reagentId,
              allocatedQuantity: allocated,
              consumedQuantity: 0,
              availableQuantity: allocated
            };
          })
        });
      }
    } else if (Array.isArray(frameworkOrder.items) && frameworkOrder.items.length === 0) {
      const order = await prisma.order.findUnique({
        where: { id: frameworkOrder.orderId },
        include: { items: true }
      });
      const orderItems = Array.isArray(order?.items) ? order!.items : [];
      if (orderItems.length > 0) {
        await prisma.frameworkOrderItem.createMany({
          data: orderItems.map((item: any) => {
            const allocated = Number(item.requestedQuantity) || 0;
            return {
              frameworkOrderId: frameworkOrder!.id,
              reagentId: item.reagentId,
              allocatedQuantity: allocated,
              consumedQuantity: 0,
              availableQuantity: allocated
            };
          })
        });
      }
    }

    if (!frameworkOrder) {
      throw new AppError('Framework order not found', 404);
    }

    const now = new Date();
    if (now < frameworkOrder.validFrom || now > frameworkOrder.validTo) {
      throw new AppError('Framework order is not currently valid', 400);
    }

    resolvedFrameworkOrderId = frameworkOrder.id;
  }

  // Calculate total value
  let totalValueRequested = 0;
  for (const item of items) {
    if (item.unitPrice && item.requestedQuantity) {
      totalValueRequested += item.unitPrice * item.requestedQuantity;
    }
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    // Generate withdrawal number atomically
    const lastWithdrawal = await tx.withdrawalRequest.findFirst({
      orderBy: { withdrawalNumber: 'desc' }
    });
    let seq = 1;
    if (lastWithdrawal) {
      const lastNum = parseInt(lastWithdrawal.withdrawalNumber.replace('WD-', ''));
      if (!isNaN(lastNum)) seq = lastNum + 1;
    }
    const withdrawalNumber = `WD-${String(seq).padStart(6, '0')}`;

    return tx.withdrawalRequest.create({
      data: {
        withdrawalNumber,
        supplierId,
        supplierSnapshot: supplier.name,
        frameworkOrderId: resolvedFrameworkOrderId,
        status: 'DRAFT',
        requesterNotes,
        requestedById: req.user?.id,
        totalValueRequested: totalValueRequested > 0 ? totalValueRequested : null,
        items: {
          create: items.map((item: any) => ({
            reagentId: item.reagentId,
            requestedQuantity: item.requestedQuantity,
            unitPrice: item.unitPrice
          }))
        }
      },
      include: {
        supplier: true,
        items: {
          include: {
            reagent: true
          }
        }
      }
    });
  }, { isolationLevel: 'Serializable' });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request created successfully'
  };
  res.status(201).json(response);
}));

/**
 * PUT /api/withdrawals/:id
 * Update withdrawal request
 */
router.put('/:id', validateBody(updateWithdrawalSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { requesterNotes } = req.body;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only update withdrawal requests in DRAFT status', 400);
  }

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      requesterNotes
    },
    include: {
      supplier: true,
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request updated successfully'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/submit
 * Submit withdrawal request for approval
 */
router.post('/:id/submit', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only submit withdrawal requests in DRAFT status', 400);
  }

  if (existing.items.length === 0) {
    throw new AppError('Cannot submit withdrawal request with no items', 400);
  }

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      requestDate: new Date()
    },
    include: {
      supplier: true,
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request submitted for approval'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/approve
 * Approve withdrawal request
 */
router.post('/:id/approve', authorize('ADMIN', 'MANAGER'), validateBody(approveWithdrawalSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approverNotes, approvedItems } = req.body;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'SUBMITTED') {
    throw new AppError('Can only approve withdrawal requests in SUBMITTED status', 400);
  }

  // Update approved quantities for items if provided
  if (approvedItems && Array.isArray(approvedItems)) {
    for (const approvedItem of approvedItems) {
      await prisma.withdrawalItem.update({
        where: { id: approvedItem.itemId },
        data: { approvedQuantity: approvedItem.approvedQuantity }
      });
    }
  } else {
    // If no specific approved items, approve all with requested quantities
    for (const item of existing.items) {
      await prisma.withdrawalItem.update({
        where: { id: item.id },
        data: { approvedQuantity: item.requestedQuantity }
      });
    }
  }

  // Calculate total approved value
  const updatedItems = await prisma.withdrawalItem.findMany({
    where: { withdrawalRequestId: id }
  });

  let totalValueApproved = 0;
  for (const item of updatedItems) {
    if (item.unitPrice && item.approvedQuantity) {
      totalValueApproved += Number(item.unitPrice) * Number(item.approvedQuantity);
    }
  }

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvalDate: new Date(),
      approvedById: req.user?.id,
      approverNotes,
      totalValueApproved: totalValueApproved > 0 ? totalValueApproved : null
    },
    include: {
      supplier: true,
      items: {
        include: {
          reagent: true
        }
      }
    }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request approved successfully'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/reject
 * Reject withdrawal request
 */
router.post('/:id/reject', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('Rejection reason is required', 400);
  }

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'SUBMITTED') {
    throw new AppError('Can only reject withdrawal requests in SUBMITTED status', 400);
  }

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      approverNotes: reason,
      approvedById: req.user?.id
    },
    include: {
      supplier: true,
      items: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request rejected'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/ship
 * Mark withdrawal as being shipped
 */
router.post('/:id/ship', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'APPROVED') {
    throw new AppError('Can only ship approved withdrawal requests', 400);
  }

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: { status: 'SHIPPING' },
    include: {
      supplier: true,
      items: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal is now being shipped'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/complete
 * Complete withdrawal request
 */
router.post('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { fulfilledItems } = req.body;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'SHIPPING' && existing.status !== 'APPROVED') {
    throw new AppError('Can only complete withdrawal requests in APPROVED or SHIPPING status', 400);
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    // Update fulfilled quantities for items
    if (fulfilledItems && Array.isArray(fulfilledItems)) {
      for (const fulfilledItem of fulfilledItems) {
        await tx.withdrawalItem.update({
          where: { id: fulfilledItem.itemId },
          data: { fulfilledQuantity: fulfilledItem.fulfilledQuantity }
        });
      }
    } else {
      for (const item of existing.items) {
        await tx.withdrawalItem.update({
          where: { id: item.id },
          data: { fulfilledQuantity: item.approvedQuantity || item.requestedQuantity }
        });
      }
    }

    // Fetch updated items for balance updates and delivery creation
    const updatedItems = await tx.withdrawalItem.findMany({
      where: { withdrawalRequestId: id }
    });

    // Update FrameworkOrderItem balances if linked to a framework order
    if (existing.frameworkOrderId) {
      for (const item of updatedItems) {
        const fulfilledQty = Number(item.fulfilledQuantity) || 0;
        if (fulfilledQty > 0) {
          await tx.frameworkOrderItem.updateMany({
            where: {
              frameworkOrderId: existing.frameworkOrderId,
              reagentId: item.reagentId
            },
            data: {
              consumedQuantity: { increment: fulfilledQty },
              availableQuantity: { decrement: fulfilledQty }
            }
          });
        }
      }
    }

    // Auto-create Delivery record for the fulfilled items
    const lastDelivery = await tx.delivery.findFirst({
      orderBy: { deliveryNumber: 'desc' }
    });
    let seq = 1;
    if (lastDelivery) {
      const lastNum = parseInt(lastDelivery.deliveryNumber.replace('DEL-', ''));
      if (!isNaN(lastNum)) seq = lastNum + 1;
    }
    const deliveryNumber = `DEL-${String(seq).padStart(6, '0')}`;

    const deliveryItems = updatedItems.filter(item => (Number(item.fulfilledQuantity) || 0) > 0);
    if (deliveryItems.length > 0) {
      await tx.delivery.create({
        data: {
          deliveryNumber,
          supplierId: existing.supplierId,
          supplierSnapshot: existing.supplierSnapshot,
          withdrawalRequestId: id,
          deliveryDate: new Date(),
          status: 'NEW',
          notes: `Auto-created from withdrawal ${existing.withdrawalNumber}`,
          items: {
            create: deliveryItems.map((item, idx) => ({
              reagentId: item.reagentId,
              batchNumber: `${existing.withdrawalNumber}-${String(idx + 1).padStart(3, '0')}`,
              quantity: Number(item.fulfilledQuantity) || 0,
              expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            }))
          }
        }
      });
    }

    // Mark withdrawal as closed
    return tx.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'CLOSED',
        completionDate: new Date()
      },
      include: {
        supplier: true,
        items: {
          include: {
            reagent: true
          }
        }
      }
    });
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request completed'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/cancel
 * Cancel withdrawal request
 */
router.post('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status === 'CLOSED' || existing.status === 'CANCELLED') {
    throw new AppError('Cannot cancel completed or already cancelled withdrawal request', 400);
  }

  const withdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      approverNotes: existing.approverNotes
        ? `${existing.approverNotes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`
    },
    include: {
      supplier: true,
      items: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: withdrawal,
    message: 'Withdrawal request cancelled'
  };
  res.json(response);
}));

/**
 * POST /api/withdrawals/:id/items
 * Add item to withdrawal request
 */
router.post('/:id/items', validateBody(addWithdrawalItemSchema), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reagentId, requestedQuantity, unitPrice } = req.body;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only add items to withdrawal requests in DRAFT status', 400);
  }

  const item = await prisma.withdrawalItem.create({
    data: {
      withdrawalRequestId: id,
      reagentId,
      requestedQuantity,
      unitPrice
    },
    include: {
      reagent: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: item,
    message: 'Item added to withdrawal request'
  };
  res.status(201).json(response);
}));

/**
 * PUT /api/withdrawals/:id/items/:itemId
 * Update withdrawal item
 */
router.put('/:id/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const { id, itemId } = req.params;
  const { requestedQuantity, unitPrice } = req.body;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only update items in withdrawal requests in DRAFT status', 400);
  }

  const item = await prisma.withdrawalItem.update({
    where: { id: itemId },
    data: {
      requestedQuantity,
      unitPrice
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
 * DELETE /api/withdrawals/:id/items/:itemId
 * Remove item from withdrawal request
 */
router.delete('/:id/items/:itemId', asyncHandler(async (req: Request, res: Response) => {
  const { id, itemId } = req.params;

  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (existing.status !== 'DRAFT') {
    throw new AppError('Can only remove items from withdrawal requests in DRAFT status', 400);
  }

  await prisma.withdrawalItem.delete({
    where: { id: itemId }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Item removed from withdrawal request'
  };
  res.json(response);
}));

export default router;
