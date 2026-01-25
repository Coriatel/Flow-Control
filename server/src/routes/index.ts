import { Router } from 'express';
import dashboardRoutes from './dashboard';
import reagentsRoutes from './reagents';
import inventoryRoutes from './inventory';
import batchesRoutes from './batches';
import suppliersRoutes from './suppliers';
import ordersRoutes from './orders';
import authRoutes from './auth';
import deliveriesRoutes from './deliveries';
import withdrawalsRoutes from './withdrawals';
import shipmentsRoutes from './shipments';
import filesRoutes from './files';
import usersRoutes from './users';
import alertsRoutes from './alerts';
import activityRoutes from './activity';
import functionsRoutes from './functions';
import systemSettingsRoutes from './systemsettings';

const router = Router();


// Mount routes

// Functions (for frontend function-based API compatibility)
router.use('/functions', functionsRoutes);

// System settings
router.use('/systemsettings', systemSettingsRoutes);

// Authentication (public)
router.use('/auth', authRoutes);

// Files (protected)
router.use('/files', filesRoutes);

// Core routes (protected)
router.use('/dashboard', dashboardRoutes);
router.use('/reagents', reagentsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/batches', batchesRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/orders', ordersRoutes);

// Logistics routes (protected)
router.use('/deliveries', deliveriesRoutes);
router.use('/withdrawals', withdrawalsRoutes);
router.use('/shipments', shipmentsRoutes);

// Administration routes (protected)
router.use('/users', usersRoutes);
router.use('/alerts', alertsRoutes);
router.use('/activity', activityRoutes);

// Health check at API level
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Legacy/Frontend Compatibility Routes
import { inventoryService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';

router.get('/inventorycountdrafts', asyncHandler(async (_req, res) => {
  const data = await inventoryService.getCurrentDraft();
  res.json({ success: true, data });
}));

export default router;

