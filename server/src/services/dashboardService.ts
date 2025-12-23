import prisma from '../utils/prisma';
import {
  DashboardData,
  ExpiringReagent,
  LowStockReagent,
  CriticalAction,
} from '../types';

class DashboardService {
  /**
   * Get all dashboard data in one call
   */
  async getDashboardData(): Promise<DashboardData> {
    const [
      expiringReagents,
      lowStockReagents,
      pendingOrders,
      pendingWithdrawals,
      dashboardNotes,
      lastInventoryCount,
      recentActivity,
      statistics,
    ] = await Promise.all([
      this.getExpiringReagents(),
      this.getLowStockReagents(),
      this.getPendingOrders(),
      this.getPendingWithdrawals(),
      this.getDashboardNotes(),
      this.getLastInventoryCount(),
      this.getRecentActivity(),
      this.getStatistics(),
    ]);

    const criticalActions = this.calculateCriticalActions({
      expiringReagents,
      lowStockReagents,
      lastInventoryCount,
      pendingOrders,
    });

    return {
      expiringReagents,
      lowStockReagents,
      pendingOrders: pendingOrders.map((o) => ({
        id: o.id,
        tempNumber: o.tempNumber || o.orderNumber || '',
        supplier: (o as any).supplier?.name || '',
        status: o.status,
        orderDate: o.orderDate,
      })),
      pendingSupplies: [
        ...pendingWithdrawals.map((w) => ({
          id: w.id,
          type: 'withdrawal' as const,
          number: w.withdrawalNumber,
          supplier: w.supplierSnapshot,
          requestDate: w.requestDate,
        })),
      ],
      dashboardNotes: dashboardNotes.map((n) => ({
        id: n.id,
        title: n.title || null,
        content: n.content,
        noteType: String(n.noteType),
        createdAt: n.createdAt,
      })),
      lastInventoryCount: lastInventoryCount
        ? {
            id: lastInventoryCount.id,
            countDate: lastInventoryCount.countDate,
            totalReagentsCounted: lastInventoryCount.totalReagentsCounted,
          }
        : null,
      recentActivity,
      criticalActions,
      statistics,
    };
  }

