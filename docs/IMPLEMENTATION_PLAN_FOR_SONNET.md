# Flow-Control: תוכנית מעבר לעצמאות מלאה
## מדריך ביצוע מפורט ל-Claude Sonnet

**מטרה:** להפוך את המערכת לעצמאית לחלוטין ולפרוס על Hostinger
**מצב נוכחי:** Frontend משתמש ב-base44 SDK (שרת ענן חיצוני)
**מצב יעד:** Backend מקומי מלא + פריסה על Hostinger VPS

---

# 📋 סקירת המשימות

```
Phase 1: הכנת תשתית Backend           (משימות 1-3)
Phase 2: החלפת base44 ב-API מקומי     (משימות 4-6)
Phase 3: השלמת Routes חסרים          (משימות 7-12)
Phase 4: Authentication מלא          (משימות 13-16)
Phase 5: Security & Production       (משימות 17-19)
Phase 6: פריסה על Hostinger          (משימות 20-23)
```

---

# Phase 1: הכנת תשתית Backend

## משימה 1: הגדרת Environment Variables

### 1.1 עדכן `server/.env.example`

```bash
# ===========================================
# Flow-Control Server Configuration
# ===========================================

# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/flow_control"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:5173

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
```

### 1.2 צור `server/.env` (העתק מ-.env.example ועדכן)

---

## משימה 2: עדכון Prisma Schema - הוספת Password ל-User

### 2.1 ערוך `server/prisma/schema.prisma`

מצא את model User (בסביבות שורה 887) ועדכן:

```prisma
/// משתמש
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  password      String    // ← הוסף שורה זו!
  role          UserRole  @default(USER)

  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?

  // Refresh tokens for secure logout
  refreshToken  String?   // ← הוסף שורה זו!

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([email])
  @@index([role])
  @@index([isActive])
}
```

### 2.2 הרץ Migration

```bash
cd server
npx prisma generate
npx prisma migrate dev --name add_user_password
```

---

## משימה 3: התקנת Dependencies חדשים

### 3.1 Backend Dependencies

```bash
cd server
npm install bcryptjs jsonwebtoken helmet express-rate-limit multer uuid
npm install -D @types/bcryptjs @types/jsonwebtoken @types/multer @types/uuid
```

### 3.2 צור תיקיית uploads

```bash
mkdir -p server/uploads
echo "uploads/*" >> server/.gitignore
echo "!uploads/.gitkeep" >> server/.gitignore
touch server/uploads/.gitkeep
```

---

# Phase 2: החלפת base44 ב-API מקומי

## משימה 4: יצירת API Client חדש

### 4.1 צור `src/api/client.js`

```javascript
/**
 * Flow-Control API Client
 * מחליף את base44 SDK בקריאות ישירות לבקנד המקומי
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  getToken() {
    return localStorage.getItem('authToken');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // הוסף Authorization header אם יש token
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    // המר body ל-JSON אם צריך
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || 'Request failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        error.message || 'Network error',
        0,
        null
      );
    }
  }

  // GET request
  get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  }

  // PUT request
  put(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  // PATCH request
  patch(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  // DELETE request
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // File upload
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData();
    formData.append('file', file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const token = this.getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status, data);
    }

    return data;
  }
}

// יצוא singleton
export const api = new ApiClient();
export { ApiError };
```

---

## משימה 5: החלפת entities.js

### 5.1 החלף את תוכן `src/api/entities.js`

