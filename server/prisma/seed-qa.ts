/**
 * Flow Control - QA Test Data Seeder
 * Comprehensive mock data for testing and QA verification
 *
 * Creates:
 * - 10 users (all 4 roles)
 * - 5 suppliers with 15 contacts
 * - 30 reagents (all categories)
 * - 100 batches (all statuses)
 * - 30 orders (all statuses)
 * - 20 deliveries
 * - 15 withdrawals
 * - 15 shipments
 * - 200 inventory transactions
 * - 10 alert rules + 30 active alerts
 * - 200 activity log entries
 */

import { PrismaClient, Prisma } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate decimal values with precision (0.25, 0.5, 0.75, whole numbers)
function randomDecimal(min: number, max: number, includeDecimals: boolean = true): number {
  const baseValue = randomInt(min, max);
  if (!includeDecimals) return baseValue;

  const decimalOptions = [0, 0.25, 0.5, 0.75];
  const decimal = randomElement(decimalOptions);
  return baseValue + decimal;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTempNumber(prefix: string, index: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return `${prefix}-${year}${month}-${String(index).padStart(4, '0')}`;
}

// ============================================================================
// STATIC DATA DEFINITIONS
// ============================================================================

const QA_PASSWORD = 'Test123!';

const USERS_DATA = [
  { email: 'admin@flow.test', name: 'מנהל מערכת', role: 'ADMIN' as const },
  { email: 'manager1@flow.test', name: 'מנהל מעבדה ראשי', role: 'MANAGER' as const },
  { email: 'manager2@flow.test', name: 'מנהל מעבדה משני', role: 'MANAGER' as const },
  { email: 'user1@flow.test', name: 'טכנאי מעבדה א', role: 'USER' as const },
  { email: 'user2@flow.test', name: 'טכנאי מעבדה ב', role: 'USER' as const },
  { email: 'user3@flow.test', name: 'טכנאי מעבדה ג', role: 'USER' as const },
  { email: 'user4@flow.test', name: 'טכנאי מעבדה ד', role: 'USER' as const },
  { email: 'user5@flow.test', name: 'טכנאי מעבדה ה', role: 'USER' as const },
  { email: 'readonly1@flow.test', name: 'קורא בלבד א', role: 'READONLY' as const },
  { email: 'readonly2@flow.test', name: 'קורא בלבד ב', role: 'READONLY' as const }
];

const SUPPLIERS_DATA = [
  { name: 'Bio-Rad Laboratories', shortCode: 'BRD', defaultCurrency: 'USD', isPreferred: true, leadTimeDays: 14 },
  { name: 'Ortho Clinical Diagnostics', shortCode: 'OCD', defaultCurrency: 'USD', isPreferred: false, leadTimeDays: 21 },
  { name: 'Grifols', shortCode: 'GRF', defaultCurrency: 'EUR', isPreferred: true, leadTimeDays: 30 },
  { name: 'Immucor', shortCode: 'IMC', defaultCurrency: 'USD', isPreferred: false, leadTimeDays: 18 },
  { name: 'DiaMed / Bio-Rad', shortCode: 'DIA', defaultCurrency: 'CHF', isPreferred: false, leadTimeDays: 25 }
];

const CONTACTS_DATA = [
  // Bio-Rad contacts
  { supplierIndex: 0, name: 'John Smith', role: 'Sales Manager', phone: '+1-555-0101', email: 'john.smith@biorad.test', isPrimary: true },
  { supplierIndex: 0, name: 'Sarah Johnson', role: 'Technical Support', phone: '+1-555-0102', email: 'sarah.j@biorad.test', isPrimary: false },
  { supplierIndex: 0, name: 'Mike Wilson', role: 'Account Manager', phone: '+1-555-0103', email: 'mike.w@biorad.test', isPrimary: false },
  // Ortho contacts
  { supplierIndex: 1, name: 'Emily Davis', role: 'Sales Representative', phone: '+1-555-0201', email: 'emily.d@ortho.test', isPrimary: true },
  { supplierIndex: 1, name: 'Robert Brown', role: 'Product Specialist', phone: '+1-555-0202', email: 'robert.b@ortho.test', isPrimary: false },
  { supplierIndex: 1, name: 'Lisa Anderson', role: 'Customer Service', phone: '+1-555-0203', email: 'lisa.a@ortho.test', isPrimary: false },
  // Grifols contacts
  { supplierIndex: 2, name: 'Carlos Rodriguez', role: 'Regional Manager', phone: '+34-555-0301', email: 'carlos.r@grifols.test', isPrimary: true },
  { supplierIndex: 2, name: 'Maria Garcia', role: 'Technical Advisor', phone: '+34-555-0302', email: 'maria.g@grifols.test', isPrimary: false },
  { supplierIndex: 2, name: 'Pablo Martinez', role: 'Logistics', phone: '+34-555-0303', email: 'pablo.m@grifols.test', isPrimary: false },
  // Immucor contacts
  { supplierIndex: 3, name: 'Jennifer White', role: 'Account Executive', phone: '+1-555-0401', email: 'jennifer.w@immucor.test', isPrimary: true },
  { supplierIndex: 3, name: 'David Lee', role: 'Technical Support', phone: '+1-555-0402', email: 'david.l@immucor.test', isPrimary: false },
  { supplierIndex: 3, name: 'Amanda Taylor', role: 'Order Processing', phone: '+1-555-0403', email: 'amanda.t@immucor.test', isPrimary: false },
  // DiaMed contacts
  { supplierIndex: 4, name: 'Thomas Mueller', role: 'Sales Director', phone: '+41-555-0501', email: 'thomas.m@diamed.test', isPrimary: true },
  { supplierIndex: 4, name: 'Anna Schmidt', role: 'Quality Assurance', phone: '+41-555-0502', email: 'anna.s@diamed.test', isPrimary: false },
  { supplierIndex: 4, name: 'Peter Weber', role: 'Logistics Manager', phone: '+41-555-0503', email: 'peter.w@diamed.test', isPrimary: false }
];

// 30 Reagents - distributed by category
const REAGENTS_DATA = [
  // REAGENT category (15 items)
  { name: 'Anti-A Monoclonal', catalogNumber: 'BRD-AA-001', category: 'REAGENT' as const, supplierIndex: 0 },
  { name: 'Anti-B Monoclonal', catalogNumber: 'BRD-AB-002', category: 'REAGENT' as const, supplierIndex: 0 },
  { name: 'Anti-D IgM', catalogNumber: 'BRD-AD-003', category: 'REAGENT' as const, supplierIndex: 0 },
  { name: 'Anti-D IgG', catalogNumber: 'OCD-AD-001', category: 'REAGENT' as const, supplierIndex: 1 },
  { name: 'Anti-C (Rh)', catalogNumber: 'OCD-AC-002', category: 'REAGENT' as const, supplierIndex: 1 },
  { name: 'Anti-c (Rh)', catalogNumber: 'GRF-AC-001', category: 'REAGENT' as const, supplierIndex: 2 },
  { name: 'Anti-E (Rh)', catalogNumber: 'GRF-AE-002', category: 'REAGENT' as const, supplierIndex: 2 },
  { name: 'Anti-e (Rh)', catalogNumber: 'GRF-AE-003', category: 'REAGENT' as const, supplierIndex: 2 },
  { name: 'Anti-K (Kell)', catalogNumber: 'IMC-AK-001', category: 'REAGENT' as const, supplierIndex: 3 },
  { name: 'Anti-Human Globulin (AHG)', catalogNumber: 'IMC-AHG-002', category: 'REAGENT' as const, supplierIndex: 3 },
  { name: 'LISS Solution', catalogNumber: 'DIA-LISS-001', category: 'REAGENT' as const, supplierIndex: 4 },
  { name: 'Bovine Albumin 22%', catalogNumber: 'DIA-ALB-002', category: 'REAGENT' as const, supplierIndex: 4 },
  { name: 'Enzyme Solution (Papain)', catalogNumber: 'BRD-ENZ-004', category: 'REAGENT' as const, supplierIndex: 0 },
  { name: 'Control Sera Positive', catalogNumber: 'OCD-CS-003', category: 'REAGENT' as const, supplierIndex: 1 },
  { name: 'Control Sera Negative', catalogNumber: 'OCD-CS-004', category: 'REAGENT' as const, supplierIndex: 1 },

  // CELLS category (10 items)
  { name: 'A1 Red Cells', catalogNumber: 'GRF-A1-001', category: 'CELLS' as const, supplierIndex: 2 },
  { name: 'A2 Red Cells', catalogNumber: 'GRF-A2-002', category: 'CELLS' as const, supplierIndex: 2 },
  { name: 'B Red Cells', catalogNumber: 'GRF-B-003', category: 'CELLS' as const, supplierIndex: 2 },
  { name: 'O Red Cells', catalogNumber: 'IMC-O-001', category: 'CELLS' as const, supplierIndex: 3 },
  { name: 'Screening Cells I', catalogNumber: 'IMC-SC1-002', category: 'CELLS' as const, supplierIndex: 3 },
  { name: 'Screening Cells II', catalogNumber: 'IMC-SC2-003', category: 'CELLS' as const, supplierIndex: 3 },
  { name: 'Screening Cells III', catalogNumber: 'DIA-SC3-001', category: 'CELLS' as const, supplierIndex: 4 },
  { name: 'Panel Cells (11 cell)', catalogNumber: 'DIA-PC11-002', category: 'CELLS' as const, supplierIndex: 4 },
  { name: 'Cord Blood Cells', catalogNumber: 'BRD-CBC-005', category: 'CELLS' as const, supplierIndex: 0 },
  { name: 'Coombs Control Cells', catalogNumber: 'BRD-CCC-006', category: 'CELLS' as const, supplierIndex: 0 },

  // CONSUMABLE category (5 items)
  { name: 'Gel Cards (ID-Card)', catalogNumber: 'DIA-GC-003', category: 'CONSUMABLE' as const, supplierIndex: 4 },
  { name: 'Pipette Tips (200μL)', catalogNumber: 'BRD-PT-007', category: 'CONSUMABLE' as const, supplierIndex: 0 },
  { name: 'Test Tubes (12x75mm)', catalogNumber: 'OCD-TT-005', category: 'CONSUMABLE' as const, supplierIndex: 1 },
  { name: 'Plate Covers', catalogNumber: 'GRF-PC-004', category: 'CONSUMABLE' as const, supplierIndex: 2 },
  { name: 'Specimen Labels', catalogNumber: 'IMC-SL-004', category: 'CONSUMABLE' as const, supplierIndex: 3 }
];

const BATCH_STATUSES = ['ACTIVE', 'CONSUMED', 'EXPIRED', 'INCOMING', 'ON_HOLD', 'DESTROYED'] as const;
const BATCH_STATUS_WEIGHTS = [60, 20, 10, 5, 3, 2]; // percentages

const ORDER_STATUSES = ['DRAFT', 'PENDING_SAP', 'APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED', 'CANCELLED'] as const;
const ORDER_STATUS_DISTRIBUTION = { DRAFT: 3, PENDING_SAP: 3, APPROVED: 6, PARTIALLY_RECEIVED: 5, FULLY_RECEIVED: 8, CLOSED: 4, CANCELLED: 1 };

const DELIVERY_STATUSES = ['NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const;
const WITHDRAWAL_STATUSES = ['DRAFT', 'SUBMITTED', 'APPROVED', 'SHIPPING', 'CLOSED', 'CANCELLED'] as const;
const SHIPMENT_STATUSES = ['DRAFT', 'SENT', 'RECEIVED', 'CANCELLED'] as const;

const ALERT_RULE_TYPES = ['EXPIRY_WARNING', 'LOW_STOCK', 'PENDING_SUPPLY', 'COUNT_REQUIRED', 'COA_MISSING', 'CUSTOM'] as const;
const ALERT_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

const HOSPITALS = [
  'בית חולים שיבא',
  'בית חולים איכילוב',
  'בית חולים הדסה עין כרם',
  'בית חולים רמב"ם',
  'בית חולים סורוקה',
  'מרכז רפואי מאיר',
  'בית חולים בילינסון',
  'מרכז רפואי כרמל'
];

const DEPARTMENTS = ['בנק דם', 'המטולוגיה', 'מעבדות', 'כללי'];

// ============================================================================
// SEEDER FUNCTIONS
// ============================================================================

async function createUsers(): Promise<Map<string, string>> {
  console.log('👥 Creating users...');
  const userIdMap = new Map<string, string>();
  const hashedPassword = await bcrypt.hash(QA_PASSWORD, 10);

  for (const userData of USERS_DATA) {
    const existing = await prisma.user.findUnique({ where: { email: userData.email } });
    if (existing) {
      userIdMap.set(userData.email, existing.id);
      console.log(`   ⚠️  User ${userData.email} already exists`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        isActive: true
      }
    });
    userIdMap.set(userData.email, user.id);
    console.log(`   ✅ Created user: ${userData.email} (${userData.role})`);
  }

  console.log(`   Total users: ${userIdMap.size}`);
  return userIdMap;
}

async function createSuppliers(): Promise<string[]> {
  console.log('🏭 Creating suppliers...');
  const supplierIds: string[] = [];

  for (const supplierData of SUPPLIERS_DATA) {
    const existing = await prisma.supplier.findUnique({ where: { name: supplierData.name } });
    if (existing) {
      supplierIds.push(existing.id);
      console.log(`   ⚠️  Supplier ${supplierData.name} already exists`);
      continue;
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: supplierData.name,
        shortCode: supplierData.shortCode,
        defaultCurrency: supplierData.defaultCurrency,
        isPreferred: supplierData.isPreferred,
        leadTimeDays: supplierData.leadTimeDays,
        isActive: true,
        address: `123 ${supplierData.name} Street, Industry City`,
        phone: `+1-555-${String(supplierIds.length + 1).padStart(4, '0')}`,
        email: `info@${supplierData.shortCode.toLowerCase()}.test`,
        website: `https://www.${supplierData.shortCode.toLowerCase()}.test`,
        paymentTerms: 'Net 30'
      }
    });
    supplierIds.push(supplier.id);
    console.log(`   ✅ Created supplier: ${supplierData.name}`);
  }

  // Create contacts
  console.log('   📇 Creating supplier contacts...');
  for (const contactData of CONTACTS_DATA) {
    const supplierId = supplierIds[contactData.supplierIndex];
    if (!supplierId) continue;

    const existingContact = await prisma.supplierContact.findFirst({
      where: { supplierId, email: contactData.email }
    });

    if (!existingContact) {
      await prisma.supplierContact.create({
        data: {
          supplierId,
          name: contactData.name,
          role: contactData.role,
          phone: contactData.phone,
          email: contactData.email,
          isPrimary: contactData.isPrimary,
          isActive: true
        }
      });
    }
  }
  console.log(`   Total contacts created: ${CONTACTS_DATA.length}`);

  return supplierIds;
}

