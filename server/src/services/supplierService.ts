import prisma from '../utils/prisma';
import { OrderStatus } from '../../generated/prisma';

export interface CreateSupplierInput {
  name: string;
  shortCode?: string;
  isActive?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  shortCode?: string;
  isActive?: boolean;
}

export interface CreateContactInput {
  supplierId: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  isPrimary?: boolean;
}

export const supplierService = {
  /**
   * Get all suppliers (simplified for basic pg client)
   */
  async getAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Manually get contacts and count for each supplier
    const results = [];
    for (const supplier of suppliers) {
      const contacts = await prisma.supplierContact.findMany({
        where: { supplierId: supplier.id },
      });
      const reagentCount = await prisma.reagent.count({
        where: { supplierId: supplier.id, isDeleted: false },
      });
      results.push({
        ...supplier,
        contacts,
        _count: { reagents: reagentCount },
      });
    }

    return results;
  },

  /**
   * Get supplier by ID with full details (simplified for basic pg client)
   */
  async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return null;

    const contacts = await prisma.supplierContact.findMany({
      where: { supplierId: id },
    });

    const reagents = await prisma.reagent.findMany({
      where: { supplierId: id, isDeleted: false },
    });

    // Get batches for each reagent
    const reagentsWithBatches = [];
    for (const reagent of reagents) {
      const batches = await prisma.reagentBatch.findMany({
        where: { reagentId: reagent.id, status: 'ACTIVE' },
      });
      reagentsWithBatches.push({ ...reagent, batches });
    }

    return { ...supplier, contacts, reagents: reagentsWithBatches };
  },

  /**
   * Get supplier with their reagents summary (simplified for basic pg client)
   */
  async getWithReagentsSummary(id: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return null;

    const contacts = await prisma.supplierContact.findMany({
      where: { supplierId: id, isPrimary: true },
    });

    const reagents = await prisma.reagent.findMany({
      where: { supplierId: id, isDeleted: false },
    });

    // Calculate summary statistics
    const summary = {
      totalReagents: reagents.length,
      lowStockCount: reagents.filter((r: any) => r.currentStockStatus === 'LOW').length,
      outOfStockCount: reagents.filter((r: any) => r.currentStockStatus === 'OUT_OF_STOCK').length,
      expiringCount: reagents.filter((r: any) => {
        if (!r.nearestExpiryDate) return false;
        const daysUntilExpiry = Math.floor(
          (r.nearestExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30;
      }).length,
    };

    return { ...supplier, contacts, reagents, summary };
  },

  /**
   * Create a new supplier
   */
  async create(data: CreateSupplierInput) {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        shortCode: data.shortCode,
        isActive: data.isActive !== false,
      },
    });

    return supplier;
  },

  /**
   * Update supplier
   */
  async update(id: string, data: UpdateSupplierInput) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data,
    });

    return supplier;
  },

  /**
   * Deactivate supplier (soft delete)
   */
  async deactivate(id: string) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    return supplier;
  },

  /**
   * Add contact to supplier
   */
  async addContact(data: CreateContactInput) {
    // If this is primary, unset other primary contacts
    if (data.isPrimary) {
      await prisma.supplierContact.updateMany({
        where: { supplierId: data.supplierId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.supplierContact.create({
      data: {
        supplierId: data.supplierId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: data.role,
        isPrimary: data.isPrimary || false,
      },
    });

    return contact;
  },

  /**
   * Update contact
   */
  async updateContact(
    contactId: string,
    data: Partial<Omit<CreateContactInput, 'supplierId'>>
  ) {
    // If setting as primary, unset others first
    if (data.isPrimary) {
      const contact = await prisma.supplierContact.findUnique({
        where: { id: contactId },
      });
      if (contact) {
        await prisma.supplierContact.updateMany({
          where: { supplierId: contact.supplierId, isPrimary: true },
          data: { isPrimary: false },
        });
      }
    }

    const updatedContact = await prisma.supplierContact.update({
      where: { id: contactId },
      data,
    });

    return updatedContact;
  },

  /**
   * Delete contact
   */
  async deleteContact(contactId: string) {
    await prisma.supplierContact.delete({
      where: { id: contactId },
    });
  },

  /**
   * Get supplier's order history (simplified for basic pg client)
   */
  async getOrderHistory(supplierId: string, limit = 20) {
    const orders = await prisma.order.findMany({
      where: { supplierId },
      orderBy: { orderDate: 'desc' },
      take: limit,
    });

    // Manually get items for each order
    const results = [];
    for (const order of orders) {
      const items = await prisma.orderItem.findMany({
        where: { orderId: order.id },
      });

      // Get reagent info for each item
      const itemsWithReagent = [];
      for (const item of items) {
        const reagent = await prisma.reagent.findUnique({
          where: { id: item.reagentId },
        });
        itemsWithReagent.push({ ...item, reagent });
      }

      results.push({ ...order, items: itemsWithReagent });
    }

    return results;
  },

  /**
   * Get suppliers grouped by whether they have pending orders (simplified for basic pg client)
   */
  async getSuppliersWithOrderStatus() {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const results = [];
    for (const supplier of suppliers) {
      const contacts = await prisma.supplierContact.findMany({
        where: { supplierId: supplier.id, isPrimary: true },
      });

      const reagentCount = await prisma.reagent.count({
        where: { supplierId: supplier.id, isDeleted: false },
      });

      const pendingOrders = await prisma.order.findMany({
        where: {
          supplierId: supplier.id,
          status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING_SAP, OrderStatus.APPROVED, OrderStatus.PARTIALLY_RECEIVED] },
        },
      });

      results.push({
        ...supplier,
        contacts,
        _count: { reagents: reagentCount },
        orders: pendingOrders.map((o) => ({ id: o.id, status: o.status })),
        hasPendingOrders: pendingOrders.length > 0,
        pendingOrdersCount: pendingOrders.length,
      });
    }

    return results;
  },
};
