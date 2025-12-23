# 📋 תוכנית מיגרציה מקיפה: Base44 → Express Backend

## מסמך עבודה ל-Claude Sonnet

**תאריך:** December 2025
**גרסה:** 1.0
**סטטוס:** מוכן לביצוע

---

## 📌 תקציר מנהלים

### מצב נוכחי
- **Backend:** Express + Prisma + PostgreSQL - **מוכן ועובד**
- **Frontend:** React + Vite עם 51 דפים - **מחובר ל-Base44 SDK** (צריך החלפה)
- **בעיה:** הדפים קוראים ל-`@base44/sdk` במקום ל-Backend המקומי

### מטרה
להחליף את כל הקריאות ל-Base44 SDK בקריאות ל-Express Backend המקומי, כך שהאפליקציה תהיה עצמאית לחלוטין.

### זמן משוער
שלב 1-4: יסודות (2-3 שעות)
שלב 5-8: מיגרציית entities (4-6 שעות)
שלב 9-12: מיגרציית functions (6-8 שעות)
שלב 13-14: בדיקות וסיום (2-3 שעות)

---

## 🏗️ ארכיטקטורה

### לפני המיגרציה
```
┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │  Base44 SDK │ ──────> Base44 Cloud
│   (React)   │         │  (external) │
└─────────────┘         └─────────────┘

┌─────────────┐
│   Backend   │  (לא בשימוש!)
│  (Express)  │
└─────────────┘
```

### אחרי המיגרציה
```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │  API Client │ ──────> │   Backend   │
│   (React)   │         │   (local)   │         │  (Express)  │
└─────────────┘         └─────────────┘         └─────────────┘
                                                       │
                                                       ▼
                                                ┌─────────────┐
                                                │  PostgreSQL │
                                                │   (Prisma)  │
                                                └─────────────┘
```

---

## 📁 קבצים מעורבים

### קבצים לשינוי
```
src/api/
├── base44Client.js    → למחוק (להחליף ב-apiClient.js)
├── apiClient.js       → ליצור חדש
├── entities.js        → לשכתב לחלוטין
├── functions.js       → לשכתב לחלוטין
└── integrations.js    → לבדוק אם נדרש
```

### קבצים לעדכון
```
src/pages/*.jsx        → לעדכן imports (51 קבצים)
vite.config.js         → להוסיף proxy configuration
package.json           → להסיר @base44/sdk
```

### קבצי Backend (לא לשנות, רק לעיון)
```
server/src/routes/
├── dashboard.ts       → GET /api/dashboard
├── reagents.ts        → CRUD /api/reagents
├── suppliers.ts       → CRUD /api/suppliers
├── orders.ts          → CRUD /api/orders
├── batches.ts         → CRUD /api/batches
└── inventory.ts       → CRUD /api/inventory
```

---

## ✅ בדיקות קדם-תנאי (לפני כל שלב)

### בדיקת Backend
```bash
# 1. וודא שה-Backend רץ
cd /home/user/Flow-Control/server
npm run dev

# 2. בדוק health endpoint
curl http://localhost:4000/api/health
# Expected: {"status":"ok","timestamp":"...","version":"1.0.0"}

# 3. בדוק dashboard endpoint
curl http://localhost:4000/api/dashboard
# Expected: JSON עם נתוני dashboard
```

### בדיקת Database
```bash
# וודא שהמסד נתונים רץ
docker ps | grep postgres
# אם לא רץ:
docker-compose up -d
```

### בדיקת Frontend
```bash
# 1. וודא שה-Frontend עולה
cd /home/user/Flow-Control
npm run dev

# 2. פתח בדפדפן
# http://localhost:5173
```

---

## 📝 שלב 1: הכנת Proxy Configuration

### 1.1 בדיקות מקדימות
- [ ] Backend רץ על port 4000
- [ ] Frontend רץ על port 5173
- [ ] `curl http://localhost:4000/api/health` מחזיר JSON

### 1.2 משימה: עדכון vite.config.js

**קובץ:** `/home/user/Flow-Control/vite.config.js`

**תוכן נוכחי:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
```

**תוכן חדש:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
```

### 1.3 בדיקה
```bash
# הפעל מחדש את Vite
npm run dev

# בדוק שה-proxy עובד
curl http://localhost:5173/api/health
# Expected: {"status":"ok",...}
```

