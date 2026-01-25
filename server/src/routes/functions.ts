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
                        items: {
                            include: {
                                reagent: true,
                            },
                        },
                    },
                    orderBy: { deliveryDate: 'desc' },
                });
                // Calculate summary
                const summary = {
                    total: deliveries.length,
                    byStatus: deliveries.reduce((acc: Record<string, number>, d: any) => {
                        acc[d.status] = (acc[d.status] || 0) + 1;
                        return acc;
                    }, {}),
                };
                result = { success: true, data: { deliveries, summary } };
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
                result = {
                    success: true,
                    data: {
                        reagents,
                        draft,
                        lastCompletedCount: lastCount,
                        summary: {
                            totalReagents: reagents.length,
                            withBatches: reagents.filter(r => r.batches.length > 0).length,
                        },
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
            case 'alertsManager':
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
                // Get all reagents with batches and supplier info
                const replenishmentReagents = await prisma.reagent.findMany({
                    where: { isDeleted: false },
                    include: {
                        supplier: true,
                        batches: {
                            where: { status: 'ACTIVE' },
                        },
                    },
                    orderBy: { name: 'asc' },
                });

                // Get framework orders and items
                const frameworkOrders = await prisma.frameworkOrder.findMany({
                    where: { status: 'ACTIVE' },
                    include: {
                        items: true,
                    },
                });

                // Get pending withdrawal requests
                const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
                    where: { status: { in: ['PENDING', 'APPROVED'] } },
                    include: {
                        items: true,
                    },
                });

                // Transform to frontend expected format
                const transformedReagents = replenishmentReagents.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    catalog_number: r.catalogNumber,
                    category: r.category,
                    supplier: r.supplier ? { id: r.supplier.id, name: r.supplier.name } : null,
                    total_quantity_all_batches: Number(r.totalQuantity) || 0,
                    active_batches_count: r.activeBatchesCount || 0,
                    current_stock_status: r.currentStockStatus?.toLowerCase() || 'normal',
                    nearest_expiry_date: r.nearestExpiryDate?.toISOString(),
                    average_monthly_usage: Number(r.averageMonthlyUsage) || 0,
                    manual_monthly_usage: Number(r.manualMonthlyUsage) || 0,
                    use_manual_usage: r.useManualUsage || false,
                    effective_monthly_usage: r.useManualUsage ? Number(r.manualMonthlyUsage) || 0 : Number(r.averageMonthlyUsage) || 0,
                    months_of_stock: Number(r.monthsOfStock) || 0,
                }));

                result = {
                    success: true,
                    data: {
                        reagents: transformedReagents,
                        frameworkOrders,
                        frameworkOrderItems: frameworkOrders.flatMap((o: any) => o.items),
                        pendingWithdrawals,
                    },
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

            case 'calculateAverageUsage':
            case 'testCOAAccess':
            case 'migrateLegacySuppliers':
            case 'deleteShipment':
            case 'changeReagentSupplier':
            case 'deleteReagent':
            case 'calculateReplenishment':
            case 'createAutomaticOrder':
            case 'createAutomaticWithdrawal':
            case 'checkPendingWithdrawals':
            case 'getAdvancedAnalytics':
            case 'getEditWithdrawalData':
            case 'getQualityAssuranceData':
            case 'fixDataIntegrity':
            case 'deleteWithdrawal':
            case 'getEditReagentData':
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
