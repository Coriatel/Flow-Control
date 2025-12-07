/**
 * Seed script for Flow Control database
 * Loads data from CSV files in DOCS folder
 *
 * Run: npx ts-node scripts/seed.ts
 */

import { PrismaClient, Category, BatchStatus } from '../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DOCS_PATH = path.join(__dirname, '../../DOCS');

interface CSVRow {
  [key: string]: string;
}

/**
 * Parse CSV content to array of objects
 */
function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter((line) => line.trim());
  if (lines.length < 2) return [];

  // Parse header - handle Hebrew BOM and quotes
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map((h) => h.replace(/^"|"$/g, '').trim());

  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.replace(/^"|"$/g, '') || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Map Hebrew category to enum
 */
function mapCategory(hebrewCategory: string): Category {
  const lower = hebrewCategory.toLowerCase();
  if (lower.includes('cells') || lower.includes('כדוריות')) return 'CELLS';
  if (lower.includes('control') || lower.includes('בקרה')) return 'CONSUMABLE';
  return 'REAGENT';
}

/**
 * Map Hebrew status to enum
 */
function mapBatchStatus(hebrewStatus: string): BatchStatus {
  const lower = hebrewStatus.toLowerCase();
  if (lower === 'active' || lower === 'פעיל') return 'ACTIVE';
  if (lower === 'consumed' || lower === 'נצרך') return 'CONSUMED';
  if (lower === 'expired' || lower === 'פג תוקף') return 'EXPIRED';
  if (lower === 'disposed' || lower === 'הושמד') return 'DESTROYED';
  return 'ACTIVE';
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) return isoDate;
  // Try DD/MM/YYYY
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return null;
}

async function seedSuppliers() {
  console.log('Seeding suppliers...');

  const filePath = path.join(DOCS_PATH, 'Supplier_2025-10-30.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  const suppliers: { id: string; name: string; shortCode: string; isActive: boolean }[] = [];

  for (const row of rows) {
    const id = row['מזהה'] || row['id'];
    const name = row['שם'] || row['name'];
    const shortCode = row['קוד'] || row['code'] || '';
    const isActive = (row['פעיל'] || row['active'] || '').toLowerCase() !== 'לא';

    if (name) {
      suppliers.push({ id, name, shortCode, isActive });
    }
  }

  // Upsert suppliers
  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { name: supplier.name },
      update: {
        shortCode: supplier.shortCode || undefined,
        isActive: supplier.isActive,
      },
      create: {
        name: supplier.name,
        shortCode: supplier.shortCode || undefined,
        isActive: supplier.isActive,
      },
    });
  }

  console.log(`  Created/updated ${suppliers.length} suppliers`);
  return suppliers;
}

async function seedReagents() {
  console.log('Seeding reagents...');

  const filePath = path.join(DOCS_PATH, 'Reagent_2025-10-30.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  let count = 0;

  for (const row of rows) {
    const name = row['שם'] || row['name'];
    const supplierName = row['ספק'] || row['supplier'];
    const catalogNumber = row['מק"ט'] || row['catalog_number'] || '';
    const category = mapCategory(row['קטגוריה'] || row['category'] || '');
    const notes = row['הערות'] || row['notes'] || '';

    if (!name || !supplierName) continue;

    // Find or create supplier
    let supplier = await prisma.supplier.findUnique({
      where: { name: supplierName },
    });

    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: { name: supplierName },
      });
    }

    // Check if reagent exists
    const existing = await prisma.reagent.findFirst({
      where: {
        name,
        supplierId: supplier.id,
      },
    });

    if (!existing) {
      await prisma.reagent.create({
        data: {
          name,
          catalogNumber: catalogNumber || undefined,
          category,
          supplierId: supplier.id,
          notes: notes || undefined,
        },
      });
      count++;
    }
  }

  console.log(`  Created ${count} reagents`);
}

