import { Router, Request, Response } from 'express';
import { dashboardService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types';

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

            // Placeholder for other functions - return mock data for now
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
            case 'getManageReagentsData':
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
            case 'getAggregatedActivityLog':
            case 'getSupplyTrackingData':
            case 'getOrdersData':
            case 'getDeliveriesData':
            case 'getOutgoingShipmentsData':
            case 'getWithdrawalRequestsData':
            case 'getManageSuppliersData':
            case 'getContactsData':
            case 'deleteWithdrawal':
            case 'getEditReagentData':
            case 'getEditReagentBatchData':
            case 'getEditDeliveryData':
            case 'getEditShipmentData':
            case 'getInventoryCountsHistoryData':
            case 'getSingleInventoryCountDetails':
            case 'getInventoryCountDraftData':
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
