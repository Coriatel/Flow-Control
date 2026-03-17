import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { authenticate, authorize } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createDeliverySchema,
  updateDeliverySchema,
  receiveDeliverySchema,
  addDeliveryItemSchema,
} from "../validation/schemas";
import { ApiResponse, DeliveryStatus } from "../types";
import { updateReagentAggregates } from "../services/reagentAggregates";

const router = Router();

// All delivery routes require authentication
router.use(authenticate);

/**
 * GET /api/deliveries
 * Get all deliveries with optional filters
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { supplierId, status, fromDate, toDate } = req.query;

    const where: any = {};

    if (supplierId) {
      where.supplierId = supplierId as string;
    }

    if (status) {
      where.status = status as DeliveryStatus;
    }

    if (fromDate || toDate) {
      where.deliveryDate = {};
      if (fromDate) {
        where.deliveryDate.gte = new Date(fromDate as string);
      }
      if (toDate) {
        where.deliveryDate.lte = new Date(toDate as string);
      }
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        supplier: true,
        order: {
          select: {
            id: true,
            tempNumber: true,
            permanentNumber: true,
          },
        },
        items: {
          include: {
            reagent: {
              select: {
                id: true,
                name: true,
                catalogNumber: true,
              },
            },
          },
        },
        batches: {
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
            currentQuantity: true,
          },
        },
      },
      orderBy: { deliveryDate: "desc" },
    });

    const response: ApiResponse = {
      success: true,
      data: deliveries,
      meta: { total: deliveries.length },
    };
    res.json(response);
  }),
);

/**
 * GET /api/deliveries/:id
 * Get delivery by ID with full details
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        supplier: true,
        order: true,
        withdrawalRequest: true,
        items: {
          include: {
            reagent: true,
          },
        },
        batches: true,
      },
    });

    if (!delivery) {
      throw new AppError("Delivery not found", 404);
    }

    const response: ApiResponse = {
      success: true,
      data: delivery,
    };
    res.json(response);
  }),
);

/**
 * POST /api/deliveries
 * Create new delivery
 */
router.post(
  "/",
  validateBody(createDeliverySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      supplierId,
      orderId,
      withdrawalRequestId,
      deliveryDate,
      items,
      notes,
      isRecurringSupply,
    } = req.body;

    // Get supplier for snapshot
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new AppError("Supplier not found", 404);
    }

    const delivery = await prisma.$transaction(
      async (tx) => {
        // Generate delivery number atomically
        const lastDelivery = await tx.delivery.findFirst({
          orderBy: { deliveryNumber: "desc" },
        });
        let seq = 1;
        if (lastDelivery) {
          const lastNum = parseInt(
            lastDelivery.deliveryNumber.replace("DEL-", ""),
          );
          if (!isNaN(lastNum)) seq = lastNum + 1;
        }
        const deliveryNumber = `DEL-${String(seq).padStart(6, "0")}`;

        return tx.delivery.create({
          data: {
            deliveryNumber,
            supplierId,
            supplierSnapshot: supplier.name,
            orderId,
            withdrawalRequestId,
            deliveryDate: new Date(deliveryDate),
            status: "NEW",
            notes,
            isRecurringSupply: isRecurringSupply || false,
            items:
              items && items.length > 0
                ? {
                    create: items.map((item: any) => ({
                      reagentId: item.reagentId,
                      batchNumber: item.batchNumber,
                      quantity: item.quantity,
                      expiryDate: new Date(item.expiryDate),
                    })),
                  }
                : undefined,
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
      },
      { isolationLevel: "Serializable" },
    );

    const response: ApiResponse = {
      success: true,
      data: delivery,
      message: "Delivery created successfully",
    };
    res.status(201).json(response);
  }),
);

/**
 * PUT /api/deliveries/:id
 * Update delivery
 */
router.put(
  "/:id",
  validateBody(updateDeliverySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { deliveryDate, notes, documentUrl, isRecurringSupply } = req.body;

    // Check delivery exists and is not completed
    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Delivery not found", 404);
    }

    if (existing.status === "COMPLETED") {
      throw new AppError("Cannot update completed delivery", 400);
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        notes,
        documentUrl,
        isRecurringSupply,
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

    const response: ApiResponse = {
      success: true,
      data: delivery,
      message: "Delivery updated successfully",
    };
    res.json(response);
  }),
);

/**
 * POST /api/deliveries/:id/process
 * Start processing delivery
 */
router.post(
  "/:id/process",
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Delivery not found", 404);
    }

    if (existing.status !== "NEW") {
      throw new AppError("Delivery must be in NEW status to process", 400);
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: { status: "PROCESSING" },
      include: {
        supplier: true,
        items: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: delivery,
      message: "Delivery is now being processed",
    };
    res.json(response);
  }),
);