async function createReagents(supplierIds: string[]): Promise<string[]> {
  console.log('🧪 Creating reagents...');
  const reagentIds: string[] = [];

  for (const reagentData of REAGENTS_DATA) {
    const supplierId = supplierIds[reagentData.supplierIndex];
    if (!supplierId) continue;

    const existing = await prisma.reagent.findFirst({
      where: {
        name: reagentData.name,
        supplierId
      }
    });

    if (existing) {
      reagentIds.push(existing.id);
      continue;
    }

    const reagent = await prisma.reagent.create({
      data: {
        name: reagentData.name,
        catalogNumber: reagentData.catalogNumber,
        category: reagentData.category,
        supplierId,
        totalQuantity: 0,
        activeBatchesCount: 0,
        averageMonthlyUsage: randomInt(5, 50),
        requiresBatches: reagentData.category !== 'CONSUMABLE',
        isConsumable: reagentData.category === 'CONSUMABLE'
      }
    });
    reagentIds.push(reagent.id);
  }

  console.log(`   Total reagents: ${reagentIds.length}`);
  return reagentIds;
}

function getWeightedBatchStatus(): typeof BATCH_STATUSES[number] {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < BATCH_STATUSES.length; i++) {
    cumulative += BATCH_STATUS_WEIGHTS[i];
    if (rand <= cumulative) {
      return BATCH_STATUSES[i];
    }
  }
  return 'ACTIVE';
}

