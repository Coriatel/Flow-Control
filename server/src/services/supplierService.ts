import prisma from '../utils/prisma';

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
   * Get all suppliers
   */
  async getAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };

    const suppliers = await prisma.supplier.findMany({
      where,
      include: {
        contacts: true,
        _count: {
          select: {
            reagents: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return suppliers;
  },

  /**
   * Get supplier by ID with full details
   */
  async getById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        contacts: true,
        reagents: {
          where: { isDeleted: false },
          include: {
            batches: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    return supplier;
  },

  /**
   * Get supplier with their reagents summary
   */
  async getWithReagentsSummary(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        contacts: {
          where: { isPrimary: true },
        },
        reagents: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            catalogNumber: true,
            category: true,
            totalQuantity: true,
            activeBatchesCount: true,
            nearestExpiryDate: true,
            currentStockStatus: true,
          },
        },
      },
    });

    if (!supplier) return null;

    // Calculate summary statistics
    const summary = {
      totalReagents: supplier.reagents.length,
      lowStockCount: supplier.reagents.filter((r) => r.currentStockStatus === 'LOW').length,
      outOfStockCount: supplier.reagents.filter((r) => r.currentStockStatus === 'OUT').length,
      expiringCount: supplier.reagents.filter((r) => {
        if (!r.nearestExpiryDate) return false;
        const daysUntilExpiry = Math.floor(
          (r.nearestExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry <= 30;
      }).length,
    };

    return { ...supplier, summary };
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
   * Get supplier's order history
   */
  async getOrderHistory(supplierId: string, limit = 20) {
    const orders = await prisma.order.findMany({
      where: { supplierId },
      include: {
        items: {
          include: {
            reagent: true,
          },
        },
      },
      orderBy: { orderDate: 'desc' },
      take: limit,
    });

    return orders;
  },

  /**
   * Get suppliers grouped by whether they have pending orders
   */
  async getSuppliersWithOrderStatus() {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        contacts: {
          where: { isPrimary: true },
        },
        _count: {
          select: {
            reagents: true,
          },
        },
        orders: {
          where: {
            status: {
              in: ['PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED'],
            },
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return suppliers.map((s) => ({
      ...s,
      hasPendingOrders: s.orders.length > 0,
      pendingOrdersCount: s.orders.length,
    }));
  },
};