```javascript
/**
 * Flow-Control Entities
 * מחליף את base44.entities בקריאות לבקנד המקומי
 */

import { api } from './client';

// ===== Entity Factory =====
function createEntity(resourceName) {
  return {
    // רשימת כל הרשומות
    list: async (params = {}) => {
      const response = await api.get(`/${resourceName}`, params);
      return response.data || [];
    },

    // רשומה בודדת לפי ID
    get: async (id) => {
      const response = await api.get(`/${resourceName}/${id}`);
      return response.data;
    },

    // יצירת רשומה חדשה
    create: async (data) => {
      const response = await api.post(`/${resourceName}`, data);
      return response.data;
    },

    // עדכון רשומה
    update: async (id, data) => {
      const response = await api.put(`/${resourceName}/${id}`, data);
      return response.data;
    },

    // מחיקת רשומה
    delete: async (id) => {
      const response = await api.delete(`/${resourceName}/${id}`);
      return response.data;
    },

    // פילטור מתקדם
    filter: async (filters) => {
      const response = await api.get(`/${resourceName}`, filters);
      return response.data || [];
    },
  };
}

// ===== Core Entities =====
export const Reagent = createEntity('reagents');
export const ReagentBatch = createEntity('batches');
export const Supplier = createEntity('suppliers');
export const SupplierContact = createEntity('contacts');

// ===== Orders & Procurement =====
export const Order = createEntity('orders');
export const OrderItem = createEntity('order-items');
export const FrameworkOrder = createEntity('framework-orders');
export const FrameworkOrderItem = createEntity('framework-order-items');
export const WithdrawalRequest = createEntity('withdrawals');
export const WithdrawalItem = createEntity('withdrawal-items');

// ===== Deliveries & Shipments =====
export const Delivery = createEntity('deliveries');
export const DeliveryItem = createEntity('delivery-items');
export const Shipment = createEntity('shipments');
export const ShipmentItem = createEntity('shipment-items');

// ===== Inventory =====
export const InventoryTransaction = createEntity('inventory-transactions');
export const InventoryCountDraft = createEntity('inventory-drafts');
export const CompletedInventoryCount = createEntity('inventory-counts');
export const ExpiredProductLog = createEntity('expired-products');

// ===== Alerts & Notifications =====
export const AlertRule = createEntity('alert-rules');
export const ActiveAlert = createEntity('alerts');
export const ScheduledReminder = createEntity('reminders');
export const DashboardNote = createEntity('notes');

// ===== System =====
export const SystemSettings = createEntity('settings');
export const ArchivedReport = createEntity('archived-reports');
export const ArchivedData = createEntity('archived-data');
export const DocumentationNote = createEntity('documentation');
export const FeatureDocumentation = createEntity('features');
export const ActivityLog = createEntity('activity-log');

// ===== Legacy/Compatibility =====
export const ReagentCatalog = createEntity('reagent-catalog');
export const ReagentReceiptEvent = createEntity('receipt-events');

// ===== User & Auth (Special) =====
export const User = {
  // קבלת פרטי המשתמש המחובר
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // התחברות
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      api.setToken(response.data.token);
    }
    return response.data;
  },

  // הרשמה
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // התנתקות
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore errors
    }
    api.setToken(null);
  },

  // עדכון פרופיל
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // שינוי סיסמה
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // בדיקה אם מחובר
  isAuthenticated: () => {
    return !!api.getToken();
  },
};
```

---

## משימה 6: החלפת functions.js

### 6.1 החלף את תוכן `src/api/functions.js`

