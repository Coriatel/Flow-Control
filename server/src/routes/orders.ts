import { Router, Request, Response } from "express";
import { orderService } from "../services";
import prisma from "../utils/prisma";
import { asyncHandler, AppError } from "../middleware/errorHandler";
import { validateBody } from "../middleware/validate";
import {
  createOrderSchema,
  receiveOrderSchema,
  updateOrderItemSchema,
  addOrderItemSchema,
} from "../validation/schemas";
import { ApiResponse, OrderStatus } from "../types";

const router = Router();

const mapOrderStatus = (status?: string | null) => {
  if (!status) return null;
  const normalized = status.toUpperCase();
  if (normalized === "DRAFT" || normalized === "PENDING_SAP")
    return "pending_sap_details";
  if (normalized === "APPROVED") return "approved";
  if (normalized === "PARTIALLY_RECEIVED") return "partially_received";
  if (normalized === "FULLY_RECEIVED") return "fully_received";
  if (normalized === "CLOSED") return "closed";
  if (normalized === "CANCELLED") return "cancelled";
  return status.toLowerCase();
};

const mapOrderType = (orderType?: string | null) => {
  if (!orderType) return null;
  const normalized = orderType.toUpperCase();
  if (normalized === "IMMEDIATE" || normalized === "IMMEDIATE_DELIVERY")
    return "immediate_delivery";
  if (normalized === "FRAMEWORK") return "framework";
  return orderType.toLowerCase();
};

const mapOrderResponse = (order: any) => {
  const items = Array.isArray(order.items) ? order.items : [];
  const totalItems = items.length;
  const totalQuantityOrdered = items.reduce(
    (sum: number, item: any) => sum + (Number(item.requestedQuantity) || 0),
    0,
  );
  const totalQuantityReceived = items.reduce(
    (sum: number, item: any) => sum + (Number(item.receivedQuantity) || 0),
    0,
  );
  const totalQuantityRemaining = items.reduce((sum: number, item: any) => {
    if (item.remainingQuantity != null) {
      return sum + (Number(item.remainingQuantity) || 0);
    }
    const requested = Number(item.requestedQuantity) || 0;
    const received = Number(item.receivedQuantity) || 0;
    return sum + Math.max(0, requested - received);
  }, 0);

  return {
    id: order.id,
    order_number_temp: order.tempNumber,
    order_number_permanent: order.permanentNumber || null,
    purchase_order_number_sap: order.sapPurchaseOrder || null,
    supplier_name_snapshot:
      order.supplierSnapshot || order.supplier?.name || null,
    supplier: order.supplier?.name || order.supplierSnapshot || null,
    supplier_id: order.supplierId,
    order_date: order.orderDate?.toISOString() || null,
    created_date: order.createdAt?.toISOString() || null,
    updated_date: order.updatedAt?.toISOString() || null,
    status: mapOrderStatus(order.status),
    order_type: mapOrderType(order.orderType),
    expected_delivery_start_date:
      order.expectedDeliveryStart?.toISOString() || null,
    expected_delivery_end_date:
      order.expectedDeliveryEnd?.toISOString() || null,
    notes: order.internalNotes || order.supplierNotes || "",
    total_items: totalItems,
    total_quantity_ordered: totalQuantityOrdered,
    total_quantity_received: totalQuantityReceived,
    total_quantity_remaining: totalQuantityRemaining,
    // H6: Populate linked data from included relations when available
    linked_delivery_numbers: Array.isArray(order.deliveries)
      ? order.deliveries.map((d: any) => d.deliveryNumber)
      : [],
    linked_delivery_ids: Array.isArray(order.deliveries)
      ? order.deliveries.map((d: any) => d.id)
      : [],
    linked_withdrawals: order.frameworkOrder?.withdrawalRequests
      ? order.frameworkOrder.withdrawalRequests.map((wr: any) => ({
          id: wr.id,
          withdrawal_number: wr.withdrawalNumber,
        }))
      : [],
    linked_withdrawal_request_ids: order.frameworkOrder?.withdrawalRequests
      ? order.frameworkOrder.withdrawalRequests.map((wr: any) => wr.id)
      : [],
  };
};

