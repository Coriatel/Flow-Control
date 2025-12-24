import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';
import { ApiResponse, AlertSeverity, AlertStatus, AlertRuleType } from '../types';

const router = Router();

// All alert routes require authentication
router.use(authenticate);

// ==================== ACTIVE ALERTS ====================

/**
 * GET /api/alerts
 * Get all active alerts with optional filters
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { severity, status, entityType, ruleType } = req.query;

  const where: any = {};

  if (severity) {
    where.severity = severity as AlertSeverity;
  }

  if (status) {
    where.status = status as AlertStatus;
  }

  if (entityType) {
    where.entityType = entityType as string;
  }

  if (ruleType) {
    where.alertRule = {
      ruleType: ruleType as AlertRuleType
    };
  }

  const alerts = await prisma.activeAlert.findMany({
    where,
    include: {
      alertRule: {
        select: {
          id: true,
          name: true,
          ruleType: true,
          description: true
        }
      }
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const response: ApiResponse = {
    success: true,
    data: alerts,
    meta: { total: alerts.length }
  };
  res.json(response);
}));

/**
 * GET /api/alerts/unresolved
 * Get all unresolved alerts
 */
router.get('/unresolved', asyncHandler(async (req: Request, res: Response) => {
  const alerts = await prisma.activeAlert.findMany({
    where: {
      status: {
        in: ['NEW', 'IN_PROGRESS']
      }
    },
    include: {
      alertRule: true
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const response: ApiResponse = {
    success: true,
    data: alerts
  };
  res.json(response);
}));

/**
 * GET /api/alerts/summary
 * Get alert summary by severity
 */
router.get('/summary', asyncHandler(async (req: Request, res: Response) => {
  const [critical, high, medium, low] = await Promise.all([
    prisma.activeAlert.count({ where: { severity: 'CRITICAL', status: { in: ['NEW', 'IN_PROGRESS'] } } }),
    prisma.activeAlert.count({ where: { severity: 'HIGH', status: { in: ['NEW', 'IN_PROGRESS'] } } }),
    prisma.activeAlert.count({ where: { severity: 'MEDIUM', status: { in: ['NEW', 'IN_PROGRESS'] } } }),
    prisma.activeAlert.count({ where: { severity: 'LOW', status: { in: ['NEW', 'IN_PROGRESS'] } } })
  ]);

  const response: ApiResponse = {
    success: true,
    data: {
      critical,
      high,
      medium,
      low,
      total: critical + high + medium + low
    }
  };
  res.json(response);
}));

/**
 * GET /api/alerts/:id
 * Get alert by ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const alert = await prisma.activeAlert.findUnique({
    where: { id },
    include: {
      alertRule: true
    }
  });

  if (!alert) {
    throw new AppError('Alert not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: alert
  };
  res.json(response);
}));

/**
 * POST /api/alerts/:id/acknowledge
 * Acknowledge alert (mark as in progress)
 */
router.post('/:id/acknowledge', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.activeAlert.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Alert not found', 404);
  }

  if (existing.status !== 'NEW') {
    throw new AppError('Can only acknowledge NEW alerts', 400);
  }

  const alert = await prisma.activeAlert.update({
    where: { id },
    data: { status: 'IN_PROGRESS' },
    include: {
      alertRule: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: alert,
    message: 'Alert acknowledged'
  };
  res.json(response);
}));

/**
 * POST /api/alerts/:id/resolve
 * Resolve alert
 */
router.post('/:id/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { resolutionNotes } = req.body;

  const existing = await prisma.activeAlert.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Alert not found', 404);
  }

  if (existing.status === 'RESOLVED' || existing.status === 'DISMISSED') {
    throw new AppError('Alert is already resolved or dismissed', 400);
  }

  const alert = await prisma.activeAlert.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolvedById: req.user?.id,
      resolvedAt: new Date(),
      resolutionNotes
    },
    include: {
      alertRule: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: alert,
    message: 'Alert resolved'
  };
  res.json(response);
}));

/**
 * POST /api/alerts/:id/dismiss
 * Dismiss alert
 */
router.post('/:id/dismiss', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const existing = await prisma.activeAlert.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Alert not found', 404);
  }

  if (existing.status === 'RESOLVED' || existing.status === 'DISMISSED') {
    throw new AppError('Alert is already resolved or dismissed', 400);
  }

  const alert = await prisma.activeAlert.update({
    where: { id },
    data: {
      status: 'DISMISSED',
      resolvedById: req.user?.id,
      resolvedAt: new Date(),
      resolutionNotes: reason || 'Dismissed'
    },
    include: {
      alertRule: true
    }
  });

  const response: ApiResponse = {
    success: true,
    data: alert,
    message: 'Alert dismissed'
  };
  res.json(response);
}));

