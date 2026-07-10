import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Permission catalogue — single source of truth
// ─────────────────────────────────────────────────────────────────────────────
const ALL_PERMISSIONS: { code: string; description: string; module: string }[] = [
  // Users
  { code: 'users.create',                 description: 'Créer de nouveaux utilisateurs',                   module: 'users' },
  // Reservations
  { code: 'reservations.create',          description: 'Créer une réservation',                             module: 'reservations' },
  { code: 'reservations.write',           description: 'Modifier une réservation',                          module: 'reservations' },
  { code: 'reservations.checkin',         description: 'Effectuer un check-in',                             module: 'reservations' },
  { code: 'reservations.checkout',        description: 'Effectuer un check-out',                            module: 'reservations' },
  { code: 'reservation.tax_exempt',       description: 'Accorder une exemption de taxe de séjour',          module: 'reservations' },
  // Guests
  { code: 'guests.write',                 description: 'Créer et modifier des clients',                     module: 'guests' },
  // Settings / Rooms
  { code: 'settings.rooms.write',         description: 'Créer et modifier les types et chambres',           module: 'settings' },
  // Billing
  { code: 'billing.write',               description: 'Ajouter des lignes et paiements sur un folio',      module: 'billing' },
  { code: 'billing.close',               description: 'Clôturer un folio (irréversible)',                  module: 'billing' },
  { code: 'billing.adjustment.create',   description: 'Créer un folio d\'ajustement',                      module: 'billing' },
  // Housekeeping
  { code: 'housekeeping.write',          description: 'Créer et mettre à jour les tâches de ménage',       module: 'housekeeping' },
  // Maintenance
  { code: 'maintenance.write',           description: 'Créer et mettre à jour les tickets de maintenance', module: 'maintenance' },
  // Reports
  { code: 'reports.read',               description: 'Consulter les rapports',                            module: 'reports' },
  { code: 'reports.write',              description: 'Lancer l\'audit de nuit',                           module: 'reports' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Role → Permission mapping
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin: [
    // Admin has every permission
    'users.create',
    'reservations.create', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'reservation.tax_exempt',
    'guests.write',
    'settings.rooms.write',
    'billing.write', 'billing.close', 'billing.adjustment.create',
    'housekeeping.write',
    'maintenance.write',
    'reports.read', 'reports.write',
  ],
  Manager: [
    // Manager: everything except user creation and system settings
    'reservations.create', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'reservation.tax_exempt',
    'guests.write',
    'billing.write', 'billing.close', 'billing.adjustment.create',
    'housekeeping.write',
    'maintenance.write',
    'reports.read', 'reports.write',
  ],
  Receptionniste: [
    // Validated by product owner (2026-07-10):
    // - Can: create/edit reservations, check-in, check-out, manage guests, add folio lines/payments
    // - Cannot: close folio (irréversible), tax exemption, settings, user management, reports
    'reservations.create', 'reservations.write', 'reservations.checkin', 'reservations.checkout',
    'guests.write',
    'billing.write',
  ],
  Housekeeping: [
    'housekeeping.write',
  ],
  Maintenance: [
    'maintenance.write',
  ],
  Comptable: [
    'billing.write', 'billing.close', 'billing.adjustment.create',
    'reports.read', 'reports.write',
  ],
};

async function main() {
  console.log('🌱 Seeding roles...');
  const roleDefs = [
    { name: 'Admin',          description: 'Administrateur système — accès total' },
    { name: 'Manager',        description: 'Directeur / Gérant — accès opérationnel complet' },
    { name: 'Receptionniste', description: 'Réception — réservations, check-in/out, clients, facturation courante' },
    { name: 'Housekeeping',   description: 'Gouvernante / Ménage' },
    { name: 'Maintenance',    description: 'Technicien' },
    { name: 'Comptable',      description: 'Comptabilité et finances' },
  ];

  const roleMap: Record<string, string> = {};
  for (const roleData of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    });
    roleMap[role.name] = role.id;
  }

  console.log('🔐 Seeding permissions...');
  const permMap: Record<string, string> = {};
  for (const permData of ALL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { code: permData.code },
      update: { description: permData.description },
      create: permData,
    });
    permMap[perm.code] = perm.id;
  }

  console.log('🔗 Linking permissions to roles...');
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roleMap[roleName];
    if (!roleId) { console.warn(`  ⚠ Role "${roleName}" not found, skipping.`); continue; }
    for (const code of permCodes) {
      const permissionId = permMap[code];
      if (!permissionId) { console.warn(`  ⚠ Permission "${code}" not found, skipping.`); continue; }
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        update: {},
        create: { roleId, permissionId },
      });
    }
    console.log(`  ✓ ${roleName}: ${permCodes.length} permissions`);
  }

  console.log('👤 Seeding admin user...');
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash('admin_pass_2026', salt);
  await prisma.user.upsert({
    where: { email: 'admin@brunchbouake.com' },
    update: {},
    create: {
      email: 'admin@brunchbouake.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'System',
      roleId: roleMap['Admin'],
    },
  });

  console.log('👤 Seeding receptionist user...');
  const recepHash = await bcrypt.hash('reception_pass_2026', salt);
  await prisma.user.upsert({
    where: { email: 'reception@brunchbouake.com' },
    update: {},
    create: {
      email: 'reception@brunchbouake.com',
      passwordHash: recepHash,
      firstName: 'Sophie',
      lastName: 'Koné',
      roleId: roleMap['Receptionniste'],
    },
  });

  console.log('🏨 Seeding base room data...');
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

  await prisma.room.upsert({
    where: { number: '101' },
    update: {},
    create: {
      number: '101',
      roomTypeId: roomType.id,
      floor: 1,
    },
  });

  await prisma.guest.upsert({
    where: { id: 1 },
    update: {},
    create: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '0102030405',
      email: 'john.doe@example.com',
    },
  });

  console.log('✅ Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