/**
 * GET /api/orders
 * Get all orders with optional filters
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, supplierId, status, fromDate, toDate } = req.query;

    if (id) {
      const order = await orderService.getById(id as string);
      const mapped = order ? [mapOrderResponse(order)] : [];
      const response: ApiResponse = {
        success: true,
        data: mapped,
        meta: { total: mapped.length },
      };
      res.json(response);
      return;
    }

    const data = await orderService.getAll({
      supplierId: supplierId as string | undefined,
      status: status as OrderStatus | undefined,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
    });

    const mapped = data.map(mapOrderResponse);
    const response: ApiResponse = {
      success: true,
      data: mapped,
      meta: { total: mapped.length },
    };
    res.json(response);
  }),
);

/**
 * GET /api/orders/attention
 * Get orders needing attention (pending approval, overdue)
 */
router.get(
  "/attention",
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await orderService.getOrdersNeedingAttention();

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  }),
);

/**
 * GET /api/orders/pending-by-supplier
 * Get count of pending orders by supplier
 */
router.get(
  "/pending-by-supplier",
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await orderService.getPendingBySupplier();

    const response: ApiResponse = {
      success: true,
      data,
    };
    res.json(response);
  }),
);

/**
 * GET /api/orders/:id
 * Get order by ID with full details
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = await orderService.getById(id);

    if (!data) {
      throw new AppError("Order not found", 404);
    }

    const response: ApiResponse = {
      success: true,
      data: mapOrderResponse(data),
    };
    res.json(response);
  }),
);

/**
 * POST /api/orders
 * Create new order
 */
router.post(
  "/",
  validateBody(createOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const data = await orderService.create(req.body);

    const response: ApiResponse = {
      success: true,
      data,
      message: "Order created successfully",
    };
    res.status(201).json(response);
  }),
);

/**
 * POST /api/orders/from-suggestions
 * Create order from replenishment suggestions
 */
router.post(
  "/from-suggestions",
  asyncHandler(async (req: Request, res: Response) => {
    const { supplierId, suggestions, createdBy } = req.body;

    if (!supplierId || !suggestions || !Array.isArray(suggestions)) {
      throw new AppError("supplierId and suggestions array are required", 400);
    }

    const data = await orderService.createFromSuggestions(
      supplierId,
      suggestions,
      createdBy,
    );

    const response: ApiResponse = {
      success: true,
      data,
      message: "Order created from suggestions",
    };
    res.status(201).json(response);
  }),
);

/**
 * POST /api/orders/:id/approve
 * Approve order
 */
router.post(
  "/:id/approve",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { approvedBy } = req.body;

    const data = await orderService.approve(id, approvedBy);

    const response: ApiResponse = {
      success: true,
      data,
      message: "Order approved successfully",
    };
    res.json(response);
  }),
);

/**
 * POST /api/orders/:id/mark-ordered
 * Mark order as sent to supplier
 */
router.post(
  "/:id/mark-ordered",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { orderedDate } = req.body;

    const data = await orderService.markOrdered(
      id,
      orderedDate ? new Date(orderedDate) : undefined,
    );

    const response: ApiResponse = {
      success: true,
      data,
      message: "Order marked as ordered",
    };
    res.json(response);
  }),
);

/**
 * POST /api/orders/:id/receive
 * Receive items from order
 */
router.post(
  "/:id/receive",
  validateBody(receiveOrderSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { items, receivedBy } = req.body;

    const data = await orderService.receiveItems(id, items, receivedBy);

    const response: ApiResponse = {
      success: true,
      data,
      message: "Items received successfully",
    };
    res.json(response);
  }),
);

/**
 * POST /api/orders/:id/cancel
 * Cancel order
 */
