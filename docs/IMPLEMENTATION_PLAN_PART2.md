# Flow-Control: תוכנית ביצוע - חלק 2
## Phases 4-6: Authentication, Security & Deployment

---

# Phase 4: Authentication מלא בצד לקוח

## משימה 13: יצירת Auth Context

### צור `src/contexts/AuthContext.jsx`

```jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/api/entities';
import { api } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // בדוק אם יש משתמש מחובר בטעינה ראשונית
  const checkAuth = useCallback(async () => {
    const token = api.getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await User.me();
      setUser(userData);
    } catch (err) {
      console.error('Auth check failed:', err);
      api.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // התחברות
  const login = async (email, password) => {
    setError(null);
    try {
      const result = await User.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // הרשמה
  const register = async (data) => {
    setError(null);
    try {
      const result = await User.register(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // התנתקות
  const logout = async () => {
    try {
      await User.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  // עדכון פרופיל
  const updateProfile = async (data) => {
    try {
      const updatedUser = await User.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // שינוי סיסמה
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await User.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
```

---

## משימה 14: יצירת Protected Route

### צור `src/components/auth/ProtectedRoute.jsx`

```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // טוען
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-teal-500" />
        <span className="mr-3 text-lg text-gray-600">בודק הרשאות...</span>
      </div>
    );
  }

  // לא מחובר - הפנה לדף התחברות
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // בדיקת תפקיד אם נדרש
  if (requiredRole && user?.role !== requiredRole) {
    // אין הרשאה - הפנה לדף הבית
    return <Navigate to="/" replace />;
  }

  return children;
}
```

### צור `src/components/auth/AdminRoute.jsx`

```jsx
import React from 'react';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      {children}
    </ProtectedRoute>
  );
}
```

---

## משימה 15: יצירת דף התחברות