async function createBatches(reagentIds: string[], deliveryIds: string[]): Promise<string[]> {
  console.log('📦 Creating batches...');
  const batchIds: string[] = [];
  const now = new Date();

  // Create 100 batches distributed across reagents
  for (let i = 0; i < 100; i++) {
    const reagentId = randomElement(reagentIds);
    const status = getWeightedBatchStatus();

    // Calculate expiry date based on status
    let expiryDate: Date;
    if (status === 'EXPIRED') {
      // Expired: past date
      expiryDate = randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000));
    } else if (i < 5) {
      // 5% within 7 days
      expiryDate = randomDate(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (i < 20) {
      // 15% within 30 days
      expiryDate = randomDate(new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
    } else if (i < 45) {
      // 25% within 90 days
      expiryDate = randomDate(new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000));
    } else {
      // 45% future (>90 days)
      expiryDate = randomDate(new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));
    }

    // Use decimal values to test precision (0.25, 0.5, 0.75)
    const initialQuantity = randomDecimal(10, 200);
    let currentQuantity = initialQuantity;

    // Adjust current quantity based on status
    if (status === 'CONSUMED') {
      currentQuantity = 0;
    } else if (status === 'ACTIVE') {
      // Use decimal values for current quantity to test precision
      currentQuantity = randomDecimal(Math.floor(initialQuantity * 0.3), Math.floor(initialQuantity));
    } else if (status === 'DESTROYED') {
      currentQuantity = 0;
    }

    const batchNumber = `LOT-${now.getFullYear()}-${String(i + 1).padStart(5, '0')}`;

    // Check if batch already exists
    const existing = await prisma.reagentBatch.findFirst({
      where: { reagentId, batchNumber }
    });

    if (existing) {
      batchIds.push(existing.id);
      continue;
    }

    const batch = await prisma.reagentBatch.create({
      data: {
        reagentId,
        batchNumber,
        expiryDate,
        manufactureDate: new Date(expiryDate.getTime() - 365 * 24 * 60 * 60 * 1000),
        initialQuantity: initialQuantity,
        currentQuantity: currentQuantity,
        reservedQuantity: 0,
        receivedDate: randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now),
        deliveryId: deliveryIds.length > 0 ? randomElement(deliveryIds) : null,
        status,
        qcStatus: status === 'ON_HOLD' ? 'REQUIRES_REVIEW' : (Math.random() > 0.1 ? 'APPROVED' : 'PENDING'),
        coaDocumentUrl: Math.random() > 0.7 ? `https://example.com/coa/${batchNumber}.pdf` : null,
        storageLocation: `Rack ${String.fromCharCode(65 + randomInt(0, 5))}${randomInt(1, 10)}`,
        storageConditions: randomElement(['2-8°C', '15-25°C', '-20°C', '-80°C'])
      }
    });
    batchIds.push(batch.id);
  }

  console.log(`   Total batches: ${batchIds.length}`);
  return batchIds;
}