/**
 * POST /api/alerts/resolve-batch
 * Resolve multiple alerts at once
 */
router.post('/resolve-batch', asyncHandler(async (req: Request, res: Response) => {
  const { alertIds, resolutionNotes } = req.body;

  if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
    throw new AppError('alertIds array is required', 400);
  }

  await prisma.activeAlert.updateMany({
    where: {
      id: { in: alertIds },
      status: { in: ['NEW', 'IN_PROGRESS'] }
    },
    data: {
      status: 'RESOLVED',
      resolvedById: req.user?.id,
      resolvedAt: new Date(),
      resolutionNotes
    }
  });

  const response: ApiResponse = {
    success: true,
    message: `${alertIds.length} alerts resolved`
  };
  res.json(response);
}));

// ==================== ALERT RULES ====================

/**
 * GET /api/alerts/rules
 * Get all alert rules
 */
router.get('/rules/list', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { ruleType, isActive } = req.query;

  const where: any = {};

  if (ruleType) {
    where.ruleType = ruleType as AlertRuleType;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const rules = await prisma.alertRule.findMany({
    where,
    include: {
      _count: {
        select: { alerts: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const response: ApiResponse = {
    success: true,
    data: rules,
    meta: { total: rules.length }
  };
  res.json(response);
}));

/**
 * GET /api/alerts/rules/:id
 * Get alert rule by ID
 */
router.get('/rules/:id', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const rule = await prisma.alertRule.findUnique({
    where: { id },
    include: {
      alerts: {
        where: { status: { in: ['NEW', 'IN_PROGRESS'] } },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!rule) {
    throw new AppError('Alert rule not found', 404);
  }

  const response: ApiResponse = {
    success: true,
    data: rule
  };
  res.json(response);
}));

/**
 * POST /api/alerts/rules
 * Create new alert rule
 */
router.post('/rules', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { ruleType, name, description, thresholdDays, thresholdQuantity, thresholdMonths, appliesToCategories } = req.body;

  if (!ruleType || !name) {
    throw new AppError('ruleType and name are required', 400);
  }

  const validRuleTypes = ['EXPIRY_WARNING', 'LOW_STOCK', 'PENDING_SUPPLY', 'COUNT_REQUIRED', 'COA_MISSING', 'CUSTOM'];
  if (!validRuleTypes.includes(ruleType)) {
    throw new AppError('Invalid ruleType', 400);
  }

  const rule = await prisma.alertRule.create({
    data: {
      ruleType,
      name,
      description,
      thresholdDays,
      thresholdQuantity,
      thresholdMonths,
      appliesToCategories: appliesToCategories || []
    }
  });

  const response: ApiResponse = {
    success: true,
    data: rule,
    message: 'Alert rule created successfully'
  };
  res.status(201).json(response);
}));

/**
 * PUT /api/alerts/rules/:id
 * Update alert rule
 */
router.put('/rules/:id', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, thresholdDays, thresholdQuantity, thresholdMonths, appliesToCategories, isActive } = req.body;

  const existing = await prisma.alertRule.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Alert rule not found', 404);
  }

  const rule = await prisma.alertRule.update({
    where: { id },
    data: {
      name,
      description,
      thresholdDays,
      thresholdQuantity,
      thresholdMonths,
      appliesToCategories,
      isActive
    }
  });

  const response: ApiResponse = {
    success: true,
    data: rule,
    message: 'Alert rule updated successfully'
  };
  res.json(response);
}));

/**
 * DELETE /api/alerts/rules/:id
 * Delete alert rule (deactivate)
 */
router.delete('/rules/:id', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.alertRule.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Alert rule not found', 404);
  }

  await prisma.alertRule.update({
    where: { id },
    data: { isActive: false }
  });

  const response: ApiResponse = {
    success: true,
    message: 'Alert rule deactivated'
  };
  res.json(response);
}));

/**
 * POST /api/alerts/rules/:id/toggle
 * Toggle alert rule active status
 */
router.post('/rules/:id/toggle', authorize('ADMIN'), asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existing = await prisma.alertRule.findUnique({
    where: { id }
  });

  if (!existing) {
    throw new AppError('Alert rule not found', 404);
  }

  const rule = await prisma.alertRule.update({
    where: { id },
    data: { isActive: !existing.isActive }
  });

  const response: ApiResponse = {
    success: true,
    data: rule,
    message: `Alert rule ${rule.isActive ? 'activated' : 'deactivated'}`
  };
  res.json(response);
}));