---

## 📝 שלב 2: יצירת API Client חדש

### 2.1 בדיקות מקדימות
- [ ] שלב 1 הושלם בהצלחה
- [ ] Proxy עובד

### 2.2 משימה: יצירת apiClient.js

**קובץ חדש:** `/home/user/Flow-Control/src/api/apiClient.js`

```javascript
/**
 * API Client for Flow Control Backend
 * Replaces Base44 SDK with local Express backend calls
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Create an entity handler that mimics Base44 SDK interface
 * Base44 SDK pattern:
 *   entity.list() → GET /api/{entity}
 *   entity.get(id) → GET /api/{entity}/{id}
 *   entity.create(data) → POST /api/{entity}
 *   entity.update(id, data) → PUT /api/{entity}/{id}
 *   entity.delete(id) → DELETE /api/{entity}/{id}
 */
function createEntityHandler(entityPath) {
  return {
    async list(params = {}) {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = queryString ? `${entityPath}?${queryString}` : entityPath;
      return apiFetch(endpoint);
    },

    async get(id) {
      return apiFetch(`${entityPath}/${id}`);
    },

    async create(data) {
      return apiFetch(entityPath, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async update(id, data) {
      return apiFetch(`${entityPath}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    async delete(id) {
      return apiFetch(`${entityPath}/${id}`, {
        method: 'DELETE',
      });
    },

    // Alias for backward compatibility with Base44 SDK
    async filter(params = {}) {
      return this.list(params);
    },
  };
}

/**
 * Create a function handler that calls backend endpoints
 */
