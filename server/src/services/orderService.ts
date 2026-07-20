import prisma from "../utils/prisma";
import { OrderStatus, TransactionType } from "../types";
import { AppError } from "../middleware/errorHandler";
import { updateReagentAggregates } from "./reagentAggregates";

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
  orderType?: "IMMEDIATE" | "FRAMEWORK";
  expectedDeliveryStart?: Date;
  expectedDeliveryEnd?: Date;
  notes?: string;
  createdBy?: string;
}

export interface ReceiveItemInput {
  orderItemId: string;
  receivedQuantity: number;
  batchNumber: string;
  expiryDate: Date;
  storageLocation?: string;
  notes?: string;
}

export interface ReceiveOrderOptions {
  deliveryReference: string;
  deliveryDate: Date;
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
      include: {
        supplier: true,
        items: {
          include: { reagent: true },
        },
      },
      orderBy: { orderDate: "desc" },
    });

    return orders.map((order) => ({
      ...order,
      _count: { items: order.items.length },
    }));
  },

  /**
   * Get order by ID with full details (simplified for basic pg client)
   */
  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        supplier: {
          include: { contacts: true },
        },
        items: {
          include: { reagent: true },
        },
        deliveries: true,
      },
    });

    if (!order) return null;

    return {
      ...order,
      delivery: order.deliveries?.[0] || null,
    };
  },

  /**
   * Create a new order (simplified for basic pg client)
   */
  async create(data: CreateOrderInput) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    // Wrap number generation + order + items in a single transaction
    const order = await prisma.$transaction(
      async (tx) => {
        const orderNumber = await this.generateOrderNumber(tx);

        const created = await tx.order.create({
          data: {
            tempNumber: orderNumber,
            supplierId: data.supplierId,
            supplierSnapshot: supplier?.name || data.supplierId,
            status: OrderStatus.DRAFT,
            orderType: data.orderType || "IMMEDIATE",
            expectedDeliveryStart: data.expectedDeliveryStart,
            expectedDeliveryEnd: data.expectedDeliveryEnd,
            internalNotes: data.notes,
          },
        });

        for (const item of data.items) {
          await tx.orderItem.create({
            data: {
              orderId: created.id,
              reagentId: item.reagentId,
              requestedQuantity: item.requestedQuantity,
              notes: item.notes,
            },
          });
        }

        await tx.activityLog.create({
          data: {
            userId: data.createdBy,
            action: "order_created",
            entityType: "order",
            entityId: created.id,
            details: JSON.stringify({
              orderNumber: created.tempNumber,
              supplierId: data.supplierId,
              orderType: data.orderType || "IMMEDIATE",
              items: data.items.map((item) => ({
                reagentId: item.reagentId,
                requestedQuantity: item.requestedQuantity,
              })),
            }),
          },
        });

        return created;
      },
      { isolationLevel: "Serializable" },
    );

    // Return order with supplier and items
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
   * Generate sequential order number (pass tx client for atomicity)
   */
  async generateOrderNumber(tx?: any): Promise<string> {
    const client = tx || prisma;
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    const lastOrder = await client.order.findFirst({
      where: {
        tempNumber: {
          startsWith: prefix,
        },
      },
      orderBy: { tempNumber: "desc" },
    });

    let sequence = 1;
    if (lastOrder && lastOrder.tempNumber) {
      const lastSeq = parseInt(lastOrder.tempNumber.replace(prefix, ""));
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      }
    }

    return `${prefix}${sequence.toString().padStart(4, "0")}`;
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
        status: OrderStatus.PENDING_SAP,
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
  async receiveItems(
    orderId: string,
    items: ReceiveItemInput[],
    receivedBy?: string,
    options?: ReceiveOrderOptions,
  ) {
    if (!options?.deliveryReference?.trim()) {
      throw new Error("Delivery reference is required");
    }

    const deliveryReference = options.deliveryReference.trim();
    const seenOrderItemIds = new Set<string>();
    for (const item of items) {
      if (seenOrderItemIds.has(item.orderItemId)) {
        throw new AppError(
          `Duplicate order item ${item.orderItemId} in receipt`,
          400,
        );
      }
      seenOrderItemIds.add(item.orderItemId);
    }

    return prisma.$transaction(
      async (tx) => {
        const replay = await tx.delivery.findUnique({
          where: { deliveryNumber: deliveryReference },
          include: { items: true },
        });

        if (replay) {
          if (replay.orderId !== orderId) {
            throw new Error(
              "Delivery reference is already linked to a different order",
            );
          }
          const replayOrder = await tx.order.findUniqueOrThrow({
            where: { id: orderId },
            include: { items: true },
          });
          const remainingQuantity = replayOrder.items.reduce(
            (sum, item) =>
              sum +
              Math.max(
                0,
                Number(item.requestedQuantity) -
                  Number(item.receivedQuantity),
              ),
            0,
          );
          return {
            idempotentReplay: true,
            delivery: replay,
            order: {
              id: replayOrder.id,
              status: replayOrder.status,
              remainingQuantity,
            },
          };
        }

        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: { supplier: true, items: true },
        });
        if (!order) throw new Error("Order not found");
        if (
          order.status === OrderStatus.CANCELLED ||
          order.status === OrderStatus.CLOSED ||
          order.status === OrderStatus.FULLY_RECEIVED
        ) {
          throw new Error(`Order cannot be received in status ${order.status}`);
        }

        const requestedItems = items.map((input) => {
          const orderItem = order.items.find(
            (candidate) => candidate.id === input.orderItemId,
          );
          if (!orderItem) {
            throw new Error(
              `Order item ${input.orderItemId} does not belong to this order`,
            );
          }
          const outstanding = Math.max(
            0,
            Number(orderItem.requestedQuantity) -
              Number(orderItem.receivedQuantity),
          );
          if (
            !Number.isFinite(input.receivedQuantity) ||
            input.receivedQuantity <= 0 ||
            input.receivedQuantity > outstanding
          ) {
            throw new Error(
              `Received quantity for ${input.orderItemId} must be between 0 and ${outstanding}`,
            );
          }
          return { input, orderItem };
        });

        const delivery = await tx.delivery.create({
          data: {
            deliveryNumber: deliveryReference,
            supplierId: order.supplierId,
            supplierSnapshot: order.supplierSnapshot || order.supplier.name,
            orderId,
            deliveryDate: options.deliveryDate,
            status: "PROCESSING",
            notes: `Receipt for order ${order.tempNumber}`,
          },
        });

        const affectedReagents = new Set<string>();
        for (const { input, orderItem } of requestedItems) {
          const deliveryItem = await tx.deliveryItem.create({
            data: {
              deliveryId: delivery.id,
              reagentId: orderItem.reagentId,
              batchNumber: input.batchNumber.trim(),
              quantity: input.receivedQuantity,
              acceptedQuantity: input.receivedQuantity,
              expiryDate: input.expiryDate,
            },
          });

          const existingBatch = await tx.reagentBatch.findUnique({
            where: {
              reagentId_batchNumber: {
                reagentId: orderItem.reagentId,
                batchNumber: input.batchNumber.trim(),
              },
            },
          });
          const batch = existingBatch
            ? await tx.reagentBatch.update({
                where: { id: existingBatch.id },
                data: {
                  initialQuantity: {
                    increment: input.receivedQuantity,
                  },
                  currentQuantity: {
                    increment: input.receivedQuantity,
                  },
                  expiryDate: input.expiryDate,
                  storageLocation:
                    input.storageLocation || existingBatch.storageLocation,
                },
              })
            : await tx.reagentBatch.create({
                data: {
                  reagentId: orderItem.reagentId,
                  batchNumber: input.batchNumber.trim(),
                  expiryDate: input.expiryDate,
                  initialQuantity: input.receivedQuantity,
                  currentQuantity: input.receivedQuantity,
                  receivedDate: options.deliveryDate,
                  deliveryId: delivery.id,
                  status: "ACTIVE",
                  qcStatus: "PENDING",
                  storageLocation: input.storageLocation,
                  generalNotes: input.notes,
                },
              });

          await tx.inventoryTransaction.create({
            data: {
              reagentId: orderItem.reagentId,
              batchId: batch.id,
              transactionType: TransactionType.RECEIPT,
              quantityDelta: input.receivedQuantity,
              sourceType: "delivery",
              sourceId: delivery.id,
              performedById: receivedBy,
              notes: `Receipt ${delivery.deliveryNumber} from order ${order.tempNumber}; item ${deliveryItem.id}`,
            },
          });

          const newReceivedQuantity =
            Number(orderItem.receivedQuantity) + input.receivedQuantity;
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: {
              receivedQuantity: newReceivedQuantity,
              remainingQuantity: Math.max(
                0,
                Number(orderItem.requestedQuantity) - newReceivedQuantity,
              ),
            },
          });
          affectedReagents.add(orderItem.reagentId);
        }

        for (const reagentId of affectedReagents) {
          await updateReagentAggregates(reagentId, tx);
        }

        const updatedItems = await tx.orderItem.findMany({
          where: { orderId },
        });
        const allReceived = updatedItems.every(
          (item) =>
            Number(item.receivedQuantity) >=
            Number(item.requestedQuantity),
        );
        const newStatus = allReceived
          ? OrderStatus.FULLY_RECEIVED
          : OrderStatus.PARTIALLY_RECEIVED;
        const remainingQuantity = updatedItems.reduce(
          (sum, item) =>
            sum +
            Math.max(
              0,
              Number(item.requestedQuantity) -
                Number(item.receivedQuantity),
            ),
          0,
        );

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: newStatus,
            closedDate: allReceived ? new Date() : null,
          },
        });
        const completedDelivery = await tx.delivery.update({
          where: { id: delivery.id },
          data: { status: "COMPLETED" },
          include: { items: true },
        });
        await tx.activityLog.create({
          data: {
            userId: receivedBy,
            action: "delivery_received",
            entityType: "delivery",
            entityId: delivery.id,
            details: JSON.stringify({
              deliveryNumber: delivery.deliveryNumber,
              orderId,
              orderNumber: order.tempNumber,
              receiptState: allReceived ? "full" : "partial",
              remainingQuantity,
              items: requestedItems.map(({ input, orderItem }) => ({
                orderItemId: orderItem.id,
                reagentId: orderItem.reagentId,
                batchNumber: input.batchNumber,
                quantity: input.receivedQuantity,
              })),
            }),
          },
        });

        return {
          idempotentReplay: false,
          delivery: completedDelivery,
          order: {
            id: orderId,
            status: newStatus,
            remainingQuantity,
          },
        };
      },
      { isolationLevel: "Serializable" },
    );
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
          ? `${reason}\n(קודם: ${existingOrder?.internalNotes || ""})`
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
        status: {
          in: [
            OrderStatus.DRAFT,
            OrderStatus.PENDING_SAP,
            OrderStatus.APPROVED,
            OrderStatus.PARTIALLY_RECEIVED,
          ],
        },
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
      orderBy: { orderDate: "asc" },
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
      orderBy: { orderDate: "asc" },
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
    createdBy?: string,
  ) {
    const items = suggestions.map((s) => ({
      reagentId: s.reagentId,
      requestedQuantity: s.suggestedQuantity,
    }));

    return this.create({
      supplierId,
      items,
      createdBy,
      notes: "נוצר אוטומטית מהצעות השלמה",
    });
  },

  /**
   * Helper: Update reagent aggregates after batch changes (delegates to canonical implementation)
   */
  async updateReagentAggregates(reagentId: string) {
    await updateReagentAggregates(reagentId);
  },
};