router.post(
  "/:id/cancel",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const data = await orderService.cancel(id, reason);

    const response: ApiResponse = {
      success: true,
      data,
      message: "Order cancelled",
    };
    res.json(response);
  }),
);

/**
 * PUT /api/orders/:id
 * Update order details
 */
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const data: any = {};

    if (
      body.order_number_permanent !== undefined ||
      body.permanentNumber !== undefined
    ) {
      data.permanentNumber =
        body.order_number_permanent ?? body.permanentNumber;
    }
    if (
      body.purchase_order_number_sap !== undefined ||
      body.sapPurchaseOrder !== undefined
    ) {
      data.sapPurchaseOrder =
        body.purchase_order_number_sap ?? body.sapPurchaseOrder;
    }
    if (
      body.expected_delivery_start_date !== undefined ||
      body.expectedDeliveryStart !== undefined
    ) {
      const value =
        body.expected_delivery_start_date ?? body.expectedDeliveryStart;
      data.expectedDeliveryStart = value ? new Date(value) : null;
    }
    if (
      body.expected_delivery_end_date !== undefined ||
      body.expectedDeliveryEnd !== undefined
    ) {
      const value = body.expected_delivery_end_date ?? body.expectedDeliveryEnd;
      data.expectedDeliveryEnd = value ? new Date(value) : null;
    }
    if (body.notes !== undefined) {
      data.internalNotes = body.notes;
    }

    if (Object.keys(data).length === 0) {
      const existing = await orderService.getById(id);
      if (!existing) {
        throw new AppError("Order not found", 404);
      }
      const response: ApiResponse = {
        success: true,
        data: mapOrderResponse(existing),
      };
      res.json(response);
      return;
    }

    const updated = await prisma.order.update({
      where: { id },
      data,
      include: {
        supplier: true,
        items: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: mapOrderResponse(updated),
      message: "Order updated",
    };
    res.json(response);
  }),
);

/**
 * DELETE /api/orders/:id
 * Delete order (hard delete if possible, otherwise cancel)
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.order.findUnique({
      where: { id },
      include: {
        deliveries: true,
        frameworkOrder: true,
        items: true,
      },
    });

    if (!existing) {
      throw new AppError("Order not found", 404);
    }

    // If order has related deliveries or framework order, cancel instead of deleting
    if (
      (existing.deliveries && existing.deliveries.length > 0) ||
      existing.frameworkOrder
    ) {
      const cancelled = await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED", closedDate: new Date() },
        include: {
          supplier: true,
          items: true,
        },
      });
      const response: ApiResponse = {
        success: true,
        data: mapOrderResponse(cancelled),
        message: "Order cancelled (related data exists)",
      };
      res.json(response);
      return;
    }

    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    const deleted = await prisma.order.delete({ where: { id } });

    const response: ApiResponse = {
      success: true,
      data: deleted,
      message: "Order deleted",
    };
    res.json(response);
  }),
);

/**
 * POST /api/orders/:id/items
 * Add item to order
 */
router.post(
  "/:id/items",
  validateBody(addOrderItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const data = await orderService.addItem(id, req.body);

    const response: ApiResponse = {
      success: true,
      data,
      message: "Item added to order",
    };
    res.status(201).json(response);
  }),
);

/**
 * PUT /api/orders/:id/items/:itemId
 * Update order item
 */
router.put(
  "/:id/items/:itemId",
  validateBody(updateOrderItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;
    const { requestedQuantity, notes } = req.body;

    const data = await orderService.updateItem(
      itemId,
      requestedQuantity,
      notes,
    );

    const response: ApiResponse = {
      success: true,
      data,
      message: "Item updated",
    };
    res.json(response);
  }),
);

/**
 * DELETE /api/orders/:id/items/:itemId
 * Remove item from order
 */
router.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req: Request, res: Response) => {
    const { itemId } = req.params;

    await orderService.removeItem(itemId);

    const response: ApiResponse = {
      success: true,
      message: "Item removed from order",
    };
    res.json(response);
  }),
);

export default router;
