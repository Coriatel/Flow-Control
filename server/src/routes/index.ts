import { Router } from "express";
import dashboardRoutes from "./dashboard";
import reagentsRoutes from "./reagents";
import inventoryRoutes from "./inventory";
import batchesRoutes from "./batches";
import suppliersRoutes from "./suppliers";
import ordersRoutes from "./orders";
import authRoutes from "./auth";
import deliveriesRoutes from "./deliveries";
import withdrawalsRoutes from "./withdrawals";
import shipmentsRoutes from "./shipments";
import deliveryItemsRoutes from "./deliveryitems";
import withdrawalItemsRoutes from "./withdrawalitems";
import shipmentItemsRoutes from "./shipmentitems";
import inventoryTransactionsRoutes from "./inventorytransactions";
import expiredProductLogsRoutes from "./expiredproductlogs";
import reagentReceiptEventsRoutes from "./reagentreceiptevents";
import filesRoutes from "./files";
import usersRoutes from "./users";
import adminSessionsRoutes from "./adminSessions";
import alertsRoutes from "./alerts";
import activityRoutes from "./activity";
import functionsRoutes from "./functions";
import systemSettingsRoutes from "./systemsettings";
import barcodeRoutes from "./barcode";
import dispenseRoutes from "./dispense";
import disposalRoutes from "./disposal";
import messagesRoutes from "./messages";

const router = Router();

// Mount routes

// Functions (for frontend function-based API compatibility)
router.use("/functions", functionsRoutes);

// System settings
router.use("/systemsettings", systemSettingsRoutes);

// Authentication (public)
router.use("/auth", authRoutes);

// Files (protected)
router.use("/files", filesRoutes);

// Core routes (protected)
router.use("/dashboard", dashboardRoutes);
router.use("/reagents", reagentsRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/batches", batchesRoutes);
router.use("/suppliers", suppliersRoutes);
router.use("/orders", ordersRoutes);

// Logistics routes (protected)
router.use("/deliveries", deliveriesRoutes);
router.use("/withdrawals", withdrawalsRoutes);
router.use("/shipments", shipmentsRoutes);
router.use("/deliveryitems", deliveryItemsRoutes);
router.use("/withdrawalitems", withdrawalItemsRoutes);
router.use("/shipmentitems", shipmentItemsRoutes);
router.use("/inventorytransactions", inventoryTransactionsRoutes);
router.use("/expiredproductlogs", expiredProductLogsRoutes);
router.use("/reagentreceiptevents", reagentReceiptEventsRoutes);

// Dispensing & Barcode routes (protected)
router.use("/barcode", barcodeRoutes);
router.use("/dispense", dispenseRoutes);
router.use("/disposal", disposalRoutes);

// Administration routes (protected)
router.use("/admin/sessions", adminSessionsRoutes);
router.use("/users", usersRoutes);
router.use("/alerts", alertsRoutes);
router.use("/messages", messagesRoutes);
router.use("/activity", activityRoutes);

// Health check at API level
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Legacy/Frontend Compatibility Routes
import { inventoryService } from "../services";
import { asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import {
  createDashboardNoteSchema,
  updateDashboardNoteSchema,
  createDocumentationNoteSchema,
  updateDocumentationNoteSchema,
} from "../validation/schemas";
import prisma from "../utils/prisma";

// Gate all legacy compatibility routes behind authentication
router.use("/inventorycountdrafts", authenticate);
router.use("/dashboardnotes", authenticate);
router.use("/featuredocumentations", authenticate);
router.use("/orderitems", authenticate);
router.use("/withdrawalitems", authenticate);

router.get(
  "/inventorycountdrafts",
  asyncHandler(async (_req, res) => {
    const data = await inventoryService.getCurrentDraft();
    res.json({ success: true, data });
  }),
);

// Dashboard Notes routes
router.get(
  "/dashboardnotes",
  asyncHandler(async (req, res) => {
    const notes = await prisma.dashboardNote.findMany({
      where: { dismissedAt: null },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
    res.json({ success: true, data: notes });
  }),
);

router.post(
  "/dashboardnotes",
  validateBody(createDashboardNoteSchema),
  asyncHandler(async (req, res) => {
    const note = await prisma.dashboardNote.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: note });
  }),
);

router.put(
  "/dashboardnotes/:id",
  validateBody(updateDashboardNoteSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const note = await prisma.dashboardNote.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: note });
  }),
);

