import { Router } from 'express';
import dashboardRoutes from './dashboard';
import reagentsRoutes from './reagents';
import inventoryRoutes from './inventory';
import batchesRoutes from './batches';
import suppliersRoutes from './suppliers';
import ordersRoutes from './orders';

const router = Router();

// Mount routes
router.use('/dashboard', dashboardRoutes);
router.use('/reagents', reagentsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/batches', batchesRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/orders', ordersRoutes);

// Health check at API level
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