```javascript
/**
 * Flow-Control API Functions
 * מחליף את base44.functions בקריאות לבקנד המקומי
 */

import { api } from './client';

// ===== Dashboard =====
export const getDashboardData = () => api.get('/dashboard');
export const getDashboardStats = () => api.get('/dashboard/stats');

// ===== Reagents =====
export const getManageReagentsData = () => api.get('/reagents/manage');
export const getEditReagentData = (id) => api.get(`/reagents/${id}/edit`);
export const deleteReagent = (id) => api.delete(`/reagents/${id}`);
export const changeReagentSupplier = (id, supplierId) =>
  api.post(`/reagents/${id}/change-supplier`, { supplierId });

// ===== Batches =====
export const getEditReagentBatchData = (id) => api.get(`/batches/${id}/edit`);
export const getBatchAndExpiryData = () => api.get('/batches/expiry-management');

// ===== Suppliers =====
export const getManageSuppliersData = () => api.get('/suppliers/manage');
export const getContactsData = () => api.get('/contacts');
export const migrateLegacySuppliers = () => api.post('/suppliers/migrate-legacy');

// ===== Orders =====
export const getOrdersData = (params) => api.get('/orders', params);
export const getOrdersForHospital = () => api.get('/orders/hospital');
export const createAutomaticOrder = (data) => api.post('/orders/automatic', data);

// ===== Deliveries =====
export const getDeliveriesData = (params) => api.get('/deliveries', params);
export const getEditDeliveryData = (id) => api.get(`/deliveries/${id}/edit`);
export const getNewDeliveryPageData = () => api.get('/deliveries/new-page-data');

// ===== Withdrawals =====
export const getWithdrawalRequestsData = (params) => api.get('/withdrawals', params);
export const getEditWithdrawalData = (id) => api.get(`/withdrawals/${id}/edit`);
export const deleteWithdrawal = (id) => api.delete(`/withdrawals/${id}`);
export const createAutomaticWithdrawal = (data) => api.post('/withdrawals/automatic', data);
export const checkPendingWithdrawals = () => api.get('/withdrawals/pending');

// ===== Shipments =====
export const getOutgoingShipmentsData = (params) => api.get('/shipments', params);
export const getEditShipmentData = (id) => api.get(`/shipments/${id}/edit`);
export const deleteShipment = (id) => api.delete(`/shipments/${id}`);

// ===== Supply Tracking =====
export const getSupplyTrackingData = () => api.get('/supply-tracking');

// ===== Inventory =====
export const getInventoryCountDraftData = () => api.get('/inventory/drafts');
export const getInventoryCountsHistoryData = () => api.get('/inventory/history');
export const getSingleInventoryCountDetails = (id) => api.get(`/inventory/counts/${id}`);
export const processCompletedCount = (data) => api.post('/inventory/process-count', data);
export const importInventoryCount = (data) => api.post('/inventory/import', data);
export const updateReagentInventory = (id, data) => api.put(`/reagents/${id}/inventory`, data);

// ===== Replenishment =====
export const getReplenishmentData = () => api.get('/replenishment');
export const calculateReplenishment = () => api.post('/replenishment/calculate');

// ===== Quality Assurance =====
export const getQualityAssuranceData = () => api.get('/quality-assurance');

// ===== Activity & Logs =====
export const getAggregatedActivityLog = (params) => api.get('/activity-log', params);

// ===== Reports =====
export const generateReports = (type, params) => api.post(`/reports/${type}`, params);
export const getAdvancedAnalytics = () => api.get('/reports/analytics');

// ===== Alerts =====
export const alertsEngine = {
  run: () => api.post('/alerts/engine/run'),
  getStatus: () => api.get('/alerts/engine/status'),
};
export const alertsManager = {
  getAll: () => api.get('/alerts'),
  dismiss: (id) => api.post(`/alerts/${id}/dismiss`),
  resolve: (id, notes) => api.post(`/alerts/${id}/resolve`, { notes }),
};

// ===== COA (Certificate of Analysis) =====
export const manageCOA = {
  upload: (batchId, file) => api.uploadFile(`/batches/${batchId}/coa`, file),
  get: (batchId) => api.get(`/batches/${batchId}/coa`),
  delete: (batchId) => api.delete(`/batches/${batchId}/coa`),
};
export const testCOAAccess = (url) => api.post('/coa/test-access', { url });
export const exportAllCoas = () => api.get('/coa/export-all');

// ===== File Upload =====
export const uploadContactsFile = (file) => api.uploadFile('/contacts/import', file);
export const uploadCatalogFile = (file) => api.uploadFile('/catalog/import', file);

// ===== Catalog Management =====
export const manageCatalog = {
  get: () => api.get('/catalog'),
  update: (data) => api.put('/catalog', data),
};
export const importGlobalCatalogToLocal = () => api.post('/catalog/import-global');
export const restoreGlobalCatalog = () => api.post('/catalog/restore-global');
export const restoreGlobalCatalogFromLocal = () => api.post('/catalog/restore-from-local');
export const getReagentsForHospital = () => api.get('/catalog/hospital-reagents');
export const migrateToHybridCatalog = () => api.post('/catalog/migrate-hybrid');

// ===== System Management =====
export const cleanupOperations = {
  run: (type) => api.post('/system/cleanup', { type }),
  getStatus: () => api.get('/system/cleanup/status'),
};
export const createAnnualReminders = () => api.post('/system/annual-reminders');
export const archiveOldData = (options) => api.post('/system/archive', options);
export const fixDataIntegrity = () => api.post('/system/fix-integrity');
export const runSummaryUpdates = () => api.post('/system/summary-updates');
export const getProcessingProgress = () => api.get('/system/processing-progress');

// ===== Usage & Statistics =====
export const calculateAverageUsage = () => api.post('/usage/calculate-average');

// ===== Documentation =====
export const exportAllDocumentation = () => api.get('/documentation/export');
```

---

## משימה 6.2: עדכן integrations.js

### החלף את תוכן `src/api/integrations.js`

```javascript
/**
 * Flow-Control Integrations
 * מחליף את base44.integrations בקריאות לבקנד המקומי
 */

import { api } from './client';

/**
 * Upload a file to the server
 * @param {Object} options - Upload options
 * @param {File} options.file - The file to upload
 * @param {string} [options.type] - File type category
 * @returns {Promise<{url: string, filename: string}>}
 */
export const UploadFile = async ({ file, type = 'general' }) => {
  const response = await api.uploadFile('/files/upload', file, { type });
  return response.data;
};

/**
 * Get file by ID or path
 * @param {string} fileId - File identifier
 * @returns {Promise<{url: string, metadata: Object}>}
 */
export const GetFile = async (fileId) => {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
};

/**
 * Delete a file
 * @param {string} fileId - File identifier
 */
export const DeleteFile = async (fileId) => {
  await api.delete(`/files/${fileId}`);
};

/**
 * Send email notification (if email service configured)
 * @param {Object} options - Email options
 */
export const SendEmail = async ({ to, subject, body, attachments = [] }) => {
  const response = await api.post('/notifications/email', {
    to,
    subject,
    body,
    attachments,
  });
  return response.data;
};
```

