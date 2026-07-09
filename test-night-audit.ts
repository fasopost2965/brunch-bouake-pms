import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing Night Audit (Daily Snapshot & NO_SHOW)...');
  const API_URL = 'http://localhost:3001/api';

  // 1. Authenticate
  let token;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@brunchbouake.com', password: 'admin_pass_2026' })
    });
    const data = await res.json();
    token = data.access_token;
  } catch (err: any) {
    console.error('Login failed:', err.message);
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // Give permission for reports.write
  const role = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (role) {
    const p = await prisma.permission.upsert({
      where: { code: 'reports.write' },
      update: {},
      create: { code: 'reports.write', module: 'phase4' }
    });
    const pRead = await prisma.permission.upsert({
      where: { code: 'reports.read' },
      update: {},
      create: { code: 'reports.read', module: 'phase4' }
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
      update: {},
      create: { roleId: role.id, permissionId: p.id }
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: pRead.id } },
      update: {},
      create: { roleId: role.id, permissionId: pRead.id }
    });
  }

  // 2. Create a reservation for yesterday (so it becomes a NO_SHOW when audit runs today)
  console.log('Creating a CONFIRMED reservation with checkInDate = yesterday...');
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Manually create it using Prisma to bypass any backend check-in date validation if it exists
  const reservation = await prisma.reservation.create({
    data: {
      guestId: 1, // Assumes guest 1 exists (from seed)
      checkInDate: yesterday,
      checkOutDate: tomorrow,
      agreedRate: 15000,
      source: 'DIRECT',
      createdById: 1, // Admin
      status: 'CONFIRMED'
    }
  });

  console.log(`Reservation created: ID ${reservation.id}, Status: ${reservation.status}, CheckIn: ${yesterday.toISOString()}`);

  // 3. Create a FolioLine of type TAX today to test automation
  console.log('Testing TAX FolioLine automation...');
  // First we need a MAIN folio for a test reservation
  const taxRes = await prisma.reservation.create({
    data: {
      guestId: 1,
      checkInDate: new Date(),
      checkOutDate: tomorrow,
      agreedRate: 25000, // Studio
      source: 'DIRECT',
      createdById: 1,
      status: 'CHECKED_IN',
      adultsCount: 2,
    }
  });
  
  const taxFolio = await prisma.folio.create({
    data: {
      reservationId: taxRes.id,
      type: 'MAIN',
      status: 'OPEN'
    }
  });

  const lineReq = await fetch(`${API_URL}/folios/${taxFolio.id}/lines`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'TAX',
      description: 'Taxe de séjour',
      quantity: 1,
      unitPrice: 0, // Should be overridden by SystemSettings (1000) * adults (2) * nights (1) = 2000
    })
  });
  const line = await lineReq.json();

  if (parseFloat(line.unitPrice) === 2000 && parseFloat(line.amount) === 2000) {
    console.log('✅ TAX line was correctly calculated based on SystemSettings (1000 * 2 adults * 1 night = 2000)');
  } else {
    console.error(`❌ TAX line calculation failed: unitPrice=${line.unitPrice}, amount=${line.amount}`);
  }

  // 4. Trigger Night Audit
  console.log('\nTriggering Night Audit...');
  const auditReq = await fetch(`${API_URL}/reports/night-audit`, { method: 'POST', headers });
  
  if (auditReq.ok) {
    console.log('Night Audit triggered successfully.');
  } else {
    console.error(`❌ Failed to trigger Night Audit: ${auditReq.status} - ${await auditReq.text()}`);
    process.exit(1);
  }

  // 5. Verify NO_SHOW
  const updatedRes = await prisma.reservation.findUnique({ where: { id: reservation.id } });
  if (updatedRes?.status === 'NO_SHOW') {
    console.log(`✅ Reservation ${reservation.id} correctly marked as NO_SHOW!`);
  } else {
    console.error(`❌ Reservation ${reservation.id} is still ${updatedRes?.status} (Expected: NO_SHOW)`);
  }

  // 6. Verify Daily Snapshot for yesterday
  const yestIso = yesterday.toISOString().split('T')[0];
  const snapReq = await fetch(`${API_URL}/reports/snapshot?date=${yestIso}`, { headers });
  const snapshot = await snapReq.json();
  
  if (snapshot && snapshot.date) {
    console.log('\n✅ Daily Snapshot created for yesterday:');
    console.log(`- Date: ${snapshot.date}`);
    console.log(`- Available Rooms: ${snapshot.availableRooms}`);
    console.log(`- Occupied Rooms: ${snapshot.occupiedRooms}`);
    console.log(`- RevPAR: ${snapshot.revPar}`);
  } else {
    console.error('❌ Failed to retrieve Daily Snapshot.');
  }

  // Cleanup
  await prisma.folioLine.deleteMany({ where: { folioId: taxFolio.id } });
  await prisma.folio.delete({ where: { id: taxFolio.id } });
  await prisma.reservation.delete({ where: { id: taxRes.id } });
  await prisma.reservation.delete({ where: { id: reservation.id } });
}

run();
