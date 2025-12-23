import prisma from '../utils/prisma';
import { Category, StockStatus, Reagent, ReagentBatch } from '../types';
import { AppError } from '../middleware/errorHandler';

export interface CreateReagentInput {
  name: string;
  catalogNumber?: string;
  category?: Category;
  supplierId: string;
  isConsumable?: boolean;
  requiresBatches?: boolean;
  notes?: string;
  manualMonthlyUsage?: number;
}

export interface UpdateReagentInput extends Partial<CreateReagentInput> {
  useManualUsage?: boolean;
}

export interface ReagentWithBatches extends Omit<Reagent, 'supplier'> {
  batches: ReagentBatch[];
  supplier?: { id: string; name: string };
}

class ReagentService {
  /**
   * Get all reagents with optional filters (simplified for basic pg client)
   */
  async getAll(filters?: {
    category?: Category;
    supplierId?: string;
    stockStatus?: StockStatus;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<any[]> {
    const where: any = {};

    if (!filters?.includeDeleted) {
      where.isDeleted = false;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.stockStatus) {
      where.currentStockStatus = filters.stockStatus;
    }

    // Simplified: no OR search support in basic client
    // If search needed, do it in memory after fetching

    const reagents = await prisma.reagent.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Manually add supplier info
    const results = [];
    for (const reagent of reagents) {
      let supplier = null;
      if (reagent.supplierId) {
        supplier = await prisma.supplier.findUnique({ where: { id: reagent.supplierId } });
      }

      // Filter by search in memory
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = reagent.name?.toLowerCase().includes(searchLower);
        const matchesCatalog = reagent.catalogNumber?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCatalog) continue;
      }

      results.push({
        ...reagent,
        supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
      });
    }

    return results;
  }

  /**
   * Get reagents grouped by supplier and category
   */
  async getBySupplierAndCategory(): Promise<Record<string, Record<string, Reagent[]>>> {
    const reagents = await this.getAll();
    const grouped: Record<string, Record<string, Reagent[]>> = {};

    for (const reagent of reagents) {
      const supplierName = (reagent as any).supplier?.name || 'Unknown';
      const category = reagent.category;

      if (!grouped[supplierName]) {
        grouped[supplierName] = {};
      }
      if (!grouped[supplierName][category]) {
        grouped[supplierName][category] = [];
      }
      grouped[supplierName][category].push(reagent);
    }

    return grouped;
  }

  /**
   * Get a single reagent by ID with all batches (simplified for basic pg client)
   */
  async getById(id: string): Promise<ReagentWithBatches | null> {
    const reagent = await prisma.reagent.findUnique({ where: { id } });
    if (!reagent) return null;

    // Get supplier info
    let supplier = null;
    if (reagent.supplierId) {
      const s = await prisma.supplier.findUnique({ where: { id: reagent.supplierId } });
      if (s) supplier = { id: s.id, name: s.name };
    }

    // Get active batches
    const allBatches = await prisma.reagentBatch.findMany({
      where: { reagentId: id },
      orderBy: { expiryDate: 'asc' },
    });

    // Filter out destroyed batches in memory
    const batches = allBatches.filter((b: any) => b.status !== 'DESTROYED');

    return {
      ...reagent,
      supplier,
      batches,
    } as ReagentWithBatches;
  }

  /**
   * Create a new reagent
   */
  async create(data: CreateReagentInput): Promise<Reagent> {
    // Check if supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: data.supplierId },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    // Check for duplicate name with same supplier
    const existing = await prisma.reagent.findFirst({
      where: {
        name: data.name,
        supplierId: data.supplierId,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new AppError('Reagent with this name already exists for this supplier', 400);
    }

    return prisma.reagent.create({
      data: {
        name: data.name,
        catalogNumber: data.catalogNumber,
        category: data.category || 'REAGENT',
        supplierId: data.supplierId,
        isConsumable: data.isConsumable || false,
        requiresBatches: data.requiresBatches ?? true,
        notes: data.notes,
        manualMonthlyUsage: data.manualMonthlyUsage,
      },
    });
  }

  /**
   * Update a reagent
   */
  async update(id: string, data: UpdateReagentInput): Promise<Reagent> {
    const reagent = await prisma.reagent.findUnique({ where: { id } });

    if (!reagent) {
      throw new AppError('Reagent not found', 404);
    }

    return prisma.reagent.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a reagent
   */
  async delete(id: string): Promise<Reagent> {
    const reagent = await prisma.reagent.findUnique({ where: { id } });

    if (!reagent) {
      throw new AppError('Reagent not found', 404);
    }

    return prisma.reagent.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  /**
   * Update aggregated fields (called after batch changes)
   */
  async updateAggregates(reagentId: string): Promise<void> {
    const batches = await prisma.reagentBatch.findMany({
      where: {
        reagentId,
        status: 'ACTIVE',
      },
      orderBy: { expiryDate: 'asc' },
    });

    const totalQuantity = batches.reduce(
      (sum, b) => sum + Number(b.currentQuantity),
      0
    );
    const activeBatchesCount = batches.length;
    const nearestExpiryDate = batches[0]?.expiryDate || null;

    // Determine stock status
    let currentStockStatus: StockStatus = 'NORMAL';
    const reagent = await prisma.reagent.findUnique({ where: { id: reagentId } });

    if (reagent) {
      const monthlyUsage = reagent.useManualUsage
        ? Number(reagent.manualMonthlyUsage || 0)
        : Number(reagent.averageMonthlyUsage || 0);

      if (monthlyUsage > 0) {
        const monthsOfStock = totalQuantity / monthlyUsage;
        if (monthsOfStock < 1) {
          currentStockStatus = 'CRITICAL';
        } else if (monthsOfStock < 2) {
          currentStockStatus = 'LOW';
        }
      }

      if (totalQuantity === 0) {
        currentStockStatus = 'OUT_OF_STOCK';
      }
    }

    await prisma.reagent.update({
      where: { id: reagentId },
      data: {
        totalQuantity,
        activeBatchesCount,
        nearestExpiryDate,
        currentStockStatus,
      },
    });
  }
}

export const reagentService = new ReagentService();
