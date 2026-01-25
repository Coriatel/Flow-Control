
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Verification Report:');
    console.log('-----------------------');
    const users = await prisma.user.count();
    console.log(`👥 Users: ${users}`);

    const settings = await prisma.systemSettings.count();
    console.log(`⚙️ Settings: ${settings}`);

    const suppliers = await prisma.supplier.count();
    console.log(`🏭 Suppliers: ${suppliers}`);

    const reagents = await prisma.reagent.count();
    console.log(`🧪 Reagents: ${reagents}`);

    const batches = await prisma.reagentBatch.count();
    console.log(`📦 Batches: ${batches}`);

    const tx = await prisma.inventoryTransaction.count();
    console.log(`📜 Transactions: ${tx}`);

    const orders = await prisma.order.count();
    console.log(`🛒 Orders: ${orders}`);

    const deliveries = await prisma.delivery.count();
    console.log(`🚚 Deliveries: ${deliveries}`);

    const notes = await prisma.dashboardNote.count();
    console.log(`📝 Notes: ${notes}`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