---

## משימה 6.3: מחק את base44Client.js

```bash
# אפשר למחוק או להשאיר כקובץ ריק לגיבוי
mv src/api/base44Client.js src/api/base44Client.js.backup
```

### או צור קובץ ריק עם הערה:

```javascript
/**
 * @deprecated This file is no longer used.
 * The application now uses the local API client (./client.js)
 * instead of the base44 SDK.
 *
 * This file is kept for reference only.
 */

console.warn('base44Client.js is deprecated. Use ./client.js instead.');

export const base44 = null;
```

---

## משימה 6.4: עדכן את Frontend .env

### צור/עדכן `.env` בתיקייה הראשית

```bash
# API Configuration
VITE_API_URL=http://localhost:4000/api

# App Configuration
VITE_APP_NAME=Flow-Control
VITE_APP_VERSION=1.0.0
```

### צור `.env.example`

```bash
# API Configuration
VITE_API_URL=http://localhost:4000/api

# App Configuration
VITE_APP_NAME=Flow-Control
VITE_APP_VERSION=1.0.0
```

---

# Phase 3: השלמת Routes חסרים

## משימה 7: יצירת Auth Routes

### צור `server/src/routes/auth.ts`

```typescript
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * POST /api/auth/register
 * הרשמת משתמש חדש
 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  // בדוק אם המייל קיים
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already registered', 400);
  }

  // הצפן סיסמה
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // צור משתמש
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: role || 'USER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    success: true,
    data: user,
    message: 'User registered successfully',
  });
}));

/**
 * POST /api/auth/login
 * התחברות
 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // מצא משתמש
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is disabled', 403);
  }

  // בדוק סיסמה
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Invalid credentials', 401);
  }

  // צור JWT
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // עדכן זמן התחברות אחרון
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    },
  });
}));

/**
 * GET /api/auth/me
 * קבלת פרטי המשתמש המחובר
 */
router.get('/me', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AppError('Account is disabled', 403);
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    throw error;
  }
}));

/**
 * POST /api/auth/logout
 * התנתקות
 */
router.post('/logout', asyncHandler(async (req: Request, res: Response) => {
  // בגרסה בסיסית, ה-logout קורה בצד הלקוח (מחיקת token)
  // בעתיד אפשר להוסיף blacklist של tokens
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}));

/**
 * PUT /api/auth/profile
 * עדכון פרופיל
 */
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  const { name, email } = req.body;

  const user = await prisma.user.update({
    where: { id: decoded.userId },
    data: { name, email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  res.json({
    success: true,
    data: user,
  });
}));

/**
 * POST /api/auth/change-password
 * שינוי סיסמה
 */
router.post('/change-password', asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Current and new password are required', 400);
  }

  if (newPassword.length < 8) {
    throw new AppError('New password must be at least 8 characters', 400);
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isValidPassword = await bcrypt.compare(currentPassword, user.password);
  if (!isValidPassword) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: decoded.userId },
    data: { password: hashedPassword },
  });

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

export default router;
```

---

## משימה 8: יצירת Auth Middleware

### צור `server/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware לאימות JWT
 */
export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    }
    throw new AppError('Invalid token', 401);
  }
};

/**
 * Middleware לבדיקת תפקידים
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Middleware אופציונלי - לא חוסם אם אין token
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };
      req.user = decoded;
    } catch (error) {
      // Ignore invalid token, continue without user
    }
  }

  next();
};
```

---

## משימה 9: יצירת Deliveries Route

### צור `server/src/routes/deliveries.ts`

```typescript
import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Prisma } from '../../generated/prisma';

const router = Router();

/**
 * GET /api/deliveries
 * רשימת משלוחים
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, supplierId, from, to, limit = '50', offset = '0' } = req.query;

  const where: Prisma.DeliveryWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (supplierId) {
    where.supplierId = supplierId as string;
  }

  if (from || to) {
    where.deliveryDate = {};
    if (from) where.deliveryDate.gte = new Date(from as string);
    if (to) where.deliveryDate.lte = new Date(to as string);
  }

  const [deliveries, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            reagent: { select: { id: true, name: true, catalogNumber: true } },
          },
        },
        order: { select: { id: true, tempNumber: true, permanentNumber: true } },
      },
      orderBy: { deliveryDate: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.delivery.count({ where }),
  ]);

  res.json({
    success: true,
    data: deliveries,
    meta: { total, limit: parseInt(limit as string), offset: parseInt(offset as string) },
  });
}));

/**
 * GET /api/deliveries/:id
 * משלוח בודד
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        include: {
          reagent: true,
        },
      },
      order: true,
      withdrawalRequest: true,
      batches: true,
    },
  });

  if (!delivery) {
    throw new AppError('Delivery not found', 404);
  }

  res.json({
    success: true,
    data: delivery,
  });
}));

/**
 * GET /api/deliveries/:id/edit
 * נתונים לעריכת משלוח
 */
