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

const router = Router();

// Mount routes

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

export default router;
