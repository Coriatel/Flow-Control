import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminEmail = 'admin@flow-control.com';
  const adminPassword = 'Admin123!'; // Change this in production!

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping...');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'System Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
  }

  // Create demo user
  const demoEmail = 'user@flow-control.com';
  const demoPassword = 'User123!';

  const existingUser = await prisma.user.findUnique({
    where: { email: demoEmail }
  });

  if (existingUser) {
    console.log('⚠️  Demo user already exists, skipping...');
  } else {
    const hashedPassword = await bcrypt.hash(demoPassword, 10);

    await prisma.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        password: hashedPassword,
        role: 'USER'
      }
    });

    console.log('✅ Demo user created:');
    console.log('   Email:', demoEmail);
    console.log('   Password:', demoPassword);
  }

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
