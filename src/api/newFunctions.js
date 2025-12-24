/**
 * Flow Control - Functions
 * מחליף את base44.functions
 */

import api from './client.js';

// ============================================================================
// Dashboard & Analytics
// ============================================================================

export async function getDashboardData() {
  return api.get('/dashboard');
}

export async function getAdvancedAnalytics(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/analytics${queryString ? '?' + queryString : ''}`);
}

export async function getProcessingProgress(taskId) {
  return api.get(`/tasks/${taskId}/progress`);
}

// ============================================================================
// Reagents & Inventory
// ============================================================================

export async function getManageReagentsData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/reagents/manage${queryString ? '?' + queryString : ''}`);
}

export async function getEditReagentData(reagentId) {
  return api.get(`/reagents/${reagentId}/edit`);
}

export async function updateReagentInventory(reagentId, data) {
  return api.post(`/reagents/${reagentId}/inventory`, data);
}

export async function deleteReagent(reagentId) {
  return api.delete(`/reagents/${reagentId}`);
}

export async function changeReagentSupplier(reagentId, newSupplierId) {
  return api.post(`/reagents/${reagentId}/change-supplier`, { supplierId: newSupplierId });
}

export async function getReagentsForHospital(hospitalId) {
  return api.get(`/hospitals/${hospitalId}/reagents`);
}

// ============================================================================
// Batches & Expiry
// ============================================================================

export async function getBatchAndExpiryData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/batches/expiry${queryString ? '?' + queryString : ''}`);
}

export async function getEditReagentBatchData(batchId) {
  return api.get(`/batches/${batchId}/edit`);
}

// ============================================================================
// Inventory Count
// ============================================================================

export async function getInventoryCountDraftData(draftId) {
  return api.get(`/inventory/drafts/${draftId}`);
}

export async function getInventoryCountsHistoryData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/inventory/history${queryString ? '?' + queryString : ''}`);
}

export async function getSingleInventoryCountDetails(countId) {
  return api.get(`/inventory/completed/${countId}`);
}

export async function importInventoryCount(data) {
  return api.post('/inventory/import', data);
}

export async function processCompletedCount(draftId, data) {
  return api.post(`/inventory/drafts/${draftId}/complete`, data);
}

// ============================================================================
// Orders
// ============================================================================

export async function getOrdersData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/orders/data${queryString ? '?' + queryString : ''}`);
}

export async function getOrdersForHospital(hospitalId) {
  return api.get(`/hospitals/${hospitalId}/orders`);
}

export async function createAutomaticOrder(data) {
  return api.post('/orders/automatic', data);
}

// ============================================================================
// Deliveries
// ============================================================================

export async function getDeliveriesData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/deliveries/data${queryString ? '?' + queryString : ''}`);
}

export async function getNewDeliveryPageData() {
  return api.get('/deliveries/new-page-data');
}

export async function getEditDeliveryData(deliveryId) {
  return api.get(`/deliveries/${deliveryId}/edit`);
}

// ============================================================================
// Shipments
// ============================================================================

export async function getOutgoingShipmentsData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/shipments/data${queryString ? '?' + queryString : ''}`);
}

export async function getEditShipmentData(shipmentId) {
  return api.get(`/shipments/${shipmentId}/edit`);
}

export async function deleteShipment(shipmentId) {
  return api.delete(`/shipments/${shipmentId}`);
}

// ============================================================================
// Withdrawals
// ============================================================================

export async function getWithdrawalRequestsData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/withdrawals/data${queryString ? '?' + queryString : ''}`);
}

export async function getEditWithdrawalData(withdrawalId) {
  return api.get(`/withdrawals/${withdrawalId}/edit`);
}

export async function createAutomaticWithdrawal(data) {
  return api.post('/withdrawals/automatic', data);
}

export async function checkPendingWithdrawals() {
  return api.get('/withdrawals/pending');
}

export async function deleteWithdrawal(withdrawalId) {
  return api.delete(`/withdrawals/${withdrawalId}`);
}

// ============================================================================
// Suppliers & Contacts
// ============================================================================

export async function getManageSuppliersData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/suppliers/data${queryString ? '?' + queryString : ''}`);
}

export async function getContactsData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/supplier-contacts/data${queryString ? '?' + queryString : ''}`);
}

export async function uploadContactsFile(file) {
  return api.upload('/supplier-contacts/import', file);
}

export async function migrateLegacySuppliers() {
  return api.post('/suppliers/migrate-legacy');
}

// ============================================================================
// Supply Tracking & Replenishment
// ============================================================================

export async function getSupplyTrackingData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/supply-tracking${queryString ? '?' + queryString : ''}`);
}

export async function calculateReplenishment(options = {}) {
  return api.post('/replenishment/calculate', options);
}

export async function getReplenishmentData() {
  return api.get('/replenishment/data');
}

// ============================================================================
// Quality Assurance
// ============================================================================

export async function getQualityAssuranceData(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/quality-assurance${queryString ? '?' + queryString : ''}`);
}

export async function manageCOA(batchId, action, data = {}) {
  return api.post(`/batches/${batchId}/coa`, { action, ...data });
}

export async function testCOAAccess(batchId) {
  return api.get(`/batches/${batchId}/coa/test`);
}

export async function exportAllCoas(options = {}) {
  return api.post('/quality-assurance/export-coas', options);
}

// ============================================================================
// Alerts & Reminders
// ============================================================================

export async function alertsEngine(action, data = {}) {
  return api.post('/alerts/engine', { action, ...data });
}

export async function alertsManager(action, data = {}) {
  return api.post('/alerts/manage', { action, ...data });
}

export async function createAnnualReminders(data) {
  return api.post('/reminders/annual', data);
}

// ============================================================================
// Reports & Analytics
// ============================================================================

export async function generateReports(reportType, options = {}) {
  return api.post('/reports/generate', { type: reportType, ...options });
}

export async function getAggregatedActivityLog(options = {}) {
  const queryString = new URLSearchParams(options).toString();
  return api.get(`/activity-log${queryString ? '?' + queryString : ''}`);
}

// ============================================================================
// Usage & Analytics
// ============================================================================

export async function calculateAverageUsage(options = {}) {
  return api.post('/usage/calculate-average', options);
}

export async function runSummaryUpdates() {
  return api.post('/system/run-summary-updates');
}

// ============================================================================
// Catalog Management
// ============================================================================

export async function manageCatalog(action, data = {}) {
  return api.post('/catalog/manage', { action, ...data });
}

export async function uploadCatalogFile(file) {
  return api.upload('/catalog/upload', file);
}

export async function migrateToHybridCatalog() {
  return api.post('/catalog/migrate-hybrid');
}

export async function importGlobalCatalogToLocal(options = {}) {
  return api.post('/catalog/import-global', options);
}

export async function restoreGlobalCatalog() {
  return api.post('/catalog/restore-global');
}

export async function restoreGlobalCatalogFromLocal() {
  return api.post('/catalog/restore-from-local');
}

// ============================================================================
// Data Management & Cleanup
// ============================================================================

export async function cleanupOperations(operation, options = {}) {
  return api.post('/system/cleanup', { operation, ...options });
}

export async function fixDataIntegrity(options = {}) {
  return api.post('/system/fix-integrity', options);
}

export async function archiveOldData(options = {}) {
  return api.post('/system/archive', options);
}

// ============================================================================
// Documentation
// ============================================================================

export async function exportAllDocumentation() {
  return api.get('/documentation/export');
}