router.get('/:id/edit', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [delivery, suppliers, reagents] = await Promise.all([
    prisma.delivery.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { reagent: true } },
        batches: true,
      },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.reagent.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!delivery) {
    throw new AppError('Delivery not found', 404);
  }

  res.json({
    success: true,
    data: { delivery, suppliers, reagents },
  });
}));

/**
 * GET /api/deliveries/new-page-data
 * נתונים לדף משלוח חדש
 */
router.get('/new-page-data', asyncHandler(async (req: Request, res: Response) => {
  const [suppliers, reagents, pendingOrders] = await Promise.all([
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.reagent.findMany({
      where: { isDeleted: false },
      include: { supplier: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.order.findMany({
      where: {
        status: { in: ['APPROVED', 'PARTIALLY_RECEIVED'] },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { reagent: true } },
      },
      orderBy: { orderDate: 'desc' },
    }),
  ]);

  res.json({
    success: true,
    data: { suppliers, reagents, pendingOrders },
  });
}));

/**
 * POST /api/deliveries
 * יצירת משלוח חדש
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    supplierId,
    deliveryDate,
    orderId,
    withdrawalRequestId,
    items,
    notes,
  } = req.body;

  if (!supplierId || !deliveryDate || !items || items.length === 0) {
    throw new AppError('Supplier, delivery date, and at least one item are required', 400);
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // צור מספר משלוח
  const deliveryCount = await prisma.delivery.count();
  const deliveryNumber = `DEL-${String(deliveryCount + 1).padStart(6, '0')}`;

  const delivery = await prisma.delivery.create({
    data: {
      deliveryNumber,
      supplierId,
      supplierSnapshot: supplier.name,
      deliveryDate: new Date(deliveryDate),
      orderId,
      withdrawalRequestId,
      notes,
      status: 'NEW',
      items: {
        create: items.map((item: any) => ({
          reagentId: item.reagentId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          expiryDate: new Date(item.expiryDate),
        })),
      },
    },
    include: {
      supplier: true,
      items: { include: { reagent: true } },
    },
  });

  res.status(201).json({
    success: true,
    data: delivery,
    message: 'Delivery created successfully',
  });
}));

/**
 * PUT /api/deliveries/:id
 * עדכון משלוח
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes, items } = req.body;

  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) {
    throw new AppError('Delivery not found', 404);
  }

  const updatedDelivery = await prisma.delivery.update({
    where: { id },
    data: {
      status,
      notes,
    },
    include: {
      supplier: true,
      items: { include: { reagent: true } },
    },
  });

  res.json({
    success: true,
    data: updatedDelivery,
  });
}));

/**
 * POST /api/deliveries/:id/complete
 * השלמת משלוח ויצירת אצוות
 */
router.post('/:id/complete', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body; // items with acceptance status

  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!delivery) {
    throw new AppError('Delivery not found', 404);
  }

  // עדכן סטטוס לCOMPLETED ויצור אצוות
  await prisma.$transaction(async (tx) => {
    // עדכן משלוח
    await tx.delivery.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    // צור אצוות לפריטים שהתקבלו
    for (const item of delivery.items) {
      const acceptedItem = items?.find((i: any) => i.id === item.id);
      const acceptedQty = acceptedItem?.acceptedQuantity ?? item.quantity;

      if (Number(acceptedQty) > 0) {
        await tx.reagentBatch.create({
          data: {
            reagentId: item.reagentId,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            initialQuantity: acceptedQty,
            currentQuantity: acceptedQty,
            receivedDate: delivery.deliveryDate,
            deliveryId: delivery.id,
            status: 'ACTIVE',
            qcStatus: 'PENDING',
          },
        });

        // צור תנועת מלאי
        await tx.inventoryTransaction.create({
          data: {
            reagentId: item.reagentId,
            transactionType: 'RECEIPT',
            quantityDelta: acceptedQty,
            sourceType: 'delivery',
            sourceId: delivery.id,
            notes: `Received from delivery ${delivery.deliveryNumber}`,
          },
        });
      }
    }
  });

  res.json({
    success: true,
    message: 'Delivery completed and batches created',
  });
}));

