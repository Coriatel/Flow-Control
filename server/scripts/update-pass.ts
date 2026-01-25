import { PrismaClient } from '../generated/prisma';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
    const hash = await bcrypt.hash('Coriathost81!', 10);
    try {
        await prisma.user.update({
            where: { email: 'coriatel@gmail.com' },
            data: { password: hash }
        });
        console.log('Password updated successfully.');
    } catch (e) {
        console.error('Error updating password:', e);
    }
}
main().finally(() => prisma.$disconnect());
