// Local API Functions - replaces @base44/sdk functions
// These functions communicate with our local Express backend

import { apiClient } from './client';

// Helper to invoke server functions
async function invokeFunction(functionName, params = {}) {
  return apiClient.post(`/functions/${functionName}`, params);
}

// All exported functions
export const getProcessingProgress = (params) => invokeFunction('getProcessingProgress', params);
export const cleanupOperations = (params) => invokeFunction('cleanupOperations', params);
export const getDashboardData = (params) => invokeFunction('getDashboardData', params);
export const updateReagentInventory = (params) => invokeFunction('updateReagentInventory', params);
export const getOrdersForHospital = (params) => invokeFunction('getOrdersForHospital', params);
export const processCompletedCount = (params) => invokeFunction('processCompletedCount', params);
export const getReagentsForHospital = (params) => invokeFunction('getReagentsForHospital', params);
export const migrateToHybridCatalog = (params) => invokeFunction('migrateToHybridCatalog', params);
export const generateReports = (params) => invokeFunction('generateReports', params);
export const manageCOA = (params) => invokeFunction('manageCOA', params);
export const importInventoryCount = (params) => invokeFunction('importInventoryCount', params);
export const manageCatalog = (params) => invokeFunction('manageCatalog', params);
export const uploadContactsFile = (params) => invokeFunction('uploadContactsFile', params);
export const importGlobalCatalogToLocal = (params) => invokeFunction('importGlobalCatalogToLocal', params);
export const restoreGlobalCatalog = (params) => invokeFunction('restoreGlobalCatalog', params);
export const restoreGlobalCatalogFromLocal = (params) => invokeFunction('restoreGlobalCatalogFromLocal', params);
export const getManageReagentsData = (params) => invokeFunction('getManageReagentsData', params);
export const uploadCatalogFile = (params) => invokeFunction('uploadCatalogFile', params);
export const runSummaryUpdates = (params) => invokeFunction('runSummaryUpdates', params);
export const exportAllCoas = (params) => invokeFunction('exportAllCoas', params);
export const createAnnualReminders = (params) => invokeFunction('createAnnualReminders', params);
export const archiveOldData = (params) => invokeFunction('archiveOldData', params);
export const alertsEngine = (params) => invokeFunction('alertsEngine', params);
export const alertsManager = (params) => invokeFunction('alertsManager', params);
export const calculateAverageUsage = (params) => invokeFunction('calculateAverageUsage', params);
export const testCOAAccess = (params) => invokeFunction('testCOAAccess', params);
export const migrateLegacySuppliers = (params) => invokeFunction('migrateLegacySuppliers', params);
export const deleteShipment = (params) => invokeFunction('deleteShipment', params);
export const changeReagentSupplier = (params) => invokeFunction('changeReagentSupplier', params);
export const deleteReagent = (params) => invokeFunction('deleteReagent', params);
export const getBatchAndExpiryData = (params) => invokeFunction('getBatchAndExpiryData', params);
export const getNewDeliveryPageData = (params) => invokeFunction('getNewDeliveryPageData', params);
export const calculateReplenishment = (params) => invokeFunction('calculateReplenishment', params);
export const getReplenishmentData = (params) => invokeFunction('getReplenishmentData', params);
export const createAutomaticOrder = (params) => invokeFunction('createAutomaticOrder', params);
export const createAutomaticWithdrawal = (params) => invokeFunction('createAutomaticWithdrawal', params);
export const checkPendingWithdrawals = (params) => invokeFunction('checkPendingWithdrawals', params);
export const getAdvancedAnalytics = (params) => invokeFunction('getAdvancedAnalytics', params);
export const getEditWithdrawalData = (params) => invokeFunction('getEditWithdrawalData', params);
export const getQualityAssuranceData = (params) => invokeFunction('getQualityAssuranceData', params);
export const fixDataIntegrity = (params) => invokeFunction('fixDataIntegrity', params);
export const getAggregatedActivityLog = (params) => invokeFunction('getAggregatedActivityLog', params);
export const getSupplyTrackingData = (params) => invokeFunction('getSupplyTrackingData', params);
export const getOrdersData = (params) => invokeFunction('getOrdersData', params);
export const getDeliveriesData = (params) => invokeFunction('getDeliveriesData', params);
export const getOutgoingShipmentsData = (params) => invokeFunction('getOutgoingShipmentsData', params);
export const getWithdrawalRequestsData = (params) => invokeFunction('getWithdrawalRequestsData', params);
export const getManageSuppliersData = (params) => invokeFunction('getManageSuppliersData', params);
export const getContactsData = (params) => invokeFunction('getContactsData', params);
export const deleteWithdrawal = (params) => invokeFunction('deleteWithdrawal', params);
export const getEditReagentData = (params) => invokeFunction('getEditReagentData', params);
export const getEditReagentBatchData = (params) => invokeFunction('getEditReagentBatchData', params);
export const getEditDeliveryData = (params) => invokeFunction('getEditDeliveryData', params);
export const getEditShipmentData = (params) => invokeFunction('getEditShipmentData', params);
export const getInventoryCountsHistoryData = (params) => invokeFunction('getInventoryCountsHistoryData', params);
export const getSingleInventoryCountDetails = (params) => invokeFunction('getSingleInventoryCountDetails', params);
export const getInventoryCountDraftData = (params) => invokeFunction('getInventoryCountDraftData', params);
export const exportAllDocumentation = (params) => invokeFunction('exportAllDocumentation', params);