/**
 * DELETE /api/deliveries/:id
 * מחיקת משלוח (רק טיוטות)
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const delivery = await prisma.delivery.findUnique({ where: { id } });
  if (!delivery) {
    throw new AppError('Delivery not found', 404);
  }

  if (delivery.status !== 'NEW') {
    throw new AppError('Only new deliveries can be deleted', 400);
  }

  await prisma.delivery.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Delivery deleted',
  });
}));

export default router;
```

---

## משימה 10: יצירת Withdrawals Route

### צור `server/src/routes/withdrawals.ts`

```typescript
import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Prisma } from '../../generated/prisma';

const router = Router();

/**
 * GET /api/withdrawals
 * רשימת בקשות משיכה
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, supplierId, limit = '50', offset = '0' } = req.query;

  const where: Prisma.WithdrawalRequestWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  if (supplierId) {
    where.supplierId = supplierId as string;
  }

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            reagent: { select: { id: true, name: true, catalogNumber: true } },
          },
        },
        frameworkOrder: true,
      },
      orderBy: { requestDate: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.withdrawalRequest.count({ where }),
  ]);

  res.json({
    success: true,
    data: withdrawals,
    meta: { total },
  });
}));

/**
 * GET /api/withdrawals/pending
 * בקשות משיכה ממתינות
 */
router.get('/pending', asyncHandler(async (req: Request, res: Response) => {
  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      status: { in: ['SUBMITTED', 'APPROVED', 'SHIPPING'] },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { reagent: true } },
    },
    orderBy: { requestDate: 'desc' },
  });

  res.json({
    success: true,
    data: withdrawals,
  });
}));

/**
 * GET /api/withdrawals/:id
 * בקשת משיכה בודדת
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { reagent: true } },
      frameworkOrder: true,
      deliveries: true,
    },
  });

  if (!withdrawal) {
    throw new AppError('Withdrawal request not found', 404);
  }

  res.json({
    success: true,
    data: withdrawal,
  });
}));

/**
 * GET /api/withdrawals/:id/edit
 * נתונים לעריכת בקשת משיכה
 */
router.get('/:id/edit', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [withdrawal, suppliers, reagents, frameworkOrders] = await Promise.all([
    prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: { include: { reagent: true } },
        frameworkOrder: true,
      },
    }),
    prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.reagent.findMany({
      where: { isDeleted: false },
      orderBy: { name: 'asc' },
    }),
    prisma.frameworkOrder.findMany({
      where: {
        validTo: { gte: new Date() },
      },
      include: {
        order: { include: { supplier: true } },
        items: { include: { reagent: true } },
      },
    }),
  ]);

  if (!withdrawal) {
    throw new AppError('Withdrawal request not found', 404);
  }

  res.json({
    success: true,
    data: { withdrawal, suppliers, reagents, frameworkOrders },
  });
}));

/**
 * POST /api/withdrawals
 * יצירת בקשת משיכה חדשה
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    supplierId,
    frameworkOrderId,
    items,
    requesterNotes,
  } = req.body;

  if (!supplierId || !items || items.length === 0) {
    throw new AppError('Supplier and at least one item are required', 400);
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // צור מספר בקשה
  const count = await prisma.withdrawalRequest.count();
  const withdrawalNumber = `WD-${String(count + 1).padStart(6, '0')}`;

  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      withdrawalNumber,
      supplierId,
      supplierSnapshot: supplier.name,
      frameworkOrderId,
      status: 'DRAFT',
      requesterNotes,
      items: {
        create: items.map((item: any) => ({
          reagentId: item.reagentId,
          requestedQuantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: {
      supplier: true,
      items: { include: { reagent: true } },
    },
  });

  res.status(201).json({
    success: true,
    data: withdrawal,
    message: 'Withdrawal request created',
  });
}));

/**
 * POST /api/withdrawals/automatic
 * יצירת בקשת משיכה אוטומטית
 */
router.post('/automatic', asyncHandler(async (req: Request, res: Response) => {
  const { supplierId, items } = req.body;

  // Similar to regular create but with SUBMITTED status
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  const count = await prisma.withdrawalRequest.count();
  const withdrawalNumber = `WD-${String(count + 1).padStart(6, '0')}`;

  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      withdrawalNumber,
      supplierId,
      supplierSnapshot: supplier.name,
      status: 'SUBMITTED',
      requesterNotes: 'Auto-generated withdrawal request',
      items: {
        create: items.map((item: any) => ({
          reagentId: item.reagentId,
          requestedQuantity: item.quantity,
        })),
      },
    },
    include: {
      supplier: true,
      items: { include: { reagent: true } },
    },
  });

  res.status(201).json({
    success: true,
    data: withdrawal,
  });
}));

