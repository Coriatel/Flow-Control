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

export interface ReagentWithBatches extends Reagent {
  batches: ReagentBatch[];
  supplier: { id: string; name: string };
}

class ReagentService {
  /**
   * Get all reagents with optional filters
   */
  async getAll(filters?: {
    category?: Category;
    supplierId?: string;
    stockStatus?: StockStatus;
    search?: string;
    includeDeleted?: boolean;
  }): Promise<Reagent[]> {
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

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { catalogNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.reagent.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ supplier: { name: 'asc' } }, { name: 'asc' }],
    });
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
   * Get a single reagent by ID with all batches
   */
  async getById(id: string): Promise<ReagentWithBatches | null> {
    return prisma.reagent.findUnique({
      where: { id },
      include: {
        supplier: {
          select: { id: true, name: true },
        },
        batches: {
          where: { status: { not: 'DESTROYED' } },
          orderBy: { expiryDate: 'asc' },
        },
      },
    }) as Promise<ReagentWithBatches | null>;
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