### צור `src/pages/Login.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      toast.success('התחברת בהצלחה!');
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-teal-700">Flow Control</CardTitle>
          <CardDescription>מערכת ניהול מלאי למעבדת בנק דם</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                className="text-left"
                dir="ltr"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  מתחבר...
                </>
              ) : (
                <>
                  <LogIn className="ml-2 h-4 w-4" />
                  התחבר
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              אין לך חשבון?{' '}
              <Link to="/register" className="text-teal-600 hover:underline">
                הרשם כאן
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### צור `src/pages/Register.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות');
      return;
    }

    if (formData.password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success('נרשמת בהצלחה! כעת תוכל להתחבר.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'שגיאה בהרשמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-teal-700">הרשמה למערכת</CardTitle>
          <CardDescription>צור חשבון חדש ב-Flow Control</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                name="name"
                placeholder="ישראל ישראלי"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="לפחות 8 תווים"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                minLength={8}
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="הקלד שוב את הסיסמה"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
                className="text-left"
                dir="ltr"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  נרשם...
                </>
              ) : (
                <>
                  <UserPlus className="ml-2 h-4 w-4" />
                  הרשם
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              כבר יש לך חשבון?{' '}
              <Link to="/login" className="text-teal-600 hover:underline">
                התחבר כאן
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## משימה 16: עדכון App.jsx / Router

### עדכן `src/App.jsx`

```jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Layout from '@/pages/Layout';

// Auth pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Main pages
import Dashboard from '@/pages/Dashboard';
import ManageReagents from '@/pages/ManageReagents';
import ManageSuppliers from '@/pages/ManageSuppliers';
import Orders from '@/pages/Orders';
import Deliveries from '@/pages/Deliveries';
import WithdrawalRequests from '@/pages/WithdrawalRequests';
import OutgoingShipments from '@/pages/OutgoingShipments';
import InventoryCount from '@/pages/InventoryCount';
import InventoryReplenishment from '@/pages/InventoryReplenishment';
import BatchAndExpiryManagement from '@/pages/BatchAndExpiryManagement';
import QualityAssurance from '@/pages/QualityAssurance';
import Contacts from '@/pages/Contacts';
import ActivityLog from '@/pages/ActivityLog';
import Reports from '@/pages/Reports';
import AlertsManagement from '@/pages/AlertsManagement';
import SystemSettings from '@/pages/SystemSettings';

// Edit pages
import EditReagent from '@/pages/EditReagent';
import NewReagent from '@/pages/NewReagent';
import EditOrder from '@/pages/EditOrder';
import NewOrder from '@/pages/NewOrder';
import EditDelivery from '@/pages/EditDelivery';
import NewDelivery from '@/pages/NewDelivery';
import EditShipment from '@/pages/EditShipment';
import NewShipment from '@/pages/NewShipment';
import EditWithdrawalRequest from '@/pages/EditWithdrawalRequest';
import NewWithdrawalRequest from '@/pages/NewWithdrawalRequest';
import EditReagentBatch from '@/pages/EditReagentBatch';

// Other pages
import DashboardNotes from '@/pages/DashboardNotes';
import SupplyTracking from '@/pages/SupplyTracking';
import UsageDataManagement from '@/pages/UsageDataManagement';
import UploadCOA from '@/pages/UploadCOA';
import ImportContacts from '@/pages/ImportContacts';
import SystemDocumentation from '@/pages/SystemDocumentation';
import SystemManagement from '@/pages/SystemManagement';
import AdminPanel from '@/pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index element={<Dashboard />} />
            <Route path="Dashboard" element={<Dashboard />} />

            {/* Reagents */}
            <Route path="ManageReagents" element={<ManageReagents />} />
            <Route path="EditReagent/:id" element={<EditReagent />} />
            <Route path="NewReagent" element={<NewReagent />} />
            <Route path="EditReagentBatch/:id" element={<EditReagentBatch />} />

            {/* Suppliers */}
            <Route path="ManageSuppliers" element={<ManageSuppliers />} />
            <Route path="Contacts" element={<Contacts />} />
            <Route path="ImportContacts" element={<ImportContacts />} />

            {/* Orders */}
            <Route path="Orders" element={<Orders />} />
            <Route path="EditOrder/:id" element={<EditOrder />} />
            <Route path="NewOrder" element={<NewOrder />} />

            {/* Deliveries */}
            <Route path="Deliveries" element={<Deliveries />} />
            <Route path="EditDelivery/:id" element={<EditDelivery />} />
            <Route path="NewDelivery" element={<NewDelivery />} />

            {/* Withdrawals */}
            <Route path="WithdrawalRequests" element={<WithdrawalRequests />} />
            <Route path="EditWithdrawalRequest/:id" element={<EditWithdrawalRequest />} />
            <Route path="NewWithdrawalRequest" element={<NewWithdrawalRequest />} />

            {/* Shipments */}
            <Route path="OutgoingShipments" element={<OutgoingShipments />} />
            <Route path="EditShipment/:id" element={<EditShipment />} />
            <Route path="NewShipment" element={<NewShipment />} />

            {/* Inventory */}
            <Route path="InventoryCount" element={<InventoryCount />} />
            <Route path="InventoryReplenishment" element={<InventoryReplenishment />} />
            <Route path="BatchAndExpiryManagement" element={<BatchAndExpiryManagement />} />

            {/* Quality & Tracking */}
            <Route path="QualityAssurance" element={<QualityAssurance />} />
            <Route path="SupplyTracking" element={<SupplyTracking />} />
            <Route path="UploadCOA" element={<UploadCOA />} />

            {/* Reports & Activity */}
            <Route path="Reports" element={<Reports />} />
            <Route path="ActivityLog" element={<ActivityLog />} />
            <Route path="AlertsManagement" element={<AlertsManagement />} />

            {/* Notes & Usage */}
            <Route path="DashboardNotes" element={<DashboardNotes />} />
            <Route path="UsageDataManagement" element={<UsageDataManagement />} />

            {/* System */}
            <Route path="SystemSettings" element={<SystemSettings />} />
            <Route path="SystemDocumentation" element={<SystemDocumentation />} />
            <Route path="SystemManagement" element={<SystemManagement />} />
            <Route path="AdminPanel" element={<AdminPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

---

# Phase 5: Security & Production Ready

## משימה 17: עדכון app.ts עם Security

### עדכן `server/src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();

// ============================================
// Security Middleware
// ============================================

// Helmet - HTTP headers security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// Body Parsing
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// Static Files (Uploads)
// ============================================

const uploadsPath = process.env.UPLOAD_PATH || './uploads';
app.use('/uploads', express.static(path.resolve(uploadsPath)));

// ============================================
// Request Logging (Development)
// ============================================

if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Health Checks
// ============================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'flow-control-api',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================
// API Routes
// ============================================

app.use('/api', apiRoutes);

// ============================================
// Serve Frontend in Production
// ============================================

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../dist');
  app.use(express.static(frontendPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ============================================
// 404 Handler
// ============================================

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// ============================================
// Error Handler
// ============================================

app.use(errorHandler);

export default app;
```

---

## משימה 18: יצירת Seed Script

### צור `server/prisma/seed.ts`

```typescript
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ===== Create Admin User =====
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowcontrol.local' },
    update: {},
    create: {
      email: 'admin@flowcontrol.local',
      name: 'מנהל מערכת',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // ===== Create Test User =====
  const userPassword = await bcrypt.hash('User1234!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@flowcontrol.local' },
    update: {},
    create: {
      email: 'user@flowcontrol.local',
      name: 'משתמש רגיל',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log('✅ Test user created:', user.email);

  // ===== Create Suppliers =====
  const suppliers = await Promise.all([
    prisma.supplier.upsert({
      where: { name: 'Bio-Rad' },
      update: {},
      create: {
        name: 'Bio-Rad',
        shortCode: 'BR',
        email: 'orders@bio-rad.com',
        phone: '1-800-424-6723',
        isPreferred: true,
      },
    }),
    prisma.supplier.upsert({
      where: { name: 'Ortho Clinical Diagnostics' },
      update: {},
      create: {
        name: 'Ortho Clinical Diagnostics',
        shortCode: 'OCD',
        email: 'orders@orthoclinical.com',
        phone: '1-800-828-6316',
        isPreferred: true,
      },
    }),
    prisma.supplier.upsert({
      where: { name: 'Immucor' },
      update: {},
      create: {
        name: 'Immucor',
        shortCode: 'IMM',
        email: 'orders@immucor.com',
        phone: '1-866-466-8267',
      },
    }),
  ]);
  console.log('✅ Suppliers created:', suppliers.length);

  // ===== Create Sample Reagents =====
  const reagents = await Promise.all([
    prisma.reagent.upsert({
      where: { name_supplierId: { name: 'Anti-A', supplierId: suppliers[0].id } },
      update: {},
      create: {
        name: 'Anti-A',
        catalogNumber: 'BR-001',
        category: 'REAGENT',
        supplierId: suppliers[0].id,
        requiresBatches: true,
        totalQuantity: 50,
        activeBatchesCount: 2,
        currentStockStatus: 'NORMAL',
      },
    }),
    prisma.reagent.upsert({
      where: { name_supplierId: { name: 'Anti-B', supplierId: suppliers[0].id } },
      update: {},
      create: {
        name: 'Anti-B',
        catalogNumber: 'BR-002',
        category: 'REAGENT',
        supplierId: suppliers[0].id,
        requiresBatches: true,
        totalQuantity: 45,
        activeBatchesCount: 2,
        currentStockStatus: 'NORMAL',
      },
    }),
    prisma.reagent.upsert({
      where: { name_supplierId: { name: 'Anti-D', supplierId: suppliers[0].id } },
      update: {},
      create: {
        name: 'Anti-D',
        catalogNumber: 'BR-003',
        category: 'REAGENT',
        supplierId: suppliers[0].id,
        requiresBatches: true,
        totalQuantity: 10,
        activeBatchesCount: 1,
        currentStockStatus: 'LOW',
      },
    }),
    prisma.reagent.upsert({
      where: { name_supplierId: { name: 'Screening Cells I', supplierId: suppliers[1].id } },
      update: {},
      create: {
        name: 'Screening Cells I',
        catalogNumber: 'OCD-SC1',
        category: 'CELLS',
        supplierId: suppliers[1].id,
        requiresBatches: true,
        totalQuantity: 20,
        activeBatchesCount: 1,
        currentStockStatus: 'NORMAL',
      },
    }),
  ]);
  console.log('✅ Reagents created:', reagents.length);

  // ===== Create Sample Batches =====
  const now = new Date();
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const batches = await Promise.all([
    prisma.reagentBatch.create({
      data: {
        reagentId: reagents[0].id,
        batchNumber: 'BAT-2024-001',
        expiryDate: in90days,
        initialQuantity: 30,
        currentQuantity: 25,
        receivedDate: now,
        status: 'ACTIVE',
        qcStatus: 'APPROVED',
      },
    }),
    prisma.reagentBatch.create({
      data: {
        reagentId: reagents[0].id,
        batchNumber: 'BAT-2024-002',
        expiryDate: in30days,
        initialQuantity: 30,
        currentQuantity: 25,
        receivedDate: now,
        status: 'ACTIVE',
        qcStatus: 'APPROVED',
      },
    }),
  ]);
  console.log('✅ Batches created:', batches.length);

  // ===== Create Alert Rules =====
  await prisma.alertRule.createMany({
    data: [
      {
        ruleType: 'EXPIRY_WARNING',
        name: 'התראת תפוגה 14 יום',
        description: 'התראה על ריאגנטים שפג תוקפם תוך 14 יום',
        thresholdDays: 14,
        isActive: true,
      },
      {
        ruleType: 'LOW_STOCK',
        name: 'מלאי נמוך',
        description: 'התראה על מלאי נמוך מ-2 חודשי צריכה',
        thresholdMonths: 2,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Alert rules created');

  console.log('🌱 Seed completed!');
  console.log('');
  console.log('📝 Login credentials:');
  console.log('   Admin: admin@flowcontrol.local / Admin123!');
  console.log('   User:  user@flowcontrol.local / User1234!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### עדכן `server/package.json` - הוסף seed script

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "ts-node prisma/seed.ts",
    "test": "echo \"No tests yet\""
  }
}
```

---

## משימה 19: יצירת Build Script מלא

### צור `scripts/build.sh`

```bash
#!/bin/bash
# ===========================================
# Flow-Control Full Build Script
# ===========================================

set -e

echo "🏗️  Building Flow-Control..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ===== Backend Build =====
echo -e "${YELLOW}📦 Building Backend...${NC}"
cd server

# Install dependencies
npm ci --only=production

# Generate Prisma
npx prisma generate

# Build TypeScript
npm run build

echo -e "${GREEN}✅ Backend built successfully${NC}"
cd ..

# ===== Frontend Build =====
echo -e "${YELLOW}📦 Building Frontend...${NC}"

# Install dependencies
npm ci

# Build Vite
npm run build

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# ===== Copy Frontend to Server =====
echo -e "${YELLOW}📋 Copying frontend to server/dist...${NC}"
cp -r dist server/public

echo ""
echo -e "${GREEN}🎉 Build completed!${NC}"
echo ""
echo "To start production server:"
echo "  cd server && npm start"
```

---

# Phase 6: פריסה על Hostinger VPS

## משימה 20: הכנת קבצי Production

### צור `server/ecosystem.config.js` (PM2)

```javascript
module.exports = {
  apps: [{
    name: 'flow-control',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 4000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    time: true,
    max_memory_restart: '500M',
    restart_delay: 1000,
  }],
};
```

### צור `nginx.conf` (לשרת)

```nginx
# /etc/nginx/sites-available/flow-control

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Root for static files
    root /var/www/flow-control/server/public;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:4000;
    }

    # Uploads
    location /uploads {
        alias /var/www/flow-control/server/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1d;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## משימה 21: סקריפט פריסה ל-Hostinger

### צור `scripts/deploy-hostinger.sh`

```bash
#!/bin/bash
# ===========================================
# Deploy to Hostinger VPS
# ===========================================

set -e

# Configuration
SERVER_USER="root"
SERVER_IP="YOUR_VPS_IP"
SERVER_PATH="/var/www/flow-control"
DOMAIN="yourdomain.com"

echo "🚀 Deploying Flow-Control to Hostinger..."

# ===== Build locally =====
echo "📦 Building application..."
./scripts/build.sh

# ===== Create archive =====
echo "📦 Creating deployment archive..."
tar -czf deploy.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  server dist package.json

# ===== Upload to server =====
echo "📤 Uploading to server..."
scp deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

# ===== Execute on server =====
echo "⚙️  Executing deployment on server..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
  set -e

  # Create directory
  mkdir -p /var/www/flow-control
  cd /var/www/flow-control

  # Backup current version
  if [ -d "server" ]; then
    mv server server.backup.$(date +%Y%m%d_%H%M%S)
  fi

  # Extract new version
  tar -xzf /tmp/deploy.tar.gz

  # Install dependencies
  cd server
  npm ci --only=production

  # Run migrations
  npx prisma migrate deploy

  # Create logs directory
  mkdir -p logs

  # Restart application
  pm2 restart flow-control || pm2 start ecosystem.config.js --env production

  # Save PM2 config
  pm2 save

  # Cleanup
  rm /tmp/deploy.tar.gz

  echo "✅ Deployment completed!"
ENDSSH

# ===== Cleanup local =====
rm deploy.tar.gz

echo ""
echo "🎉 Deployment successful!"
echo "🌐 Visit: https://$DOMAIN"
```

---

## משימה 22: הוראות התקנה ראשונית על Hostinger

### צור `docs/HOSTINGER_SETUP.md`

```markdown
# התקנת Flow-Control על Hostinger VPS

## דרישות מקדימות

- Hostinger VPS (Ubuntu 22.04 מומלץ)
- דומיין מוגדר
- גישת SSH

## שלב 1: התחבר ל-VPS

```bash
ssh root@YOUR_VPS_IP
```

## שלב 2: התקן תוכנות בסיסיות

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install Nginx
apt install -y nginx

# Install PM2
npm install -g pm2

# Install Certbot (SSL)
apt install -y certbot python3-certbot-nginx
```

## שלב 3: הגדר PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE flow_control;
CREATE USER flow_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE flow_control TO flow_user;
\q

# Allow local connections
# Edit /etc/postgresql/15/main/pg_hba.conf if needed
```

## שלב 4: הגדר את האפליקציה

```bash
# Create directory
mkdir -p /var/www/flow-control
cd /var/www/flow-control

# Clone repository (or upload files)
git clone https://github.com/YOUR_REPO/flow-control.git .

# Install dependencies
cd server
npm install

# Create .env
cp .env.example .env
nano .env
```

עדכן `.env`:
```
PORT=4000
NODE_ENV=production
DATABASE_URL="postgresql://flow_user:your_strong_password@localhost:5432/flow_control"
JWT_SECRET=your-super-long-random-secret-key-at-least-32-chars
CORS_ORIGIN=https://yourdomain.com
```

## שלב 5: הרץ Migrations

```bash
npx prisma migrate deploy
npx prisma db seed
```

## שלב 6: בנה והפעל

```bash
# Build
npm run build

# Copy frontend
cd ..
npm install
npm run build
cp -r dist server/public

# Start with PM2
cd server
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## שלב 7: הגדר Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/flow-control
sudo ln -s /etc/nginx/sites-available/flow-control /etc/nginx/sites-enabled/

# Edit with your domain
sudo nano /etc/nginx/sites-available/flow-control

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

## שלב 8: הגדר SSL

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## שלב 9: הגדר Firewall

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## בדיקה

```bash
# Check app status
pm2 status

# Check logs
pm2 logs flow-control

# Test API
curl https://yourdomain.com/health
```

## פקודות שימושיות

```bash
# Restart app
pm2 restart flow-control

# View logs
pm2 logs flow-control --lines 100

# Monitor
pm2 monit

# Update app
cd /var/www/flow-control
git pull
cd server && npm install && npm run build
pm2 restart flow-control
```
```

---

## משימה 23: Checklist סופי

### צור `docs/DEPLOYMENT_CHECKLIST.md`

```markdown
# Flow-Control Deployment Checklist

## Pre-Deployment

### Code Ready
- [ ] All tests passing (when added)
- [ ] No console.log statements
- [ ] Environment variables documented
- [ ] Dependencies up to date

### Configuration
- [ ] .env.example updated
- [ ] CORS origins correct
- [ ] JWT_SECRET is strong (32+ chars)
- [ ] Rate limits configured

### Database
- [ ] Schema finalized
- [ ] Migrations created
- [ ] Seed data ready
- [ ] Backup strategy defined

## Deployment Steps

### Server Setup
- [ ] VPS provisioned
- [ ] SSH access configured
- [ ] Node.js 22 installed
- [ ] PostgreSQL installed
- [ ] Nginx installed
- [ ] PM2 installed

### Application
- [ ] Code uploaded
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Database migrated
- [ ] Seed data loaded
- [ ] PM2 configured

### Security
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Security headers enabled
- [ ] Rate limiting active

### Monitoring
- [ ] PM2 monitoring active
- [ ] Error logging configured
- [ ] Health check endpoint working

## Post-Deployment

### Verification
- [ ] Homepage loads
- [ ] Login works
- [ ] CRUD operations work
- [ ] File uploads work
- [ ] Mobile responsive

### Documentation
- [ ] README updated
- [ ] API documentation
- [ ] Admin credentials stored securely

## Rollback Plan

1. SSH to server
2. `pm2 stop flow-control`
3. `mv server server.failed`
4. `mv server.backup.XXXXXX server`
5. `pm2 start flow-control`
```

---

# סיכום כללי

## סדר ביצוע מומלץ

```
שבוע 1:
├── Phase 1: הכנת תשתית (משימות 1-3)
└── Phase 2: החלפת base44 (משימות 4-6)

שבוע 2:
├── Phase 3: Backend Routes (משימות 7-12)
└── Phase 4: Auth Frontend (משימות 13-16)

שבוע 3:
├── Phase 5: Security (משימות 17-19)
└── Phase 6: Hostinger (משימות 20-23)
```

## קבצים חדשים שייווצרו

```
src/
├── api/
│   ├── client.js (חדש)
│   ├── entities.js (מוחלף)
│   ├── functions.js (מוחלף)
│   └── integrations.js (מוחלף)
├── contexts/
│   └── AuthContext.jsx (חדש)
├── components/auth/
│   ├── ProtectedRoute.jsx (חדש)
│   └── AdminRoute.jsx (חדש)
└── pages/
    ├── Login.jsx (חדש)
    └── Register.jsx (חדש)

server/
├── src/
│   ├── routes/
│   │   ├── auth.ts (חדש)
│   │   ├── deliveries.ts (חדש)
│   │   ├── withdrawals.ts (חדש)
│   │   ├── shipments.ts (חדש)
│   │   └── files.ts (חדש)
│   └── middleware/
│       └── auth.ts (חדש)
├── prisma/
│   └── seed.ts (חדש)
└── ecosystem.config.js (חדש)

scripts/
├── build.sh (חדש)
└── deploy-hostinger.sh (חדש)

docs/
├── HOSTINGER_SETUP.md (חדש)
└── DEPLOYMENT_CHECKLIST.md (חדש)
```

## פקודות הרצה

```bash
# פיתוח מקומי
cd server && npm run dev  # Terminal 1
npm run dev               # Terminal 2

# בנייה
./scripts/build.sh

# פריסה
./scripts/deploy-hostinger.sh
```
```
