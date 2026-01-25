/**
 * SQLite Seed Script for Flow Control
 * Populates the database with demo/test data
 * 
 * Run: npx ts-node prisma/seed-sqlite.ts
 */

import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== Flow Control SQLite Seed Script ===\n');

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
    console.log('  ✅ Admin user created:', admin.email);

    const demoUser = await prisma.user.upsert({
        where: { email: 'user@flow-control.com' },
        update: {},
        create: {
            email: 'user@flow-control.com',
            name: 'משתמש דמו',
            password: userPassword,
            role: 'USER',
        },
    });
    console.log('  ✅ Demo user created:', demoUser.email);

    // 2. Create Suppliers
    console.log('\nCreating suppliers...');
    const suppliers = [
        { name: 'Bio-Rad Laboratories', shortCode: 'BIO', isPreferred: true },
        { name: 'Grifols', shortCode: 'GRF', isPreferred: true },
        { name: 'Ortho Clinical Diagnostics', shortCode: 'ORT', isPreferred: false },
        { name: 'Immucor', shortCode: 'IMM', isPreferred: false },
        { name: 'Quotient', shortCode: 'QUO', isPreferred: false },
    ];

    const createdSuppliers: any[] = [];
    for (const supplier of suppliers) {
        const created = await prisma.supplier.upsert({
            where: { name: supplier.name },
            update: {},
            create: supplier,
        });
        createdSuppliers.push(created);
        console.log(`  ✅ Supplier: ${supplier.name}`);
    }

    // 3. Create Reagents
    console.log('\nCreating reagents...');
    const reagentData = [
        { name: 'Anti-A Monoclonal', category: 'REAGENT', catalogNumber: 'BA-001' },
        { name: 'Anti-B Monoclonal', category: 'REAGENT', catalogNumber: 'BA-002' },
        { name: 'Anti-D (IgM/IgG)', category: 'REAGENT', catalogNumber: 'BA-003' },
        { name: 'Anti-Human Globulin (AHG)', category: 'REAGENT', catalogNumber: 'BA-004' },
        { name: 'A1 Cells Panel', category: 'CELLS', catalogNumber: 'BC-001' },
        { name: 'B Cells Panel', category: 'CELLS', catalogNumber: 'BC-002' },
        { name: 'O Cells Panel', category: 'CELLS', catalogNumber: 'BC-003' },
        { name: 'Screen Cells I', category: 'CELLS', catalogNumber: 'BC-010' },
        { name: 'Screen Cells II', category: 'CELLS', catalogNumber: 'BC-011' },
        { name: 'Screen Cells III', category: 'CELLS', catalogNumber: 'BC-012' },
        { name: 'Gel Cards (ABO/Rh)', category: 'CONSUMABLE', catalogNumber: 'GC-001' },
        { name: 'Gel Cards (Coombs)', category: 'CONSUMABLE', catalogNumber: 'GC-002' },
    ];

    const createdReagents: any[] = [];
    for (let i = 0; i < reagentData.length; i++) {
        const reagent = reagentData[i];
        const supplier = createdSuppliers[i % createdSuppliers.length];

        const created = await prisma.reagent.upsert({
            where: {
                name_supplierId: {
                    name: reagent.name,
                    supplierId: supplier.id,
                },
            },
            update: {},
            create: {
                name: reagent.name,
                category: reagent.category,
                catalogNumber: reagent.catalogNumber,
                supplierId: supplier.id,
                totalQuantity: Math.floor(Math.random() * 100) + 10,
                activeBatchesCount: Math.floor(Math.random() * 3) + 1,
                currentStockStatus: ['NORMAL', 'LOW', 'CRITICAL'][Math.floor(Math.random() * 3)],
                monthsOfStock: Math.random() * 6,
                averageMonthlyUsage: Math.floor(Math.random() * 20) + 5,
            },
        });
        createdReagents.push(created);
        console.log(`  ✅ Reagent: ${reagent.name}`);
    }

    // 4. Create Batches for reagents
    console.log('\nCreating reagent batches...');
    const now = new Date();
    for (const reagent of createdReagents) {
        const numBatches = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numBatches; i++) {
            const expiryDays = Math.floor(Math.random() * 180) + 10; // 10-190 days from now
            const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
            const quantity = Math.floor(Math.random() * 50) + 5;

            await prisma.reagentBatch.create({
                data: {
                    reagentId: reagent.id,
                    batchNumber: `LOT-${Date.now()}-${i}`,
                    expiryDate,
                    initialQuantity: quantity,
                    currentQuantity: quantity,
                    receivedDate: now,
                    status: 'ACTIVE',
                    qcStatus: 'APPROVED',
                },
            });
        }
    }
    console.log(`  ✅ Created batches for ${createdReagents.length} reagents`);

    // 5. Create Dashboard Notes
    console.log('\nCreating dashboard notes...');
    await prisma.dashboardNote.createMany({
        data: [
            {
                title: 'ברוכים הבאים ל-Flow Control',
                content: 'מערכת ניהול מלאי בנק דם - סביבת פיתוח',
                noteType: 'INFO',
                isPinned: true,
                priority: 10,
            },
            {
                title: 'ספירת מלאי שבועית',
                content: 'יש לבצע ספירת מלאי שבועית בכל יום ראשון',
                noteType: 'REMINDER',
                priority: 5,
            },
            {
                title: 'עדכון גרסה',
                content: 'המערכת עודכנה לגרסה האחרונה עם תיקוני באגים',
                noteType: 'GENERAL',
                priority: 3,
            },
        ],
    });
    console.log('  ✅ Dashboard notes created');

    // 6. Create System Settings
    console.log('\nCreating system settings...');
    await prisma.systemSettings.upsert({
        where: { key: 'display' },
        update: {},
        create: {
            key: 'display',
            value: '{}',
            mainHeaderName: 'מערכת ניהול מלאי בנק דם',
            sidebarHeaderName: 'Flow Control',
            logoUrl: '/favicon.svg',
            description: 'Display settings for the application',
        },
    });
    console.log('  ✅ System settings created');

    // 7. Create some activity logs
    console.log('\nCreating activity logs...');
    await prisma.activityLog.createMany({
        data: [
            {
                userId: admin.id,
                action: 'user_login',
                entityType: 'user',
                entityId: admin.id,
                details: JSON.stringify({ ip: '127.0.0.1' }),
            },
            {
                userId: admin.id,
                action: 'delivery_received',
                entityType: 'delivery',
                details: JSON.stringify({ supplier: 'Bio-Rad Laboratories', items: 5 }),
            },
            {
                userId: admin.id,
                action: 'inventory_count',
                entityType: 'inventory',
                details: JSON.stringify({ reagentsCount: 12, batchesCount: 25 }),
            },
        ],
    });
    console.log('  ✅ Activity logs created');

    // 8. Create alert rules
    console.log('\nCreating alert rules...');
    await prisma.alertRule.createMany({
        data: [
            {
                ruleType: 'EXPIRY_WARNING',
                name: 'התראת תפוגה 30 יום',
                description: 'התראה 30 ימים לפני פג תוקף',
                thresholdDays: 30,
                appliesToCategories: 'REAGENT,CONSUMABLE',
                isActive: true,
            },
            {
                ruleType: 'EXPIRY_WARNING',
                name: 'התראת תפוגה כדוריות 10 יום',
                description: 'התראה 10 ימים לפני פג תוקף לכדוריות',
                thresholdDays: 10,
                appliesToCategories: 'CELLS',
                isActive: true,
            },
            {
                ruleType: 'LOW_STOCK',
                name: 'מלאי נמוך',
                description: 'התראה כשמלאי מתחת ל-2 חודשים',
                thresholdMonths: 2,
                appliesToCategories: 'REAGENT,CELLS,CONSUMABLE',
                isActive: true,
            },
        ],
    });
    console.log('  ✅ Alert rules created');

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