async function seedBatches() {
  console.log('Seeding batches...');

  const filePath = path.join(DOCS_PATH, 'ReagentBatch_2025-10-30.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  let count = 0;

  // Get reagent ID mapping from CSV reagent IDs to our IDs
  const reagentMap = new Map<string, string>();
  const reagentsFilePath = path.join(DOCS_PATH, 'Reagent_2025-10-30.csv');
  const reagentsContent = fs.readFileSync(reagentsFilePath, 'utf-8');
  const reagentRows = parseCSV(reagentsContent);

  for (const row of reagentRows) {
    const csvId = row['מזהה'] || row['id'];
    const name = row['שם'] || row['name'];
    const supplierName = row['ספק'] || row['supplier'];

    if (csvId && name && supplierName) {
      const supplier = await prisma.supplier.findUnique({
        where: { name: supplierName },
      });

      if (supplier) {
        const reagent = await prisma.reagent.findFirst({
          where: { name, supplierId: supplier.id },
        });

        if (reagent) {
          reagentMap.set(csvId, reagent.id);
        }
      }
    }
  }

  for (const row of rows) {
    const csvReagentId = row['מזהה ריאגנט'] || row['reagent_id'];
    const batchNumber = row['אצווה'] || row['batch'] || '';
    const expiryDateStr = row['תפוגה'] || row['expiry'] || '';
    const quantityStr = row['כמות'] || row['quantity'] || '0';
    const statusStr = row['סטטוס'] || row['status'] || 'active';

    const reagentId = reagentMap.get(csvReagentId);
    if (!reagentId || !batchNumber) continue;

    const expiryDate = parseDate(expiryDateStr);
    if (!expiryDate) continue;

    const quantity = parseFloat(quantityStr) || 0;
    const status = mapBatchStatus(statusStr);

    // Check if batch exists
    const existing = await prisma.reagentBatch.findFirst({
      where: {
        reagentId,
        batchNumber,
      },
    });

    if (!existing) {
      await prisma.reagentBatch.create({
        data: {
          reagentId,
          batchNumber,
          expiryDate,
          initialQuantity: quantity,
          currentQuantity: quantity,
          receivedDate: new Date(),
          status,
        },
      });
      count++;
    }
  }

  console.log(`  Created ${count} batches`);
}

async function seedSupplierContacts() {
  console.log('Seeding supplier contacts...');

  const filePath = path.join(DOCS_PATH, 'SupplierContact_2025-10-30.csv');

  if (!fs.existsSync(filePath)) {
    console.log('  No contacts file found, skipping');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  let count = 0;

  for (const row of rows) {
    const supplierName = row['ספק'] || row['supplier'];
    const name = row['שם'] || row['name'];
    const phone = row['טלפון'] || row['phone'] || '';
    const email = row['אימייל'] || row['email'] || '';
    const role = row['תפקיד'] || row['role'] || '';

    if (!supplierName || !name) continue;

    const supplier = await prisma.supplier.findUnique({
      where: { name: supplierName },
    });

    if (!supplier) continue;

    // Check if contact exists
    const existing = await prisma.supplierContact.findFirst({
      where: {
        supplierId: supplier.id,
        name,
      },
    });

    if (!existing) {
      await prisma.supplierContact.create({
        data: {
          supplierId: supplier.id,
          name,
          phone: phone || undefined,
          email: email || undefined,
          role: role || undefined,
        },
      });
      count++;
    }
  }

  console.log(`  Created ${count} contacts`);
}

async function updateReagentAggregates() {
  console.log('Updating reagent aggregates...');

  const reagents = await prisma.reagent.findMany();

  for (const reagent of reagents) {
    const batches = await prisma.reagentBatch.findMany({
      where: {
        reagentId: reagent.id,
        status: 'ACTIVE',
      },
      orderBy: { expiryDate: 'asc' },
    });

    const totalQuantity = batches.reduce(
      (sum, b) => sum + Number(b.currentQuantity),
      0
    );

    await prisma.reagent.update({
      where: { id: reagent.id },
      data: {
        totalQuantity,
        activeBatchesCount: batches.length,
        nearestExpiryDate: batches[0]?.expiryDate || null,
      },
    });
  }

  console.log(`  Updated ${reagents.length} reagents`);
}

async function seedAlertRules() {
  console.log('Seeding default alert rules...');

  const rules = [
    {
      ruleType: 'EXPIRY_WARNING' as const,
      name: 'התראת תפוגה כדוריות',
      description: 'התראה 10 ימים לפני פג תוקף לכדוריות',
      thresholdDays: 10,
      appliesToCategories: ['CELLS'],
    },
    {
      ruleType: 'EXPIRY_WARNING' as const,
      name: 'התראת תפוגה ריאגנטים',
      description: 'התראה 30 ימים לפני פג תוקף לריאגנטים',
      thresholdDays: 30,
      appliesToCategories: ['REAGENT', 'CONSUMABLE'],
    },
    {
      ruleType: 'LOW_STOCK' as const,
      name: 'מלאי נמוך',
      description: 'התראה כשמלאי מתחת ל-2 חודשים',
      thresholdMonths: 2,
      appliesToCategories: ['REAGENT', 'CELLS', 'CONSUMABLE'],
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.alertRule.findFirst({
      where: { name: rule.name },
    });

    if (!existing) {
      await prisma.alertRule.create({ data: rule });
    }
  }

  console.log(`  Created ${rules.length} alert rules`);
}

async function seedSystemSettings() {
  console.log('Seeding system settings...');

  const settings = [
    { key: 'alertDaysReagents', value: 30, description: 'Days before expiry to alert for reagents' },
    { key: 'alertDaysCells', value: 10, description: 'Days before expiry to alert for cells' },
    { key: 'lowStockMonthsThreshold', value: 2, description: 'Months of stock threshold for low stock alert' },
    { key: 'inventoryCountReminderDays', value: 30, description: 'Days between inventory count reminders' },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log(`  Created ${settings.length} settings`);
}

async function main() {
  console.log('\n=== Flow Control Database Seed ===\n');

  try {
    await seedSuppliers();
    await seedReagents();
    await seedBatches();
    await seedSupplierContacts();
    await updateReagentAggregates();
    await seedAlertRules();
    await seedSystemSettings();

    console.log('\n=== Seed completed successfully! ===\n');
  } catch (error) {
    console.error('\nSeed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