/**
 * PUT /api/withdrawals/:id
 * עדכון בקשת משיכה
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, approverNotes, items } = req.body;

  const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!withdrawal) {
    throw new AppError('Withdrawal request not found', 404);
  }

  const updateData: any = {};

  if (status) {
    updateData.status = status;
    if (status === 'APPROVED') {
      updateData.approvalDate = new Date();
    }
    if (status === 'CLOSED') {
      updateData.completionDate = new Date();
    }
  }

  if (approverNotes) {
    updateData.approverNotes = approverNotes;
  }

  const updatedWithdrawal = await prisma.withdrawalRequest.update({
    where: { id },
    data: updateData,
    include: {
      supplier: true,
      items: { include: { reagent: true } },
    },
  });

  res.json({
    success: true,
    data: updatedWithdrawal,
  });
}));

/**
 * DELETE /api/withdrawals/:id
 * מחיקת בקשת משיכה
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const withdrawal = await prisma.withdrawalRequest.findUnique({ where: { id } });
  if (!withdrawal) {
    throw new AppError('Withdrawal request not found', 404);
  }

  if (!['DRAFT', 'CANCELLED'].includes(withdrawal.status)) {
    throw new AppError('Only draft or cancelled withdrawals can be deleted', 400);
  }

  await prisma.withdrawalRequest.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Withdrawal request deleted',
  });
}));

export default router;
```

---

## משימה 11: יצירת Shipments Route

### צור `server/src/routes/shipments.ts`

```typescript
import { Router, Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import prisma from '../utils/prisma';
import { Prisma } from '../../generated/prisma';

const router = Router();

/**
 * GET /api/shipments
 * רשימת משלוחים יוצאים
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, limit = '50', offset = '0' } = req.query;

  const where: Prisma.ShipmentWhereInput = {};

  if (status) {
    where.status = status as any;
  }

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        items: {
          include: {
            reagent: { select: { id: true, name: true, catalogNumber: true } },
          },
        },
      },
      orderBy: { shipmentDate: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    }),
    prisma.shipment.count({ where }),
  ]);

  res.json({
    success: true,
    data: shipments,
    meta: { total },
  });
}));

/**
 * GET /api/shipments/:id
 * משלוח בודד
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      items: { include: { reagent: true } },
    },
  });

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  res.json({
    success: true,
    data: shipment,
  });
}));

/**
 * GET /api/shipments/:id/edit
 * נתונים לעריכת משלוח
 */
router.get('/:id/edit', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [shipment, reagents, batches] = await Promise.all([
    prisma.shipment.findUnique({
      where: { id },
      include: { items: { include: { reagent: true } } },
    }),
    prisma.reagent.findMany({
      where: { isDeleted: false, totalQuantity: { gt: 0 } },
      orderBy: { name: 'asc' },
    }),
    prisma.reagentBatch.findMany({
      where: { status: 'ACTIVE', currentQuantity: { gt: 0 } },
      include: { reagent: { select: { id: true, name: true } } },
    }),
  ]);

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  res.json({
    success: true,
    data: { shipment, reagents, batches },
  });
}));

/**
 * POST /api/shipments
 * יצירת משלוח יוצא
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const {
    destinationHospital,
    destinationDepartment,
    shipmentDate,
    items,
    notes,
  } = req.body;

  if (!destinationHospital || !shipmentDate || !items || items.length === 0) {
    throw new AppError('Destination, date, and items are required', 400);
  }

  // צור מספר משלוח
  const count = await prisma.shipment.count();
  const shipmentNumber = `SHP-${String(count + 1).padStart(6, '0')}`;

  const shipment = await prisma.shipment.create({
    data: {
      shipmentNumber,
      destinationHospital,
      destinationDepartment,
      shipmentDate: new Date(shipmentDate),
      status: 'DRAFT',
      notes,
      items: {
        create: items.map((item: any) => ({
          reagentId: item.reagentId,
          batchId: item.batchId,
          quantity: item.quantity,
        })),
      },
    },
    include: {
      items: { include: { reagent: true } },
    },
  });

  res.status(201).json({
    success: true,
    data: shipment,
    message: 'Shipment created',
  });
}));

/**
 * PUT /api/shipments/:id
 * עדכון משלוח
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, notes, destinationHospital, destinationDepartment } = req.body;

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id },
    data: {
      status,
      notes,
      destinationHospital,
      destinationDepartment,
    },
    include: {
      items: { include: { reagent: true } },
    },
  });

  res.json({
    success: true,
    data: updatedShipment,
  });
}));

/**
 * POST /api/shipments/:id/send
 * שליחת משלוח (עדכון מלאי)
 */
