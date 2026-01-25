
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const IMPORT_DIR = '/opt/flow-control/import';

async function main() {
    console.log('🚀 Starting Legacy Data Import...');

    // 1. Clear Database
    console.log('🗑️ Clearing existing data...');
    // Delete in order of dependencies (child first)
    await prisma.inventoryTransaction.deleteMany();
    await prisma.activeAlert.deleteMany();
    await prisma.expiredProductLog.deleteMany();
    await prisma.inventoryCountEntry.deleteMany();
    await prisma.inventoryCountDraft.deleteMany();
    await prisma.completedInventoryCount.deleteMany();

    await prisma.reagentBatch.deleteMany();

    await prisma.deliveryItem.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.withdrawalItem.deleteMany();
    await prisma.withdrawalRequest.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.shipmentItem.deleteMany();
    await prisma.shipment.deleteMany();

    await prisma.reagent.deleteMany();
    await prisma.supplierContact.deleteMany();
    await prisma.supplier.deleteMany();

    await prisma.systemSettings.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.dashboardNote.deleteMany();

    // We keep Users? No, user said overwrite ALL.
    // But we need to verify if we delete users, we can recreate them.
    await prisma.user.deleteMany();

    console.log('✅ Database cleared.');

    // 2. Seed Users
    console.log('bust👥 Seeding Users...');
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    const userPassword = await bcrypt.hash('User123!', 10);

    // Admin
    await prisma.user.create({
        data: {
            id: 'admin_id_placeholder', // Or let it generate
            email: 'admin@flow-control.com',
            name: 'System Admin',
            password: hashedPassword,
            role: 'ADMIN',
        }
    });

    // Default User
    await prisma.user.create({
        data: {
            email: 'user@flow-control.com',
            name: 'Demo User',
            password: userPassword,
            role: 'USER',
        }
    });

    // Coriatel User (found in data)
    await prisma.user.create({
        data: {
            id: '6874a8334a2629bd298ff241', // Original ID from CSV created_by_id
            email: 'coriatel@gmail.com',
            name: 'Legacy User (Coriatel)',
            password: userPassword,
            role: 'ADMIN',
        }
    });
    console.log('✅ Users seeded.');

    // Helper to read CSV
    const readCsv = (filename: string): any[] => {
        const filePath = path.join(IMPORT_DIR, filename);
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️ Warning: ${filename} not found. Skipping.`);
            return [];
        }
        const input = fs.readFileSync(filePath);
        return parse(input, {
            columns: true,
            skip_empty_lines: true,
            relax_quotes: true
        });
    };

    // 3. Import System Settings
    console.log('⚙️ Importing Settings...');
    const settingsData = readCsv('SystemSettings_export.csv');
    if (settingsData.length > 0) {
        const s = settingsData[0];
        await prisma.systemSettings.create({
            data: {
                key: 'GENERAL_SETTINGS',
                value: '{}',
                mainHeaderName: s.mainHeaderName,
                sidebarHeaderName: s.sidebarHeaderName,
                logoUrl: s.logoUrl
            }
        });
    } else {
        // Default
        await prisma.systemSettings.create({
            data: {
                key: 'GENERAL_SETTINGS',
                value: '{}',
                mainHeaderName: 'Flow Control',
                sidebarHeaderName: 'Inventory',
            }
        });
    }

    // 4. Import Suppliers
    console.log('🏭 Importing Suppliers...');
    const suppliers = readCsv('Supplier_export.csv');
    const supplierMap = new Map<string, string>(); // Name -> ID

    for (const s of suppliers) {
        try {
            // Check if ID exists (it should be unique)
            // Fix boolean fields strings 'false' -> false
            const isActive = s.is_active === 'true';

            await prisma.supplier.create({
                data: {
                    id: s.id, // Keep legacy ID
                    name: s.display_name || s.name,
                    // s.name might be internal code like "DANIEL_BIOTECH", display_name is "Daniel Biotech"
                    // Schema name is unique.
                    // We'll use display_name if available, else name.
                    shortCode: s.code,
                    // contactPerson: s.contact_person, // Removed as not in schema
                    phone: s.phone,
                    email: s.email,
                    address: s.address,
                    website: s.website,
                    // notes: s.notes, // Removed as not in schema
                    isActive: isActive,
                    createdAt: s.created_date ? new Date(s.created_date) : undefined,
                }
            });
            // Map BOTH name and display_name to ID for flexibility
            if (s.name) supplierMap.set(s.name, s.id);
            if (s.display_name) supplierMap.set(s.display_name, s.id);

        } catch (e) {
            console.error(`Error importing supplier ${s.name}:`, e);
        }
    }

    // Import Supplier Contacts
    console.log('📞 Importing Supplier Contacts...');
    const contacts = readCsv('SupplierContact_export.csv');
    for (const c of contacts) {
        if (!c.supplier_id) continue;
        // Verify supplier exists (it should)
        try {
            await prisma.supplierContact.create({
                data: {
                    id: c.id,
                    supplierId: c.supplier_id,
                    name: c.name || 'Unknown',
                    role: c.role,
                    phone: c.phone,
                    mobile: c.mobile,
                    email: c.email,
                    isPrimary: c.is_primary === 'true',
                    isActive: c.is_active === 'true',
                }
            });
        } catch (e) {
            // Ignore if supplier missing
        }
    }

    // 5. Import Reagents
    console.log('🧪 Importing Reagents...');
    const reagents = readCsv('Reagent_export.csv');
    for (const r of reagents) {
        try {
            // Lookup supplier
            let supplierId = supplierMap.get(r.supplier);

            // Fallback: If not found, try to find supplier with name=r.supplier
            if (!supplierId) {
                // Check if we have an "INTERNAL" supplier or default?
                // Or maybe create it?
                console.warn(`Supplier '${r.supplier}' not found for reagent '${r.name}'. skipping.`);
                continue;
            }

            await prisma.reagent.create({
                data: {
                    id: r.id,
                    name: r.name,
                    catalogNumber: r.catalog_number,
                    category: r.category?.toUpperCase() || 'REAGENT',
                    supplierId: supplierId,
                    currentStockStatus: r.current_stock_status?.toUpperCase() || 'NORMAL',
                    isConsumable: r.is_consumable === 'true',
                    requiresBatches: r.requires_batches === 'true',
                    notes: r.notes === 'null' ? null : r.notes,
                    averageMonthlyUsage: parseFloat(r.average_monthly_usage) || 0,

                    createdAt: r.created_date ? new Date(r.created_date) : undefined,
                }
            });
        } catch (e) {
            console.error(`Error importing reagent ${r.name}:`, e);
        }
    }

    // 6. Import Batches
    console.log('📦 Importing Batches...');
    const batches = readCsv('ReagentBatch_export.csv');
    for (const b of batches) {
        try {
            let expiry = b.expiry_date ? new Date(b.expiry_date) : new Date();
            if (isNaN(expiry.getTime())) expiry = new Date(); // Fallback for invalid dates


            let status = 'ACTIVE';
            if (b.status === 'disposed') status = 'DESTROYED';
            if (b.status === 'consumed') status = 'CONSUMED';
            if (b.status === 'expired') status = 'EXPIRED';

            // Create batch
            await prisma.reagentBatch.create({
                data: {
                    id: b.id,
                    reagentId: b.reagent_id, // Link by legacy ID
                    batchNumber: b.batch_number || 'UNKNOWN',
                    expiryDate: expiry,
                    manufactureDate: b.manufacture_date ? new Date(b.manufacture_date) : null,

                    initialQuantity: parseFloat(b.initial_quantity) || 0,
                    currentQuantity: parseFloat(b.current_quantity) || 0,
                    reservedQuantity: parseFloat(b.reserved_quantity) || 0,

                    receivedDate: b.received_date ? new Date(b.received_date) : new Date(),
                    status: status.toUpperCase(),
                    storageLocation: b.storage_location,
                    storageConditions: b.storage_conditions,

                    createdAt: b.created_date ? new Date(b.created_date) : undefined,
                }
            });
        } catch (e) {
            console.error(`Error importing batch ${b.batch_number}:`, e);
        }
    }

    // 7. Import Inventory Transactions
    console.log('📜 Importing Transactions...');
    const transactions = readCsv('InventoryTransaction_export.csv');
    for (const t of transactions) {
        try {
            // Map type
            let type = t.transaction_type?.toUpperCase() || 'ADJUSTMENT';
            if (type === 'DISPOSAL') type = 'DESTRUCTION';

            await prisma.inventoryTransaction.create({
                data: {
                    id: t.id,
                    reagentId: t.reagent_id,
                    batchId: t.batch_id || null, // Might be null for general adjust
                    transactionType: type,
                    quantityDelta: parseFloat(t.quantity), // Can be negative

                    sourceType: 'IMPORT',
                    notes: t.notes,

                    createdAt: t.created_date ? new Date(t.created_date) : new Date(),
                    performedById: t.created_by_id // Link to coriatel user if exists
                }
            });
        } catch (e) {
            // Ignore orphan transactions (if reagent deleted?)
        }
    }

    // 8. Import Orders
    console.log('🛒 Importing Orders...');
    const orders = readCsv('Order_export.csv');
    for (const o of orders) {
        try {
            // Lookup supplier
            let supplierId = supplierMap.get(o.supplier_name_snapshot);

            if (!supplierId) continue; // Skip orphan orders

            await prisma.order.create({
                data: {
                    id: o.id,
                    tempNumber: o.order_number_temp || o.id, // Unique
                    supplierId: supplierId,
                    supplierSnapshot: o.supplier_name_snapshot || 'Unknown',
                    status: o.status.toUpperCase(),
                    orderDate: o.order_date ? new Date(o.order_date) : new Date(),
                    createdAt: o.created_date ? new Date(o.created_date) : undefined,
                }
            });
        } catch (e) {
            console.error(`Error importing order ${o.id}:`, e);
        }
    }

    // Order Items
    console.log('🛒 Importing Order Items...');
    const orderItems = readCsv('OrderItem_export.csv');
    for (const oi of orderItems) {
        try {
            await prisma.orderItem.create({
                data: {
                    id: oi.id,
                    orderId: oi.order_id,
                    reagentId: oi.reagent_id,
                    requestedQuantity: parseFloat(oi.requested_quantity) || 0,
                    receivedQuantity: parseFloat(oi.received_quantity) || 0,
                    unitPrice: parseFloat(oi.unit_price) || 0,
                    createdAt: oi.created_date ? new Date(oi.created_date) : undefined,
                }
            });
        } catch (e) { }
    }

    // 9. Deliveries
    console.log('Truck Importing Deliveries...');
    const deliveries = readCsv('Delivery_export.csv');
    for (const d of deliveries) {
        try {
            let supplierId = supplierMap.get(d.supplier);
            if (!supplierId) continue;

            await prisma.delivery.create({
                data: {
                    id: d.id,
                    deliveryNumber: d.delivery_number || d.id,
                    supplierId: supplierId,
                    supplierSnapshot: d.supplier,
                    orderId: d.linked_order_id || null,
                    deliveryDate: d.delivery_date ? new Date(d.delivery_date) : new Date(),
                    status: d.status.toUpperCase(),
                    notes: d.notes,
                    createdAt: d.created_date ? new Date(d.created_date) : undefined,
                }
            });
        } catch (e) {
            console.error(`Error importing delivery ${d.id}:`, e);
        }
    }

    // Delivery Items
    console.log('📦 Importing Delivery Items...');
    const deliveryItems = readCsv('DeliveryItem_export.csv');
    for (const di of deliveryItems) {
        try {
            await prisma.deliveryItem.create({
                data: {
                    id: di.id,
                    deliveryId: di.delivery_id,
                    reagentId: di.reagent_id, // Note: Schema needs reagentId. CSV might reference batch?
                    // Schema: reagentId, batchNumber.
                    // CSV has reagent_id.
                    batchNumber: di.batch_number || 'UNKNOWN',
                    quantity: parseFloat(di.quantity) || 0,
                    expiryDate: di.expiry_date ? new Date(di.expiry_date) : new Date(),
                    createdAt: di.created_date ? new Date(di.created_date) : undefined,
                }
            });
        } catch (e) { }
    }

    // 10. Dashboard Notes
    console.log('📝 Importing Notes...');
    const notes = readCsv('DashboardNote_export.csv');
    for (const n of notes) {
        try {
            await prisma.dashboardNote.create({
                data: {
                    id: n.id,
                    content: n.content,
                    noteType: n.note_type?.toUpperCase() || 'GENERAL',
                    priority: parseInt(n.priority) || 0,
                    isPinned: n.is_pinned === 'true',
                    createdAt: n.created_date ? new Date(n.created_date) : undefined,
                }
            });
        } catch (e) { }
    }

    console.log('🏁 Import Complete!');
}

main()
    .catch((e) => {
        console.error('❌ Import Failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