/**
 * POST /api/alerts/generate
 * Manually trigger alert generation (checks all rules)
 */
router.post('/generate', authorize('ADMIN', 'MANAGER'), asyncHandler(async (req: Request, res: Response) => {
  // Get all active rules
  const rules = await prisma.alertRule.findMany({
    where: { isActive: true }
  });

  let alertsCreated = 0;

  for (const rule of rules) {
    switch (rule.ruleType) {
      case 'EXPIRY_WARNING': {
        if (rule.thresholdDays) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + rule.thresholdDays);

          const expiringBatches = await prisma.reagentBatch.findMany({
            where: {
              status: 'ACTIVE',
              expiryDate: { lte: expiryDate },
              currentQuantity: { gt: 0 }
            },
            include: { reagent: true }
          });

          for (const batch of expiringBatches) {
            // Check if alert already exists
            const existingAlert = await prisma.activeAlert.findFirst({
              where: {
                alertRuleId: rule.id,
                entityType: 'batch',
                entityId: batch.id,
                status: { in: ['NEW', 'IN_PROGRESS'] }
              }
            });

            if (!existingAlert) {
              await prisma.activeAlert.create({
                data: {
                  alertRuleId: rule.id,
                  entityType: 'batch',
                  entityId: batch.id,
                  severity: rule.thresholdDays <= 7 ? 'CRITICAL' : rule.thresholdDays <= 30 ? 'HIGH' : 'MEDIUM',
                  message: `Batch ${batch.batchNumber} of ${batch.reagent.name} expires on ${batch.expiryDate.toLocaleDateString()}`,
                  details: {
                    reagentId: batch.reagentId,
                    reagentName: batch.reagent.name,
                    batchNumber: batch.batchNumber,
                    expiryDate: batch.expiryDate,
                    currentQuantity: batch.currentQuantity
                  }
                }
              });
              alertsCreated++;
            }
          }
        }
        break;
      }

      case 'LOW_STOCK': {
        if (rule.thresholdMonths) {
          const lowStockReagents = await prisma.reagent.findMany({
            where: {
              isDeleted: false,
              monthsOfStock: { lt: rule.thresholdMonths }
            },
            include: { supplier: true }
          });

          for (const reagent of lowStockReagents) {
            const existingAlert = await prisma.activeAlert.findFirst({
              where: {
                alertRuleId: rule.id,
                entityType: 'reagent',
                entityId: reagent.id,
                status: { in: ['NEW', 'IN_PROGRESS'] }
              }
            });

            if (!existingAlert) {
              await prisma.activeAlert.create({
                data: {
                  alertRuleId: rule.id,
                  entityType: 'reagent',
                  entityId: reagent.id,
                  severity: Number(reagent.monthsOfStock || 0) <= 1 ? 'CRITICAL' : 'HIGH',
                  message: `${reagent.name} has low stock: ${reagent.monthsOfStock?.toFixed(1)} months remaining`,
                  details: {
                    reagentName: reagent.name,
                    supplier: reagent.supplier?.name,
                    monthsOfStock: reagent.monthsOfStock,
                    currentQuantity: reagent.totalQuantity
                  }
                }
              });
              alertsCreated++;
            }
          }
        }
        break;
      }

      case 'COA_MISSING': {
        const batchesWithoutCOA = await prisma.reagentBatch.findMany({
          where: {
            status: 'ACTIVE',
            coaDocumentUrl: null,
            currentQuantity: { gt: 0 }
          },
          include: { reagent: true }
        });

        for (const batch of batchesWithoutCOA) {
          const existingAlert = await prisma.activeAlert.findFirst({
            where: {
              alertRuleId: rule.id,
              entityType: 'batch',
              entityId: batch.id,
              status: { in: ['NEW', 'IN_PROGRESS'] }
            }
          });

          if (!existingAlert) {
            await prisma.activeAlert.create({
              data: {
                alertRuleId: rule.id,
                entityType: 'batch',
                entityId: batch.id,
                severity: 'MEDIUM',
                message: `Batch ${batch.batchNumber} of ${batch.reagent.name} is missing COA document`,
                details: {
                  reagentId: batch.reagentId,
                  reagentName: batch.reagent.name,
                  batchNumber: batch.batchNumber
                }
              }
            });
            alertsCreated++;
          }
        }
        break;
      }
    }
  }

  const response: ApiResponse = {
    success: true,
    data: { alertsCreated },
    message: `Generated ${alertsCreated} new alerts`
  };
  res.json(response);
}));

export default router;