async function createOrders(supplierIds: string[], reagentIds: string[]): Promise<string[]> {
  console.log('📋 Creating orders...');
  const orderIds: string[] = [];
  const now = new Date();
  let orderIndex = 1;

  // Create orders according to status distribution
  for (const [status, count] of Object.entries(ORDER_STATUS_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      const supplierId = randomElement(supplierIds);
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      const isFramework = Math.random() > 0.7;

      const tempNumber = generateTempNumber('ORD', orderIndex++);

      const existing = await prisma.order.findUnique({ where: { tempNumber } });
      if (existing) {
        orderIds.push(existing.id);
        continue;
      }

      const orderDate = randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now);

      const order = await prisma.order.create({
        data: {
          tempNumber,
          permanentNumber: ['APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED'].includes(status)
            ? `SAP-${String(orderIndex).padStart(6, '0')}`
            : null,
          sapPurchaseOrder: ['APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED'].includes(status)
            ? `PO-${String(orderIndex).padStart(8, '0')}`
            : null,
          supplierId,
          supplierSnapshot: supplier?.name || 'Unknown Supplier',
          orderType: isFramework ? 'FRAMEWORK' : 'IMMEDIATE',
          status: status as typeof ORDER_STATUSES[number],
          orderDate,
          expectedDeliveryStart: new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000),
          expectedDeliveryEnd: new Date(orderDate.getTime() + 30 * 24 * 60 * 60 * 1000),
          closedDate: status === 'CLOSED' ? randomDate(orderDate, now) : null,
          currency: supplier?.defaultCurrency || 'ILS',
          internalNotes: `QA Test Order ${orderIndex}`
        }
      });

      // Add 1-5 order items with decimal quantities for precision testing
      const itemCount = randomInt(1, 5);
      for (let j = 0; j < itemCount; j++) {
        const reagentId = randomElement(reagentIds);
        const requestedQty = randomDecimal(10, 100);

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            reagentId,
            requestedQuantity: requestedQty,
            approvedQuantity: ['APPROVED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED'].includes(status)
              ? requestedQty
              : null,
            receivedQuantity: 
              status === 'FULLY_RECEIVED' || status === 'CLOSED' ? requestedQty :
              status === 'PARTIALLY_RECEIVED' ? requestedQty * 0.5 : 0,
            unitPrice: randomDecimal(50, 500),
            currency: supplier?.defaultCurrency || 'ILS'
          }
        });
      }

      // Create framework order extension if applicable
      if (isFramework && order.orderType === 'FRAMEWORK') {
        await prisma.frameworkOrder.create({
          data: {
            orderId: order.id,
            validFrom: orderDate,
            validTo: new Date(orderDate.getTime() + 365 * 24 * 60 * 60 * 1000),
            maxTotalQuantity: 1000,
            availableQuantity: randomInt(100, 1000)
          }
        });
      }

      orderIds.push(order.id);
    }
  }

  console.log(`   Total orders: ${orderIds.length}`);
  return orderIds;
}