function createFunctionHandler(functionPath) {
  return async function(params = {}) {
    return apiFetch(functionPath, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  };
}

// ============================================================================
// ENTITIES
// ============================================================================

export const Reagent = createEntityHandler('/reagents');
export const Supplier = createEntityHandler('/suppliers');
export const SupplierContact = createEntityHandler('/suppliers/contacts');
export const Order = createEntityHandler('/orders');
export const OrderItem = createEntityHandler('/orders/items');
export const ReagentBatch = createEntityHandler('/batches');
export const InventoryCountDraft = createEntityHandler('/inventory/drafts');
export const CompletedInventoryCount = createEntityHandler('/inventory/completed');
export const InventoryTransaction = createEntityHandler('/inventory/transactions');
export const Delivery = createEntityHandler('/deliveries');
export const DeliveryItem = createEntityHandler('/deliveries/items');
export const WithdrawalRequest = createEntityHandler('/withdrawals');
export const WithdrawalItem = createEntityHandler('/withdrawals/items');
export const Shipment = createEntityHandler('/shipments');
export const ShipmentItem = createEntityHandler('/shipments/items');
export const FrameworkOrder = createEntityHandler('/framework-orders');
export const FrameworkOrderItem = createEntityHandler('/framework-orders/items');
export const ExpiredProductLog = createEntityHandler('/expired-products');
export const DashboardNote = createEntityHandler('/dashboard/notes');
export const SystemSettings = createEntityHandler('/settings');
export const AlertRule = createEntityHandler('/alerts/rules');
export const ActiveAlert = createEntityHandler('/alerts/active');
export const ScheduledReminder = createEntityHandler('/reminders');
export const ArchivedData = createEntityHandler('/archive/data');
export const ArchivedReport = createEntityHandler('/archive/reports');
export const DocumentationNote = createEntityHandler('/documentation');
export const ReagentCatalog = createEntityHandler('/catalog');

// ============================================================================
// FUNCTIONS (Backend API calls)
// ============================================================================

export async function getDashboardData() {
  return apiFetch('/dashboard');
}

export async function getManageReagentsData(params = {}) {
  return apiFetch('/reagents', {
    method: 'GET',
  });
}

export async function getOrdersData(params = {}) {
  return apiFetch('/orders');
}

export async function getDeliveriesData(params = {}) {
  return apiFetch('/deliveries');
}

export async function getWithdrawalRequestsData(params = {}) {
  return apiFetch('/withdrawals');
}

export async function getOutgoingShipmentsData(params = {}) {
  return apiFetch('/shipments');
}

export async function getManageSuppliersData(params = {}) {
  return apiFetch('/suppliers');
}

export async function getContactsData(params = {}) {
  return apiFetch('/suppliers/contacts');
}

export async function getBatchAndExpiryData(params = {}) {
  return apiFetch('/batches');
}

export async function getInventoryCountsHistoryData(params = {}) {
  return apiFetch('/inventory/history');
}

export async function getInventoryCountDraftData(id) {
  return apiFetch(`/inventory/drafts/${id}`);
}

export async function getSingleInventoryCountDetails(id) {
  return apiFetch(`/inventory/completed/${id}`);
}

export async function processCompletedCount(data) {
  return apiFetch('/inventory/drafts/complete', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function calculateReplenishment(params = {}) {
  return apiFetch('/inventory/replenishment', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getReplenishmentData(params = {}) {
  return apiFetch('/inventory/replenishment');
}

export async function createAutomaticOrder(data) {
  return apiFetch('/orders/automatic', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createAutomaticWithdrawal(data) {
  return apiFetch('/withdrawals/automatic', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getEditReagentData(id) {
  return apiFetch(`/reagents/${id}`);
}

export async function getEditReagentBatchData(id) {
  return apiFetch(`/batches/${id}`);
}

export async function getEditOrderData(id) {
  return apiFetch(`/orders/${id}`);
}

export async function getEditDeliveryData(id) {
  return apiFetch(`/deliveries/${id}`);
}

export async function getEditShipmentData(id) {
  return apiFetch(`/shipments/${id}`);
}

export async function getEditWithdrawalData(id) {
  return apiFetch(`/withdrawals/${id}`);
}

export async function getNewDeliveryPageData() {
  return apiFetch('/deliveries/new-page-data');
}

export async function getSupplyTrackingData(params = {}) {
  return apiFetch('/supply-tracking');
}

export async function getQualityAssuranceData(params = {}) {
  return apiFetch('/quality-assurance');
}

export async function getAdvancedAnalytics(params = {}) {
  return apiFetch('/analytics');
}

export async function getAggregatedActivityLog(params = {}) {
  return apiFetch('/activity-log');
}

export async function generateReports(params = {}) {
  return apiFetch('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function archiveOldData(params = {}) {
  return apiFetch('/archive', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function fixDataIntegrity(params = {}) {
  return apiFetch('/maintenance/fix-integrity', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function cleanupOperations(params = {}) {
  return apiFetch('/maintenance/cleanup', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function deleteReagent(id) {
  return apiFetch(`/reagents/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteShipment(id) {
  return apiFetch(`/shipments/${id}`, {
    method: 'DELETE',
  });
}

export async function deleteWithdrawal(id) {
  return apiFetch(`/withdrawals/${id}`, {
    method: 'DELETE',
  });
}

export async function changeReagentSupplier(data) {
  return apiFetch('/reagents/change-supplier', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateReagentInventory(data) {
  return apiFetch('/reagents/update-inventory', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function importInventoryCount(data) {
  return apiFetch('/inventory/import', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function manageCOA(action, data = {}) {
  return apiFetch('/coa/manage', {
    method: 'POST',
    body: JSON.stringify({ action, ...data }),
  });
}

export async function testCOAAccess(params = {}) {
  return apiFetch('/coa/test-access', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function exportAllCoas(params = {}) {
  return apiFetch('/coa/export-all', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function manageCatalog(action, data = {}) {
  return apiFetch('/catalog/manage', {
    method: 'POST',
    body: JSON.stringify({ action, ...data }),
  });
}

export async function uploadCatalogFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/catalog/upload', {
    method: 'POST',
    body: formData,
    headers: {}, // Let browser set Content-Type for FormData
  });
}

export async function uploadContactsFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/contacts/upload', {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export async function alertsEngine(action, params = {}) {
  return apiFetch('/alerts/engine', {
    method: 'POST',
    body: JSON.stringify({ action, ...params }),
  });
}

export async function alertsManager(action, params = {}) {
  return apiFetch('/alerts/manager', {
    method: 'POST',
    body: JSON.stringify({ action, ...params }),
  });
}

export async function calculateAverageUsage(params = {}) {
  return apiFetch('/analytics/usage', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function checkPendingWithdrawals(params = {}) {
  return apiFetch('/withdrawals/check-pending');
}

export async function createAnnualReminders(params = {}) {
  return apiFetch('/reminders/annual', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function runSummaryUpdates(params = {}) {
  return apiFetch('/maintenance/summary-updates', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function exportAllDocumentation(params = {}) {
  return apiFetch('/documentation/export-all', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getProcessingProgress(taskId) {
  return apiFetch(`/tasks/${taskId}/progress`);
}

// Legacy functions - may need backend implementation
export async function getReagentsForHospital(hospitalId) {
  return apiFetch(`/hospitals/${hospitalId}/reagents`);
}

export async function getOrdersForHospital(hospitalId) {
  return apiFetch(`/hospitals/${hospitalId}/orders`);
}

export async function migrateToHybridCatalog(params = {}) {
  return apiFetch('/catalog/migrate-hybrid', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function importGlobalCatalogToLocal(params = {}) {
  return apiFetch('/catalog/import-global', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function restoreGlobalCatalog(params = {}) {
  return apiFetch('/catalog/restore-global', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function restoreGlobalCatalogFromLocal(params = {}) {
  return apiFetch('/catalog/restore-from-local', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function migrateLegacySuppliers(params = {}) {
  return apiFetch('/suppliers/migrate-legacy', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ============================================================================
// AUTH (Placeholder - needs JWT implementation)
// ============================================================================

export const User = {
  async me() {
    return apiFetch('/auth/me');
  },

  async login(credentials) {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async logout() {
    return apiFetch('/auth/logout', {
      method: 'POST',
    });
  },

  async register(userData) {
    return apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Placeholder for Base44 compatibility
  isLoggedIn: () => true, // TODO: Implement proper check
};

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

// This mimics the base44 client interface for gradual migration
export const api = {
  entities: {
    Reagent,
    Supplier,
    SupplierContact,
    Order,
    OrderItem,
    ReagentBatch,
    InventoryCountDraft,
    CompletedInventoryCount,
    InventoryTransaction,
    Delivery,
    DeliveryItem,
    WithdrawalRequest,
    WithdrawalItem,
    Shipment,
    ShipmentItem,
    FrameworkOrder,
    FrameworkOrderItem,
    ExpiredProductLog,
    DashboardNote,
    SystemSettings,
    AlertRule,
    ActiveAlert,
    ScheduledReminder,
    ArchivedData,
    ArchivedReport,
    DocumentationNote,
    ReagentCatalog,
  },
  functions: {
    getDashboardData,
    getManageReagentsData,
    getOrdersData,
    getDeliveriesData,
    getWithdrawalRequestsData,
    getOutgoingShipmentsData,
    getManageSuppliersData,
    getContactsData,
    getBatchAndExpiryData,
    getInventoryCountsHistoryData,
    processCompletedCount,
    calculateReplenishment,
    getReplenishmentData,
    createAutomaticOrder,
    createAutomaticWithdrawal,
    getEditReagentData,
    getEditReagentBatchData,
    getEditOrderData,
    getEditDeliveryData,
    getEditShipmentData,
    getEditWithdrawalData,
    getNewDeliveryPageData,
    getSupplyTrackingData,
    getQualityAssuranceData,
    getAdvancedAnalytics,
    getAggregatedActivityLog,
    generateReports,
    archiveOldData,
    fixDataIntegrity,
    cleanupOperations,
    deleteReagent,
    deleteShipment,
    deleteWithdrawal,
    changeReagentSupplier,
    updateReagentInventory,
    importInventoryCount,
    manageCOA,
    testCOAAccess,
    exportAllCoas,
    manageCatalog,
    uploadCatalogFile,
    uploadContactsFile,
    alertsEngine,
    alertsManager,
    calculateAverageUsage,
    checkPendingWithdrawals,
    createAnnualReminders,
    runSummaryUpdates,
    exportAllDocumentation,
    getProcessingProgress,
    getReagentsForHospital,
    getOrdersForHospital,
    migrateToHybridCatalog,
    importGlobalCatalogToLocal,
    restoreGlobalCatalog,
    restoreGlobalCatalogFromLocal,
    migrateLegacySuppliers,
  },
  auth: User,
};

export default api;
```

### 2.3 בדיקה
```javascript
// בקונסול הדפדפן
import { getDashboardData } from '@/api/apiClient';
const data = await getDashboardData();
console.log(data);
```

---

## 📝 שלב 3: עדכון entities.js

### 3.1 בדיקות מקדימות
- [ ] שלב 2 הושלם בהצלחה
- [ ] apiClient.js נוצר

### 3.2 משימה: שכתוב entities.js

**קובץ:** `/home/user/Flow-Control/src/api/entities.js`

**תוכן חדש:**
```javascript
/**
 * Entity Exports - Using Local API Client
 * This file replaces Base44 SDK entities with local API calls
 */

export {
  Reagent,
  Supplier,
  SupplierContact,
  Order,
  OrderItem,
  ReagentBatch,
  InventoryCountDraft,
  CompletedInventoryCount,
  InventoryTransaction,
  Delivery,
  DeliveryItem,
  WithdrawalRequest,
  WithdrawalItem,
  Shipment,
  ShipmentItem,
  FrameworkOrder,
  FrameworkOrderItem,
  ExpiredProductLog,
  DashboardNote,
  SystemSettings,
  AlertRule,
  ActiveAlert,
  ScheduledReminder,
  ArchivedData,
  ArchivedReport,
  DocumentationNote,
  ReagentCatalog,
  User,
} from './apiClient';

// Legacy export for backward compatibility
export { ReagentCatalog as ReagentReceiptEvent } from './apiClient';
export { DocumentationNote as FeatureDocumentation } from './apiClient';
```

---

## 📝 שלב 4: עדכון functions.js

### 4.1 בדיקות מקדימות
- [ ] שלב 3 הושלם בהצלחה
- [ ] entities.js מעודכן

### 4.2 משימה: שכתוב functions.js

**קובץ:** `/home/user/Flow-Control/src/api/functions.js`

**תוכן חדש:**
```javascript
/**
 * Function Exports - Using Local API Client
 * This file replaces Base44 SDK functions with local API calls
 */

export {
  // Dashboard & Data Fetching
  getDashboardData,
  getManageReagentsData,
  getOrdersData,
  getDeliveriesData,
  getWithdrawalRequestsData,
  getOutgoingShipmentsData,
  getManageSuppliersData,
  getContactsData,
  getBatchAndExpiryData,

  // Inventory
  getInventoryCountsHistoryData,
  getInventoryCountDraftData,
  getSingleInventoryCountDetails,
  processCompletedCount,
  calculateReplenishment,
  getReplenishmentData,
  importInventoryCount,
  updateReagentInventory,

  // Orders & Withdrawals
  createAutomaticOrder,
  createAutomaticWithdrawal,
  checkPendingWithdrawals,

  // Edit Page Data
  getEditReagentData,
  getEditReagentBatchData,
  getEditOrderData,
  getEditDeliveryData,
  getEditShipmentData,
  getEditWithdrawalData,
  getNewDeliveryPageData,

  // Analytics & Reports
  getSupplyTrackingData,
  getQualityAssuranceData,
  getAdvancedAnalytics,
  getAggregatedActivityLog,
  generateReports,
  calculateAverageUsage,
  getProcessingProgress,

  // Maintenance & Cleanup
  archiveOldData,
  fixDataIntegrity,
  cleanupOperations,
  runSummaryUpdates,

  // Delete Operations
  deleteReagent,
  deleteShipment,
  deleteWithdrawal,

  // Supplier & Reagent Management
  changeReagentSupplier,
  migrateLegacySuppliers,

  // COA Management
  manageCOA,
  testCOAAccess,
  exportAllCoas,

  // Catalog Management
  manageCatalog,
  uploadCatalogFile,
  uploadContactsFile,
  migrateToHybridCatalog,
  importGlobalCatalogToLocal,
  restoreGlobalCatalog,
  restoreGlobalCatalogFromLocal,

  // Alerts & Reminders
  alertsEngine,
  alertsManager,
  createAnnualReminders,

  // Hospital-specific (legacy)
  getReagentsForHospital,
  getOrdersForHospital,

  // Documentation
  exportAllDocumentation,
} from './apiClient';
```

---

## 📝 שלב 5: מחיקת Base44 Client

### 5.1 בדיקות מקדימות
- [ ] שלבים 3-4 הושלמו בהצלחה
- [ ] האפליקציה עדיין עולה (עם שגיאות צפויות)

### 5.2 משימה: מחיקה/שינוי base44Client.js

**קובץ:** `/home/user/Flow-Control/src/api/base44Client.js`

**אפשרות א' - מחיקה:**
```bash
rm /home/user/Flow-Control/src/api/base44Client.js
```

**אפשרות ב' - שמירה כ-redirect (מומלץ בשלב ראשון):**
```javascript
/**
 * DEPRECATED: Base44 Client
 * This file now redirects to the local API client
 * Keep for backward compatibility during migration
 */

import api from './apiClient';

// Re-export as base44 for backward compatibility
export const base44 = api;

export default api;
```

---

## 📝 שלב 6: עדכון imports בדפי React

### 6.1 רשימת דפים לעדכון

הדפים שמייבאים `base44Client` ישירות:

```
src/pages/Dashboard.jsx          ← import { base44 } from "@/api/base44Client"
src/pages/ManageReagents.jsx     ← import { base44 } from '@/api/base44Client'
src/pages/Orders.jsx             ← (לבדוק)
src/pages/Deliveries.jsx         ← (לבדוק)
...
```

### 6.2 משימה: עדכון כל הדפים

**דפוס החלפה:**

**לפני:**
```javascript
import { base44 } from "@/api/base44Client";

// בתוך הקוד:
const data = await base44.functions.getDashboardData();
const reagents = await base44.entities.Reagent.list();
```

**אחרי:**
```javascript
import { getDashboardData, Reagent } from "@/api/apiClient";

// בתוך הקוד:
const data = await getDashboardData();
const reagents = await Reagent.list();
```

### 6.3 סקריפט עזר למציאת כל ה-imports

```bash
# מצא את כל הקבצים שמייבאים מ-base44Client
grep -r "base44Client" src/pages/ --include="*.jsx" -l

# מצא את כל השימושים ב-base44.
grep -r "base44\." src/pages/ --include="*.jsx"
```

### 6.4 רשימת בדיקה לכל דף

לכל דף יש לבצע:
1. [ ] שנה את ה-import
2. [ ] החלף `base44.entities.X` ב-`X` (ישירות)
3. [ ] החלף `base44.functions.X` ב-`X` (ישירות)
4. [ ] החלף `base44.auth` ב-`User`
5. [ ] בדוק שהדף עולה ללא שגיאות
6. [ ] בדוק שהפונקציונליות עובדת

---

## 📝 שלב 7: עדכון package.json

### 7.1 בדיקות מקדימות
- [ ] כל הדפים עודכנו
- [ ] אין שימוש ב-`@base44/sdk` בקוד

### 7.2 משימה: הסרת Base44 SDK

**קובץ:** `/home/user/Flow-Control/package.json`

**הסר את השורה:**
```json
"@base44/sdk": "^0.1.2",
```

**הרץ:**
```bash
npm uninstall @base44/sdk
npm install
```

### 7.3 בדיקה
```bash
# וודא שאין תלות ב-base44
grep -r "@base44" node_modules/ 2>/dev/null | head -5
# Expected: אין תוצאות
```

---

## 📝 שלב 8: הוספת endpoints חסרים ל-Backend

### 8.1 זיהוי endpoints חסרים

הרשימה הבאה מציגה functions שקיימות ב-frontend אך ייתכן שחסרות ב-backend:

**endpoints קיימים:**
- ✅ `/api/dashboard` - getDashboardData
- ✅ `/api/reagents` - CRUD
- ✅ `/api/suppliers` - CRUD
- ✅ `/api/orders` - CRUD
- ✅ `/api/batches` - CRUD
- ✅ `/api/inventory` - CRUD

**endpoints שצריך להוסיף:**
- ❌ `/api/deliveries` - CRUD
- ❌ `/api/withdrawals` - CRUD
- ❌ `/api/shipments` - CRUD
- ❌ `/api/alerts` - rules/active
- ❌ `/api/analytics` - getAdvancedAnalytics
- ❌ `/api/activity-log` - getAggregatedActivityLog
- ❌ `/api/reports` - generateReports
- ❌ `/api/coa` - manage/test/export
- ❌ `/api/catalog` - manage/upload
- ❌ `/api/auth` - login/logout/me

### 8.2 תבנית להוספת route חדש

**יצירת קובץ חדש:** `/home/user/Flow-Control/server/src/routes/deliveries.ts`

```typescript
import { Router } from 'express';
// import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/deliveries - List all deliveries
router.get('/', async (req, res, next) => {
  try {
    // TODO: Implement with Prisma
    res.json({ message: 'Deliveries list - TODO' });
  } catch (error) {
    next(error);
  }
});

// GET /api/deliveries/:id - Get single delivery
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement with Prisma
    res.json({ message: `Delivery ${id} - TODO` });
  } catch (error) {
    next(error);
  }
});

// POST /api/deliveries - Create delivery
router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    // TODO: Implement with Prisma
    res.status(201).json({ message: 'Created - TODO', data });
  } catch (error) {
    next(error);
  }
});

// PUT /api/deliveries/:id - Update delivery
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    // TODO: Implement with Prisma
    res.json({ message: `Updated ${id} - TODO`, data });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/deliveries/:id - Delete delivery
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // TODO: Implement with Prisma
    res.json({ message: `Deleted ${id} - TODO` });
  } catch (error) {
    next(error);
  }
});

export default router;
```

**עדכון index.ts:**
```typescript
import deliveriesRoutes from './deliveries';
// ...
router.use('/deliveries', deliveriesRoutes);
```

---

## 📝 שלב 9: בדיקות מקיפות

### 9.1 בדיקות יחידה (Unit Tests)

```bash
# יצירת תיקיית tests
mkdir -p /home/user/Flow-Control/src/__tests__

# יצירת קובץ בדיקה ל-apiClient
cat > /home/user/Flow-Control/src/__tests__/apiClient.test.js << 'EOF'
import { getDashboardData, Reagent, Supplier } from '../api/apiClient';

describe('API Client', () => {
  describe('getDashboardData', () => {
    test('should return dashboard data', async () => {
      const data = await getDashboardData();
      expect(data).toBeDefined();
      expect(data.status).toBe('ok');
    });
  });

  describe('Reagent entity', () => {
    test('should have list method', () => {
      expect(typeof Reagent.list).toBe('function');
    });

    test('should have create method', () => {
      expect(typeof Reagent.create).toBe('function');
    });
  });
});
EOF
```

### 9.2 בדיקות אינטגרציה

**רשימת בדיקות ידניות:**

| דף | בדיקה | סטטוס |
|----|-------|-------|
| Dashboard | טעינת נתונים | ⬜ |
| Dashboard | הצגת התראות | ⬜ |
| ManageReagents | רשימת ריאגנטים | ⬜ |
| ManageReagents | סינון וחיפוש | ⬜ |
| NewReagent | יצירת ריאגנט חדש | ⬜ |
| EditReagent | עריכת ריאגנט | ⬜ |
| Orders | רשימת הזמנות | ⬜ |
| NewOrder | יצירת הזמנה | ⬜ |
| Deliveries | רשימת משלוחים | ⬜ |
| Suppliers | רשימת ספקים | ⬜ |
| InventoryCount | ספירת מלאי | ⬜ |

### 9.3 בדיקות E2E (End-to-End)

**תרחיש 1: יצירת ריאגנט חדש**
1. [ ] נווט ל-ManageReagents
2. [ ] לחץ "ריאגנט חדש"
3. [ ] מלא את הטופס
4. [ ] שמור
5. [ ] וודא שהריאגנט מופיע ברשימה

**תרחיש 2: יצירת הזמנה**
1. [ ] נווט ל-Orders
2. [ ] לחץ "הזמנה חדשה"
3. [ ] בחר ריאגנטים
4. [ ] שמור
5. [ ] וודא שההזמנה מופיעה ברשימה

**תרחיש 3: קליטת משלוח**
1. [ ] נווט ל-Deliveries
2. [ ] לחץ "משלוח חדש"
3. [ ] הוסף פריטים
4. [ ] שמור
5. [ ] וודא שהמלאי עודכן

---

## 📝 שלב 10: טיפול בשגיאות

### 10.1 שגיאות נפוצות ופתרונות

**שגיאה 1: CORS Error**
```
Access to fetch at 'http://localhost:4000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**פתרון:** וודא שה-proxy ב-vite.config.js מוגדר נכון

**שגיאה 2: 404 Not Found**
```
GET http://localhost:5173/api/deliveries 404 (Not Found)
```
**פתרון:** הוסף את ה-route החסר ב-backend

**שגיאה 3: Network Error**
```
TypeError: Failed to fetch
```
**פתרון:** וודא שה-backend רץ (`npm run dev` בתיקיית server)

**שגיאה 4: Prisma Client Error**
```
PrismaClientInitializationError
```
**פתרון:** הרץ `npx prisma generate` ו-`npx prisma migrate dev`

### 10.2 Fallback Pattern

עבור endpoints שעדיין לא מומשו, השתמש ב-fallback:

```javascript
export async function getDeliveriesData() {
  try {
    return await apiFetch('/deliveries');
  } catch (error) {
    console.warn('Deliveries API not available, returning empty array');
    return [];
  }
}
```

---

## 📝 שלב 11: עדכון README

### 11.1 משימה: עדכון README.md

**עדכן את הסטטוס:**
```markdown
## Project Status

| Component | Status | Notes |
|-----------|--------|-------|
| Database Schema | ✅ Complete | 27 tables, 16 enums |
| SQL Migration | ✅ Complete | PostgreSQL 16 |
| Backend API | ✅ Complete | Express 5.1 + TypeScript |
| Services Layer | ✅ Complete | 6 services |
| API Routes | ✅ Complete | RESTful endpoints |
| Prisma ORM | ✅ Complete | Generated and working |
| Frontend | ✅ Complete | React + Vite, 51 pages |
| API Integration | ✅ Complete | Local API Client |
| Authentication | ⚠️ Pending | JWT planned |
```

---

## 📝 שלב 12: הכנה ל-Production

### 12.1 Environment Variables

**יצירת .env.production:**
```bash
# Backend
DATABASE_URL="postgresql://user:password@host:5432/flow_control"
PORT=4000
NODE_ENV=production

# Frontend (in vite)
VITE_API_URL=https://your-domain.com/api
```

### 12.2 Build Scripts

```bash
# Frontend build
cd /home/user/Flow-Control
npm run build

# Backend build
cd server
npm run build
```

### 12.3 Docker Configuration

**עדכון docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: flow_control
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./server
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/flow_control
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 📋 רשימת בדיקות סופית

### לפני Push לייצור

- [ ] כל הדפים עולים ללא שגיאות
- [ ] Dashboard מציג נתונים
- [ ] CRUD לריאגנטים עובד
- [ ] CRUD לספקים עובד
- [ ] CRUD להזמנות עובד
- [ ] CRUD למשלוחים עובד
- [ ] ספירת מלאי עובדת
- [ ] אין שימוש ב-Base44 SDK
- [ ] אין שגיאות בקונסול
- [ ] Build עובד ללא שגיאות
- [ ] README מעודכן
- [ ] .gitignore מעודכן

---

## 🚀 סיכום

### סדר ביצוע מומלץ

1. **שלב 1:** Proxy Configuration ← **התחל כאן**
2. **שלב 2:** יצירת apiClient.js
3. **שלב 3:** עדכון entities.js
4. **שלב 4:** עדכון functions.js
5. **שלב 5:** מחיקת/שינוי base44Client.js
6. **שלב 6:** עדכון imports בדפים (הכי ארוך!)
7. **שלב 7:** הסרת @base44/sdk
8. **שלב 8:** הוספת endpoints חסרים
9. **שלב 9:** בדיקות מקיפות
10. **שלב 10:** טיפול בשגיאות
11. **שלב 11:** עדכון README
12. **שלב 12:** הכנה ל-Production

### טיפים חשובים

1. **עבוד בשלבים קטנים** - בצע commit אחרי כל שלב
2. **בדוק אחרי כל שינוי** - אל תצבור שינויים
3. **שמור גיבוי** - לפני שינויים גדולים
4. **תעד בעיות** - רשום שגיאות ופתרונות

### פקודות שימושיות

```bash
# הפעלת הכל
cd /home/user/Flow-Control
docker-compose up -d          # Database
cd server && npm run dev &    # Backend
cd .. && npm run dev          # Frontend

# בדיקת API
curl http://localhost:4000/api/health
curl http://localhost:5173/api/health  # Through proxy

# חיפוש שימושים ב-base44
grep -r "base44" src/ --include="*.jsx" --include="*.js"

# Build
npm run build
cd server && npm run build
```

---

**מסמך זה הוכן לשימוש עם Claude Sonnet**
**תאריך:** December 2025
**גרסה:** 1.0