router.post('/:id/send', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  if (shipment.status !== 'DRAFT') {
    throw new AppError('Only draft shipments can be sent', 400);
  }

  await prisma.$transaction(async (tx) => {
    // עדכן סטטוס משלוח
    await tx.shipment.update({
      where: { id },
      data: { status: 'SENT' },
    });

    // עדכן מלאי לכל פריט
    for (const item of shipment.items) {
      if (item.batchId) {
        // הפחת מאצווה ספציפית
        await tx.reagentBatch.update({
          where: { id: item.batchId },
          data: {
            currentQuantity: { decrement: item.quantity },
          },
        });
      }

      // צור תנועת מלאי
      await tx.inventoryTransaction.create({
        data: {
          reagentId: item.reagentId,
          batchId: item.batchId,
          transactionType: 'TRANSFER_OUT',
          quantityDelta: -Number(item.quantity),
          sourceType: 'shipment',
          sourceId: shipment.id,
          notes: `Shipped to ${shipment.destinationHospital}`,
        },
      });
    }
  });

  res.json({
    success: true,
    message: 'Shipment sent and inventory updated',
  });
}));

/**
 * DELETE /api/shipments/:id
 * מחיקת משלוח
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const shipment = await prisma.shipment.findUnique({ where: { id } });
  if (!shipment) {
    throw new AppError('Shipment not found', 404);
  }

  if (shipment.status !== 'DRAFT') {
    throw new AppError('Only draft shipments can be deleted', 400);
  }

  await prisma.shipment.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Shipment deleted',
  });
}));

export default router;
```

---

## משימה 12: יצירת File Upload Route

### צור `server/src/routes/files.ts`

```typescript
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler, AppError } from '../middleware/errorHandler';

const router = Router();

// הגדרת תיקיית uploads
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

// ודא שתיקיית uploads קיימת
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// הגדרת Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'general';
    const typePath = path.join(UPLOAD_PATH, type);

    if (!fs.existsSync(typePath)) {
      fs.mkdirSync(typePath, { recursive: true });
    }

    cb(null, typePath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // סוגי קבצים מותרים
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * POST /api/files/upload
 * העלאת קובץ
 */
router.post('/upload', upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const fileUrl = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
    },
  });
}));

/**
 * GET /api/files/:type/:filename
 * קבלת קובץ
 */
router.get('/:type/:filename', asyncHandler(async (req: Request, res: Response) => {
  const { type, filename } = req.params;
  const filePath = path.join(UPLOAD_PATH, type, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found', 404);
  }

  res.sendFile(path.resolve(filePath));
}));

/**
 * DELETE /api/files/:type/:filename
 * מחיקת קובץ
 */
router.delete('/:type/:filename', asyncHandler(async (req: Request, res: Response) => {
  const { type, filename } = req.params;
  const filePath = path.join(UPLOAD_PATH, type, filename);

  if (!fs.existsSync(filePath)) {
    throw new AppError('File not found', 404);
  }

  fs.unlinkSync(filePath);

  res.json({
    success: true,
    message: 'File deleted',
  });
}));

export default router;
```

---

## משימה 12.1: עדכון routes/index.ts

### עדכן `server/src/routes/index.ts`

```typescript
import { Router } from 'express';

// Core routes
import dashboardRoutes from './dashboard';
import reagentsRoutes from './reagents';
import suppliersRoutes from './suppliers';
import ordersRoutes from './orders';
import batchesRoutes from './batches';
import inventoryRoutes from './inventory';

// New routes
import authRoutes from './auth';
import deliveriesRoutes from './deliveries';
import withdrawalsRoutes from './withdrawals';
import shipmentsRoutes from './shipments';
import filesRoutes from './files';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Auth (no authentication required)
router.use('/auth', authRoutes);

// Core routes
router.use('/dashboard', dashboardRoutes);
router.use('/reagents', reagentsRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/orders', ordersRoutes);
router.use('/batches', batchesRoutes);
router.use('/inventory', inventoryRoutes);

// New routes
router.use('/deliveries', deliveriesRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/shipments', shipmentsRoutes);
router.use('/files', filesRoutes);

export default router;
```

---

# Phase 4 - 6: המשך...

עקב מגבלת אורך, אמשיך בקובץ נפרד.

**ראה קובץ:** `IMPLEMENTATION_PLAN_PART2.md`

---

# Checklist מהיר

```
Phase 1: תשתית
□ עדכן .env.example
□ הוסף password ל-User model
□ הרץ prisma migrate
□ התקן dependencies חדשים

Phase 2: API Client
□ צור src/api/client.js
□ החלף src/api/entities.js
□ החלף src/api/functions.js
□ עדכן src/api/integrations.js
□ צור .env עם VITE_API_URL

Phase 3: Backend Routes
□ צור auth.ts route
□ צור auth.ts middleware
□ צור deliveries.ts
□ צור withdrawals.ts
□ צור shipments.ts
□ צור files.ts
□ עדכן routes/index.ts

Phase 4-6: ראה חלק 2
```