async function createDeliveries(supplierIds: string[], orderIds: string[], reagentIds: string[]): Promise<string[]> {
  console.log('🚚 Creating deliveries...');
  const deliveryIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const supplierId = randomElement(supplierIds);
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    const status = randomElement(DELIVERY_STATUSES);

    const deliveryNumber = generateTempNumber('DEL', i + 1);

    const existing = await prisma.delivery.findUnique({ where: { deliveryNumber } });
    if (existing) {
      deliveryIds.push(existing.id);
      continue;
    }

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        supplierId,
        supplierSnapshot: supplier?.name || 'Unknown Supplier',
        orderId: orderIds.length > 0 && Math.random() > 0.3 ? randomElement(orderIds) : null,
        deliveryDate: randomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now),
        status,
        isRecurringSupply: Math.random() > 0.7,
        notes: `QA Test Delivery ${i + 1}`
      }
    });

    // Add 1-4 delivery items with decimal quantities for precision testing
    const itemCount = randomInt(1, 4);
    for (let j = 0; j < itemCount; j++) {
      const reagentId = randomElement(reagentIds);
      const quantity = randomDecimal(5, 50);

      await prisma.deliveryItem.create({
        data: {
          deliveryId: delivery.id,
          reagentId,
          batchNumber: `LOT-DEL-${i + 1}-${j + 1}`,
          quantity: quantity,
          expiryDate: new Date(now.getTime() + randomInt(90, 365) * 24 * 60 * 60 * 1000),
          acceptedQuantity: status === 'COMPLETED' ? quantity : null,
          rejectedQuantity: status === 'COMPLETED' && Math.random() > 0.9
            ? randomDecimal(0.25, 5)
            : null
        }
      });
    }

    deliveryIds.push(delivery.id);
  }

  console.log(`   Total deliveries: ${deliveryIds.length}`);
  return deliveryIds;
}

