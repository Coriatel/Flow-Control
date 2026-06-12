#!/usr/bin/env node
/*
 * Flow Control blood-bank demo seed.
 * Default: dry-run only. Use --apply to replace demo inventory/procurement data.
 */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('../generated/prisma');

const APPLY = process.argv.includes('--apply');
const today = new Date();
today.setHours(12, 0, 0, 0);

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5440/flow_control?schema=inventory';
}

const prisma = new PrismaClient();

const addDays = (days) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d;
};

const suppliers = [
  { key: 'biorad', name: 'Bio-Rad Laboratories', shortCode: 'BIORAD', leadTimeDays: 14, email: 'orders@demo-biorad.invalid' },
  { key: 'ortho', name: 'QuidelOrtho', shortCode: 'ORTHO', leadTimeDays: 18, email: 'orders@demo-ortho.invalid' },
  { key: 'immucor', name: 'Immucor', shortCode: 'IMMUCOR', leadTimeDays: 10, email: 'orders@demo-immucor.invalid' },
  { key: 'innotrain', name: 'Inno-Train', shortCode: 'INNO', leadTimeDays: 21, email: 'orders@demo-innotrain.invalid' },
];

const reagentRows = [
  ['Anti-D IgM/IgG Blend', 'REAGENT', 'biorad', 'BRD-ANTI-D', 3, 4, 0.75, 12, 'RhD typing reagent'],
  ['Anti-A Monoclonal', 'REAGENT', 'ortho', 'ORTHO-ANTI-A', 8, 3, 2.7, 38, 'ABO forward grouping reagent'],
  ['Anti-B Monoclonal', 'REAGENT', 'ortho', 'ORTHO-ANTI-B', 7, 3, 2.3, 42, 'ABO forward grouping reagent'],
  ['Anti-C', 'REAGENT', 'immucor', 'IMM-ANTI-C', 2, 2, 1.0, 21, 'Rh phenotype reagent'],
  ['Anti-c', 'REAGENT', 'immucor', 'IMM-ANTI-c', 3, 2, 1.5, 64, 'Rh phenotype reagent'],
  ['Anti-E', 'REAGENT', 'immucor', 'IMM-ANTI-E', 1, 2, 0.5, 9, 'Rh phenotype reagent'],
  ['Anti-e', 'REAGENT', 'immucor', 'IMM-ANTI-e', 4, 2, 2.0, 77, 'Rh phenotype reagent'],
  ['Anti-K (Kell)', 'REAGENT', 'biorad', 'BRD-ANTI-K', 1, 2, 0.5, 6, 'Kell antigen typing reagent'],
  ['Anti-k (Cellano)', 'REAGENT', 'biorad', 'BRD-ANTI-k', 2, 1, 2.0, 96, 'Cellano antigen typing reagent'],
  ['Anti-Fya', 'REAGENT', 'biorad', 'BRD-ANTI-FYA', 2, 1, 2.0, 31, 'Duffy antigen typing reagent'],
  ['Anti-Fyb', 'REAGENT', 'biorad', 'BRD-ANTI-FYB', 1, 1, 1.0, 118, 'Duffy antigen typing reagent'],
  ['LISS/Coombs Gel Cards', 'REAGENT', 'biorad', 'BRD-LISS-COOMBS', 16, 8, 2.0, 55, 'Indirect antiglobulin test cards'],
  ['NaCl Enzyme Test Cards', 'REAGENT', 'biorad', 'BRD-NACL-ENZ', 10, 5, 2.0, 18, 'Enzyme phase gel cards'],
  ['ABO/Rh Newborn Cards', 'REAGENT', 'biorad', 'BRD-NEWBORN', 7, 4, 1.8, 28, 'Newborn blood typing cards'],
  ['DTT 0.2M Tubes', 'CONSUMABLE', 'immucor', 'DTT-02M', 6, 3, 2.0, 120, 'DTT treatment tubes for anti-CD38 workflow'],
  ['DaraEx Plus', 'REAGENT', 'innotrain', 'DARAEX-PLUS', 2, 1, 2.0, 25, 'Anti-CD38 interference removal kit'],
  ['DIACELL I-II-III Screening Cells', 'CELLS', 'biorad', 'BRD-DIACELL-3', 4, 6, 0.7, 5, '3-cell antibody screen panel'],
  ['DIAPANEL 11 Cell Panel', 'CELLS', 'biorad', 'BRD-DIAPANEL-11', 3, 4, 0.75, 16, '11-cell antibody identification panel'],
  ['Affirmagen A1 & B Cells', 'CELLS', 'ortho', 'ORTHO-AFFIRM-A1B', 2, 3, 0.7, 34, 'Reverse grouping red cells'],
  ['Surgiscreen 0.8%', 'CELLS', 'ortho', 'ORTHO-SURGISCREEN', 3, 5, 0.6, 44, 'Antibody screening cells'],
  ['CHECKCELLS', 'CELLS', 'immucor', 'IMM-CHECKCELLS', 2, 2, 1.0, 14, 'Coombs control cells'],
  ['Panoscreen I-II-III', 'CELLS', 'immucor', 'IMM-PANOSCREEN', 2, 2, 1.0, 71, 'Screening cells for antibody detection'],
  ['IH-QC 1 Control', 'CELLS', 'biorad', 'BRD-IH-QC1', 5, 4, 1.25, 7, 'Daily QC control cells'],
  ['IH-QC 2 Control', 'CELLS', 'biorad', 'BRD-IH-QC2', 5, 4, 1.25, 84, 'Daily QC control cells'],
];

