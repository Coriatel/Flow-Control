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

    const reagents: any[] = [];
    for (let i = 0; i < reagentData.length; i++) {
        const data = reagentData[i];
        const supplier = suppliers[i % suppliers.length];

        // Random stock status for demo
        const stockStatuses = ['NORMAL', 'NORMAL', 'NORMAL', 'LOW', 'CRITICAL'];
        const stockStatus = stockStatuses[Math.floor(Math.random() * stockStatuses.length)];

        const reagent = await prisma.reagent.upsert({
            where: {
                name_supplierId: {
                    name: data.name,
                    supplierId: supplier.id,
                },
            },
            update: {},
            create: {
                name: data.name,
                category: data.category as any,
                catalogNumber: data.catalogNumber,
                supplierId: supplier.id,
                totalQuantity: Math.floor(Math.random() * 100) + 10,
                activeBatchesCount: Math.floor(Math.random() * 3) + 1,
                currentStockStatus: stockStatus as any,
                monthsOfStock: Math.random() * 6,
                averageMonthlyUsage: Math.floor(Math.random() * 20) + 5,
            },
        });
        reagents.push(reagent);
        console.log(`  ✅ Reagent: ${data.name}`);
    }

    // 4. Create Batches for reagents
    console.log('\nCreating reagent batches...');
    const now = new Date();
    let batchCount = 0;

    for (const reagent of reagents) {
        const numBatches = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numBatches; i++) {
            // Some batches expire soon (for demo alerts)
            const expiryDays = i === 0
                ? Math.floor(Math.random() * 30) + 5  // First batch: 5-35 days
                : Math.floor(Math.random() * 180) + 30; // Others: 30-210 days

            const expiryDate = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);
            const quantity = Math.floor(Math.random() * 50) + 5;

            try {
                await prisma.reagentBatch.create({
                    data: {
                        reagentId: reagent.id,
                        batchNumber: `LOT-${reagent.catalogNumber || 'XX'}-${Date.now()}-${i}`,
                        expiryDate,
                        initialQuantity: quantity,
                        currentQuantity: quantity,
                        receivedDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
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

    // 5. Create Dashboard Notes
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
    ];

    for (const note of notes) {
        await prisma.dashboardNote.create({ data: note });
    }
    console.log(`  ✅ Created ${notes.length} dashboard notes`);

    // 6. Create System Settings
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

    // 7. Create Activity Logs
    console.log('\nCreating activity logs...');
    await prisma.activityLog.createMany({
        data: [
            {
                userId: admin.id,
                action: 'user_login',
                entityType: 'user',
                entityId: admin.id,
                details: { ip: '127.0.0.1' },
            },
            {
                userId: admin.id,
                action: 'delivery_received',
                entityType: 'delivery',
                details: { supplier: 'Bio-Rad Laboratories', items: 5 },
            },
            {
                userId: admin.id,
                action: 'inventory_count',
                entityType: 'inventory',
                details: { reagentsCount: 12, batchesCount: 25 },
            },
        ],
    });
    console.log('  ✅ Activity logs created');

    // 8. Create Alert Rules
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