async function createWithdrawals(supplierIds: string[], reagentIds: string[]): Promise<string[]> {
  console.log('📤 Creating withdrawals...');
  const withdrawalIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const supplierId = randomElement(supplierIds);
    const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
    const status = randomElement(WITHDRAWAL_STATUSES);

    const withdrawalNumber = generateTempNumber('WDR', i + 1);

    const existing = await prisma.withdrawalRequest.findUnique({ where: { withdrawalNumber } });
    if (existing) {
      withdrawalIds.push(existing.id);
      continue;
    }

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        withdrawalNumber,
        supplierId,
        supplierSnapshot: supplier?.name || 'Unknown Supplier',
        status,
        requestDate: randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now),
        approvalDate: ['APPROVED', 'SHIPPING', 'CLOSED'].includes(status)
          ? randomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now)
          : null,
        completionDate: status === 'CLOSED'
          ? randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now)
          : null,
        requesterNotes: `QA Test Withdrawal ${i + 1}`
      }
    });

    // Add 1-3 withdrawal items with decimal quantities for precision testing
    const itemCount = randomInt(1, 3);
    for (let j = 0; j < itemCount; j++) {
      const reagentId = randomElement(reagentIds);
      const requestedQty = randomDecimal(5, 30);

      await prisma.withdrawalItem.create({
        data: {
          withdrawalRequestId: withdrawal.id,
          reagentId,
          requestedQuantity: requestedQty,
          approvedQuantity: ['APPROVED', 'SHIPPING', 'CLOSED'].includes(status)
            ? requestedQty
            : null,
          fulfilledQuantity: 
            status === 'CLOSED' ? requestedQty :
            status === 'SHIPPING' ? requestedQty * 0.75 : 0
        }
      });
    }

    withdrawalIds.push(withdrawal.id);
  }

  console.log(`   Total withdrawals: ${withdrawalIds.length}`);
  return withdrawalIds;
}

async function createShipments(reagentIds: string[], batchIds: string[]): Promise<string[]> {
  console.log('📬 Creating shipments...');
  const shipmentIds: string[] = [];
  const now = new Date();

  for (let i = 0; i < 15; i++) {
    const status = randomElement(SHIPMENT_STATUSES);
    const shipmentNumber = generateTempNumber('SHP', i + 1);

    const existing = await prisma.shipment.findUnique({ where: { shipmentNumber } });
    if (existing) {
      shipmentIds.push(existing.id);
      continue;
    }

    const shipment = await prisma.shipment.create({
      data: {
        shipmentNumber,
        destinationHospital: randomElement(HOSPITALS),
        destinationDepartment: randomElement(DEPARTMENTS),
        shipmentDate: randomDate(new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), now),
        status,
        notes: `QA Test Shipment ${i + 1}`
      }
    });

    // Add 1-4 shipment items with decimal quantities for precision testing
    const itemCount = randomInt(1, 4);
    for (let j = 0; j < itemCount; j++) {
      const reagentId = randomElement(reagentIds);

      await prisma.shipmentItem.create({
        data: {
          shipmentId: shipment.id,
          reagentId,
          batchId: batchIds.length > 0 ? randomElement(batchIds) : null,
          quantity: randomDecimal(1, 20)
        }
      });
    }

    shipmentIds.push(shipment.id);
  }

  console.log(`   Total shipments: ${shipmentIds.length}`);
  return shipmentIds;
}

async function createInventoryTransactions(reagentIds: string[], batchIds: string[], userIds: Map<string, string>): Promise<void> {
  console.log('📊 Creating inventory transactions...');
  const now = new Date();
  const transactionTypes = ['RECEIPT', 'CONSUMPTION', 'WITHDRAWAL', 'ADJUSTMENT', 'DESTRUCTION', 'TRANSFER_IN', 'TRANSFER_OUT'] as const;
  const userIdArray = Array.from(userIds.values());

  for (let i = 0; i < 200; i++) {
    const reagentId = randomElement(reagentIds);
    const transactionType = randomElement(transactionTypes);

    // Determine quantity delta based on type with decimal precision
    let quantityDelta: number;
    switch (transactionType) {
      case 'RECEIPT':
      case 'TRANSFER_IN':
        quantityDelta = randomDecimal(5, 50);
        break;
      case 'CONSUMPTION':
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
        quantityDelta = -randomDecimal(1, 20);
        break;
      case 'DESTRUCTION':
        quantityDelta = -randomDecimal(5, 30);
        break;
      case 'ADJUSTMENT':
        quantityDelta = randomDecimal(-10, 10);
        break;
      default:
        quantityDelta = randomDecimal(-5, 5);
    }

    await prisma.inventoryTransaction.create({
      data: {
        reagentId,
        batchId: batchIds.length > 0 ? randomElement(batchIds) : null,
        transactionType,
        quantityDelta: quantityDelta,
        sourceType: randomElement(['delivery', 'withdrawal', 'count', 'destruction', 'manual']),
        sourceId: `QA-${i + 1}`,
        performedById: randomElement(userIdArray),
        notes: `QA Transaction ${i + 1}`,
        createdAt: randomDate(new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), now)
      }
    });
  }

  console.log('   Total transactions: 200');
}

