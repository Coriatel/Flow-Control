import { Router, Request, Response } from 'express';
import { dashboardService, supplierService, orderService, inventoryService, reagentService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';
import prisma from '../utils/prisma';

const router = Router();

/**
 * POST /api/functions/:functionName
 * Generic function handler - maps function names to services
 * This provides compatibility with the frontend's function-based API pattern
 */
router.post(
    '/:functionName',
    asyncHandler(async (req: Request, res: Response) => {
        const { functionName } = req.params;
        const params = req.body || {};

        let result: any;

        switch (functionName) {
            // Dashboard functions
            case 'getDashboardData':
                result = await dashboardService.getDashboardData();
                break;

            case 'getExpiringReagents':
                result = await dashboardService.getExpiringReagents();
                break;

            case 'getLowStockReagents':
                result = await dashboardService.getLowStockReagents();
                break;

            case 'getStatistics':
                result = await dashboardService.getStatistics();
                break;

            // Implemented data functions
            // Format: { success: true, data: { <entityName>: [...], summary?: {} } }
            case 'getOrdersData': {
                const orders = await prisma.order.findMany({
                    include: {
                        supplier: true,
                        items: {
                            include: {
                                reagent: true,
                            },
                        },
                    },
                    orderBy: { orderDate: 'desc' },
                });
                result = { success: true, data: { orders } };
                break;
            }

            case 'getDeliveriesData': {
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
                    orderBy: { deliveryDate: 'desc' },
                });
                const mappedDeliveries = deliveries.map((d: any) => {
                    const totalItemsReceived = (d.items || []).reduce((sum: number, item: any) => {
                        return sum + (Number(item.quantity) || 0);
                    }, 0);
                    const completionType = d.items && d.items.length > 0
                        ? (d.items.every((item: any) => (Number(item.acceptedQuantity ?? item.quantity) || 0) >= (Number(item.quantity) || 0)) ? 'full' : 'partial')
                        : null;
                    const linkedWithdrawalNumbers = d.withdrawalRequest ? [d.withdrawalRequest.withdrawalNumber] : [];
                    const linkedWithdrawalIds = d.withdrawalRequest ? [d.withdrawalRequest.id] : [];
                    const deliveryType = d.withdrawalRequestId ? 'with_order' : 'with_order';
                    return {
                        id: d.id,
                        delivery_number: d.deliveryNumber,
                        delivery_date: d.deliveryDate?.toISOString(),
                        status: d.status?.toLowerCase() || 'open',
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
                    byStatus: mappedDeliveries.reduce((acc: Record<string, number>, d: any) => {
                        acc[d.status] = (acc[d.status] || 0) + 1;
                        return acc;
                    }, {}),
                };
                result = { success: true, data: { deliveries: mappedDeliveries, summary } };
                break;
            }

            case 'getOutgoingShipmentsData': {
                const shipments = await prisma.shipment.findMany({
                    include: {
                        items: {
                            include: {
                                reagent: true,
                            },
                        },
                    },
                    orderBy: { shipmentDate: 'desc' },
                });
                const shipmentsSummary = {
                    total: shipments.length,
                    byStatus: shipments.reduce((acc: Record<string, number>, s: any) => {
                        acc[s.status] = (acc[s.status] || 0) + 1;
                        return acc;
                    }, {}),
                };
                result = { success: true, data: { shipments, summary: shipmentsSummary } };
                break;
            }

            case 'getWithdrawalRequestsData': {
                const withdrawals = await prisma.withdrawalRequest.findMany({
                    include: {
                        supplier: true,
                        items: {
                            include: {
                                reagent: true,
                            },
                        },
                    },
                    orderBy: { requestDate: 'desc' },
                });
                const withdrawalsSummary = {
                    total: withdrawals.length,
                    byStatus: withdrawals.reduce((acc: Record<string, number>, w: any) => {
                        acc[w.status] = (acc[w.status] || 0) + 1;
                        return acc;
                    }, {}),
                };
                result = { success: true, data: { withdrawals, summary: withdrawalsSummary } };
                break;
            }

            case 'getSupplyTrackingData': {
                const supplies = await prisma.delivery.findMany({
                    where: { isRecurringSupply: true },
                    include: {
                        supplier: true,
                        items: {
                            include: {
                                reagent: true,
                            },
                        },
                    },
                    orderBy: { deliveryDate: 'desc' },
                });
                const suppliesSummary = {
                    total: supplies.length,
                    byStatus: supplies.reduce((acc: Record<string, number>, s: any) => {
                        acc[s.status] = (acc[s.status] || 0) + 1;
                        return acc;
                    }, {}),
                };
                result = { success: true, data: { supplies, summary: suppliesSummary } };
                break;
            }

            case 'getAggregatedActivityLog': {
                const activities = await prisma.activityLog.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                });
                // ActivityLog frontend expects response.data.data to be the array directly
                result = { success: true, data: activities, totalCount: activities.length, filteredCount: activities.length };
                break;
            }

            case 'getManageSuppliersData': {
                const suppliers = await supplierService.getAll(true);
                result = { success: true, data: { suppliers } };
                break;
            }

            case 'getContactsData': {
                const contacts = await prisma.supplierContact.findMany({
                    include: {
                        supplier: true,
                    },
                    orderBy: { name: 'asc' },
                });
                result = { success: true, data: { contacts } };
                break;
            }

            case 'getManageReagentsData': {
                const reagents = await prisma.reagent.findMany({
                    where: { isDeleted: false },
                    include: {
                        supplier: true,
                        batches: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                    orderBy: { name: 'asc' },
                });
                result = { success: true, data: { reagents } };
                break;
            }

            case 'getInventoryCountDraftData': {
                const draft = await inventoryService.getCurrentDraft();
                const reagents = await prisma.reagent.findMany({
                    where: { isDeleted: false },
                    include: {
                        supplier: true,
                        batches: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                });
                const lastCount = await prisma.completedInventoryCount.findFirst({
                    orderBy: { countDate: 'desc' },
                });
                const totalActiveBatches = reagents.reduce((sum, r) => sum + r.batches.length, 0);
                const reagentsWithNewBatches = 0;
                result = {
                    success: true,
                    data: {
                        reagents,
                        draft,
                        lastCompletedCount: lastCount,
                        summary: {
                            totalReagents: reagents.length,
                            withBatches: reagents.filter(r => r.batches.length > 0).length,
                            totalActiveBatches,
                            reagentsWithNewBatches,
                        },
                    },
                };
                break;
            }

            case 'getQualityAssuranceData': {
                const batches = await prisma.reagentBatch.findMany({
                    include: {
                        reagent: {
                            include: { supplier: true },
                        },
                        delivery: {
                            include: { order: true, supplier: true },
                        },
                    },
                    orderBy: { expiryDate: 'asc' },
                });

                const mapStatus = (status: string | null | undefined) => {
                    if (!status) return 'active';
                    const normalized = status.toUpperCase();
                    if (normalized === 'ACTIVE') return 'active';
                    if (normalized === 'EXPIRED') return 'expired';
                    if (normalized === 'CONSUMED') return 'consumed';
                    if (normalized === 'ON_HOLD') return 'quarantine';
                    if (normalized === 'DESTROYED') return 'disposed';
                    if (normalized === 'INCOMING') return 'active';
                    return status.toLowerCase();
                };

                result = batches.map((batch: any) => {
                    const delivery = batch.delivery;
                    const order = delivery?.order;
                    const orderNumber = order?.permanentNumber || order?.tempNumber || null;
                    const supplierName = batch.reagent?.supplier?.name || delivery?.supplier?.name || null;
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

            case 'alertsManager': {
                const action = params.action;
                const data = params.data || {};

                const mapPriority = (severity: string | null | undefined) => {
                    if (!severity) return 'medium';
                    const normalized = severity.toUpperCase();
                    if (normalized === 'LOW') return 'low';
                    if (normalized === 'HIGH') return 'high';
                    if (normalized === 'CRITICAL') return 'critical';
                    return 'medium';
                };

                const mapStatus = (status: string | null | undefined) => {
                    if (!status) return 'active';
                    const normalized = status.toUpperCase();
                    if (normalized === 'NEW') return 'active';
                    if (normalized === 'IN_PROGRESS') return 'acknowledged';
                    if (normalized === 'RESOLVED') return 'resolved';
                    if (normalized === 'DISMISSED') return 'snoozed';
                    return status.toLowerCase();
                };

                const mapStatusToDb = (status: string | null | undefined) => {
                    if (!status || status === 'all') return undefined;
                    if (status === 'active') return 'NEW';
                    if (status === 'acknowledged') return 'IN_PROGRESS';
                    if (status === 'resolved') return 'RESOLVED';
                    if (status === 'snoozed') return 'DISMISSED';
                    return status.toUpperCase();
                };

                const mapPriorityToDb = (priority: string | null | undefined) => {
                    if (!priority || priority === 'all') return undefined;
                    if (priority === 'low') return 'LOW';
                    if (priority === 'medium') return 'MEDIUM';
                    if (priority === 'high') return 'HIGH';
                    if (priority === 'critical') return 'CRITICAL';
                    return priority.toUpperCase();
                };

                if (action === 'get_active_alerts') {
                    const filters = data.filters || {};
                    const where: any = {};

                    const statusFilter = mapStatusToDb(filters.status);
                    if (statusFilter) where.status = statusFilter;

                    const priorityFilter = mapPriorityToDb(filters.priority);
                    if (priorityFilter) where.severity = priorityFilter;

                    if (filters.type && filters.type !== 'all') {
                        where.alertRule = { ruleType: filters.type.toUpperCase() };
                    }

                    const alerts = await prisma.activeAlert.findMany({
                        where,
                        include: { alertRule: true },
                        orderBy: { createdAt: 'desc' },
                    });

                    result = alerts.map((alert: any) => ({
                        id: alert.id,
                        alert_type: alert.alertRule?.ruleType?.toLowerCase() || alert.entityType?.toLowerCase() || 'custom',
                        title: alert.alertRule?.name || 'התראה',
                        message: alert.message,
                        status: mapStatus(alert.status),
                        priority: mapPriority(alert.severity),
                        created_date: alert.createdAt?.toISOString(),
                        entity_type: alert.entityType,
                        entity_id: alert.entityId,
                    }));
                    break;
                }

                if (action === 'acknowledge_alert') {
                    const alertId = data.alertId || data.alert_id;
                    if (!alertId) {
                        result = { success: false, error: 'alertId is required' };
                        break;
                    }
                    await prisma.activeAlert.update({
                        where: { id: alertId },
                        data: { status: 'IN_PROGRESS' },
                    });
                    result = { success: true };
                    break;
                }

                if (action === 'resolve_alert') {
                    const alertId = data.alertId || data.alert_id;
                    if (!alertId) {
                        result = { success: false, error: 'alertId is required' };
                        break;
                    }
                    const resolution = data.resolution || {};
                    const notes = resolution.notes || resolution.action_taken || null;
                    await prisma.activeAlert.update({
                        where: { id: alertId },
                        data: {
                            status: 'RESOLVED',
                            resolvedAt: new Date(),
                            resolutionNotes: notes,
                        },
                    });
                    result = { success: true };
                    break;
                }

                if (action === 'create_rule') {
                    const ruleName = data.rule_name || data.name;
                    const ruleType = data.rule_type || data.type;
                    if (!ruleName || !ruleType) {
                        result = { success: false, error: 'rule_name and rule_type are required' };
                        break;
                    }
                    const conditions = data.conditions || {};
                    const targetFilters = data.target_filters || {};
                    const categories = targetFilters.categories;
                    const appliesToCategories = Array.isArray(categories) ? categories.join(',') : '';
                    const created = await prisma.alertRule.create({
                        data: {
                            name: ruleName,
                            ruleType: ruleType.toUpperCase(),
                            description: data.notes || data.description || null,
                            thresholdDays: conditions.threshold_days ?? conditions.thresholdDays ?? null,
                            thresholdQuantity: conditions.threshold_quantity ?? conditions.thresholdQuantity ?? null,
                            thresholdMonths: conditions.threshold_months ?? conditions.thresholdMonths ?? null,
                            appliesToCategories,
                            isActive: true,
                        },
                    });
                    result = { success: true, ruleId: created.id };
                    break;
                }

                result = { success: false, error: `Unsupported alertsManager action: ${action}` };
                break;
            }

            case 'getEditReagentData': {
                const reagentId = params.reagent_id || params.reagentId;
                if (!reagentId) {
                    result = { success: false, error: 'reagent_id is required' };
                    break;
                }

                const reagent = await prisma.reagent.findUnique({
                    where: { id: reagentId },
                    include: { supplier: true },
                });

                if (!reagent) {
                    result = { success: false, error: 'Reagent not found' };
                    break;
                }

                const activeBatches = await prisma.reagentBatch.findMany({
                    where: { reagentId, status: 'ACTIVE' },
                    orderBy: { expiryDate: 'asc' },
                });

                const recentTransactions = await prisma.inventoryTransaction.findMany({
                    where: { reagentId },
                    include: { batch: true },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                });

                const relatedOrderItems = await prisma.orderItem.findMany({
                    where: { reagentId },
                    include: { order: true },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                });

                const mapStockStatus = (status: string | null | undefined) => {
                    if (!status) return null;
                    const normalized = status.toUpperCase();
                    if (normalized === 'NORMAL') return 'in_stock';
                    if (normalized === 'LOW') return 'low_stock';
                    if (normalized === 'CRITICAL') return 'low_stock';
                    if (normalized === 'OUT_OF_STOCK') return 'out_of_stock';
                    if (normalized === 'OVERSTOCKED') return 'overstocked';
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
                    notes: reagent.notes || '',
                    created_date: reagent.createdAt.toISOString(),
                    updated_date: reagent.updatedAt.toISOString(),
                };

                const mappedSupplier = reagent.supplier ? {
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
                } : null;

                const mappedBatches = activeBatches.map(batch => ({
                    id: batch.id,
                    reagent_id: batch.reagentId,
                    batch_number: batch.batchNumber,
                    expiry_date: batch.expiryDate?.toISOString() || null,
                    current_quantity: batch.currentQuantity,
                    status: batch.status,
                }));

                const mappedTransactions = recentTransactions.map(tx => ({
                    id: tx.id,
                    reagent_id: tx.reagentId,
                    batch_id: tx.batchId,
                    batch_number: tx.batch?.batchNumber || null,
                    transaction_type: tx.transactionType,
                    quantity: tx.quantityDelta,
                    created_date: tx.createdAt.toISOString(),
                    notes: tx.notes || null,
                }));

                const mappedRelatedOrders = relatedOrderItems.map(item => ({
                    id: item.id,
                    order_id: item.orderId,
                    order_number_temp: item.order?.tempNumber || null,
                    order_date: item.order?.orderDate ? item.order.orderDate.toISOString() : null,
                    order_status: item.order?.status?.toLowerCase() || item.order?.status || null,
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

            // Other placeholder functions
            case 'getProcessingProgress':
            case 'cleanupOperations':
            case 'updateReagentInventory':
            case 'getOrdersForHospital':
            case 'processCompletedCount':
            case 'getReagentsForHospital':
            case 'migrateToHybridCatalog':
            case 'generateReports':
            case 'manageCOA':
            case 'importInventoryCount':
            case 'manageCatalog':
            case 'uploadContactsFile':
            case 'importGlobalCatalogToLocal':
            case 'restoreGlobalCatalog':
            case 'restoreGlobalCatalogFromLocal':
            case 'uploadCatalogFile':
            case 'runSummaryUpdates':
            case 'exportAllCoas':
            case 'createAnnualReminders':
            case 'archiveOldData':
            case 'alertsEngine':
            case 'getBatchAndExpiryData': {
                // Get all batches with reagent info
                const allBatches = await prisma.reagentBatch.findMany({
                    include: {
                        reagent: {
                            include: {
                                supplier: true,
                            },
                        },
                    },
                    orderBy: { expiryDate: 'asc' },
                });

                // Get expired product logs (handled batches)
                const handledBatches = await prisma.expiredProductLog.findMany({
                    orderBy: { createdAt: 'desc' },
                });

                // Get all active suppliers
                const allSuppliers = await prisma.supplier.findMany({
                    where: { isActive: true },
                    orderBy: { name: 'asc' },
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
                    status: b.status?.toLowerCase(),
                    storage_location: b.storageLocation,
                    qc_status: b.qcStatus,
                    received_date: b.receivedDate?.toISOString(),
                    supplier: b.reagent?.supplier?.name || null,
                }));

                result = {
                    success: true,
                    data: {
                        allBatches: transformedBatches,
                        handledBatches,
                        allSuppliers: allSuppliers.map((s: any) => ({ id: s.id, name: s.name })),
                        reagentInfoCache,
                    },
                };
                break;
            }

            case 'getReplenishmentData': {
                const orderStatusToUi = (status: string | null | undefined) => {
                    if (!status) return 'draft';
                    const normalized = status.toUpperCase();
                    if (normalized === 'APPROVED') return 'approved';
                    if (normalized === 'PARTIALLY_RECEIVED') return 'partially_received';
                    if (normalized === 'PENDING_SAP') return 'pending_sap_details';
                    if (normalized === 'FULLY_RECEIVED') return 'fully_received';
                    if (normalized === 'CANCELLED') return 'cancelled';
                    if (normalized === 'CLOSED') return 'closed';
                    return status.toLowerCase();
                };

                const orderTypeToUi = (orderType: string | null | undefined) => {
                    if (!orderType) return 'regular';
                    return orderType.toUpperCase() === 'FRAMEWORK' ? 'framework' : 'regular';
                };

                // Reagents + supplier
                const replenishmentReagents = await prisma.reagent.findMany({
                    where: { isDeleted: false },
                    include: { supplier: true },
                    orderBy: { name: 'asc' },
                });

                // Active batches
                const activeBatches = await prisma.reagentBatch.findMany({
                    where: { status: 'ACTIVE' },
                    include: {
                        reagent: {
                            include: { supplier: true },
                        },
                    },
                    orderBy: { expiryDate: 'asc' },
                });

                // Open orders + items
                const openOrders = await prisma.order.findMany({
                    where: { status: { in: ['DRAFT', 'PENDING_SAP', 'APPROVED', 'PARTIALLY_RECEIVED'] } },
                    include: {
                        supplier: true,
                        items: true,
                    },
                    orderBy: { orderDate: 'desc' },
                });

                const openOrderItems = openOrders.flatMap((order) =>
                    (order.items || []).map((item: any) => {
                        const quantityOrdered = Number(item.requestedQuantity) || 0;
                        const quantityReceived = Number(item.receivedQuantity) || 0;
                        const quantityRemaining = Math.max(0, quantityOrdered - quantityReceived);
                        let lineStatus = 'open';
                        if (quantityReceived > 0 && quantityRemaining > 0) lineStatus = 'partially_received';
                        if (quantityRemaining <= 0) lineStatus = 'fully_received';
                        return {
                            id: item.id,
                            order_id: item.orderId,
                            reagent_id: item.reagentId,
                            quantity_ordered: quantityOrdered,
                            quantity_received: quantityReceived,
                            quantity_remaining: quantityRemaining,
                            line_status: lineStatus,
                        };
                    })
                );

                // Framework orders: filter from open orders
                const frameworkOrders = openOrders.filter((o) => orderTypeToUi(o.orderType) === 'framework');
                const frameworkOrderItems = openOrderItems.filter((item) =>
                    frameworkOrders.some((o) => o.id === item.order_id)
                );

                // Pending withdrawals + items
                const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
                    where: { status: { in: ['SUBMITTED', 'APPROVED', 'SHIPPING'] } },
                    include: {
                        items: true,
                    },
                    orderBy: { requestDate: 'desc' },
                });

                const withdrawalItems = pendingWithdrawals.flatMap((wr) =>
                    (wr.items || []).map((item: any) => {
                        const requested = Number(item.approvedQuantity ?? item.requestedQuantity) || 0;
                        const fulfilled = Number(item.fulfilledQuantity) || 0;
                        let lineStatus = 'open';
                        if (fulfilled > 0 && fulfilled < requested) lineStatus = 'partially_delivered';
                        if (fulfilled >= requested) lineStatus = 'delivered';
                        return {
                            id: item.id,
                            withdrawal_request_id: item.withdrawalRequestId,
                            reagent_id: item.reagentId,
                            quantity_requested: requested,
                            quantity_received: fulfilled,
                            line_status: lineStatus,
                        };
                    })
                );

                // Deliveries in progress
                const inProgressDeliveries = await prisma.delivery.findMany({
                    where: { status: { in: ['NEW', 'PROCESSING'] } },
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
                    const remaining = Math.max(0, (item.quantity_requested || 0) - (item.quantity_received || 0));
                    pendingWithdrawalByReagent[item.reagent_id] =
                        (pendingWithdrawalByReagent[item.reagent_id] || 0) + remaining;
                }

                const quantityInTransitByReagent: Record<string, number> = {};
                for (const item of openOrderItems) {
                    const remaining = Math.max(0, (item.quantity_ordered || 0) - (item.quantity_received || 0));
                    quantityInTransitByReagent[item.reagent_id] =
                        (quantityInTransitByReagent[item.reagent_id] || 0) + remaining;
                }

                const quantityInTransitWithoutTempByReagent: Record<string, number> = {};
                const nonTempOrders = openOrders.filter((o) => ['APPROVED', 'PARTIALLY_RECEIVED'].includes(o.status));
                for (const order of nonTempOrders) {
                    for (const item of order.items || []) {
                        const remaining = Math.max(0, (Number(item.requestedQuantity) || 0) - (Number(item.receivedQuantity) || 0));
                        quantityInTransitWithoutTempByReagent[item.reagentId] =
                            (quantityInTransitWithoutTempByReagent[item.reagentId] || 0) + remaining;
                    }
                }

                const transformedReagents = replenishmentReagents.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    catalog_number: r.catalogNumber || null,
                    category: r.category?.toLowerCase() || r.category,
                    supplier: r.supplier ? { id: r.supplier.id, name: r.supplier.name } : null,
                    total_quantity_all_batches: Number(r.totalQuantity) || 0,
                    active_batches_count: r.activeBatchesCount || 0,
                    current_stock_status: r.currentStockStatus?.toLowerCase() || 'normal',
                    nearest_expiry_date: r.nearestExpiryDate?.toISOString() || null,
                    average_monthly_usage: Number(r.averageMonthlyUsage) || 0,
                    manual_monthly_usage: Number(r.manualMonthlyUsage) || 0,
                    use_manual_usage: r.useManualUsage || false,
                    effective_monthly_usage: r.useManualUsage ? Number(r.manualMonthlyUsage) || 0 : Number(r.averageMonthlyUsage) || 0,
                    months_of_stock: Number(r.monthsOfStock) || 0,
                }));

                const transformedBatches = activeBatches.map((b: any) => ({
                    id: b.id,
                    reagent_id: b.reagentId,
                    batch_number: b.batchNumber,
                    expiry_date: b.expiryDate?.toISOString() || null,
                    current_quantity: Number(b.currentQuantity) || 0,
                    status: b.status?.toLowerCase() || 'active',
                }));

                const openOrdersData = openOrders
                    .filter((o) => orderTypeToUi(o.orderType) !== 'framework')
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

            case 'getNewDeliveryPageData': {
                // Get all reagents for selection
                const deliveryReagents = await prisma.reagent.findMany({
                    where: { isDeleted: false },
                    include: {
                        supplier: true,
                    },
                    orderBy: { name: 'asc' },
                });

                // Get pending orders
                const pendingOrders = await prisma.order.findMany({
                    where: { status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] } },
                    include: {
                        supplier: true,
                        items: {
                            include: {
                                reagent: true,
                            },
                        },
                    },
                    orderBy: { orderDate: 'desc' },
                });

                // Get pending withdrawal requests
                const deliveryWithdrawals = await prisma.withdrawalRequest.findMany({
                    where: { status: { in: ['PENDING', 'APPROVED'] } },
                    include: {
                        supplier: true,
                        items: true,
                    },
                    orderBy: { requestDate: 'desc' },
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

            case 'createAutomaticOrder': {
                const supplierParam = params.supplier;
                const supplierIdParam = params.supplierId || params.supplier_id;
                let supplierId = supplierIdParam || null;
                let supplierName = null;

                if (!supplierId && supplierParam) {
                    if (typeof supplierParam === 'string') {
                        supplierName = supplierParam;
                    } else if (typeof supplierParam === 'object') {
                        supplierId = supplierParam.id || supplierParam.supplier_id || null;
                        supplierName = supplierParam.name || supplierParam.supplier_name || null;
                    }
                }

                if (!supplierId) {
                    const supplier = await prisma.supplier.findFirst({
                        where: supplierName ? { name: supplierName } : undefined,
                    });
                    supplierId = supplier?.id || null;
                    supplierName = supplier?.name || supplierName;
                } else {
                    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
                    supplierName = supplier?.name || supplierName;
                }

                if (!supplierId) {
                    result = { success: false, error: 'Supplier not found' };
                    break;
                }

                const orderTypeParam = params.orderType || params.order_type;
                const orderType = orderTypeParam === 'framework' ? 'FRAMEWORK' : 'IMMEDIATE';

                const orderNumber = await orderService.generateOrderNumber();
                const order = await prisma.order.create({
                    data: {
                        tempNumber: orderNumber,
                        supplierId,
                        supplierSnapshot: supplierName || supplierId,
                        orderType,
                        status: 'DRAFT',
                        internalNotes: 'נוצר אוטומטית מהשלמות',
                    },
                });

                const items = Array.isArray(params.items) ? params.items : [];
                for (const item of items) {
                    if (!item?.reagent_id) continue;
                    await prisma.orderItem.create({
                        data: {
                            orderId: order.id,
                            reagentId: item.reagent_id,
                            requestedQuantity: Number(item.quantity) || 0,
                            notes: item.notes || null,
                        },
                    });
                }

                result = {
                    success: true,
                    orderId: order.id,
                    orderNumber: order.tempNumber,
                };
                break;
            }

            case 'calculateAverageUsage':
            case 'testCOAAccess':
            case 'migrateLegacySuppliers':
            case 'deleteShipment':
            case 'changeReagentSupplier':
            case 'deleteReagent':
            case 'calculateReplenishment':
            case 'createAutomaticWithdrawal':
            case 'checkPendingWithdrawals':
            case 'getAdvancedAnalytics':
            case 'getEditWithdrawalData':
            case 'fixDataIntegrity':
            case 'deleteWithdrawal':
            case 'getEditReagentBatchData':
            case 'getEditDeliveryData':
            case 'getEditShipmentData':
            case 'getInventoryCountsHistoryData':
            case 'getSingleInventoryCountDetails':
            case 'exportAllDocumentation':
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
    })
);

export default router;
