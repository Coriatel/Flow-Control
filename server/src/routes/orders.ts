import { Router, Request, Response } from 'express';
import { orderService } from '../services';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ApiResponse, OrderStatus } from '../types';

const router = Router();

/**
 * GET /api/orders
 * Get all orders with optional filters
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { supplierId, status, fromDate, toDate } = req.query;

    const data = await orderService.getAll({
      supplierId: supplierId as string | undefined,
      status: status as OrderStatus | undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
    });

    const response: ApiResponse = {
      success: true,
      data,
      meta: { total: data.length },
    };
    res.json(response);
  })
);

/**
 * GET /api/orders/attention
 * Get orders needing attention (pending approval, overdue)
 */
router.get(
  '/attention',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await orderService.getOrdersNeedingAttention();

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/orders/pending-by-supplier
 * Get count of pending orders by supplier
 */
router.get(
  '/pending-by-supplier',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await orderService.getPendingBySupplier();

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * GET /api/orders/:id
 * Get order by ID with full details
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await orderService.getById(id);

    if (!data) {
      throw new AppError('Order not found', 404);
    }

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  })
);

/**
 * POST /api/orders
 * Create new order
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { supplierId, items, notes, createdBy } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('supplierId and at least one item are required', 400);
    }

    // Validate items
    for (const item of items) {
      if (!item.reagentId || !item.requestedQuantity || item.requestedQuantity <= 0) {
        throw new AppError(
          'Each item must have reagentId and positive requestedQuantity',
          400
        );
      }
    }

    const data = await orderService.create({
      supplierId,
      items,
      notes,
      createdBy,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Order created successfully',
    };
    res.status(201).json(response);
  })
);

/**
 * POST /api/orders/from-suggestions
 * Create order from replenishment suggestions
 */
router.post(
  '/from-suggestions',
  asyncHandler(async (req: Request, res: Response) => {
    const { supplierId, suggestions, createdBy } = req.body;

    if (!supplierId || !suggestions || !Array.isArray(suggestions)) {
      throw new AppError('supplierId and suggestions array are required', 400);
    }

    const data = await orderService.createFromSuggestions(
      supplierId,
      suggestions,
      createdBy
    );

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Order created from suggestions',
    };
    res.status(201).json(response);
  })
);

/**
 * POST /api/orders/:id/approve
 * Approve order
 */
router.post(
  '/:id/approve',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const data = await orderService.approve(id, approvedBy);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Order approved successfully',
    };
    res.json(response);
  })
);

/**
 * POST /api/orders/:id/mark-ordered
 * Mark order as sent to supplier
 */
router.post(
  '/:id/mark-ordered',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { orderedDate } = req.body;

    const data = await orderService.markOrdered(
      id,
      orderedDate ? new Date(orderedDate) : undefined
    );

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Order marked as ordered',
    };
    res.json(response);
  })
);

/**
 * POST /api/orders/:id/receive
 * Receive items from order
 */
router.post(
  '/:id/receive',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { items, receivedBy } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one item to receive is required', 400);
    }

    // Validate items
    for (const item of items) {
      if (
        !item.orderItemId ||
        !item.receivedQuantity ||
        !item.batchNumber ||
        !item.expiryDate
      ) {
        throw new AppError(
          'Each item must have orderItemId, receivedQuantity, batchNumber, and expiryDate',
          400
        );
      }
    }

    const processedItems = items.map((item: any) => ({
      ...item,
      expiryDate: new Date(item.expiryDate),
    }));

    const data = await orderService.receiveItems(id, processedItems, receivedBy);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Items received successfully',
    };
    res.json(response);
  })
);

/**
 * POST /api/orders/:id/cancel
 * Cancel order
 */
router.post(
  '/:id/cancel',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const data = await orderService.cancel(id, reason);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Order cancelled',
    };
    res.json(response);
  })
);

/**
 * POST /api/orders/:id/items
 * Add item to order
 */
router.post(
  '/:id/items',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reagentId, requestedQuantity, notes } = req.body;

    if (!reagentId || !requestedQuantity || requestedQuantity <= 0) {
      throw new AppError('reagentId and positive requestedQuantity are required', 400);
    }

    const data = await orderService.addItem(id, {
      reagentId,
      requestedQuantity,
      notes,
    });

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Item added to order',
    };
    res.status(201).json(response);
  })
);

/**
 * PUT /api/orders/:id/items/:itemId
 * Update order item
 */
router.put(
  '/:id/items/:itemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { requestedQuantity, notes } = req.body;

    if (!requestedQuantity || requestedQuantity <= 0) {
      throw new AppError('Positive requestedQuantity is required', 400);
    }

    const data = await orderService.updateItem(itemId, requestedQuantity, notes);

    const response: ApiResponse = {
      success: true,
      data,
      message: 'Item updated',
    };
    res.json(response);
  })
);

/**
 * DELETE /api/orders/:id/items/:itemId
 * Remove item from order
 */
router.delete(
  '/:id/items/:itemId',
  asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;

    await orderService.removeItem(itemId);

    const response: ApiResponse = {
      success: true,
      message: 'Item removed from order',
    };
    res.json(response);
  })
);

export default router;
