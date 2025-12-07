import prisma from '../utils/prisma';
import { OrderStatus } from '../generated/prisma';

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
   * Get all orders with optional filters
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
      include: {
        supplier: true,
        items: {
          include: {
            reagent: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    });

    return orders;
  },

  /**
   * Get order by ID with full details
   */
  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: {
          include: {
            contacts: true,
          },
        },
        items: {
          include: {
            reagent: true,
          },
        },
        delivery: true,
      },
    });

    return order;
  },

  /**
   * Create a new order
   */
  async create(data: CreateOrderInput) {
    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        supplierId: data.supplierId,
        status: 'PENDING_APPROVAL',
        notes: data.notes,
        createdBy: data.createdBy,
        items: {
          create: data.items.map((item) => ({
            reagentId: item.reagentId,
            requestedQuantity: item.requestedQuantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        supplier: true,
        items: {
          include: {
            reagent: true,
          },
        },
      },
    });

    return order;
  },

  /**
   * Generate sequential order number
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    const lastOrder = await prisma.order.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { orderNumber: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderNumber.replace(prefix, ''));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  },

  /**
   * Approve order
   */
  async approve(id: string, approvedBy?: string) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedDate: new Date(),
        approvedBy,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    return order;
  },

  /**
   * Mark order as sent/ordered
   */
  async markOrdered(id: string, orderedDate?: Date) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'ORDERED',
        orderedDate: orderedDate || new Date(),
      },
    });

    return order;
  },

  /**
   * Add item to existing order
   */
  async addItem(orderId: string, item: CreateOrderItemInput) {
    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        reagentId: item.reagentId,
        requestedQuantity: item.requestedQuantity,
        notes: item.notes,
      },
      include: {
        reagent: true,
      },
    });

    return orderItem;
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
   * Receive items (partial or full)
   */
  async receiveItems(orderId: string, items: ReceiveItemInput[], receivedBy?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const results = [];

    for (const item of items) {
      const orderItem = order.items.find((i) => i.id === item.orderItemId);
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
          notes: item.notes,
        },
      });

      // Create receiving transaction
      await prisma.inventoryTransaction.create({
        data: {
          reagentId: orderItem.reagentId,
          batchId: batch.id,
          transactionType: 'RECEIVE',
          quantity: item.receivedQuantity,
          performedBy: receivedBy,
          notes: `קבלה מהזמנה ${order.orderNumber}`,
        },
      });

      // Update reagent aggregates
      await this.updateReagentAggregates(orderItem.reagentId);

      results.push({ orderItemId: item.orderItemId, batch });
    }

    // Update order status based on received quantities
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (updatedOrder) {
      const allReceived = updatedOrder.items.every(
        (i) => Number(i.receivedQuantity) >= Number(i.requestedQuantity)
      );
      const someReceived = updatedOrder.items.some(
        (i) => Number(i.receivedQuantity) > 0
      );

      let newStatus: OrderStatus = updatedOrder.status;
      if (allReceived) {
        newStatus = 'RECEIVED';
      } else if (someReceived) {
        newStatus = 'PARTIALLY_RECEIVED';
      }

      if (newStatus !== updatedOrder.status) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: newStatus,
            receivedDate: allReceived ? new Date() : undefined,
          },
        });
      }
    }

    return results;
  },

  /**
   * Cancel order
   */
  async cancel(id: string, reason?: string) {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${reason}\n(קודם: ${(await prisma.order.findUnique({ where: { id } }))?.notes || ''})`
          : undefined,
      },
    });

    return order;
  },

  /**
   * Get pending orders count by supplier
   */
  async getPendingBySupplier() {
    const orders = await prisma.order.groupBy({
      by: ['supplierId'],
      where: {
        status: {
          in: ['PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED'],
        },
      },
      _count: {
        id: true,
      },
    });

    return orders;
  },

  /**
   * Get orders needing attention (pending approval, overdue, etc.)
   */
  async getOrdersNeedingAttention() {
    const pendingApproval = await prisma.order.findMany({
      where: { status: 'PENDING_APPROVAL' },
      include: {
        supplier: true,
        _count: { select: { items: true } },
      },
      orderBy: { orderDate: 'asc' },
    });

    // Orders that have been "ordered" but not received for more than 14 days
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 14);

    const overdue = await prisma.order.findMany({
      where: {
        status: 'ORDERED',
        orderedDate: {
          lt: overdueDate,
        },
      },
      include: {
        supplier: true,
        _count: { select: { items: true } },
      },
      orderBy: { orderedDate: 'asc' },
    });

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
