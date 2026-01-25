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
            case 'calculateAverageUsage':
            case 'testCOAAccess':
            case 'migrateLegacySuppliers':
            case 'deleteShipment':
            case 'changeReagentSupplier':
            case 'deleteReagent':
            case 'getBatchAndExpiryData':
            case 'getNewDeliveryPageData':
            case 'calculateReplenishment':
            case 'getReplenishmentData':
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
