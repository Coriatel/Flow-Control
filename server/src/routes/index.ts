import { Router } from 'express';
import dashboardRoutes from './dashboard';
import reagentsRoutes from './reagents';
import inventoryRoutes from './inventory';

const router = Router();

// Mount routes
router.use('/dashboard', dashboardRoutes);
router.use('/reagents', reagentsRoutes);
router.use('/inventory', inventoryRoutes);

// Health check at API level
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;
