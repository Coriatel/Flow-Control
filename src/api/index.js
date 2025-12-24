/**
 * Flow Control - API Module
 * נקודת כניסה מרכזית ל-API
 *
 * Usage:
 *   import { Reagent, Supplier, getDashboardData } from '@/api';
 *   // or
 *   import { api } from '@/api';
 */

// Core API client
export { default as api, ApiError } from './client.js';

// Entity Factory
export { createEntity } from './entityFactory.js';

// All Entities
export {
  Reagent,
  ReagentBatch,
  Supplier,
  SupplierContact,
  Order,
  OrderItem,
  FrameworkOrder,
  FrameworkOrderItem,
  WithdrawalRequest,
  WithdrawalItem,
  Delivery,
  DeliveryItem,
  Shipment,
  ShipmentItem,
  InventoryTransaction,
  InventoryCountDraft,
  CompletedInventoryCount,
  ExpiredProductLog,
  AlertRule,
  ActiveAlert,
  ScheduledReminder,
  DashboardNote,
  SystemSettings,
  ArchivedData,
  ArchivedReport,
  DocumentationNote,
  ReagentCatalog,
  FeatureDocumentation,
  ReagentReceiptEvent,
  User,
} from './newEntities.js';

// All Functions
export {
  // Dashboard & Analytics
  getDashboardData,
  getAdvancedAnalytics,
  getProcessingProgress,

  // Reagents & Inventory
  getManageReagentsData,
  getEditReagentData,
  updateReagentInventory,
  deleteReagent,
  changeReagentSupplier,
  getReagentsForHospital,

  // Batches & Expiry
  getBatchAndExpiryData,
  getEditReagentBatchData,

  // Inventory Count
  getInventoryCountDraftData,
  getInventoryCountsHistoryData,
  getSingleInventoryCountDetails,
  importInventoryCount,
  processCompletedCount,

  // Orders
  getOrdersData,
  getOrdersForHospital,
  createAutomaticOrder,

  // Deliveries
  getDeliveriesData,
  getNewDeliveryPageData,
  getEditDeliveryData,

  // Shipments
  getOutgoingShipmentsData,
  getEditShipmentData,
  deleteShipment,

  // Withdrawals
  getWithdrawalRequestsData,
  getEditWithdrawalData,
  createAutomaticWithdrawal,
  checkPendingWithdrawals,
  deleteWithdrawal,

  // Suppliers & Contacts
  getManageSuppliersData,
  getContactsData,
  uploadContactsFile,
  migrateLegacySuppliers,

  // Supply Tracking & Replenishment
  getSupplyTrackingData,
  calculateReplenishment,
  getReplenishmentData,

  // Quality Assurance
  getQualityAssuranceData,
  manageCOA,
  testCOAAccess,
  exportAllCoas,

  // Alerts & Reminders
  alertsEngine,
  alertsManager,
  createAnnualReminders,

  // Reports & Analytics
  generateReports,
  getAggregatedActivityLog,

  // Usage & Analytics
  calculateAverageUsage,
  runSummaryUpdates,

  // Catalog Management
  manageCatalog,
  uploadCatalogFile,
  migrateToHybridCatalog,
  importGlobalCatalogToLocal,
  restoreGlobalCatalog,
  restoreGlobalCatalogFromLocal,

  // Data Management & Cleanup
  cleanupOperations,
  fixDataIntegrity,
  archiveOldData,

  // Documentation
  exportAllDocumentation,
} from './newFunctions.js';

// All Integrations
export {
  Core,
  UploadFile,
  UploadPrivateFile,
  CreateFileSignedUrl,
  ExtractDataFromUploadedFile,
  SendEmail,
  InvokeLLM,
  GenerateImage,
} from './newIntegrations.js';