router.delete(
  "/dashboardnotes/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.dashboardNote.update({
      where: { id },
      data: { dismissedAt: new Date() },
    });
    res.json({ success: true, message: "Note dismissed" });
  }),
);

// Feature Documentation routes (maps to DocumentationNote model)
router.get(
  "/featuredocumentations",
  asyncHandler(async (_req, res) => {
    const docs = await prisma.documentationNote.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: docs });
  }),
);

router.post(
  "/featuredocumentations",
  validateBody(createDocumentationNoteSchema),
  asyncHandler(async (req, res) => {
    const doc = await prisma.documentationNote.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: doc });
  }),
);

router.put(
  "/featuredocumentations/:id",
  validateBody(updateDocumentationNoteSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await prisma.documentationNote.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: doc });
  }),
);

router.delete(
  "/featuredocumentations/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.documentationNote.delete({
      where: { id },
    });
    res.json({ success: true, message: "Documentation deleted" });
  }),
);

const mapOrderItem = (item: any, reagent: any) => {
  const quantityOrdered = Number(item.requestedQuantity) || 0;
  const quantityReceived = Number(item.receivedQuantity) || 0;
  const quantityRemaining =
    item.remainingQuantity != null
      ? Number(item.remainingQuantity)
      : Math.max(0, quantityOrdered - quantityReceived);
  let lineStatus = "open";
  if (quantityReceived > 0 && quantityRemaining > 0)
    lineStatus = "partially_received";
  if (quantityRemaining <= 0) lineStatus = "fully_received";
  return {
    id: item.id,
    order_id: item.orderId,
    reagent_id: item.reagentId,
    reagent_name_snapshot: reagent?.name || null,
    reagent_catalog_number_snapshot: reagent?.catalogNumber || null,
    quantity_ordered: quantityOrdered,
    quantity_received: quantityReceived,
    quantity_remaining: quantityRemaining,
    line_status: lineStatus,
    notes: item.notes || null,
  };
};

router.get(
  "/orderitems",
  asyncHandler(async (req, res) => {
    const { order_id, reagent_id, line_status } = req.query;
    const where: any = {};
    if (order_id) where.orderId = order_id as string;
    if (reagent_id) where.reagentId = reagent_id as string;

    const items = await prisma.orderItem.findMany({
      where,
      include: { reagent: true },
      orderBy: { createdAt: "desc" },
    });
    let mapped = items.map((item: any) => mapOrderItem(item, item.reagent));
    if (line_status) {
      mapped = mapped.filter((item: any) => item.line_status === line_status);
    }
    res.json({ success: true, data: mapped, meta: { total: mapped.length } });
  }),
);

router.get(
  "/orderitems/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await prisma.orderItem.findUnique({
      where: { id },
      include: { reagent: true },
    });
    if (!item)
      return res
        .status(404)
        .json({ success: false, error: "Order item not found" });
    res.json({ success: true, data: mapOrderItem(item, item.reagent) });
  }),
);

router.post(
  "/orderitems",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const orderId = body.order_id || body.orderId;
    const reagentId = body.reagent_id || body.reagentId;
    const requestedQuantity = Number(
      body.quantity_ordered ?? body.requestedQuantity ?? 0,
    );
    const created = await prisma.orderItem.create({
      data: {
        orderId,
        reagentId,
        requestedQuantity,
        receivedQuantity: Number(
          body.quantity_received ?? body.receivedQuantity ?? 0,
        ),
        remainingQuantity:
          body.quantity_remaining != null
            ? Number(body.quantity_remaining)
            : null,
        notes: body.notes || null,
      },
      include: { reagent: true },
    });
    res
      .status(201)
      .json({ success: true, data: mapOrderItem(created, created.reagent) });
  }),
);

router.put(
  "/orderitems/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const data: any = {};
    if (body.order_id || body.orderId)
      data.orderId = body.order_id || body.orderId;
    if (body.reagent_id || body.reagentId)
      data.reagentId = body.reagent_id || body.reagentId;
    if (
      body.quantity_ordered !== undefined ||
      body.requestedQuantity !== undefined
    ) {
      data.requestedQuantity = Number(
        body.quantity_ordered ?? body.requestedQuantity,
      );
    }
    if (
      body.quantity_received !== undefined ||
      body.receivedQuantity !== undefined
    ) {
      data.receivedQuantity = Number(
        body.quantity_received ?? body.receivedQuantity,
      );
    }
    if (
      body.quantity_remaining !== undefined ||
      body.remainingQuantity !== undefined
    ) {
      data.remainingQuantity = Number(
        body.quantity_remaining ?? body.remainingQuantity,
      );
    }
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await prisma.orderItem.update({
      where: { id },
      data,
      include: { reagent: true },
    });
    res.json({ success: true, data: mapOrderItem(updated, updated.reagent) });
  }),
);

