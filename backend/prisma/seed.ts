import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPhone = process.env.ADMIN_PHONE ?? '11999999999';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

  const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existing) {
    await prisma.user.create({
      data: {
        fullName: 'Administrador',
        age: 30,
        phone: adminPhone,
        password: await bcrypt.hash(adminPassword, 12),
        role: 'ADMIN',
        securityQuestion: 'Qual o nome do seu primeiro animal de estimação?',
        securityAnswer: await bcrypt.hash('admin', 12),
      },
    });
    console.log(`Admin criado: ${adminPhone}`);
  } else {
    console.log('Admin já existe, pulando.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
