import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles...');
  const roles = [
    { name: 'Admin', description: 'Administrateur système' },
    { name: 'Manager', description: 'Directeur / Gérant' },
    { name: 'Receptionniste', description: 'Réception et réservation' },
    { name: 'Housekeeping', description: 'Gouvernante / Ménage' },
    { name: 'Maintenance', description: 'Technicien' },
    { name: 'Comptable', description: 'Comptabilité et finances' },
  ];

  const roleMap: Record<string, string> = {};

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    roleMap[role.name] = role.id;
  }

  console.log('Seeding initial admin user...');
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash('admin_pass_2026', salt);

  await prisma.user.upsert({
    where: { email: 'admin@brunchbouake.com' },
    update: {},
    create: {
      email: 'admin@brunchbouake.com',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'System',
      roleId: roleMap['Admin'],
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