router.delete(
  "/orderitems/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.orderItem.delete({ where: { id } });
    res.json({ success: true, message: "Order item deleted" });
  }),
);

const mapWithdrawalItem = (item: any, reagent: any) => {
  const quantityRequested =
    Number(item.approvedQuantity ?? item.requestedQuantity) || 0;
  const quantityReceived = Number(item.fulfilledQuantity) || 0;
  let lineStatus = "open";
  if (quantityReceived > 0 && quantityReceived < quantityRequested)
    lineStatus = "partially_delivered";
  if (quantityRequested > 0 && quantityReceived >= quantityRequested)
    lineStatus = "delivered";
  return {
    id: item.id,
    withdrawal_request_id: item.withdrawalRequestId,
    reagent_id: item.reagentId,
    reagent_name_snapshot: reagent?.name || null,
    quantity_requested: quantityRequested,
    quantity_received: quantityReceived,
    line_status: lineStatus,
  };
};

router.get(
  "/withdrawalitems",
  asyncHandler(async (req, res) => {
    const { withdrawal_request_id, reagent_id } = req.query;
    const where: any = {};
    if (withdrawal_request_id)
      where.withdrawalRequestId = withdrawal_request_id as string;
    if (reagent_id) where.reagentId = reagent_id as string;

    const items = await prisma.withdrawalItem.findMany({
      where,
      include: { reagent: true },
      orderBy: { createdAt: "desc" },
    });
    const mapped = items.map((item: any) =>
      mapWithdrawalItem(item, item.reagent),
    );
    res.json({ success: true, data: mapped, meta: { total: mapped.length } });
  }),
);

router.get(
  "/withdrawalitems/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const item = await prisma.withdrawalItem.findUnique({
      where: { id },
      include: { reagent: true },
    });
    if (!item)
      return res
        .status(404)
        .json({ success: false, error: "Withdrawal item not found" });
    res.json({ success: true, data: mapWithdrawalItem(item, item.reagent) });
  }),
);

router.post(
  "/withdrawalitems",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const withdrawalRequestId =
      body.withdrawal_request_id || body.withdrawalRequestId;
    const reagentId = body.reagent_id || body.reagentId;
    const created = await prisma.withdrawalItem.create({
      data: {
        withdrawalRequestId,
        reagentId,
        requestedQuantity: Number(
          body.quantity_requested ?? body.requestedQuantity ?? 0,
        ),
        approvedQuantity:
          body.approved_quantity != null
            ? Number(body.approved_quantity)
            : null,
        fulfilledQuantity: Number(
          body.quantity_received ?? body.fulfilledQuantity ?? 0,
        ),
        unitPrice: body.unit_price != null ? Number(body.unit_price) : null,
      },
      include: { reagent: true },
    });
    res.status(201).json({
      success: true,
      data: mapWithdrawalItem(created, created.reagent),
    });
  }),
);

router.put(
  "/withdrawalitems/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const data: any = {};
    if (body.withdrawal_request_id || body.withdrawalRequestId)
      data.withdrawalRequestId =
        body.withdrawal_request_id || body.withdrawalRequestId;
    if (body.reagent_id || body.reagentId)
      data.reagentId = body.reagent_id || body.reagentId;
    if (
      body.quantity_requested !== undefined ||
      body.requestedQuantity !== undefined
    ) {
      data.requestedQuantity = Number(
        body.quantity_requested ?? body.requestedQuantity,
      );
    }
    if (
      body.approved_quantity !== undefined ||
      body.approvedQuantity !== undefined
    ) {
      data.approvedQuantity = Number(
        body.approved_quantity ?? body.approvedQuantity,
      );
    }
    if (
      body.quantity_received !== undefined ||
      body.fulfilledQuantity !== undefined
    ) {
      data.fulfilledQuantity = Number(
        body.quantity_received ?? body.fulfilledQuantity,
      );
    }
    const updated = await prisma.withdrawalItem.update({
      where: { id },
      data,
      include: { reagent: true },
    });
    res.json({
      success: true,
      data: mapWithdrawalItem(updated, updated.reagent),
    });
  }),
);

router.delete(
  "/withdrawalitems/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.withdrawalItem.delete({ where: { id } });
    res.json({ success: true, message: "Withdrawal item deleted" });
  }),
);

export default router;