async function createAlertRulesAndAlerts(reagentIds: string[]): Promise<void> {
  console.log('🚨 Creating alert rules and alerts...');
  const now = new Date();

  // Create 10 alert rules
  const alertRules: { id: string; ruleType: string }[] = [];

  const ruleDefinitions = [
    { ruleType: 'EXPIRY_WARNING', name: 'התראת פג תוקף - 30 יום', thresholdDays: 30 },
    { ruleType: 'EXPIRY_WARNING', name: 'התראת פג תוקף - 7 ימים', thresholdDays: 7 },
    { ruleType: 'LOW_STOCK', name: 'מלאי נמוך - ריאגנטים', thresholdQuantity: 10, categories: ['REAGENT'] },
    { ruleType: 'LOW_STOCK', name: 'מלאי נמוך - כדוריות', thresholdQuantity: 5, categories: ['CELLS'] },
    { ruleType: 'LOW_STOCK', name: 'מלאי נמוך - מתכלים', thresholdQuantity: 50, categories: ['CONSUMABLE'] },
    { ruleType: 'PENDING_SUPPLY', name: 'אספקה ממתינה מעל 14 יום', thresholdDays: 14 },
    { ruleType: 'COUNT_REQUIRED', name: 'נדרשת ספירת מלאי חודשית', thresholdDays: 30 },
    { ruleType: 'COA_MISSING', name: 'חסר COA לאצווה', thresholdDays: 7 },
    { ruleType: 'CUSTOM', name: 'התראה מותאמת - בדיקות איכות', thresholdDays: null },
    { ruleType: 'EXPIRY_WARNING', name: 'התראת פג תוקף קריטית - 3 ימים', thresholdDays: 3 }
  ];

  for (const ruleDef of ruleDefinitions) {
    const existing = await prisma.alertRule.findFirst({
      where: { name: ruleDef.name }
    });

    if (existing) {
      alertRules.push({ id: existing.id, ruleType: existing.ruleType });
      continue;
    }

    const rule = await prisma.alertRule.create({
      data: {
        ruleType: ruleDef.ruleType as typeof ALERT_RULE_TYPES[number],
        name: ruleDef.name,
        description: `QA Alert Rule: ${ruleDef.name}`,
        thresholdDays: ruleDef.thresholdDays,
        thresholdQuantity: ruleDef.thresholdQuantity ? ruleDef.thresholdQuantity : null,
        appliesToCategories: JSON.stringify(ruleDef.categories || []),
        isActive: true
      }
    });
    alertRules.push({ id: rule.id, ruleType: rule.ruleType });
  }

  console.log(`   Created ${alertRules.length} alert rules`);

  // Create 30 active alerts
  for (let i = 0; i < 30; i++) {
    const rule = randomElement(alertRules);
    const severity = randomElement(ALERT_SEVERITIES);
    const status = randomElement(['NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'] as const);

    await prisma.activeAlert.create({
      data: {
        alertRuleId: rule.id,
        entityType: 'reagent',
        entityId: randomElement(reagentIds),
        severity,
        status,
        message: `QA Alert ${i + 1}: ${rule.ruleType} triggered`,
        details: JSON.stringify({ qaTest: true, index: i + 1 }),
        resolvedAt: status === 'RESOLVED' ? randomDate(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), now) : null,
        createdAt: randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now)
      }
    });
  }

  console.log('   Total active alerts: 30');
}

async function createActivityLogs(userIds: Map<string, string>, reagentIds: string[]): Promise<void> {
  console.log('📝 Creating activity logs...');
  const now = new Date();
  const userIdArray = Array.from(userIds.values());

  const actions = [
    'user.login', 'user.logout',
    'reagent.create', 'reagent.update', 'reagent.delete',
    'batch.create', 'batch.update', 'batch.status_change',
    'order.create', 'order.approve', 'order.cancel',
    'delivery.create', 'delivery.receive', 'delivery.complete',
    'withdrawal.create', 'withdrawal.approve', 'withdrawal.ship',
    'shipment.create', 'shipment.send', 'shipment.receive',
    'inventory.count', 'inventory.adjust',
    'alert.resolve', 'alert.dismiss'
  ];

  const entityTypes = ['user', 'reagent', 'batch', 'order', 'delivery', 'withdrawal', 'shipment', 'inventory', 'alert'];

  for (let i = 0; i < 200; i++) {
    const action = randomElement(actions);
    const entityType = action.split('.')[0];

    await prisma.activityLog.create({
      data: {
        userId: randomElement(userIdArray),
        action,
        entityType,
        entityId: entityType === 'reagent' ? randomElement(reagentIds) : `QA-${entityType}-${i + 1}`,
        details: JSON.stringify({ qaTest: true, index: i + 1 }),
        ipAddress: `192.168.1.${randomInt(1, 254)}`,
        userAgent: 'QA Test Agent',
        createdAt: randomDate(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), now)
      }
    });
  }

  console.log('   Total activity logs: 200');
}

async function updateReagentAggregates(reagentIds: string[]): Promise<void> {
  console.log('🔄 Updating reagent aggregates...');

  for (const reagentId of reagentIds) {
    // Calculate aggregates from batches
    const batches = await prisma.reagentBatch.findMany({
      where: { reagentId, status: 'ACTIVE' }
    });

    const totalQuantity = batches.reduce((sum, b) => sum + Number(b.currentQuantity), 0);
    const activeBatchesCount = batches.length;
    const nearestExpiryDate = batches.length > 0
      ? batches.reduce((min, b) => b.expiryDate < min ? b.expiryDate : min, batches[0].expiryDate)
      : null;

    // Determine stock status
    let currentStockStatus: 'NORMAL' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK' = 'NORMAL';
    if (totalQuantity === 0) {
      currentStockStatus = 'OUT_OF_STOCK';
    } else if (totalQuantity < 5) {
      currentStockStatus = 'CRITICAL';
    } else if (totalQuantity < 20) {
      currentStockStatus = 'LOW';
    }

    await prisma.reagent.update({
      where: { id: reagentId },
      data: {
        totalQuantity: totalQuantity,
        activeBatchesCount,
        nearestExpiryDate,
        currentStockStatus
      }
    });
  }

  console.log(`   Updated ${reagentIds.length} reagents`);
}

