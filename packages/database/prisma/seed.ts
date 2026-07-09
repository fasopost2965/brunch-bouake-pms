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

  console.log('Seeding permissions...');
  const permUsersCreate = await prisma.permission.upsert({
    where: { code: 'users.create' },
    update: {},
    create: {
      code: 'users.create',
      description: 'Créer de nouveaux utilisateurs',
      module: 'users',
    },
  });

  // Link permission to Admin role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: roleMap['Admin'],
        permissionId: permUsersCreate.id,
      },
    },
    update: {},
    create: {
      roleId: roleMap['Admin'],
      permissionId: permUsersCreate.id,
    },
  });

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

  console.log('Seeding Phase 1 test data...');
  const roomType = await prisma.roomType.upsert({
    where: { name: 'Standard Double' },
    update: {},
    create: {
      name: 'Standard Double',
      description: 'Chambre standard avec un lit double',
      capacity: 2,
      baseRate: 50000,
    },
  });

  const room = await prisma.room.upsert({
    where: { number: '101' },
    update: {},
    create: {
      number: '101',
      roomTypeId: roomType.id,
      floor: 1,
    },
  });

  const guest = await prisma.guest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '0102030405',
      email: 'john.doe@example.com',
    },
  });

  // Adding new permissions for phase 1
  const perms = ['reservations.write', 'settings.rooms.write'];
  for (const code of perms) {
    const perm = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, module: 'phase1' },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap['Admin'], permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap['Admin'], permissionId: perm.id },
    });
  }

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
