/**
 * Enhanced Seed Script for Flow Control
 * Populates the database with demo/test data
 *
 * Run: npx ts-node prisma/seed-demo.ts
 */

import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== Flow Control Demo Data Seed ===\n');

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    // 1. Create Users
    console.log('Creating users...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const userPassword = await bcrypt.hash('User123!', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@flow-control.com' },
        update: {},
        create: {
            email: 'admin@flow-control.com',
            name: 'מנהל מערכת',
            password: adminPassword,
            role: 'ADMIN',
        },
    });
    console.log('  ✅ Admin user:', admin.email);

    await prisma.user.upsert({
        where: { email: 'user@flow-control.com' },
        update: {},
        create: {
            email: 'user@flow-control.com',
            name: 'משתמש דמו',
            password: userPassword,
            role: 'USER',
        },
    });
    console.log('  ✅ Demo user: user@flow-control.com');

    // 2. Create Suppliers
    console.log('\nCreating suppliers...');
    const supplierData = [
        { name: 'Bio-Rad Laboratories', shortCode: 'BIO', isPreferred: true },
        { name: 'Grifols', shortCode: 'GRF', isPreferred: true },
        { name: 'Ortho Clinical Diagnostics', shortCode: 'ORT', isPreferred: false },
        { name: 'Immucor', shortCode: 'IMM', isPreferred: false },
        { name: 'Quotient', shortCode: 'QUO', isPreferred: false },
    ];

    const suppliers: any[] = [];
    for (const data of supplierData) {
        const supplier = await prisma.supplier.upsert({
            where: { name: data.name },
            update: {},
            create: data,
        });
        suppliers.push(supplier);
        console.log(`  ✅ Supplier: ${data.name}`);
    }

    // 3. Create Reagents with controlled stock statuses
    console.log('\nCreating reagents...');
    const reagentDefs = [
        // LOW stock reagents
        { name: 'Anti-A Monoclonal', category: 'REAGENT', catalogNumber: 'BA-001', stockStatus: 'LOW', totalQty: 8, monthsOfStock: 1.5, avgUsage: 5 },
        { name: 'Anti-B Monoclonal', category: 'REAGENT', catalogNumber: 'BA-002', stockStatus: 'LOW', totalQty: 12, monthsOfStock: 2.0, avgUsage: 6 },
        // CRITICAL stock reagents
        { name: 'Anti-D (IgM/IgG)', category: 'REAGENT', catalogNumber: 'BA-003', stockStatus: 'CRITICAL', totalQty: 3, monthsOfStock: 0.5, avgUsage: 6 },
        { name: 'Anti-Human Globulin (AHG)', category: 'REAGENT', catalogNumber: 'BA-004', stockStatus: 'CRITICAL', totalQty: 2, monthsOfStock: 0.3, avgUsage: 7 },
        // OUT_OF_STOCK reagents
        { name: 'A1 Cells Panel', category: 'CELLS', catalogNumber: 'BC-001', stockStatus: 'OUT_OF_STOCK', totalQty: 0, monthsOfStock: 0, avgUsage: 8 },
        { name: 'B Cells Panel', category: 'CELLS', catalogNumber: 'BC-002', stockStatus: 'OUT_OF_STOCK', totalQty: 0, monthsOfStock: 0, avgUsage: 4 },
        // NORMAL stock reagents
        { name: 'O Cells Panel', category: 'CELLS', catalogNumber: 'BC-003', stockStatus: 'NORMAL', totalQty: 45, monthsOfStock: 5.0, avgUsage: 9 },
        { name: 'Screen Cells I', category: 'CELLS', catalogNumber: 'BC-010', stockStatus: 'NORMAL', totalQty: 30, monthsOfStock: 4.0, avgUsage: 7 },
        { name: 'Screen Cells II', category: 'CELLS', catalogNumber: 'BC-011', stockStatus: 'NORMAL', totalQty: 35, monthsOfStock: 4.5, avgUsage: 8 },
        { name: 'Screen Cells III', category: 'CELLS', catalogNumber: 'BC-012', stockStatus: 'NORMAL', totalQty: 25, monthsOfStock: 3.5, avgUsage: 7 },
        { name: 'Gel Cards (ABO/Rh)', category: 'CONSUMABLE', catalogNumber: 'GC-001', stockStatus: 'NORMAL', totalQty: 80, monthsOfStock: 6.0, avgUsage: 13 },
        { name: 'Gel Cards (Coombs)', category: 'CONSUMABLE', catalogNumber: 'GC-002', stockStatus: 'NORMAL', totalQty: 60, monthsOfStock: 5.0, avgUsage: 12 },
    ];

    const reagents: any[] = [];
    for (let i = 0; i < reagentDefs.length; i++) {
        const data = reagentDefs[i];
        const supplier = suppliers[i % suppliers.length];

        const reagent = await prisma.reagent.upsert({
            where: {
                name_supplierId: {
                    name: data.name,
                    supplierId: supplier.id,
                },
            },
            update: {
                currentStockStatus: data.stockStatus,
                totalQuantity: data.totalQty,
                monthsOfStock: data.monthsOfStock,
                averageMonthlyUsage: data.avgUsage,
            },
            create: {
                name: data.name,
                category: data.category as any,
                catalogNumber: data.catalogNumber,
                supplierId: supplier.id,
                totalQuantity: data.totalQty,
                activeBatchesCount: data.totalQty > 0 ? 2 : 0,
                currentStockStatus: data.stockStatus as any,
                monthsOfStock: data.monthsOfStock,
                averageMonthlyUsage: data.avgUsage,
            },
        });
        reagents.push(reagent);
        console.log(`  ✅ Reagent: ${data.name} [${data.stockStatus}]`);
    }

    // 4. Create Batches with controlled expiry dates
    console.log('\nCreating reagent batches...');
    let batchCount = 0;

    // Expiring batches definition:
    // 2 already expired, 3 within 7 days, 3 within 14-30 days, rest normal
    const expiryBatchDefs = [
        // Already expired
        { reagentIdx: 0, daysOffset: -3, qty: 5, batchSuffix: 'EXP-1' },
        { reagentIdx: 1, daysOffset: -1, qty: 8, batchSuffix: 'EXP-2' },
        // Expiring within 7 days
        { reagentIdx: 2, daysOffset: 2, qty: 12, batchSuffix: 'SOON-1' },
        { reagentIdx: 3, daysOffset: 5, qty: 6, batchSuffix: 'SOON-2' },
        { reagentIdx: 7, daysOffset: 7, qty: 20, batchSuffix: 'SOON-3' },
        // Expiring within 14-30 days
        { reagentIdx: 8, daysOffset: 14, qty: 15, batchSuffix: 'MED-1' },
        { reagentIdx: 9, daysOffset: 21, qty: 10, batchSuffix: 'MED-2' },
        { reagentIdx: 10, daysOffset: 28, qty: 25, batchSuffix: 'MED-3' },
    ];

    for (const def of expiryBatchDefs) {
        const reagent = reagents[def.reagentIdx];
        try {
            await prisma.reagentBatch.create({
                data: {
                    reagentId: reagent.id,
                    batchNumber: `LOT-${def.batchSuffix}`,
                    expiryDate: new Date(now.getTime() + def.daysOffset * day),
                    initialQuantity: def.qty,
                    currentQuantity: def.qty,
                    receivedDate: new Date(now.getTime() - 60 * day),
                    status: 'ACTIVE',
                    qcStatus: 'APPROVED',
                },
            });
            batchCount++;
        } catch (e) {
            // Skip if exists
        }
    }

    // Normal batches for all reagents
    for (const reagent of reagents) {
        const numBatches = 2;
        for (let i = 0; i < numBatches; i++) {
            const expiryDays = 60 + Math.floor(Math.random() * 150);
            const quantity = Math.floor(Math.random() * 30) + 10;
            try {
                await prisma.reagentBatch.create({
                    data: {
                        reagentId: reagent.id,
                        batchNumber: `LOT-${reagent.catalogNumber || 'XX'}-${Date.now()}-${i}`,
                        expiryDate: new Date(now.getTime() + expiryDays * day),
                        initialQuantity: quantity,
                        currentQuantity: quantity,
                        receivedDate: new Date(now.getTime() - 30 * day),
                        status: 'ACTIVE',
                        qcStatus: 'APPROVED',
                    },
                });
                batchCount++;
            } catch (e) {
                // Skip if batch already exists
            }
        }
    }
    console.log(`  ✅ Created ${batchCount} batches`);

    // 5. Create Orders with OrderItems
    console.log('\nCreating orders...');
    const orderDefs = [
        { tempNumber: 'TMP-2025-001', status: 'DRAFT', supplierIdx: 0, daysAgo: 2 },
        { tempNumber: 'TMP-2025-002', status: 'PENDING_SAP', supplierIdx: 1, daysAgo: 5 },
        { tempNumber: 'TMP-2025-003', status: 'APPROVED', supplierIdx: 2, daysAgo: 10 },
        { tempNumber: 'TMP-2025-004', status: 'DRAFT', supplierIdx: 3, daysAgo: 1 },
    ];

    for (const def of orderDefs) {
        const supplier = suppliers[def.supplierIdx];
        try {
            const order = await prisma.order.upsert({
                where: { tempNumber: def.tempNumber },
                update: {},
                create: {
                    tempNumber: def.tempNumber,
                    supplierId: supplier.id,
                    supplierSnapshot: supplier.name,
                    status: def.status,
                    orderDate: new Date(now.getTime() - def.daysAgo * day),
                },
            });

            // Add 2 order items per order
            const reagent1 = reagents[def.supplierIdx % reagents.length];
            const reagent2 = reagents[(def.supplierIdx + 1) % reagents.length];
            for (const reagent of [reagent1, reagent2]) {
                try {
                    await prisma.orderItem.create({
                        data: {
                            orderId: order.id,
                            reagentId: reagent.id,
                            requestedQuantity: Math.floor(Math.random() * 30) + 10,
                            receivedQuantity: 0,
                        },
                    });
                } catch (e) {
                    // Skip duplicates
                }
            }

            console.log(`  ✅ Order: ${def.tempNumber} [${def.status}]`);
        } catch (e) {
            console.log(`  ⚠️  Order ${def.tempNumber} skipped`);
        }
    }

    // 6. Create Withdrawal Requests
    console.log('\nCreating withdrawal requests...');
    const withdrawalDefs = [
        { number: 'WD-2025-001', status: 'SUBMITTED', supplierIdx: 0, daysAgo: 3 },
        { number: 'WD-2025-002', status: 'APPROVED', supplierIdx: 1, daysAgo: 7 },
        { number: 'WD-2025-003', status: 'SHIPPING', supplierIdx: 2, daysAgo: 14 },
    ];

    for (const def of withdrawalDefs) {
        const supplier = suppliers[def.supplierIdx];
        try {
            await prisma.withdrawalRequest.upsert({
                where: { withdrawalNumber: def.number },
                update: {},
                create: {
                    withdrawalNumber: def.number,
                    supplierId: supplier.id,
                    supplierSnapshot: supplier.name,
                    status: def.status,
                    requestDate: new Date(now.getTime() - def.daysAgo * day),
                },
            });
            console.log(`  ✅ Withdrawal: ${def.number} [${def.status}]`);
        } catch (e) {
            console.log(`  ⚠️  Withdrawal ${def.number} skipped`);
        }
    }

    // 7. Create Dashboard Notes (including URGENT)
    console.log('\nCreating dashboard notes...');
    const notes = [
        {
            title: 'ברוכים הבאים ל-Flow Control',
            content: 'מערכת ניהול מלאי בנק דם - סביבת פיתוח',
            noteType: 'INFO' as const,
            isPinned: true,
            priority: 10,
        },
        {
            title: 'דחוף: חוסר ב-Anti-D',
            content: 'יש לבצע הזמנה דחופה של Anti-D מספק Bio-Rad. המלאי צפוי להסתיים תוך שבוע.',
            noteType: 'URGENT' as const,
            isPinned: true,
            priority: 20,
        },
        {
            title: 'ספירת מלאי שבועית',
            content: 'יש לבצע ספירת מלאי שבועית בכל יום ראשון',
            noteType: 'REMINDER' as const,
            priority: 5,
        },
        {
            title: 'עדכון גרסה',
            content: 'המערכת עודכנה לגרסה האחרונה עם תיקוני באגים',
            noteType: 'GENERAL' as const,
            priority: 3,
        },
        {
            title: 'תזכורת: בדיקת תעודות COA',
            content: 'יש לוודא שכל האצוות שהתקבלו השבוע מלוות בתעודות אנליזה תקינות.',
            noteType: 'TASK' as const,
            priority: 7,
        },
    ];

    for (const note of notes) {
        await prisma.dashboardNote.create({ data: note });
    }
    console.log(`  ✅ Created ${notes.length} dashboard notes`);

    // 8. Create System Settings
    console.log('\nCreating system settings...');
    try {
        await prisma.systemSettings.upsert({
            where: { key: 'display' },
            update: {},
            create: {
                key: 'display',
                value: {
                    mainHeaderName: 'מערכת ניהול מלאי בנק דם',
                    sidebarHeaderName: 'Flow Control',
                    logoUrl: '/favicon.svg',
                },
                description: 'Display settings for the application',
            },
        });
        console.log('  ✅ System settings created');
    } catch (e) {
        console.log('  ⚠️  System settings already exist or error:', e);
    }

    // 9. Create Activity Logs (~10 diverse entries)
    console.log('\nCreating activity logs...');
    await prisma.activityLog.createMany({
        data: [
            {
                userId: admin.id,
                action: 'user_login',
                entityType: 'user',
                entityId: admin.id,
                details: JSON.stringify({ ip: '127.0.0.1' }),
                createdAt: new Date(now.getTime() - 0.5 * day),
            },
            {
                userId: admin.id,
                action: 'delivery_received',
                entityType: 'delivery',
                details: JSON.stringify({ supplier: 'Bio-Rad Laboratories', items: 5 }),
                createdAt: new Date(now.getTime() - 1 * day),
            },
            {
                userId: admin.id,
                action: 'inventory_count',
                entityType: 'inventory',
                details: JSON.stringify({ reagentsCount: 12, batchesCount: 25 }),
                createdAt: new Date(now.getTime() - 1.5 * day),
            },
            {
                userId: admin.id,
                action: 'order_created',
                entityType: 'order',
                details: JSON.stringify({ tempNumber: 'TMP-2025-001', supplier: 'Bio-Rad Laboratories' }),
                createdAt: new Date(now.getTime() - 2 * day),
            },
            {
                userId: admin.id,
                action: 'withdrawal_created',
                entityType: 'withdrawal',
                details: JSON.stringify({ number: 'WD-2025-001' }),
                createdAt: new Date(now.getTime() - 3 * day),
            },
            {
                userId: admin.id,
                action: 'batch_expired',
                entityType: 'reagent',
                details: JSON.stringify({ reagent: 'Anti-A Monoclonal', batch: 'LOT-EXP-1' }),
                createdAt: new Date(now.getTime() - 3.5 * day),
            },
            {
                userId: admin.id,
                action: 'delivery_received',
                entityType: 'delivery',
                details: JSON.stringify({ supplier: 'Grifols', items: 3 }),
                createdAt: new Date(now.getTime() - 4 * day),
            },
            {
                userId: admin.id,
                action: 'order_approved',
                entityType: 'order',
                details: JSON.stringify({ tempNumber: 'TMP-2025-003', supplier: 'Ortho Clinical Diagnostics' }),
                createdAt: new Date(now.getTime() - 5 * day),
            },
            {
                userId: admin.id,
                action: 'reagent_updated',
                entityType: 'reagent',
                details: JSON.stringify({ name: 'Gel Cards (ABO/Rh)', field: 'averageMonthlyUsage' }),
                createdAt: new Date(now.getTime() - 6 * day),
            },
            {
                userId: admin.id,
                action: 'user_login',
                entityType: 'user',
                entityId: admin.id,
                details: JSON.stringify({ ip: '192.168.1.50' }),
                createdAt: new Date(now.getTime() - 7 * day),
            },
        ],
    });
    console.log('  ✅ Activity logs created (10 entries)');

    // 10. Create Alert Rules
    console.log('\nCreating alert rules...');
    const alertRules = [
        {
            ruleType: 'EXPIRY_WARNING' as const,
            name: 'התראת תפוגה 30 יום',
            description: 'התראה 30 ימים לפני פג תוקף',
            thresholdDays: 30,
            appliesToCategories: ['REAGENT', 'CONSUMABLE'],
            isActive: true,
        },
        {
            ruleType: 'EXPIRY_WARNING' as const,
            name: 'התראת תפוגה כדוריות 10 יום',
            description: 'התראה 10 ימים לפני פג תוקף לכדוריות',
            thresholdDays: 10,
            appliesToCategories: ['CELLS'],
            isActive: true,
        },
        {
            ruleType: 'LOW_STOCK' as const,
            name: 'מלאי נמוך',
            description: 'התראה כשמלאי מתחת ל-2 חודשים',
            thresholdMonths: 2,
            appliesToCategories: ['REAGENT', 'CELLS', 'CONSUMABLE'],
            isActive: true,
        },
    ];

    for (const rule of alertRules) {
        try {
            await prisma.alertRule.create({ data: rule });
        } catch (e) {
            // Skip if already exists
        }
    }
    console.log(`  ✅ Alert rules created`);

    console.log('\n=== Seed completed successfully! ===');
    console.log('\n📋 Login credentials:');
    console.log('   Admin: admin@flow-control.com / Admin123!');
    console.log('   User:  user@flow-control.com / User123!');
    console.log('');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
