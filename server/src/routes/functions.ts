import { Router, Request, Response } from "express";
import {
  dashboardService,
  supplierService,
  orderService,
  inventoryService,
  reagentService,
  batchService,
} from "../services";
import { updateReagentAggregates } from "../services/reagentAggregates";
import { AppError, asyncHandler } from "../middleware/errorHandler";
import { authenticate } from "../middleware/auth";
import { ApiResponse } from "../types";
import prisma from "../utils/prisma";

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

/**
 * POST /api/functions/:functionName
 * Generic function handler - maps function names to services
 * This provides compatibility with the frontend's function-based API pattern
 */
router.post(
  "/:functionName",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { functionName } = req.params;
    const params = req.body || {};

    let result: any;

    switch (functionName) {
      // Dashboard functions
      case "getDashboardData":
        result = await dashboardService.getDashboardData();
        break;

      case "getExpiringReagents":
        result = await dashboardService.getExpiringReagents();
        break;

      case "getLowStockReagents":
        result = await dashboardService.getLowStockReagents();
        break;

      case "getStatistics":
        result = await dashboardService.getStatistics();
        break;

      // Implemented data functions
      // Format (wrapped at response): { success: true, data: { <entityName>: [...], summary?: {} } }
      case "getOrdersData": {
        const orders = await prisma.order.findMany({
          include: {
            supplier: true,
            items: {
              include: {
                reagent: true,
              },
            },
            deliveries: true,
            frameworkOrder: {
              include: {
                withdrawalRequests: true,
              },
            },
          },
          orderBy: { orderDate: "desc" },
        });
        const mappedOrders = orders.map((order: any) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const totalItems = items.length;
          const totalQuantityOrdered = items.reduce(
            (sum: number, item: any) => {
              return sum + (Number(item.requestedQuantity) || 0);
            },
            0,
          );
          const totalQuantityReceived = items.reduce(
            (sum: number, item: any) => {
              return sum + (Number(item.receivedQuantity) || 0);
            },
            0,
          );
          const totalQuantityRemaining = items.reduce(
            (sum: number, item: any) => {
              if (item.remainingQuantity != null) {
                return sum + (Number(item.remainingQuantity) || 0);
              }
              const requested = Number(item.requestedQuantity) || 0;
              const received = Number(item.receivedQuantity) || 0;
              return sum + Math.max(0, requested - received);
            },
            0,
          );

          const linkedDeliveries = Array.isArray(order.deliveries)
            ? order.deliveries
            : [];
          const linkedDeliveryNumbers = linkedDeliveries.map(
            (delivery: any) => delivery.deliveryNumber,
          );
          const linkedDeliveryIds = linkedDeliveries.map(
            (delivery: any) => delivery.id,
          );

          const linkedWithdrawals =
            order.frameworkOrder?.withdrawalRequests || [];
          const mappedWithdrawals = linkedWithdrawals.map(
            (withdrawal: any) => ({
              id: withdrawal.id,
              withdrawal_number: withdrawal.withdrawalNumber,
            }),
          );
          const linkedWithdrawalIds = mappedWithdrawals.map(
            (withdrawal: any) => withdrawal.id,
          );

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
            linked_delivery_numbers: linkedDeliveryNumbers,
            linked_delivery_ids: linkedDeliveryIds,
            linked_withdrawals: mappedWithdrawals,
            linked_withdrawal_request_ids: linkedWithdrawalIds,
          };
        });

        result = { orders: mappedOrders };
        break;
      }

      case "getDeliveriesData": {
        const deliveries = await prisma.delivery.findMany({
          include: {
            supplier: true,
            order: true,
            withdrawalRequest: true,
            items: {
              include: {
                reagent: true,
              },
            },
          },
          orderBy: { deliveryDate: "desc" },
        });
        const mappedDeliveries = deliveries.map((d: any) => {
          const totalItemsReceived = (d.items || []).reduce(
            (sum: number, item: any) => {
              return sum + (Number(item.quantity) || 0);
            },
            0,
          );
          const completionType =
            d.items && d.items.length > 0
              ? d.items.every(
                  (item: any) =>
                    (Number(item.acceptedQuantity ?? item.quantity) || 0) >=
                    (Number(item.quantity) || 0),
                )
                ? "full"
                : "partial"
              : null;
          const linkedWithdrawalNumbers = d.withdrawalRequest
            ? [d.withdrawalRequest.withdrawalNumber]
            : [];
          const linkedWithdrawalIds = d.withdrawalRequest
            ? [d.withdrawalRequest.id]
            : [];
          const deliveryType = d.withdrawalRequestId
            ? "with_order"
            : "standalone";
          return {
            id: d.id,
            delivery_number: d.deliveryNumber,
            delivery_date: d.deliveryDate?.toISOString(),
            status: d.status?.toLowerCase() || "open",
            supplier: d.supplier?.name || d.supplierSnapshot || null,
            supplier_id: d.supplierId,
            linked_order_id: d.orderId || null,
            order_number_temp: d.order?.tempNumber || null,
            order_number_permanent: d.order?.permanentNumber || null,
            purchase_order_number_sap: d.order?.sapPurchaseOrder || null,
            linked_withdrawal_numbers: linkedWithdrawalNumbers,
            linked_withdrawal_request_ids: linkedWithdrawalIds,
            delivery_type: deliveryType,
            total_items_received: totalItemsReceived,
            completion_type: completionType,
            notes: d.notes || null,
          };
        });
        // Calculate summary
        const summary = {
          total: mappedDeliveries.length,
          byStatus: mappedDeliveries.reduce(
            (acc: Record<string, number>, d: any) => {
              acc[d.status] = (acc[d.status] || 0) + 1;
              return acc;
            },
            {},
          ),
        };
        result = { deliveries: mappedDeliveries, summary };
        break;
      }

      case "getOutgoingShipmentsData": {
        const shipments = await prisma.shipment.findMany({
          include: {
            items: {
              include: {
                reagent: true,
              },
            },
          },
          orderBy: { shipmentDate: "desc" },
        });
        const shipmentsSummary = {
          total: shipments.length,
          byStatus: shipments.reduce((acc: Record<string, number>, s: any) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
          }, {}),
        };
        result = { shipments, summary: shipmentsSummary };
        break;
      }

      case "getWithdrawalRequestsData": {
        const mapWithdrawalStatus = (status?: string | null) => {
          if (!status) return "draft";
          const normalized = status.toUpperCase();
          if (normalized === "DRAFT") return "draft";
          if (normalized === "SUBMITTED") return "submitted";
          if (normalized === "APPROVED") return "approved";
          if (normalized === "SHIPPING") return "in_delivery";
          if (normalized === "CLOSED") return "completed";
          if (normalized === "CANCELLED") return "cancelled";
          return status.toLowerCase();
        };

        const withdrawals = await prisma.withdrawalRequest.findMany({
          include: {
            supplier: true,
            items: {
              include: {
                reagent: true,
              },
            },
            frameworkOrder: {
              include: {
                order: true,
              },
            },
            deliveries: true,
          },
          orderBy: { requestDate: "desc" },
        });

        const mappedWithdrawals = withdrawals.map((withdrawal: any) => {
          const items = Array.isArray(withdrawal.items) ? withdrawal.items : [];
          const totalItems = items.length;
          const totalQuantityRequested = items.reduce(
            (sum: number, item: any) => {
              return sum + (Number(item.requestedQuantity) || 0);
            },
            0,
          );
          const totalQuantityApproved = items.reduce(
            (sum: number, item: any) => {
              return sum + (Number(item.approvedQuantity ?? 0) || 0);
            },
            0,
          );

          const linkedDeliveries = Array.isArray(withdrawal.deliveries)
            ? withdrawal.deliveries
            : [];
          const linkedDeliveryNumbers = linkedDeliveries.map(
            (delivery: any) => delivery.deliveryNumber,
          );
          const linkedDeliveryIds = linkedDeliveries.map(
            (delivery: any) => delivery.id,
          );

          const frameworkOrderNumberSnapshot =
            withdrawal.frameworkOrder?.order?.permanentNumber ||
            withdrawal.frameworkOrder?.order?.tempNumber ||
            null;

          return {
            id: withdrawal.id,
            withdrawal_number: withdrawal.withdrawalNumber,
            status: mapWithdrawalStatus(withdrawal.status),
            urgency_level: "routine",
            supplier_snapshot:
              withdrawal.supplierSnapshot || withdrawal.supplier?.name || null,
            supplier_id: withdrawal.supplierId,
            framework_order_id: withdrawal.frameworkOrderId || null,
            framework_order_number_snapshot: frameworkOrderNumberSnapshot,
            request_date: withdrawal.requestDate?.toISOString() || null,
            created_date: withdrawal.createdAt?.toISOString() || null,
            updated_date: withdrawal.updatedAt?.toISOString() || null,
            requested_delivery_date: null,
            total_items: totalItems,
            total_quantity_requested: totalQuantityRequested,
            total_quantity_approved: totalQuantityApproved,
            linked_delivery_ids: linkedDeliveryIds,
            linked_delivery_numbers: linkedDeliveryNumbers,
            linked_delivery_count: linkedDeliveryIds.length,
          };
        });

        const withdrawalsSummary = {
          totalWithdrawals: mappedWithdrawals.length,
          byStatus: mappedWithdrawals.reduce(
            (acc: Record<string, number>, w: any) => {
              acc[w.status] = (acc[w.status] || 0) + 1;
              return acc;
            },
            {},
          ),
        };
        result = {
          withdrawals: mappedWithdrawals,
          summary: withdrawalsSummary,
        };
        break;
      }

      case "getSupplyTrackingData": {
        const limit = params.limit ? Number(params.limit) : 100;
        const sortBy =
          typeof params.sortBy === "string" ? params.sortBy : "-request_date";
        const sortField = sortBy.startsWith("-") ? sortBy.slice(1) : sortBy;
        const sortDirection = sortBy.startsWith("-") ? "desc" : "asc";

        const [orders, withdrawals] = await Promise.all([
          prisma.order.findMany({
            where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
            include: {
              supplier: true,
              items: true,
            },
            orderBy: { orderDate: "desc" },
          }),
          prisma.withdrawalRequest.findMany({
            where: { status: { notIn: ["CLOSED", "CANCELLED"] } },
            include: {
              supplier: true,
              items: true,
            },
            orderBy: { requestDate: "desc" },
          }),
        ]);

        const now = new Date();
        const mapUrgencyFromDays = (daysWaiting: number) => {
          if (daysWaiting > 14) return "emergency";
          if (daysWaiting > 7) return "urgent";
          return "routine";
        };

        const supplies = [
          ...orders.map((order: any) => {
            const requestDate = order.orderDate || order.createdAt;
            const daysWaiting = requestDate
              ? Math.max(
                  0,
                  Math.floor(
                    (now.getTime() - new Date(requestDate).getTime()) /
                      86400000,
                  ),
                )
              : 0;
            return {
              id: order.id,
              type: "order",
              document_number:
                order.permanentNumber || order.tempNumber || null,
              request_date: order.orderDate?.toISOString() || null,
              expected_delivery:
                order.expectedDeliveryEnd?.toISOString() ||
                order.expectedDeliveryStart?.toISOString() ||
                null,
              supplier: order.supplierSnapshot || order.supplier?.name || null,
              status:
                mapOrderStatus(order.status) ||
                (order.status ? order.status.toLowerCase() : null),
              urgency: mapUrgencyFromDays(daysWaiting),
              total_items: Array.isArray(order.items) ? order.items.length : 0,
              days_waiting: daysWaiting,
              items: order.items || [],
            };
          }),
          ...withdrawals.map((withdrawal: any) => {
            const requestDate = withdrawal.requestDate || withdrawal.createdAt;
            const daysWaiting = requestDate
              ? Math.max(
                  0,
                  Math.floor(
                    (now.getTime() - new Date(requestDate).getTime()) /
                      86400000,
                  ),
                )
              : 0;
            const normalizedStatus = withdrawal.status
              ? withdrawal.status.toUpperCase()
              : null;
            const status =
              normalizedStatus === "SHIPPING"
                ? "in_delivery"
                : normalizedStatus
                  ? normalizedStatus.toLowerCase()
                  : null;
            return {
              id: withdrawal.id,
              type: "withdrawal",
              document_number: withdrawal.withdrawalNumber,
              request_date: withdrawal.requestDate?.toISOString() || null,
              expected_delivery: null,
              supplier:
                withdrawal.supplierSnapshot ||
                withdrawal.supplier?.name ||
                null,
              status,
              urgency: mapUrgencyFromDays(daysWaiting),
              total_items: Array.isArray(withdrawal.items)
                ? withdrawal.items.length
                : 0,
              days_waiting: daysWaiting,
              items: withdrawal.items || [],
            };
          }),
        ];

        const sortedSupplies = supplies.sort((a: any, b: any) => {
          const aDate = a[sortField];
          const bDate = b[sortField];
          if (!aDate && !bDate) return 0;
          if (!aDate) return sortDirection === "asc" ? -1 : 1;
          if (!bDate) return sortDirection === "asc" ? 1 : -1;
          const diff = new Date(aDate).getTime() - new Date(bDate).getTime();
          return sortDirection === "asc" ? diff : -diff;
        });

        const limitedSupplies = Number.isFinite(limit)
          ? sortedSupplies.slice(0, limit)
          : sortedSupplies;
        const summary = {
          totalSupplies: limitedSupplies.length,
          ordersCount: orders.length,
          withdrawalsCount: withdrawals.length,
          urgentCount: limitedSupplies.filter(
            (s: any) => s.urgency !== "routine",
          ).length,
        };
        result = { supplies: limitedSupplies, summary };
        break;
      }

      case "getAggregatedActivityLog": {
        const activities = await prisma.activityLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 100,
        });
        // ActivityLog frontend expects response.data.data to be the array directly
        result = {
          activities,
          totalCount: activities.length,
          filteredCount: activities.length,
        };
        break;
      }

      case "getManageSuppliersData": {
        const suppliers = await supplierService.getAll(true);
        result = { suppliers };
        break;
      }

      case "getContactsData": {
        const contacts = await prisma.supplierContact.findMany({
          include: {
            supplier: true,
          },
          orderBy: { name: "asc" },
        });
        result = { contacts };
        break;
      }

      case "getManageReagentsData": {
        const reagents = await prisma.reagent.findMany({
          where: { isDeleted: false },
          include: {
            supplier: true,
            batches: {
              where: { status: "ACTIVE" },
            },
          },
          orderBy: { name: "asc" },
        });
        result = { reagents };
        break;
      }

      case "getInventoryCountDraftData": {
        const draft = await inventoryService.getCurrentDraft();
        const reagents = await prisma.reagent.findMany({
          where: { isDeleted: false },
          include: {
            supplier: true,
            batches: {
              where: { status: "ACTIVE" },
            },
          },
        });
        const lastCount = await prisma.completedInventoryCount.findFirst({
          orderBy: { countDate: "desc" },
        });
        const totalActiveBatches = reagents.reduce(
          (sum, r) => sum + r.batches.length,
          0,
        );
        const reagentsWithNewBatches = 0;
        result = {
          reagents,
          draft,
          lastCompletedCount: lastCount,
          summary: {
            totalReagents: reagents.length,
            withBatches: reagents.filter((r) => r.batches.length > 0).length,
            totalActiveBatches,
            reagentsWithNewBatches,
          },
        };
        break;
      }

      case "getQualityAssuranceData": {
        const batches = await prisma.reagentBatch.findMany({
          include: {
            reagent: {
              include: { supplier: true },
            },
            delivery: {
              include: { order: true, supplier: true },
            },
          },
          orderBy: { expiryDate: "asc" },
        });

        const mapStatus = (status: string | null | undefined) => {
          if (!status) return "active";
          const normalized = status.toUpperCase();
          if (normalized === "ACTIVE") return "active";
          if (normalized === "EXPIRED") return "expired";
          if (normalized === "CONSUMED") return "consumed";
          if (normalized === "ON_HOLD") return "quarantine";
          if (normalized === "DESTROYED") return "disposed";
          if (normalized === "INCOMING") return "active";
          return status.toLowerCase();
        };

        result = batches.map((batch: any) => {
          const delivery = batch.delivery;
          const order = delivery?.order;
          const orderNumber =
            order?.permanentNumber || order?.tempNumber || null;
          const supplierName =
            batch.reagent?.supplier?.name || delivery?.supplier?.name || null;
          const coaDocuments = batch.coaDocumentUrl
            ? [{ coa_document_url: batch.coaDocumentUrl }]
            : [];

          return {
            id: batch.id,
            reagent_batch_id: batch.id,
            reagent_id: batch.reagentId,
            reagent_name: batch.reagent?.name || null,
            batch_number: batch.batchNumber,
            expiry_date: batch.expiryDate?.toISOString() || null,
            receipt_quantity: Number(batch.initialQuantity) || 0,
            status_quantity: Number(batch.currentQuantity) || 0,
            current_quantity: Number(batch.currentQuantity) || 0,
            receipt_date: batch.receivedDate?.toISOString() || null,
            delivery_number: delivery?.deliveryNumber || null,
            delivery_id: delivery?.id || null,
            order_number: orderNumber,
            supplier: supplierName,
            status: mapStatus(batch.status),
            first_use_date: batch.firstOpenedDate?.toISOString() || null,
            received_by: null,
            coa_documents: coaDocuments,
            action_taken: false,
          };
        });
        break;
      }

      case "alertsManager": {
        const action = params.action;
        const data = params.data || {};

        const mapPriority = (severity: string | null | undefined) => {
          if (!severity) return "medium";
          const normalized = severity.toUpperCase();
          if (normalized === "LOW") return "low";
          if (normalized === "HIGH") return "high";
          if (normalized === "CRITICAL") return "critical";
          return "medium";
        };

        const mapStatus = (status: string | null | undefined) => {
          if (!status) return "active";
          const normalized = status.toUpperCase();
          if (normalized === "NEW") return "active";
          if (normalized === "IN_PROGRESS") return "acknowledged";
          if (normalized === "RESOLVED") return "resolved";
          if (normalized === "DISMISSED") return "snoozed";
          return status.toLowerCase();
        };

        const mapStatusToDb = (status: string | null | undefined) => {
          if (!status || status === "all") return undefined;
          if (status === "active") return "NEW";
          if (status === "acknowledged") return "IN_PROGRESS";
          if (status === "resolved") return "RESOLVED";
          if (status === "snoozed") return "DISMISSED";
          return status.toUpperCase();
        };

        const mapPriorityToDb = (priority: string | null | undefined) => {
          if (!priority || priority === "all") return undefined;
          if (priority === "low") return "LOW";
          if (priority === "medium") return "MEDIUM";
          if (priority === "high") return "HIGH";
          if (priority === "critical") return "CRITICAL";
          return priority.toUpperCase();
        };

        if (action === "get_active_alerts") {
          const filters = data.filters || {};
          const where: any = {};

          const statusFilter = mapStatusToDb(filters.status);
          if (statusFilter) where.status = statusFilter;

          const priorityFilter = mapPriorityToDb(filters.priority);
          if (priorityFilter) where.severity = priorityFilter;

          if (filters.type && filters.type !== "all") {
            where.alertRule = { ruleType: filters.type.toUpperCase() };
          }

          const alerts = await prisma.activeAlert.findMany({
            where,
            include: { alertRule: true },
            orderBy: { createdAt: "desc" },
          });

          result = alerts.map((alert: any) => ({
            id: alert.id,
            alert_type:
              alert.alertRule?.ruleType?.toLowerCase() ||
              alert.entityType?.toLowerCase() ||
              "custom",
            title: alert.alertRule?.name || "התראה",
            message: alert.message,
            status: mapStatus(alert.status),
            priority: mapPriority(alert.severity),
            created_date: alert.createdAt?.toISOString(),
            entity_type: alert.entityType,
            entity_id: alert.entityId,
          }));
          break;
        }

        if (action === "acknowledge_alert") {
          const alertId = data.alertId || data.alert_id;
          if (!alertId) {
            result = { success: false, error: "alertId is required" };
            break;
          }
          await prisma.activeAlert.update({
            where: { id: alertId },
            data: { status: "IN_PROGRESS" },
          });
          result = { success: true };
          break;
        }

        if (action === "resolve_alert") {
          const alertId = data.alertId || data.alert_id;
          if (!alertId) {
            result = { success: false, error: "alertId is required" };
            break;
          }
          const resolution = data.resolution || {};
          const notes = resolution.notes || resolution.action_taken || null;
          await prisma.activeAlert.update({
            where: { id: alertId },
            data: {
              status: "RESOLVED",
              resolvedAt: new Date(),
              resolutionNotes: notes,
            },
          });
          result = { success: true };
          break;
        }

        if (action === "create_rule") {
          const ruleName = data.rule_name || data.name;
          const ruleType = data.rule_type || data.type;
          if (!ruleName || !ruleType) {
            result = {
              success: false,
              error: "rule_name and rule_type are required",
            };
            break;
          }
          const conditions = data.conditions || {};
          const targetFilters = data.target_filters || {};
          const categories = targetFilters.categories;
          const appliesToCategories = Array.isArray(categories)
            ? categories.join(",")
            : "";
          const created = await prisma.alertRule.create({
            data: {
              name: ruleName,
              ruleType: ruleType.toUpperCase(),
              description: data.notes || data.description || null,
              thresholdDays:
                conditions.threshold_days ?? conditions.thresholdDays ?? null,
              thresholdQuantity:
                conditions.threshold_quantity ??
                conditions.thresholdQuantity ??
                null,
              thresholdMonths:
                conditions.threshold_months ??
                conditions.thresholdMonths ??
                null,
              appliesToCategories,
              isActive: true,
            },
          });
          result = { success: true, ruleId: created.id };
          break;
        }

        result = {
          success: false,
          error: `Unsupported alertsManager action: ${action}`,
        };
        break;
      }

      case "getEditReagentData": {
        const reagentId = params.reagent_id || params.reagentId;
        if (!reagentId) {
          result = { success: false, error: "reagent_id is required" };
          break;
        }

        const reagent = await prisma.reagent.findUnique({
          where: { id: reagentId },
          include: { supplier: true },
        });

        if (!reagent) {
          result = { success: false, error: "Reagent not found" };
          break;
        }

        const activeBatches = await prisma.reagentBatch.findMany({
          where: { reagentId, status: "ACTIVE" },
          orderBy: { expiryDate: "asc" },
        });

        const recentTransactions = await prisma.inventoryTransaction.findMany({
          where: { reagentId },
          include: { batch: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        const relatedOrderItems = await prisma.orderItem.findMany({
          where: { reagentId },
          include: { order: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        const mapStockStatus = (status: string | null | undefined) => {
          if (!status) return null;
          const normalized = status.toUpperCase();
          if (normalized === "NORMAL") return "in_stock";
          if (normalized === "LOW") return "low_stock";
          if (normalized === "CRITICAL") return "low_stock";
          if (normalized === "OUT_OF_STOCK") return "out_of_stock";
          if (normalized === "OVERSTOCKED") return "overstocked";
          return status.toLowerCase();
        };

        const mappedReagent = {
          id: reagent.id,
          name: reagent.name,
          catalog_number: reagent.catalogNumber || null,
          category: reagent.category?.toLowerCase() || reagent.category,
          supplier: reagent.supplier?.name || null,
          supplier_id: reagent.supplierId,
          total_quantity_all_batches: reagent.totalQuantity,
          active_batches_count: reagent.activeBatchesCount,
          nearest_expiry_date: reagent.nearestExpiryDate?.toISOString() || null,
          current_stock_status: mapStockStatus(reagent.currentStockStatus),
          months_of_stock: reagent.monthsOfStock,
          requires_batches: reagent.requiresBatches,
          is_consumable: reagent.isConsumable,
          custom_min_stock: (reagent as any).minStockLevel ?? null,
          custom_max_stock: (reagent as any).maxStockLevel ?? null,
          min_stock_level: (reagent as any).minStockLevel ?? null,
          max_stock_level: (reagent as any).maxStockLevel ?? null,
          notes: reagent.notes || "",
          created_date: reagent.createdAt.toISOString(),
          updated_date: reagent.updatedAt.toISOString(),
        };

        const mappedSupplier = reagent.supplier
          ? {
              id: reagent.supplier.id,
              name: reagent.supplier.name,
              display_name: reagent.supplier.name,
              short_code: reagent.supplier.shortCode || null,
              address: reagent.supplier.address || null,
              phone: reagent.supplier.phone || null,
              email: reagent.supplier.email || null,
              website: reagent.supplier.website || null,
              default_currency: reagent.supplier.defaultCurrency,
              payment_terms: reagent.supplier.paymentTerms || null,
              lead_time_days: reagent.supplier.leadTimeDays || null,
              is_preferred: reagent.supplier.isPreferred,
              is_active: reagent.supplier.isActive,
              created_at: reagent.supplier.createdAt.toISOString(),
              updated_at: reagent.supplier.updatedAt.toISOString(),
            }
          : null;

        const mappedBatches = activeBatches.map((batch) => ({
          id: batch.id,
          reagent_id: batch.reagentId,
          batch_number: batch.batchNumber,
          expiry_date: batch.expiryDate?.toISOString() || null,
          current_quantity: batch.currentQuantity,
          status: batch.status,
        }));

        const mappedTransactions = recentTransactions.map((tx) => ({
          id: tx.id,
          reagent_id: tx.reagentId,
          batch_id: tx.batchId,
          batch_number: tx.batch?.batchNumber || null,
          transaction_type: tx.transactionType,
          quantity: tx.quantityDelta,
          created_date: tx.createdAt.toISOString(),
          notes: tx.notes || null,
        }));

        const mappedRelatedOrders = relatedOrderItems.map((item) => ({
          id: item.id,
          order_id: item.orderId,
          order_number_temp: item.order?.tempNumber || null,
          order_date: item.order?.orderDate
            ? item.order.orderDate.toISOString()
            : null,
          order_status:
            item.order?.status?.toLowerCase() || item.order?.status || null,
          quantity_ordered: item.requestedQuantity,
          quantity_received: item.receivedQuantity,
        }));

        result = {
          success: true,
          data: {
            reagent: mappedReagent,
            activeBatches: mappedBatches,
            recentTransactions: mappedTransactions,
            relatedOrders: mappedRelatedOrders,
            supplierData: mappedSupplier,
          },
        };
        break;
      }

      case "getEditReagentBatchData": {
        const batchId = params.batch_id || params.batchId;
        if (!batchId) {
          result = { success: false, error: "batch_id is required" };
          break;
        }

        const batch = await prisma.reagentBatch.findUnique({
          where: { id: batchId },
          include: {
            reagent: {
              include: {
                supplier: true,
              },
            },
            delivery: {
              include: {
                supplier: true,
                order: true,
              },
            },
          },
        });

        if (!batch) {
          result = { success: false, error: "Batch not found" };
          break;
        }

        const relatedTransactions = await prisma.inventoryTransaction.findMany({
          where: { batchId },
          orderBy: { createdAt: "desc" },
        });

        const deliveryItems = await prisma.deliveryItem.findMany({
          where: {
            reagentId: batch.reagentId,
            batchNumber: batch.batchNumber,
          },
          include: {
            delivery: {
              include: {
                supplier: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        const shipmentItems = await prisma.shipmentItem.findMany({
          where: { batchId },
          include: {
            shipment: true,
          },
          orderBy: { createdAt: "desc" },
        });

        const mapBatchStatus = (status?: string | null) => {
          if (!status) return null;
          const normalized = status.toUpperCase();
          if (normalized === "INCOMING") return "incoming";
          if (normalized === "ACTIVE") return "active";
          if (normalized === "EXPIRED") return "expired";
          if (normalized === "CONSUMED") return "consumed";
          if (normalized === "ON_HOLD") return "quarantine";
          if (normalized === "DESTROYED") return "disposed";
          return status.toLowerCase();
        };

        const mapQcStatus = (status?: string | null) => {
          if (!status) return "not_required";
          const normalized = status.toUpperCase();
          if (normalized === "PENDING") return "pending";
          if (normalized === "APPROVED") return "passed";
          if (normalized === "REJECTED") return "failed";
          if (normalized === "REQUIRES_REVIEW") return "in_progress";
          return status.toLowerCase();
        };

        const orderReference = batch.delivery?.order
          ? batch.delivery.order.permanentNumber ||
            batch.delivery.order.tempNumber ||
            null
          : null;

        const mappedBatch = {
          id: batch.id,
          reagent_id: batch.reagentId,
          batch_number: batch.batchNumber,
          expiry_date: batch.expiryDate?.toISOString() || null,
          manufacture_date: batch.manufactureDate?.toISOString() || null,
          initial_quantity: batch.initialQuantity,
          current_quantity: batch.currentQuantity,
          reserved_quantity: batch.reservedQuantity,
          received_date: batch.receivedDate?.toISOString() || null,
          storage_location: batch.storageLocation || null,
          storage_conditions: batch.storageConditions || null,
          status: mapBatchStatus(batch.status),
          qc_status: mapQcStatus(batch.qcStatus),
          qc_notes: batch.qcNotes || null,
          notes: batch.generalNotes || null,
          received_by: null,
          delivery_reference: batch.delivery?.deliveryNumber || null,
          order_reference: orderReference,
          qc_date: null,
          qc_performed_by: null,
          coa_document_url: batch.coaDocumentUrl || null,
          coa_upload_date: null,
          coa_uploaded_by: null,
          created_date: batch.createdAt?.toISOString() || null,
          updated_date: batch.updatedAt?.toISOString() || null,
        };

        const mappedReagentData = batch.reagent
          ? {
              id: batch.reagent.id,
              name: batch.reagent.name,
              supplier: batch.reagent.supplier?.name || null,
              supplier_id: batch.reagent.supplierId,
              unit_of_measure: null,
            }
          : null;

        const mappedTransactions = relatedTransactions.map((tx: any) => ({
          id: tx.id,
          transaction_type: tx.transactionType,
          quantity: tx.quantityDelta,
          notes: tx.notes || null,
          created_date: tx.createdAt.toISOString(),
        }));

        const mappedDeliveryItems = deliveryItems.map((item: any) => ({
          id: item.id,
          delivery_id: item.deliveryId,
          delivery_number: item.delivery?.deliveryNumber || null,
          delivery_date: item.delivery?.deliveryDate?.toISOString() || null,
          quantity_received:
            Number(item.acceptedQuantity ?? item.quantity) || 0,
        }));

        const mappedShipmentItems = shipmentItems.map((item: any) => ({
          id: item.id,
          shipment_id: item.shipmentId,
          shipment_number: item.shipment?.shipmentNumber || null,
          shipment_date: item.shipment?.shipmentDate?.toISOString() || null,
          quantity_sent: Number(item.quantity) || 0,
        }));

        const linkedDelivery = batch.delivery
          ? {
              id: batch.delivery.id,
              delivery_number: batch.delivery.deliveryNumber,
              delivery_date: batch.delivery.deliveryDate?.toISOString() || null,
              supplier:
                batch.delivery.supplier?.name ||
                batch.delivery.supplierSnapshot ||
                null,
            }
          : null;

        result = {
          success: true,
          data: {
            batch: mappedBatch,
            reagentData: mappedReagentData,
            relatedTransactions: mappedTransactions,
            deliveryItems: mappedDeliveryItems,
            shipmentItems: mappedShipmentItems,
            linkedDelivery,
          },
        };
        break;
      }

      case "getEditDeliveryData": {
        const deliveryId = params.delivery_id || params.deliveryId;
        if (!deliveryId) {
          result = { success: false, error: "delivery_id is required" };
          break;
        }

        const delivery = await prisma.delivery.findUnique({
          where: { id: deliveryId },
          include: {
            supplier: true,
            order: true,
            withdrawalRequest: true,
            items: {
              include: {
                reagent: true,
              },
            },
          },
        });

        if (!delivery) {
          result = { success: false, error: "Delivery not found" };
          break;
        }

        const mapDeliveryStatus = (status?: string | null) => {
          if (!status) return "open";
          const normalized = status.toUpperCase();
          if (normalized === "NEW") return "open";
          if (normalized === "PROCESSING") return "processing";
          if (normalized === "COMPLETED") return "processed";
          if (normalized === "CANCELLED") return "closed";
          return status.toLowerCase();
        };

        const items = Array.isArray(delivery.items) ? delivery.items : [];
        const totalItemsReceived = items.reduce((sum: number, item: any) => {
          return sum + (Number(item.acceptedQuantity ?? item.quantity) || 0);
        }, 0);
        const completionType =
          items.length > 0
            ? items.every(
                (item: any) =>
                  (Number(item.acceptedQuantity ?? item.quantity) || 0) >=
                  (Number(item.quantity) || 0),
              )
              ? "full"
              : "partial"
            : null;

        const mappedDelivery = {
          id: delivery.id,
          delivery_number: delivery.deliveryNumber,
          supplier:
            delivery.supplier?.name || delivery.supplierSnapshot || null,
          supplier_id: delivery.supplierId,
          delivery_date: delivery.deliveryDate?.toISOString() || null,
          status: mapDeliveryStatus(delivery.status),
          delivery_type: delivery.orderId ? "with_order" : "other",
          completion_type: completionType,
          total_items_received: totalItemsReceived,
          notes: delivery.notes || null,
          completion_notes: null,
          delivery_reason_text: null,
          created_date: delivery.createdAt?.toISOString() || null,
          updated_date: delivery.updatedAt?.toISOString() || null,
          created_by: null,
        };

        const mappedDeliveryItems = items.map((item: any) => ({
          id: item.id,
          reagent_id: item.reagentId,
          reagent_current_name: item.reagent?.name || null,
          reagent_name_snapshot: item.reagent?.name || null,
          reagent_catalog_number: item.reagent?.catalogNumber || null,
          batch_number: item.batchNumber,
          expiry_date: item.expiryDate?.toISOString() || null,
          quantity_received:
            Number(item.acceptedQuantity ?? item.quantity) || 0,
          is_replacement: false,
        }));

        const linkedOrder = delivery.order
          ? {
              id: delivery.order.id,
              order_number_temp: delivery.order.tempNumber,
              order_number_permanent: delivery.order.permanentNumber || null,
              purchase_order_number_sap:
                delivery.order.sapPurchaseOrder || null,
              order_date: delivery.order.orderDate?.toISOString() || null,
              status: mapOrderStatus(delivery.order.status),
            }
          : null;

        const linkedWithdrawals = delivery.withdrawalRequest
          ? [
              {
                id: delivery.withdrawalRequest.id,
                withdrawal_number: delivery.withdrawalRequest.withdrawalNumber,
                request_date:
                  delivery.withdrawalRequest.requestDate?.toISOString() || null,
                status:
                  delivery.withdrawalRequest.status?.toLowerCase() ||
                  delivery.withdrawalRequest.status,
              },
            ]
          : [];

        result = {
          success: true,
          data: {
            delivery: mappedDelivery,
            deliveryItems: mappedDeliveryItems,
            linkedOrder,
            linkedWithdrawals,
          },
        };
        break;
      }

      case "getEditWithdrawalData": {
        const withdrawalId =
          params.withdrawal_request_id || params.withdrawalId;
        if (!withdrawalId) {
          result = {
            success: false,
            error: "withdrawal_request_id is required",
          };
          break;
        }

        const withdrawal = await prisma.withdrawalRequest.findUnique({
          where: { id: withdrawalId },
          include: {
            supplier: true,
            deliveries: true,
            items: {
              include: {
                reagent: true,
              },
            },
            frameworkOrder: {
              include: {
                order: true,
              },
            },
          },
        });

        if (!withdrawal) {
          result = { success: false, error: "Withdrawal request not found" };
          break;
        }

        const mappedRequest = {
          id: withdrawal.id,
          withdrawal_number: withdrawal.withdrawalNumber,
          status: withdrawal.status ? withdrawal.status.toLowerCase() : "draft",
          supplier_snapshot:
            withdrawal.supplierSnapshot || withdrawal.supplier?.name || null,
          supplier_id: withdrawal.supplierId,
          framework_order_id: withdrawal.frameworkOrderId || null,
          request_date: withdrawal.requestDate?.toISOString() || null,
          created_date: withdrawal.createdAt?.toISOString() || null,
          updated_date: withdrawal.updatedAt?.toISOString() || null,
          requester_notes: withdrawal.requesterNotes || null,
          approver_notes: withdrawal.approverNotes || null,
          total_value_requested: withdrawal.totalValueRequested ?? null,
          total_value_approved: withdrawal.totalValueApproved ?? null,
          urgency_level: withdrawal.urgencyLevel || null,
          requested_delivery_date:
            withdrawal.requestedDeliveryDate?.toISOString() || null,
          special_instructions: withdrawal.specialInstructions || null,
          created_by: null,
          linked_delivery_ids: Array.isArray(withdrawal.deliveries)
            ? withdrawal.deliveries.map((delivery: any) => delivery.id)
            : [],
        };

        const mappedItems = withdrawal.items.map((item: any) => ({
          withdrawal_item_id: item.id,
          reagent_id: item.reagentId,
          reagent_name_snapshot: item.reagent?.name || null,
          reagent_catalog_number_snapshot: item.reagent?.catalogNumber || null,
          requested_quantity: Number(item.requestedQuantity) || 0,
          approved_quantity: item.approvedQuantity ?? null,
          quantity_received: Number(item.fulfilledQuantity) || 0,
          unit_price: item.unitPrice ?? null,
        }));

        const frameworkOrder = withdrawal.frameworkOrder
          ? {
              id: withdrawal.frameworkOrder.id,
              order_id: withdrawal.frameworkOrder.orderId,
              order_number_temp:
                withdrawal.frameworkOrder.order?.tempNumber || null,
              order_number_permanent:
                withdrawal.frameworkOrder.order?.permanentNumber || null,
              status: mapOrderStatus(withdrawal.frameworkOrder.order?.status),
              valid_from:
                withdrawal.frameworkOrder.validFrom?.toISOString() || null,
              valid_to:
                withdrawal.frameworkOrder.validTo?.toISOString() || null,
            }
          : null;

        result = {
          success: true,
          data: {
            withdrawalRequest: mappedRequest,
            frameworkOrder,
            items: mappedItems,
          },
        };
        break;
      }

      // C3: updateReagentInventory - recalculate reagent aggregates
      case "updateReagentInventory": {
        const reagentId = params.reagentId || params.reagent_id;
        if (!reagentId) {
          throw new AppError("reagentId is required", 400);
        }
        await updateReagentAggregates(reagentId);
        result = { success: true, message: "Reagent inventory updated" };
        break;
      }

      // C5: processCompletedCount - finalize an inventory count draft
      case "processCompletedCount": {
        const draftId = params.draftId || params.draft_id;
        if (!draftId) {
          throw new AppError("draftId is required", 400);
        }
        const countResult = await inventoryService.completeCount(
          draftId,
          params.userId || params.user_id,
        );
        result = { success: true, data: countResult };
        break;
      }

      // Other placeholder functions
      case "getProcessingProgress":
      case "cleanupOperations":
      case "getOrdersForHospital":
      case "getReagentsForHospital":
      case "migrateToHybridCatalog":
      case "generateReports":
      case "manageCOA":
      case "importInventoryCount":
      case "manageCatalog":
      case "uploadContactsFile":
      case "importGlobalCatalogToLocal":
      case "restoreGlobalCatalog":
      case "restoreGlobalCatalogFromLocal":
      case "uploadCatalogFile":
      case "runSummaryUpdates":
      case "exportAllCoas":
      case "createAnnualReminders":
      case "archiveOldData":
      case "alertsEngine":
      case "getBatchAndExpiryData": {
        // Auto-flag expired batches before loading data
        await batchService.processExpiredBatches();

        // Get all batches with reagent info
        const allBatches = await prisma.reagentBatch.findMany({
          include: {
            reagent: {
              include: {
                supplier: true,
              },
            },
          },
          orderBy: { expiryDate: "asc" },
        });

        // Get expired product logs (handled batches)
        const handledBatches = await prisma.expiredProductLog.findMany({
          include: {
            batch: {
              include: {
                reagent: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        // Get all active suppliers
        const allSuppliers = await prisma.supplier.findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
        });

        // Build reagent info cache
        const reagents = await prisma.reagent.findMany({
          where: { isDeleted: false },
          include: {
            supplier: true,
          },
        });
        const reagentInfoCache: Record<string, any> = {};
        for (const r of reagents) {
          reagentInfoCache[r.id] = {
            id: r.id,
            name: r.name,
            catalog_number: r.catalogNumber,
            category: r.category,
            supplier: r.supplier?.name || null,
            supplierId: r.supplierId,
          };
        }

        // Transform batches to frontend expected format
        const transformedBatches = allBatches.map((b: any) => ({
          id: b.id,
          reagent_id: b.reagentId,
          reagent_name: b.reagent?.name,
          batch_number: b.batchNumber,
          expiry_date: b.expiryDate?.toISOString(),
          current_quantity: Number(b.currentQuantity),
          initial_quantity: Number(b.initialQuantity),
          reserved_quantity: Number(b.reservedQuantity) || 0,
          status: b.status ? b.status.toLowerCase() : "active",
          storage_location: b.storageLocation || null,
          storage_conditions: b.storageConditions || null,
          qc_status: b.qcStatus ? b.qcStatus.toLowerCase() : null,
          qc_notes: b.qcNotes || null,
          manufacture_date: b.manufactureDate?.toISOString() || null,
          received_date: b.receivedDate?.toISOString() || null,
          coa_document_url: b.coaDocumentUrl || null,
          coa_upload_date: null,
          coa_uploaded_by: null,
          supplier: b.reagent?.supplier?.name || null,
        }));

        const mappedHandledBatches = handledBatches.map((log: any) => ({
          id: log.id,
          reagent_id: log.reagentId,
          batch_id: log.batchId,
          batch_number_snapshot: log.batch?.batchNumber || null,
          reagent_name_snapshot: log.batch?.reagent?.name || null,
          original_expiry_date: log.batch?.expiryDate?.toISOString() || null,
          action_taken: log.actionTaken
            ? String(log.actionTaken).toLowerCase()
            : null,
          quantity_affected: Number(log.quantity) || 0,
          action_notes: log.notes || null,
          documented_date: log.handledAt?.toISOString() || null,
          documented_by_user_id: log.handledById || null,
        }));

        result = {
          allBatches: transformedBatches,
          handledBatches: mappedHandledBatches,
          allSuppliers: allSuppliers.map((s: any) => ({
            id: s.id,
            name: s.name,
          })),
          reagentInfoCache,
        };
        break;
      }

      case "getReplenishmentData": {
        const orderStatusToUi = (status: string | null | undefined) => {
          if (!status) return "draft";
          const normalized = status.toUpperCase();
          if (normalized === "APPROVED") return "approved";
          if (normalized === "PARTIALLY_RECEIVED") return "partially_received";
          if (normalized === "PENDING_SAP") return "pending_sap_details";
          if (normalized === "FULLY_RECEIVED") return "fully_received";
          if (normalized === "CANCELLED") return "cancelled";
          if (normalized === "CLOSED") return "closed";
          return status.toLowerCase();
        };

        const orderTypeToUi = (orderType: string | null | undefined) => {
          if (!orderType) return "regular";
          return orderType.toUpperCase() === "FRAMEWORK"
            ? "framework"
            : "regular";
        };

        // Reagents + supplier
        const replenishmentReagents = await prisma.reagent.findMany({
          where: { isDeleted: false },
          include: { supplier: true },
          orderBy: { name: "asc" },
        });

        // Active batches
        const activeBatches = await prisma.reagentBatch.findMany({
          where: { status: "ACTIVE" },
          include: {
            reagent: {
              include: { supplier: true },
            },
          },
          orderBy: { expiryDate: "asc" },
        });

        // Open orders + items
        const openOrders = await prisma.order.findMany({
          where: {
            status: {
              in: ["DRAFT", "PENDING_SAP", "APPROVED", "PARTIALLY_RECEIVED"],
            },
          },
          include: {
            supplier: true,
            items: true,
          },
          orderBy: { orderDate: "desc" },
        });

        const openOrderItems = openOrders.flatMap((order) =>
          (order.items || []).map((item: any) => {
            const quantityOrdered = Number(item.requestedQuantity) || 0;
            const quantityReceived = Number(item.receivedQuantity) || 0;
            const quantityRemaining = Math.max(
              0,
              quantityOrdered - quantityReceived,
            );
            let lineStatus = "open";
            if (quantityReceived > 0 && quantityRemaining > 0)
              lineStatus = "partially_received";
            if (quantityRemaining <= 0) lineStatus = "fully_received";
            return {
              id: item.id,
              order_id: item.orderId,
              reagent_id: item.reagentId,
              quantity_ordered: quantityOrdered,
              quantity_received: quantityReceived,
              quantity_remaining: quantityRemaining,
              line_status: lineStatus,
            };
          }),
        );

        // Framework orders: filter from open orders
        const frameworkOrders = openOrders.filter(
          (o) => orderTypeToUi(o.orderType) === "framework",
        );
        const frameworkOrderItems = openOrderItems.filter((item) =>
          frameworkOrders.some((o) => o.id === item.order_id),
        );

        // Pending withdrawals + items
        const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
          where: { status: { in: ["SUBMITTED", "APPROVED", "SHIPPING"] } },
          include: {
            items: true,
          },
          orderBy: { requestDate: "desc" },
        });

        const withdrawalItems = pendingWithdrawals.flatMap((wr) =>
          (wr.items || []).map((item: any) => {
            const requested =
              Number(item.approvedQuantity ?? item.requestedQuantity) || 0;
            const fulfilled = Number(item.fulfilledQuantity) || 0;
            let lineStatus = "open";
            if (fulfilled > 0 && fulfilled < requested)
              lineStatus = "partially_delivered";
            if (fulfilled >= requested) lineStatus = "delivered";
            return {
              id: item.id,
              withdrawal_request_id: item.withdrawalRequestId,
              reagent_id: item.reagentId,
              quantity_requested: requested,
              quantity_received: fulfilled,
              line_status: lineStatus,
            };
          }),
        );

        // Deliveries in progress
        const inProgressDeliveries = await prisma.delivery.findMany({
          where: { status: { in: ["NEW", "PROCESSING"] } },
          include: { items: true },
        });

        const inDeliveryByReagent: Record<string, number> = {};
        for (const delivery of inProgressDeliveries) {
          for (const item of delivery.items || []) {
            const qty = Number(item.quantity) || 0;
            inDeliveryByReagent[item.reagentId] =
              (inDeliveryByReagent[item.reagentId] || 0) + qty;
          }
        }

        const pendingWithdrawalByReagent: Record<string, number> = {};
        for (const item of withdrawalItems) {
          const remaining = Math.max(
            0,
            (item.quantity_requested || 0) - (item.quantity_received || 0),
          );
          pendingWithdrawalByReagent[item.reagent_id] =
            (pendingWithdrawalByReagent[item.reagent_id] || 0) + remaining;
        }

        const quantityInTransitByReagent: Record<string, number> = {};
        for (const item of openOrderItems) {
          const remaining = Math.max(
            0,
            (item.quantity_ordered || 0) - (item.quantity_received || 0),
          );
          quantityInTransitByReagent[item.reagent_id] =
            (quantityInTransitByReagent[item.reagent_id] || 0) + remaining;
        }

        const quantityInTransitWithoutTempByReagent: Record<string, number> =
          {};
        const nonTempOrders = openOrders.filter((o) =>
          ["APPROVED", "PARTIALLY_RECEIVED"].includes(o.status),
        );
        for (const order of nonTempOrders) {
          for (const item of order.items || []) {
            const remaining = Math.max(
              0,
              (Number(item.requestedQuantity) || 0) -
                (Number(item.receivedQuantity) || 0),
            );
            quantityInTransitWithoutTempByReagent[item.reagentId] =
              (quantityInTransitWithoutTempByReagent[item.reagentId] || 0) +
              remaining;
          }
        }

        const transformedReagents = replenishmentReagents.map((r: any) => ({
          id: r.id,
          name: r.name,
          catalog_number: r.catalogNumber || null,
          category: r.category?.toLowerCase() || r.category,
          supplier: r.supplier
            ? { id: r.supplier.id, name: r.supplier.name }
            : null,
          total_quantity_all_batches: Number(r.totalQuantity) || 0,
          active_batches_count: r.activeBatchesCount || 0,
          current_stock_status: r.currentStockStatus?.toLowerCase() || "normal",
          nearest_expiry_date: r.nearestExpiryDate?.toISOString() || null,
          average_monthly_usage: Number(r.averageMonthlyUsage) || 0,
          manual_monthly_usage: Number(r.manualMonthlyUsage) || 0,
          use_manual_usage: r.useManualUsage || false,
          effective_monthly_usage: r.useManualUsage
            ? Number(r.manualMonthlyUsage) || 0
            : Number(r.averageMonthlyUsage) || 0,
          months_of_stock: Number(r.monthsOfStock) || 0,
          min_stock_level:
            r.minStockLevel == null ? null : Number(r.minStockLevel),
          max_stock_level:
            r.maxStockLevel == null ? null : Number(r.maxStockLevel),
        }));

        const transformedBatches = activeBatches.map((b: any) => ({
          id: b.id,
          reagent_id: b.reagentId,
          batch_number: b.batchNumber,
          expiry_date: b.expiryDate?.toISOString() || null,
          current_quantity: Number(b.currentQuantity) || 0,
          status: b.status?.toLowerCase() || "active",
        }));

        const openOrdersData = openOrders
          .filter((o) => orderTypeToUi(o.orderType) !== "framework")
          .map((o: any) => ({
            id: o.id,
            order_number_temp: o.tempNumber,
            order_number_permanent: o.permanentNumber || null,
            purchase_order_number_sap: o.sapPurchaseOrder || null,
            supplier_name_snapshot: o.supplierSnapshot,
            supplier_id: o.supplierId,
            order_type: orderTypeToUi(o.orderType),
            status: orderStatusToUi(o.status),
            order_date: o.orderDate?.toISOString() || null,
          }));

        const frameworkOrdersData = frameworkOrders.map((o: any) => ({
          id: o.id,
          order_number_temp: o.tempNumber,
          order_number_permanent: o.permanentNumber || null,
          purchase_order_number_sap: o.sapPurchaseOrder || null,
          supplier_name_snapshot: o.supplierSnapshot,
          supplier_id: o.supplierId,
          order_type: orderTypeToUi(o.orderType),
          status: orderStatusToUi(o.status),
          order_date: o.orderDate?.toISOString() || null,
        }));

        result = {
          reagentsData: transformedReagents,
          batchesData: transformedBatches,
          openOrderItemsData: openOrderItems,
          withdrawalRequestsData: withdrawalItems,
          openOrdersData,
          frameworkOrdersData,
          frameworkOrderItemsData: frameworkOrderItems,
          pendingWithdrawalByReagent,
          inDeliveryByReagent,
          quantityInTransitByReagent,
          quantityInTransitWithoutTempByReagent,
        };
        break;
      }

      case "getNewDeliveryPageData": {
        // Get all reagents for selection
        const deliveryReagents = await prisma.reagent.findMany({
          where: { isDeleted: false },
          include: {
            supplier: true,
          },
          orderBy: { name: "asc" },
        });

        // Get pending orders
        const pendingOrders = await prisma.order.findMany({
          where: { status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] } },
          include: {
            supplier: true,
            items: {
              include: {
                reagent: true,
              },
            },
          },
          orderBy: { orderDate: "desc" },
        });

        // Get pending withdrawal requests
        const deliveryWithdrawals = await prisma.withdrawalRequest.findMany({
          where: { status: { in: ["SUBMITTED", "APPROVED"] } },
          include: {
            supplier: true,
            items: true,
          },
          orderBy: { requestDate: "desc" },
        });

        result = {
          success: true,
          data: {
            reagents: deliveryReagents.map((r: any) => ({
              id: r.id,
              name: r.name,
              catalog_number: r.catalogNumber,
              category: r.category,
              supplier: r.supplier?.name || null,
              supplier_id: r.supplierId,
            })),
            orders: pendingOrders,
            withdrawalRequests: deliveryWithdrawals,
          },
        };
        break;
      }

      case "createAutomaticOrder": {
        const supplierParam = params.supplier;
        const supplierIdParam = params.supplierId || params.supplier_id;
        let supplierId = supplierIdParam || null;
        let supplierName = null;
        let supplierLeadTimeDays = 7;

        if (!supplierId && supplierParam) {
          if (typeof supplierParam === "string") {
            supplierName = supplierParam;
          } else if (typeof supplierParam === "object") {
            supplierId = supplierParam.id || supplierParam.supplier_id || null;
            supplierName =
              supplierParam.name || supplierParam.supplier_name || null;
          }
        }

        if (!supplierId) {
          const supplier = await prisma.supplier.findFirst({
            where: supplierName ? { name: supplierName } : undefined,
          });
          supplierId = supplier?.id || null;
          supplierName = supplier?.name || supplierName;
          supplierLeadTimeDays = supplier?.leadTimeDays || 7;
        } else {
          const supplier = await prisma.supplier.findUnique({
            where: { id: supplierId },
          });
          supplierName = supplier?.name || supplierName;
          supplierLeadTimeDays = supplier?.leadTimeDays || 7;
        }

        if (!supplierId) {
          result = { success: false, error: "Supplier not found" };
          break;
        }

        const orderTypeParam = params.orderType || params.order_type;
        const orderType =
          orderTypeParam === "framework" ? "FRAMEWORK" : "IMMEDIATE";

        const items = Array.isArray(params.items) ? params.items : [];
        const orderItems = items
          .filter(
            (item: any) =>
              item?.reagent_id && Number(item.quantity) > 0,
          )
          .map((item: any) => ({
            reagentId: item.reagent_id,
            requestedQuantity: Number(item.quantity),
            notes: item.notes || undefined,
          }));
        if (orderItems.length === 0) {
          result = {
            success: false,
            error: "At least one positive-quantity item is required",
          };
          break;
        }

        const expectedDeliveryStart = new Date();
        expectedDeliveryStart.setUTCDate(
          expectedDeliveryStart.getUTCDate() + supplierLeadTimeDays,
        );
        const expectedDeliveryEnd = new Date(expectedDeliveryStart);
        expectedDeliveryEnd.setUTCDate(
          expectedDeliveryEnd.getUTCDate() + 3,
        );

        const order = await orderService.create({
          supplierId,
          items: orderItems,
          orderType,
          expectedDeliveryStart,
          expectedDeliveryEnd,
          notes: "נוצר אוטומטית מהשלמות",
          createdBy: req.user?.id,
        });
        result = {
          success: true,
          orderId: order.id,
          orderNumber: order.tempNumber,
        };
        break;
      }

      case "createAutomaticWithdrawal": {
        const frameworkOrderId =
          params.frameworkOrderId || params.framework_order_id;
        const items = Array.isArray(params.items) ? params.items : [];
        const urgencyLevel =
          params.urgencyLevel || params.urgency_level || "routine";

        if (!frameworkOrderId) {
          result = { success: false, error: "frameworkOrderId is required" };
          break;
        }

        if (items.length === 0) {
          result = { success: false, error: "At least one item is required" };
          break;
        }

        const createFrameworkOrderFromOrder = async (order: any) => {
          const orderItems =
            Array.isArray(order.items) && order.items.length > 0
              ? order.items
              : await prisma.orderItem.findMany({
                  where: { orderId: order.id },
                });
          const totalAllocated = orderItems.reduce((sum: number, item: any) => {
            return sum + (Number(item.requestedQuantity) || 0);
          }, 0);
          const validFrom = order.orderDate
            ? new Date(order.orderDate)
            : new Date();
          const validTo = new Date(validFrom);
          validTo.setFullYear(validTo.getFullYear() + 1);

          const created = await prisma.frameworkOrder.create({
            data: {
              orderId: order.id,
              validFrom,
              validTo,
              maxTotalQuantity: totalAllocated,
              availableQuantity: totalAllocated,
            },
          });

          if (orderItems.length > 0) {
            await prisma.frameworkOrderItem.createMany({
              data: orderItems.map((item: any) => {
                const allocated = Number(item.requestedQuantity) || 0;
                return {
                  frameworkOrderId: created.id,
                  reagentId: item.reagentId,
                  allocatedQuantity: allocated,
                  consumedQuantity: 0,
                  availableQuantity: allocated,
                };
              }),
            });
          }

          return created;
        };

        // Get the framework order with its parent order
        let frameworkOrder: any = await prisma.frameworkOrder.findUnique({
          where: { id: frameworkOrderId },
          include: {
            order: {
              include: {
                supplier: true,
              },
            },
            items: true,
          },
        });
        let orderForSupplier: any = frameworkOrder?.order ?? null;

        if (!frameworkOrder) {
          // Try to find by order id instead
          const order = await prisma.order.findUnique({
            where: { id: frameworkOrderId },
            include: {
              supplier: true,
              frameworkOrder: { include: { items: true } },
              items: true,
            },
          });

          if (!order) {
            result = { success: false, error: "Framework order not found" };
            break;
          }

          orderForSupplier = order;

          if (order.frameworkOrder) {
            frameworkOrder = order.frameworkOrder;
            if (
              Array.isArray(order.frameworkOrder.items) &&
              order.frameworkOrder.items.length === 0
            ) {
              const orderItems =
                Array.isArray(order.items) && order.items.length > 0
                  ? order.items
                  : await prisma.orderItem.findMany({
                      where: { orderId: order.id },
                    });
              if (orderItems.length > 0) {
                await prisma.frameworkOrderItem.createMany({
                  data: orderItems.map((item: any) => {
                    const allocated = Number(item.requestedQuantity) || 0;
                    return {
                      frameworkOrderId: order.frameworkOrder.id,
                      reagentId: item.reagentId,
                      allocatedQuantity: allocated,
                      consumedQuantity: 0,
                      availableQuantity: allocated,
                    };
                  }),
                });
              }
            }
          } else {
            const normalizedOrderType = order.orderType
              ? order.orderType.toUpperCase()
              : "";
            if (normalizedOrderType !== "FRAMEWORK") {
              result = { success: false, error: "Framework order not found" };
              break;
            }
            frameworkOrder = await createFrameworkOrderFromOrder(order);
          }
        }

        if (!frameworkOrder) {
          result = { success: false, error: "Framework order not found" };
          break;
        }

        const supplierId =
          orderForSupplier?.supplierId || frameworkOrder.order?.supplierId;
        const supplierSnapshot =
          orderForSupplier?.supplierSnapshot ||
          orderForSupplier?.supplier?.name ||
          frameworkOrder.order?.supplierSnapshot ||
          frameworkOrder.order?.supplier?.name ||
          "";

        // Generate withdrawal number
        const count = await prisma.withdrawalRequest.count();
        const withdrawalNumber = `WD-${String(count + 1).padStart(6, "0")}`;

        // Create the withdrawal request
        const withdrawal = await prisma.withdrawalRequest.create({
          data: {
            withdrawalNumber,
            supplierId,
            supplierSnapshot,
            frameworkOrderId: frameworkOrder.id,
            status: "SUBMITTED",
            requestDate: new Date(),
            requesterNotes: `נוצר אוטומטית מהשלמות מלאי. דחיפות: ${urgencyLevel}`,
          },
        });

        // Create withdrawal items
        for (const item of items) {
          const reagentId = item.reagent_id || item.reagentId;
          const quantity = Number(item.quantity) || 0;

          if (!reagentId || quantity <= 0) continue;

          await prisma.withdrawalItem.create({
            data: {
              withdrawalRequestId: withdrawal.id,
              reagentId,
              requestedQuantity: quantity,
            },
          });
        }

        result = {
          success: true,
          withdrawalId: withdrawal.id,
          withdrawalNumber: withdrawal.withdrawalNumber,
        };
        break;
      }

      // C4: deleteWithdrawal - delete a DRAFT or CANCELLED withdrawal
      case "deleteWithdrawal": {
        const withdrawalId =
          params.id || params.withdrawal_id || params.withdrawalId;
        if (!withdrawalId) {
          throw new AppError("withdrawal id is required", 400);
        }
        const existingWd = await prisma.withdrawalRequest.findUnique({
          where: { id: withdrawalId },
        });
        if (!existingWd) {
          throw new AppError("Withdrawal request not found", 404);
        }
        if (
          existingWd.status !== "DRAFT" &&
          existingWd.status !== "CANCELLED"
        ) {
          throw new AppError(
            "ניתן למחוק רק בקשות משיכה בסטטוס טיוטה או מבוטל",
            400,
          );
        }
        // Delete items first, then the withdrawal request
        await prisma.withdrawalItem.deleteMany({
          where: { withdrawalRequestId: withdrawalId },
        });
        await prisma.withdrawalRequest.delete({
          where: { id: withdrawalId },
        });
        result = { success: true, message: "Withdrawal request deleted" };
        break;
      }

      case "deleteShipment": {
        const shipmentId = params.id || params.shipment_id || params.shipmentId;
        if (!shipmentId) {
          result = { success: false, error: "shipment id is required" };
          break;
        }
        const shipmentToDelete = await prisma.shipment.findUnique({
          where: { id: shipmentId },
        });
        if (!shipmentToDelete) {
          result = { success: false, error: "Shipment not found" };
          break;
        }
        if (shipmentToDelete.status === "RECEIVED") {
          result = {
            success: false,
            error: "Cannot delete a received shipment",
          };
          break;
        }
        await prisma.shipmentItem.deleteMany({
          where: { shipmentId },
        });
        await prisma.shipment.delete({
          where: { id: shipmentId },
        });
        result = { success: true, message: "Shipment deleted" };
        break;
      }

      case "deleteReagent": {
        const reagentIdToDelete =
          params.id || params.reagent_id || params.reagentId;
        if (!reagentIdToDelete) {
          result = { success: false, error: "reagent id is required" };
          break;
        }
        const reagentToDelete = await prisma.reagent.findUnique({
          where: { id: reagentIdToDelete },
        });
        if (!reagentToDelete) {
          result = { success: false, error: "Reagent not found" };
          break;
        }
        await prisma.reagent.update({
          where: { id: reagentIdToDelete },
          data: { isDeleted: true },
        });
        result = { success: true, message: "Reagent deleted" };
        break;
      }

      case "getEditShipmentData": {
        const editShipmentId =
          params.id || params.shipment_id || params.shipmentId;
        if (!editShipmentId) {
          result = { success: false, error: "shipment id is required" };
          break;
        }
        const shipment = await prisma.shipment.findUnique({
          where: { id: editShipmentId },
          include: {
            items: {
              include: {
                reagent: true,
              },
            },
          },
        });
        if (!shipment) {
          result = { success: false, error: "Shipment not found" };
          break;
        }
        const shipmentItems = Array.isArray(shipment.items)
          ? shipment.items
          : [];
        const mappedShipment = {
          id: shipment.id,
          shipment_number: shipment.shipmentNumber,
          destination_hospital: shipment.destinationHospital,
          destination_department: shipment.destinationDepartment || null,
          shipment_date: shipment.shipmentDate?.toISOString() || null,
          status: shipment.status ? shipment.status.toLowerCase() : "draft",
          document_url: shipment.documentUrl || null,
          notes: shipment.notes || null,
          created_date: shipment.createdAt?.toISOString() || null,
          updated_date: shipment.updatedAt?.toISOString() || null,
        };
        const mappedShipmentItems = shipmentItems.map((item: any) => ({
          id: item.id,
          reagent_id: item.reagentId,
          reagent_name: item.reagent?.name || null,
          reagent_catalog_number: item.reagent?.catalogNumber || null,
          batch_id: item.batchId || null,
          quantity: Number(item.quantity) || 0,
        }));
        result = {
          shipment: mappedShipment,
          items: mappedShipmentItems,
        };
        break;
      }

      case "getInventoryCountsHistoryData": {
        const completedCounts = await prisma.completedInventoryCount.findMany({
          orderBy: { completedAt: "desc" },
        });
        result = {
          counts: completedCounts.map((c: any) => ({
            id: c.id,
            count_date: c.countDate?.toISOString() || null,
            completed_at: c.completedAt?.toISOString() || null,
            total_reagents_counted: c.totalReagentsCounted,
            total_batches_counted: c.totalBatchesCounted,
            variance_summary: c.varianceSummary || null,
            csv_export_url: c.csvExportUrl || null,
            pdf_report_url: c.pdfReportUrl || null,
            completed_by: c.completedById || null,
          })),
        };
        break;
      }

      case "getSingleInventoryCountDetails": {
        const countId = params.id || params.count_id || params.countId;
        if (!countId) {
          result = { success: false, error: "count id is required" };
          break;
        }
        const countRecord = await prisma.completedInventoryCount.findUnique({
          where: { id: countId },
        });
        if (!countRecord) {
          result = { success: false, error: "Inventory count not found" };
          break;
        }
        result = {
          id: countRecord.id,
          count_date: countRecord.countDate?.toISOString() || null,
          completed_at: countRecord.completedAt?.toISOString() || null,
          total_reagents_counted: countRecord.totalReagentsCounted,
          total_batches_counted: countRecord.totalBatchesCounted,
          variance_summary: countRecord.varianceSummary || null,
          csv_export_url: countRecord.csvExportUrl || null,
          pdf_report_url: countRecord.pdfReportUrl || null,
          completed_by: countRecord.completedById || null,
        };
        break;
      }

      case "calculateAverageUsage":
      case "testCOAAccess":
      case "migrateLegacySuppliers":
      case "changeReagentSupplier":
      case "calculateReplenishment":
      case "checkPendingWithdrawals":
      case "getAdvancedAnalytics":
      case "fixDataIntegrity":
      case "exportAllDocumentation":
        // Return empty/mock data for unimplemented functions
        result = {
          message: `Function '${functionName}' is not fully implemented yet`,
          data: [],
        };
        break;

      default:
        const response: ApiResponse = {
          success: false,
          error: `Function '${functionName}' not found`,
        };
        return res.status(404).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: result,
    };
    res.json(response);
  }),
);

export default router;
