import prisma from '../utils/prisma';
import { OrderStatus, TransactionType } from '../types';

export interface OrderFilters {
  supplierId?: string;
  status?: OrderStatus;
  fromDate?: Date;
  toDate?: Date;
}

export interface CreateOrderItemInput {
  reagentId: string;
  requestedQuantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  supplierId: string;
  items: CreateOrderItemInput[];
  notes?: string;
  createdBy?: string;
}

export interface ReceiveItemInput {
  orderItemId: string;
  receivedQuantity: number;
  batchNumber: string;
  expiryDate: Date;
  notes?: string;
}

export const orderService = {
  /**
   * Get all orders with optional filters (simplified for basic pg client)
   */
  async getAll(filters: OrderFilters = {}) {
    const where: any = {};

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.fromDate || filters.toDate) {
      where.orderDate = {};
      if (filters.fromDate) where.orderDate.gte = filters.fromDate;
      if (filters.toDate) where.orderDate.lte = filters.toDate;
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { orderDate: 'desc' },
    });

    // Manually add supplier, items, and count for each order
    const results = [];
    for (const order of orders) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: order.supplierId },
      });

      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      // Get reagent info for each item
      const itemsWithReagent = [];
      for (const item of items) {
        const reagent = await prisma.reagent.findUnique({
          where: { id: item.reagentId },
        });
        itemsWithReagent.push({ ...item, reagent });
      }

      results.push({
        ...order,
        supplier,
        items: itemsWithReagent,
        _count: { items: items.length },
      });
    }

    return results;
  },

  /**
   * Get order by ID with full details (simplified for basic pg client)
   */
  async getById(id: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return null;

    const supplier = await prisma.supplier.findUnique({
      where: { id: order.supplierId },
    });

    let contacts: any[] = [];
    if (supplier) {
      contacts = await prisma.supplierContact.findMany({
        where: { supplierId: supplier.id },
      });
    }

    const items = await prisma.orderItem.findMany({
      where: { orderId: id },
    });

    // Get reagent info for each item
    const itemsWithReagent = [];
    for (const item of items) {
      const reagent = await prisma.reagent.findUnique({
        where: { id: item.reagentId },
      });
      itemsWithReagent.push({ ...item, reagent });
    }

    // Note: delivery table may not exist yet, return null for now
    const delivery = null;

    return {
      ...order,
      supplier: supplier ? { ...supplier, contacts } : null,
      items: itemsWithReagent,
      delivery,
    };
  },

  /**
   * Create a new order (simplified for basic pg client)
   */
  async create(data: CreateOrderInput) {
    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order first
    const order = await prisma.order.create({
      data: {
        tempNumber: orderNumber,
        supplierId: data.supplierId,
        supplierSnapshot: data.supplierId, // Will be updated with supplier name
        status: OrderStatus.DRAFT,
        internalNotes: data.notes,
      },
    });

    // Create items separately
    for (const item of data.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          reagentId: item.reagentId,
          requestedQuantity: item.requestedQuantity,
          notes: item.notes,
        },
      });
    }

    // Return order with supplier and items
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    const itemsWithReagent = [];
    for (const item of items) {
      const reagent = await prisma.reagent.findUnique({
        where: { id: item.reagentId },
      });
      itemsWithReagent.push({ ...item, reagent });
    }

    return { ...order, supplier, items: itemsWithReagent };
  },

  /**
   * Generate sequential order number
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    const lastOrder = await prisma.order.findFirst({
      where: {
        tempNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { tempNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder && lastOrder.tempNumber) {
      const lastSeq = parseInt(lastOrder.tempNumber.replace(prefix, ''));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  },

  /**
   * Approve order (simplified for basic pg client)
   */
  async approve(id: string, _approvedBy?: string) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.APPROVED,
      },
    });

    const supplier = await prisma.supplier.findUnique({
      where: { id: order.supplierId },
    });
    const items = await prisma.orderItem.findMany({
      where: { orderId: id },
    });

    return { ...order, supplier, items };
  },

  /**
   * Mark order as sent/ordered
   */
  async markOrdered(id: string, _orderedDate?: Date) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.APPROVED,
      },
    });

    return order;
  },

  /**
   * Add item to existing order (simplified for basic pg client)
   */
  async addItem(orderId: string, item: CreateOrderItemInput) {
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        reagentId: item.reagentId,
        requestedQuantity: item.requestedQuantity,
        notes: item.notes,
      },
    });

    const reagent = await prisma.reagent.findUnique({
      where: { id: item.reagentId },
    });

    return { ...orderItem, reagent };
  },

  /**
   * Update order item quantity
   */
  async updateItem(itemId: string, requestedQuantity: number, notes?: string) {
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: {
        requestedQuantity,
        notes,
      },
    });

    return item;
  },

  /**
   * Remove item from order
   */
  async removeItem(itemId: string) {
    await prisma.orderItem.delete({
      where: { id: itemId },
    });
  },

  /**
   * Receive items (partial or full) - simplified for basic pg client
   */
  async receiveItems(orderId: string, items: ReceiveItemInput[], receivedBy?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new Error('Order not found');
    }

    const orderItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const results = [];

    for (const item of items) {
      const orderItem = orderItems.find((i: any) => i.id === item.orderItemId);
      if (!orderItem) continue;

      // Update order item received quantity
      const newReceivedQty =
        Number(orderItem.receivedQuantity || 0) + item.receivedQuantity;

      await prisma.orderItem.update({
        where: { id: item.orderItemId },
        data: {
          receivedQuantity: newReceivedQty,
        },
      });

      // Create batch for received reagent
      const batch = await prisma.reagentBatch.create({
        data: {
          reagentId: orderItem.reagentId,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          initialQuantity: item.receivedQuantity,
          currentQuantity: item.receivedQuantity,
          receivedDate: new Date(),
          status: 'ACTIVE',
          generalNotes: item.notes,
        },
      });

      // Create receiving transaction
      await prisma.inventoryTransaction.create({
        data: {
          reagentId: orderItem.reagentId,
          batchId: batch.id,
          transactionType: TransactionType.RECEIPT,
          quantityDelta: item.receivedQuantity,
          performedById: receivedBy,
          notes: `קבלה מהזמנה ${order.tempNumber}`,
        },
      });

      // Update reagent aggregates
      await this.updateReagentAggregates(orderItem.reagentId);

      results.push({ orderItemId: item.orderItemId, batch });
    }

    // Update order status based on received quantities
    const updatedItems = await prisma.orderItem.findMany({
      where: { orderId },
    });

    const allReceived = updatedItems.every(
      (i: any) => Number(i.receivedQuantity) >= Number(i.requestedQuantity)
    );
    const someReceived = updatedItems.some(
      (i: any) => Number(i.receivedQuantity) > 0
    );

    let newStatus: OrderStatus = order.status;
    if (allReceived) {
      newStatus = OrderStatus.FULLY_RECEIVED;
    } else if (someReceived) {
      newStatus = OrderStatus.PARTIALLY_RECEIVED;
    }

    if (newStatus !== order.status) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          closedDate: allReceived ? new Date() : undefined,
        },
      });
    }

    return results;
  },

  /**
   * Cancel order
   */
  async cancel(id: string, reason?: string) {
    const existingOrder = await prisma.order.findUnique({ where: { id } });
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        internalNotes: reason
          ? `${reason}\n(קודם: ${existingOrder?.internalNotes || ''})`
          : existingOrder?.internalNotes,
      },
    });

    return order;
  },

  /**
   * Get pending orders count by supplier (simplified - no groupBy support)
   */
  async getPendingBySupplier() {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING_SAP, OrderStatus.APPROVED, OrderStatus.PARTIALLY_RECEIVED] },
      },
    });

    // Group by supplier in memory
    const grouped: Record<string, number> = {};
    for (const order of orders) {
      grouped[order.supplierId] = (grouped[order.supplierId] || 0) + 1;
    }

    return Object.entries(grouped).map(([supplierId, count]) => ({
      supplierId,
      _count: { id: count },
    }));
  },

  /**
   * Get orders needing attention (simplified for basic pg client)
   */
  async getOrdersNeedingAttention() {
    const pendingApprovalOrders = await prisma.order.findMany({
      where: { status: OrderStatus.PENDING_SAP },
      orderBy: { orderDate: 'asc' },
    });

    // Add supplier and count for each order
    const pendingApproval = [];
    for (const order of pendingApprovalOrders) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: order.supplierId },
      });
      const itemCount = await prisma.orderItem.count({
        where: { orderId: order.id },
      });
      pendingApproval.push({
        ...order,
        supplier,
        _count: { items: itemCount },
      });
    }

    // Orders that have been "approved" but not received for more than 14 days
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 14);

    const overdueOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.APPROVED,
        orderDate: { lt: overdueDate },
      },
      orderBy: { orderDate: 'asc' },
    });

    const overdue = [];
    for (const order of overdueOrders) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: order.supplierId },
      });
      const itemCount = await prisma.orderItem.count({
        where: { orderId: order.id },
      });
      overdue.push({
        ...order,
        supplier,
        _count: { items: itemCount },
      });
    }

    return {
      pendingApproval,
      overdue,
    };
  },

  /**
   * Create order from replenishment suggestions
   */
  async createFromSuggestions(
    supplierId: string,
    suggestions: { reagentId: string; suggestedQuantity: number }[],
    createdBy?: string
  ) {
    const items = suggestions.map((s) => ({
      reagentId: s.reagentId,
      requestedQuantity: s.suggestedQuantity,
    }));

    return this.create({
      supplierId,
      items,
      createdBy,
      notes: 'נוצר אוטומטית מהצעות השלמה',
    });
  },

  /**
   * Helper: Update reagent aggregates after batch changes
   */
  async updateReagentAggregates(reagentId: string) {
    const activeBatches = await prisma.reagentBatch.findMany({
      where: {
        reagentId,
        status: 'ACTIVE',
      },
      orderBy: { expiryDate: 'asc' },
    });

    const totalQuantity = activeBatches.reduce(
      (sum, b) => sum + Number(b.currentQuantity),
      0
    );

    await prisma.reagent.update({
      where: { id: reagentId },
      data: {
        totalQuantity,
        activeBatchesCount: activeBatches.length,
        nearestExpiryDate: activeBatches[0]?.expiryDate || null,
      },
    });
  },
};