async function createInventoryCounts(userIds: Map<string, string>, reagentIds: string[], batchIds: string[]): Promise<void> {
  console.log('📋 Creating inventory counts...');
  const now = new Date();
  const userIdArray = Array.from(userIds.values());

  // Create 5 inventory count drafts with mixed statuses
  const statuses = ['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'COMPLETED', 'DRAFT'] as const;

  for (let i = 0; i < 5; i++) {
    const status = statuses[i];
    const startedAt = randomDate(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), now);
    
    const draft = await prisma.inventoryCountDraft.create({
      data: {
        status,
        startedAt,
        lastSavedAt: status === 'COMPLETED' ? randomDate(startedAt, now) : startedAt,
        startedById: randomElement(userIdArray),
      }
    });

    // Add 5-15 entries per draft
    const entryCount = randomInt(5, 15);
    const usedReagents = new Set<string>();

    for (let j = 0; j < entryCount; j++) {
      let reagentId = randomElement(reagentIds);
      // Try to find a unique reagent for this count to avoid duplicates
      let attempts = 0;
      while (usedReagents.has(reagentId) && attempts < 10) {
        reagentId = randomElement(reagentIds);
        attempts++;
      }
      usedReagents.add(reagentId);

      const batchId = Math.random() > 0.3 ? randomElement(batchIds) : null;
      let batchNumber = null;
      
      if (batchId) {
        const batch = await prisma.reagentBatch.findUnique({ where: { id: batchId } });
        if (batch && batch.reagentId === reagentId) {
          batchNumber = batch.batchNumber;
        }
      }

      await prisma.inventoryCountEntry.create({
        data: {
          countDraftId: draft.id,
          reagentId,
          batchNumber,
          countedQuantity: randomDecimal(0, 100),
          expiryDate: batchNumber ? randomDate(now, new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) : null,
          notes: Math.random() > 0.8 ? 'Double checked' : null
        }
      });
    }

    if (status === 'COMPLETED') {
      await prisma.completedInventoryCount.create({
        data: {
          countDate: draft.startedAt,
          completedAt: draft.lastSavedAt,
          totalReagentsCounted: entryCount,
          totalBatchesCounted: randomInt(entryCount, entryCount * 1.5),
          completedById: draft.startedById,
          varianceSummary: JSON.stringify({
            totalVariance: randomDecimal(-10, 10),
            itemsWithVariance: randomInt(0, 3)
          })
        }
      });
    }
  }
  
  console.log('   Total inventory counts: 5');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('\n🧪 Flow Control QA Test Data Seeder');
  console.log('====================================\n');
  console.log('⚠️  This will add comprehensive test data to your database.');
  console.log('   Run on a test/development database only!\n');

  try {
    // Phase 1: Users
    const userIds = await createUsers();

    // Phase 2: Suppliers and Contacts
    const supplierIds = await createSuppliers();

    // Phase 3: Reagents
    const reagentIds = await createReagents(supplierIds);

    // Phase 4: Orders (before deliveries since deliveries reference orders)
    const orderIds = await createOrders(supplierIds, reagentIds);

    // Phase 5: Deliveries
    const deliveryIds = await createDeliveries(supplierIds, orderIds, reagentIds);

    // Phase 6: Batches (after deliveries so they can reference them)
    const batchIds = await createBatches(reagentIds, deliveryIds);

    // Phase 7: Withdrawals
    await createWithdrawals(supplierIds, reagentIds);

    // Phase 8: Shipments
    await createShipments(reagentIds, batchIds);

    // Phase 9: Inventory Transactions
    await createInventoryTransactions(reagentIds, batchIds, userIds);

    // Phase 10: Alerts
    await createAlertRulesAndAlerts(reagentIds);

    // Phase 11: Activity Logs
    await createActivityLogs(userIds, reagentIds);

    // Phase 12: Update Reagent Aggregates
    await updateReagentAggregates(reagentIds);

    // Phase 13: Inventory Counts
    await createInventoryCounts(userIds, reagentIds, batchIds);

    console.log('\n====================================');
    console.log('🎉 QA Seed completed successfully!');
    console.log('====================================');
    console.log('\nTest Credentials:');
    console.log(`   All users password: ${QA_PASSWORD}`);
    console.log('\nUser Accounts:');
    USERS_DATA.forEach(u => console.log(`   ${u.email} (${u.role})`));
    console.log('\n');

  } catch (error) {
    console.error('\n❌ QA Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ QA Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