/**
 * POST /api/deliveries/:id/receive
 * Receive delivery - creates batches and updates inventory
 */
router.post(
  "/:id/receive",
  authorize("ADMIN", "MANAGER"),
  validateBody(receiveDeliverySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { items, receivedBy } = req.body;

    const existing = await prisma.delivery.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      throw new AppError("Delivery not found", 404);
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      throw new AppError("Cannot receive completed or cancelled delivery", 400);
    }

    const delivery = await prisma.$transaction(async (tx) => {
      // Process each item sequentially within transaction
      for (const item of items) {
        const {
          deliveryItemId,
          acceptedQuantity,
          rejectedQuantity,
          rejectionReason,
          storageLocation,
        } = item;

        await tx.deliveryItem.update({
          where: { id: deliveryItemId },
          data: {
            acceptedQuantity,
            rejectedQuantity,
            rejectionReason,
          },
        });

        const deliveryItem = await tx.deliveryItem.findUnique({
          where: { id: deliveryItemId },
        });

        if (!deliveryItem) {
          throw new AppError(`Delivery item ${deliveryItemId} not found`, 404);
        }

        if (acceptedQuantity && acceptedQuantity > 0) {
          const batch = await tx.reagentBatch.create({
            data: {
              reagentId: deliveryItem.reagentId,
              batchNumber: deliveryItem.batchNumber,
              expiryDate: deliveryItem.expiryDate,
              initialQuantity: acceptedQuantity,
              currentQuantity: acceptedQuantity,
              receivedDate: new Date(),
              deliveryId: id,
              status: "ACTIVE",
              qcStatus: "PENDING",
              storageLocation,
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              reagentId: deliveryItem.reagentId,
              batchId: batch.id,
              transactionType: "RECEIPT",
              quantityDelta: acceptedQuantity,
              sourceType: "delivery",
              sourceId: id,
              performedById: receivedBy,
              notes: `Received from delivery ${existing.deliveryNumber}`,
            },
          });

          // H4: Removed raw tx.reagent.update increment — canonical updateReagentAggregates runs after transaction
        }
      }

      // Update delivery status
      return tx.delivery.update({
        where: { id },
        data: { status: "COMPLETED" },
        include: {
          supplier: true,
          items: {
            include: {
              reagent: true,
            },
          },
          batches: true,
        },
      });
    });

    // H4: Recalculate aggregates for all affected reagents using canonical function
    const affectedReagentIds = new Set<string>();
    for (const item of items) {
      const deliveryItem = existing.items.find(
        (di: any) => di.id === item.deliveryItemId,
      );
      if (deliveryItem && item.acceptedQuantity && item.acceptedQuantity > 0) {
        affectedReagentIds.add(deliveryItem.reagentId);
      }
    }
    for (const reagentId of affectedReagentIds) {
      await updateReagentAggregates(reagentId);
    }

    const response: ApiResponse = {
      success: true,
      data: delivery,
      message: "Delivery received successfully",
    };
    res.json(response);
  }),
);

/**
 * POST /api/deliveries/:id/cancel
 * Cancel delivery
 */
router.post(
  "/:id/cancel",
  authorize("ADMIN", "MANAGER"),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Delivery not found", 404);
    }

    if (existing.status === "COMPLETED") {
      throw new AppError("Cannot cancel completed delivery", 400);
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: existing.notes
          ? `${existing.notes}\n\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: delivery,
      message: "Delivery cancelled",
    };
    res.json(response);
  }),
);

/**
 * POST /api/deliveries/:id/items
 * Add item to delivery
 */
router.post(
  "/:id/items",
  validateBody(addDeliveryItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reagentId, batchNumber, quantity, expiryDate } = req.body;

    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Delivery not found", 404);
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      throw new AppError(
        "Cannot add items to completed or cancelled delivery",
        400,
      );
    }

    const item = await prisma.deliveryItem.create({
      data: {
        deliveryId: id,
        reagentId,
        batchNumber,
        quantity,
        expiryDate: new Date(expiryDate),
      },
      include: {
        reagent: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: item,
      message: "Item added to delivery",
    };
    res.status(201).json(response);
  }),
);

/**
 * DELETE /api/deliveries/:id/items/:itemId
 * Remove item from delivery
 */
router.delete(
  "/:id/items/:itemId",
  asyncHandler(async (req: Request, res: Response) => {
    const { id, itemId } = req.params;

    const existing = await prisma.delivery.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError("Delivery not found", 404);
    }

    if (existing.status === "COMPLETED" || existing.status === "CANCELLED") {
      throw new AppError(
        "Cannot remove items from completed or cancelled delivery",
        400,
      );
    }

    await prisma.deliveryItem.delete({
      where: { id: itemId },
    });

    const response: ApiResponse = {
      success: true,
      message: "Item removed from delivery",
    };
    res.json(response);
  }),
);

export default router;