  /**
   * Get reagents expiring within threshold days (simplified query)
   */
  async getExpiringReagents(): Promise<ExpiringReagent[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Simplified query - get all active batches expiring within 30 days
    const batches = await prisma.reagentBatch.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: { lte: threshold },
      },
      orderBy: { expiryDate: 'asc' },
      take: 20,
    });

    // Get reagent info for each batch
    const results: ExpiringReagent[] = [];
    for (const batch of batches) {
      if (Number(batch.currentQuantity) <= 0) continue;

      const reagent = await prisma.reagent.findUnique({ where: { id: batch.reagentId } });
      let supplierName = '';
      if (reagent?.supplierId) {
        const supplier = await prisma.supplier.findUnique({ where: { id: reagent.supplierId } });
        supplierName = supplier?.name || '';
      }

      results.push({
        id: batch.id,
        name: reagent?.name || '',
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry: Math.ceil(
          (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        currentQuantity: Number(batch.currentQuantity),
        supplier: supplierName,
      });
    }
    return results;
  }

  /**
   * Get reagents with low stock (simplified)
   */
  async getLowStockReagents(): Promise<LowStockReagent[]> {
    // Get all active reagents with low stock status
    const reagents = await prisma.reagent.findMany({
      where: {
        isDeleted: false,
        currentStockStatus: { in: ['LOW', 'CRITICAL', 'OUT_OF_STOCK'] },
      },
      orderBy: { monthsOfStock: 'asc' },
      take: 20,
    });

    const results: LowStockReagent[] = [];
    for (const r of reagents) {
      const supplier = await prisma.supplier.findUnique({ where: { id: r.supplierId } });
      results.push({
        id: r.id,
        name: r.name,
        currentQuantity: Number(r.totalQuantity),
        monthsOfStock: Number(r.monthsOfStock || 0),
        averageUsage: Number(
          r.useManualUsage ? r.manualMonthlyUsage : r.averageMonthlyUsage
        ) || 0,
        supplier: supplier?.name || '',
      });
    }
    return results;
  }

  /**
   * Get pending orders (simplified for basic pg client)
   */
  async getPendingOrders() {
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['DRAFT', 'PENDING_SAP', 'APPROVED'] },
      },
      orderBy: { orderDate: 'desc' },
      take: 10,
    });

    // Manually fetch supplier names
    const results = [];
    for (const order of orders) {
      let supplierName = '';
      if (order.supplierId) {
        const supplier = await prisma.supplier.findUnique({ where: { id: order.supplierId } });
        supplierName = supplier?.name || '';
      }
      results.push({
        ...order,
        supplier: { name: supplierName },
      });
    }
    return results;
  }

  /**
   * Get pending withdrawals
   */
  async getPendingWithdrawals() {
    return prisma.withdrawalRequest.findMany({
      where: {
        status: { in: ['SUBMITTED', 'APPROVED', 'SHIPPING'] },
      },
      orderBy: { requestDate: 'desc' },
      take: 10,
    });
  }

  /**
   * Get dashboard notes
   */
  async getDashboardNotes() {
    return prisma.dashboardNote.findMany({
      where: {
        dismissedAt: null,
      },
      orderBy: [{ isPinned: 'desc' }, { priority: 'desc' }, { createdAt: 'desc' }],
      take: 5,
    });
  }

  /**
   * Get last inventory count
   */
  async getLastInventoryCount() {
    return prisma.completedInventoryCount.findFirst({
      orderBy: { completedAt: 'desc' },
    });
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType || '',
      description: this.formatActivityDescription(log),
      timestamp: log.createdAt,
    }));
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const [totalReagents, totalBatches, expiringCount, lowStockCount] =
      await Promise.all([
        prisma.reagent.count({ where: { isDeleted: false } }),
        prisma.reagentBatch.count({ where: { status: 'ACTIVE' } }),
        prisma.reagentBatch.count({
          where: {
            status: 'ACTIVE',
            expiryDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.reagent.count({
          where: {
            isDeleted: false,
            currentStockStatus: { in: ['LOW', 'CRITICAL', 'OUT_OF_STOCK'] },
          },
        }),
      ]);

    return {
      totalReagents,
      totalBatches,
      expiringCount,
      lowStockCount,
    };
  }

  /**
   * Calculate critical actions
   */
  private calculateCriticalActions(data: {
    expiringReagents: ExpiringReagent[];
    lowStockReagents: LowStockReagent[];
    lastInventoryCount: any;
    pendingOrders: any[];
  }): CriticalAction[] {
    const actions: CriticalAction[] = [];

    // Expiring today
    const expiringToday = data.expiringReagents.filter(
      (r) => r.daysUntilExpiry <= 0
    );
    if (expiringToday.length > 0) {
      actions.push({
        type: 'expiry',
        title: 'פגי תוקף היום',
        description: `${expiringToday.length} אצוות פגו היום`,
        priority: 'high',
        route: '/BatchAndExpiryManagement?view=expired',
      });
    }

    // Very low stock
    const criticalStock = data.lowStockReagents.filter(
      (r) => r.monthsOfStock < 1
    );
    if (criticalStock.length > 0) {
      actions.push({
        type: 'stock',
        title: 'מלאי קריטי',
        description: `${criticalStock.length} ריאגנטים במלאי קריטי`,
        priority: 'high',
        route: '/InventoryReplenishment',
      });
    }

    // Inventory count needed
    if (data.lastInventoryCount) {
      const daysSinceCount = Math.floor(
        (Date.now() - data.lastInventoryCount.countDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysSinceCount > 30) {
        actions.push({
          type: 'count',
          title: 'נדרשת ספירת מלאי',
          description: `עברו ${daysSinceCount} ימים מהספירה האחרונה`,
          priority: 'medium',
          route: '/InventoryCount',
        });
      }
    }

    return actions;
  }

  private formatActivityDescription(log: any): string {
    const details = log.details as any;
    switch (log.action) {
      case 'delivery_received':
        return `התקבל משלוח מ-${details?.supplier || 'ספק'}`;
      case 'inventory_count':
        return 'הושלמה ספירת מלאי';
      case 'withdrawal_created':
        return `נוצרה בקשת משיכה ${details?.number || ''}`;
      default:
        return log.action;
    }
  }
}

export const dashboardService = new DashboardService();
