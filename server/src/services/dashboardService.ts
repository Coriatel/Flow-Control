import prisma from "../utils/prisma";
import {
  DashboardData,
  ExpiringReagent,
  LowStockReagent,
  CriticalAction,
} from "../types";

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
      onOrderQuantity,
    ] = await Promise.all([
      this.getExpiringReagents(),
      this.getLowStockReagents(),
      this.getPendingOrders(),
      this.getPendingWithdrawals(),
      this.getDashboardNotes(),
      this.getLastInventoryCount(),
      this.getRecentActivity(),
      this.getStatistics(),
      this.getOnOrderQuantity(),
    ]);

    const criticalActions = this.calculateCriticalActions({
      expiringReagents,
      lowStockReagents,
      lastInventoryCount,
      pendingOrders,
    });

    const pendingSupplies = [
      ...pendingOrders.map((o) => ({
        id: o.id,
        type: "order" as const,
        number: o.tempNumber || "",
        supplier: o.supplier?.name || "",
        requestDate: o.orderDate,
      })),
      ...pendingWithdrawals.map((w) => ({
        id: w.id,
        type: "withdrawal" as const,
        number: w.withdrawalNumber,
        supplier: w.supplierSnapshot,
        requestDate: w.requestDate,
      })),
    ];

    return {
      expiringReagents,
      lowStockReagents,
      pendingOrders: pendingOrders.map((o) => ({
        id: o.id,
        tempNumber: o.tempNumber || "",
        supplier: o.supplier?.name || "",
        status: o.status,
        orderDate: o.orderDate,
      })),
      pendingSupplies,
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
      onOrderQuantity,
    };
  }

  /**
   * Get reagents expiring within threshold days (simplified query)
   */
  async getExpiringReagents(): Promise<ExpiringReagent[]> {
    const now = new Date();
    const threshold = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const batches = await prisma.reagentBatch.findMany({
      where: {
        status: "ACTIVE",
        expiryDate: { lte: threshold },
      },
      include: {
        reagent: {
          include: { supplier: true },
        },
      },
      orderBy: { expiryDate: "asc" },
      take: 20,
    });

    return batches
      .filter((batch) => Number(batch.currentQuantity) > 0)
      .map((batch) => ({
        id: batch.id,
        name: batch.reagent?.name || "",
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry: Math.ceil(
          (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        currentQuantity: Number(batch.currentQuantity),
        supplier: batch.reagent?.supplier?.name || "",
      }));
  }

  /**
   * Get reagents with low stock (simplified)
   */
  async getLowStockReagents(): Promise<LowStockReagent[]> {
    const reagents = await prisma.reagent.findMany({
      where: {
        isDeleted: false,
        currentStockStatus: { in: ["LOW", "CRITICAL", "OUT_OF_STOCK"] },
      },
      include: { supplier: true },
      orderBy: { monthsOfStock: "asc" },
      take: 20,
    });

    return reagents.map((r) => ({
      id: r.id,
      name: r.name,
      currentQuantity: Number(r.totalQuantity),
      monthsOfStock: Number(r.monthsOfStock || 0),
      averageUsage:
        Number(
          r.useManualUsage ? r.manualMonthlyUsage : r.averageMonthlyUsage,
        ) || 0,
      supplier: r.supplier?.name || "",
      minStockLevel: (r as any).minStockLevel ?? null,
      maxStockLevel: (r as any).maxStockLevel ?? null,
    }));
  }

  /**
   * Get pending orders (simplified for basic pg client)
   */
  async getPendingOrders() {
    return prisma.order.findMany({
      where: {
        status: { in: ["DRAFT", "PENDING_SAP", "APPROVED"] },
      },
      include: { supplier: true },
      orderBy: { orderDate: "desc" },
      take: 10,
    });
  }

  /**
   * Get pending withdrawals
   */
  async getPendingWithdrawals() {
    return prisma.withdrawalRequest.findMany({
      where: {
        status: { in: ["SUBMITTED", "APPROVED", "SHIPPING"] },
      },
      orderBy: { requestDate: "desc" },
      take: 10,
    });
  }

  /**
   * Get total quantity on-order (ordered but not yet received)
   */
  async getOnOrderQuantity(): Promise<number> {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          status: {
            in: ["DRAFT", "PENDING_SAP", "APPROVED", "PARTIALLY_RECEIVED"],
          },
        },
      },
      select: { requestedQuantity: true, receivedQuantity: true },
    });

    return items.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          Number(item.requestedQuantity) - Number(item.receivedQuantity),
        ),
      0,
    );
  }

  /**
   * Get dashboard notes
   */
  async getDashboardNotes() {
    return prisma.dashboardNote.findMany({
      where: {
        dismissedAt: null,
      },
      orderBy: [
        { isPinned: "desc" },
        { priority: "desc" },
        { createdAt: "desc" },
      ],
      take: 5,
    });
  }

  /**
   * Get last inventory count
   */
  async getLastInventoryCount() {
    return prisma.completedInventoryCount.findFirst({
      orderBy: { completedAt: "desc" },
    });
  }

  /**
   * Get recent activity
   */
  async getRecentActivity() {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType || "",
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
        prisma.reagentBatch.count({ where: { status: "ACTIVE" } }),
        prisma.reagentBatch.count({
          where: {
            status: "ACTIVE",
            expiryDate: {
              lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.reagent.count({
          where: {
            isDeleted: false,
            currentStockStatus: { in: ["LOW", "CRITICAL", "OUT_OF_STOCK"] },
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
      (r) => r.daysUntilExpiry <= 0,
    );
    if (expiringToday.length > 0) {
      actions.push({
        type: "expiry",
        title: "פגי תוקף היום",
        description: `${expiringToday.length} אצוות פגו היום`,
        priority: "high",
        route: "/BatchAndExpiryManagement?view=expired",
      });
    }

    // Very low stock
    const criticalStock = data.lowStockReagents.filter(
      (r) => r.monthsOfStock < 1,
    );
    if (criticalStock.length > 0) {
      actions.push({
        type: "stock",
        title: "מלאי קריטי",
        description: `${criticalStock.length} ריאגנטים במלאי קריטי`,
        priority: "high",
        route: "/InventoryReplenishment",
      });
    }

    // Inventory count needed
    if (data.lastInventoryCount) {
      const daysSinceCount = Math.floor(
        (Date.now() - data.lastInventoryCount.countDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (daysSinceCount > 30) {
        actions.push({
          type: "count",
          title: "נדרשת ספירת מלאי",
          description: `עברו ${daysSinceCount} ימים מהספירה האחרונה`,
          priority: "medium",
          route: "/InventoryCount",
        });
      }
    }

    return actions;
  }

  /**
   * Get expiry calendar data for a given number of days ahead
   */
  async getExpiryCalendarData(days: number = 90) {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const batches = await prisma.reagentBatch.findMany({
      where: {
        status: { in: ["ACTIVE", "IN_USE", "EXPIRED"] },
        expiryDate: {
          gte: pastDate,
          lte: futureDate,
        },
      },
      include: {
        reagent: {
          include: { supplier: true },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    return batches
      .filter((batch) => Number(batch.currentQuantity) > 0)
      .map((batch) => ({
        id: batch.id,
        reagentId: batch.reagent?.id || "",
        name: batch.reagent?.name || "",
        catalogNumber: batch.reagent?.catalogNumber || "",
        category: batch.reagent?.category || "",
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        daysUntilExpiry: Math.ceil(
          (batch.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        ),
        currentQuantity: Number(batch.currentQuantity),
        status: batch.status,
        supplier: batch.reagent?.supplier?.name || "",
      }));
  }

  private formatActivityDescription(log: any): string {
    const details = log.details as any;
    switch (log.action) {
      case "delivery_received":
        return `התקבל משלוח מ-${details?.supplier || "ספק"}`;
      case "inventory_count":
        return "הושלמה ספירת מלאי";
      case "withdrawal_created":
        return `נוצרה בקשת משיכה ${details?.number || ""}`;
      default:
        return log.action;
    }
  }
}

export const dashboardService = new DashboardService();