const tablesToBackup = [
  'supplier', 'reagent', 'reagentBatch', 'order', 'orderItem', 'delivery', 'deliveryItem',
  'withdrawalRequest', 'withdrawalItem', 'inventoryTransaction', 'expiredProductLog',
  'dashboardNote', 'activityLog', 'activeAlert', 'alertRule', 'shipment', 'shipmentItem',
  'frameworkOrder', 'frameworkOrderItem', 'completedInventoryCount', 'inventoryCountDraft',
  'inventoryCountEntry', 'dispenseEvent', 'partialDisposal', 'supplierContact', 'barcodeFormat'
];

async function snapshotCounts() {
  const out = {};
  for (const table of tablesToBackup) {
    if (prisma[table]?.count) out[table] = await prisma[table].count();
  }
  return out;
}

async function backupTables() {
  const dir = path.resolve(__dirname, '..', '..', 'backups', `flow-demo-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const table of tablesToBackup) {
    if (!prisma[table]?.findMany) continue;
    const rows = await prisma[table].findMany();
    fs.writeFileSync(path.join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
  }
  return dir;
}

function statusFor(months) {
  if (months <= 0) return 'OUT_OF_STOCK';
  if (months < 1) return 'CRITICAL';
  if (months < 2) return 'LOW';
  return 'NORMAL';
}

async function clearDemoTables(tx) {
  // FK children first.
  await tx.partialDisposal.deleteMany({});
  await tx.dispenseEvent.deleteMany({});
  await tx.expiredProductLog.deleteMany({});
  await tx.inventoryTransaction.deleteMany({});
  await tx.shipmentItem.deleteMany({});
  await tx.shipment.deleteMany({});
  await tx.deliveryItem.deleteMany({});
  await tx.delivery.deleteMany({});
  await tx.withdrawalItem.deleteMany({});
  await tx.withdrawalRequest.deleteMany({});
  await tx.frameworkOrderItem.deleteMany({});
  await tx.frameworkOrder.deleteMany({});
  await tx.orderItem.deleteMany({});
  await tx.order.deleteMany({});
  await tx.inventoryCountEntry.deleteMany({});
  await tx.inventoryCountDraft.deleteMany({});
  await tx.completedInventoryCount.deleteMany({});
  await tx.activeAlert.deleteMany({});
  await tx.alertRule.deleteMany({});
  await tx.dashboardNote.deleteMany({});
  await tx.activityLog.deleteMany({});
  await tx.reagentBatch.deleteMany({});
  await tx.reagent.deleteMany({});
  await tx.supplierContact.deleteMany({});
  await tx.barcodeFormat.deleteMany({});
  await tx.supplier.deleteMany({});
}

async function seed(tx) {
  const supplierByKey = {};
  for (const s of suppliers) {
    supplierByKey[s.key] = await tx.supplier.create({
      data: {
        name: s.name,
        shortCode: s.shortCode,
        email: s.email,
        leadTimeDays: s.leadTimeDays,
        isPreferred: true,
        isActive: true,
        paymentTerms: 'Demo terms - Net 30',
      },
    });
  }

  const reagentRecords = [];
  for (let i = 0; i < reagentRows.length; i++) {
    const [name, category, supplierKey, catalogNumber, totalQty, monthlyUse, months, expiryOffset, note] = reagentRows[i];
    const supplier = supplierByKey[supplierKey];
    const reagent = await tx.reagent.create({
      data: {
        name,
        catalogNumber,
        category,
        supplierId: supplier.id,
        totalQuantity: totalQty,
        activeBatchesCount: totalQty > 0 ? 1 : 0,
        nearestExpiryDate: addDays(expiryOffset),
        currentStockStatus: statusFor(months),
        monthsOfStock: months,
        averageMonthlyUsage: monthlyUse,
        manualMonthlyUsage: monthlyUse,
        useManualUsage: true,
        isConsumable: category === 'CONSUMABLE',
        requiresBatches: true,
        notes: `${note}. Demo monthly use: ${monthlyUse}.`,
      },
    });
    reagentRecords.push({ reagent, supplier, totalQty, expiryOffset, monthlyUse });
    await tx.reagentBatch.create({
      data: {
        reagentId: reagent.id,
        batchNumber: `BB-${String(i + 1).padStart(3, '0')}-2026`,
        expiryDate: addDays(expiryOffset),
        initialQuantity: totalQty,
        currentQuantity: totalQty,
        receivedDate: addDays(-21),
        storageLocation: category === 'CELLS' ? 'Blood bank refrigerator 2-8°C' : 'Reagent cabinet 2-8°C',
        storageConditions: 'Demo storage condition',
        status: 'ACTIVE',
        qcStatus: 'APPROVED',
        generalNotes: 'Fake demo batch for presentation only',
      },
    });
  }

  const orderCandidates = reagentRecords
    .filter((r) => Number(r.reagent.monthsOfStock || 0) < 2)
    .slice(0, 6);

  for (let i = 0; i < 3; i++) {
    const group = orderCandidates.filter((_, idx) => idx % 3 === i);
    if (group.length === 0) continue;
    const supplier = group[0].supplier;
    const order = await tx.order.create({
      data: {
        tempNumber: `DEMO-PO-2026-${String(i + 1).padStart(3, '0')}`,
        supplierId: supplier.id,
        supplierSnapshot: supplier.name,
        orderType: 'IMMEDIATE',
        status: i === 0 ? 'APPROVED' : 'PENDING_SAP',
        orderDate: addDays(-(i + 1) * 2),
        expectedDeliveryStart: addDays(7 + i * 4),
        expectedDeliveryEnd: addDays(12 + i * 4),
        internalNotes: 'Fake demo order generated for presentation',
      },
    });
    for (const item of group) {
      const requestedQuantity = Math.max(2, Math.ceil(Number(item.monthlyUse || 1) * 2));
      await tx.orderItem.create({
        data: {
          orderId: order.id,
          reagentId: item.reagent.id,
          requestedQuantity,
          approvedQuantity: requestedQuantity,
          receivedQuantity: i === 0 ? 0 : 0,
          remainingQuantity: requestedQuantity,
          notes: 'Demo recommendation item',
        },
      });
    }
  }

  const note = await tx.dashboardNote.create({
    data: {
      title: 'נתוני דמו לבנק הדם',
      content: 'כל הנתונים במסך הם פייק לצורך הצגה: ריאגנטים, אצוות, תאריכי תפוגה והמלצות הזמנה.',
      noteType: 'INFO',
      priority: 10,
      isPinned: true,
      ctaRoute: '/Dashboard',
    },
  });

  await tx.activityLog.create({
    data: {
      action: 'demo_seed_applied',
      entityType: 'dashboardNote',
      entityId: note.id,
      details: JSON.stringify({ source: 'seed-flow-demo.js', rows: reagentRows.length }),
    },
  });
}

async function main() {
  const before = await snapshotCounts();
  console.log('Flow demo seed target:', process.env.DATABASE_URL.replace(/:\/\/.*@/, '://***@'));
  console.log('Before counts:', before);
  console.log(`Planned suppliers=${suppliers.length}, reagents=${reagentRows.length}, batches=${reagentRows.length}, pending orders=3`);
  console.log('Sample rows:');
  for (const row of reagentRows.slice(0, 8)) {
    console.log(`- ${row[0]} | ${row[2]} | qty ${row[4]} | expires ${addDays(row[7]).toISOString().slice(0, 10)} | months ${row[6]}`);
  }

  if (!APPLY) {
    console.log('\nDRY RUN ONLY. Re-run with --apply after explicit owner approval.');
    return;
  }

  const backupDir = await backupTables();
  console.log('Backup written:', backupDir);

  await prisma.$transaction(async (tx) => {
    await clearDemoTables(tx);
    await seed(tx);
  }, { timeout: 60_000 });

  const after = await snapshotCounts();
  console.log('After counts:', after);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
