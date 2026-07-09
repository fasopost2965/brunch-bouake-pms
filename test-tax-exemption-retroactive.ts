import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing retroactive TAX exemption...');
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

  // 2. Seed permission
  const role = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (role) {
    const pTax = await prisma.permission.upsert({
      where: { code: 'reservation.tax_exempt' },
      update: {},
      create: { code: 'reservation.tax_exempt', module: 'reservations' }
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: pTax.id } },
      update: {},
      create: { roleId: role.id, permissionId: pTax.id }
    });
  }

  // 3. Create reservation (taxExempt = false initially)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const res1 = await prisma.reservation.create({
    data: {
      guestId: 1,
      checkInDate: new Date(),
      checkOutDate: tomorrow,
      agreedRate: 25000,
      source: 'DIRECT',
      createdById: 1,
      status: 'CHECKED_IN',
      adultsCount: 2,
      taxExempt: false,
    }
  });

  // Create an OPEN folio and a CLOSED folio
  const folioOpen = await prisma.folio.create({
    data: { reservationId: res1.id, type: 'MAIN', status: 'OPEN' }
  });
  const folioClosed = await prisma.folio.create({
    data: { reservationId: res1.id, type: 'MAIN', status: 'CLOSED' }
  });

  // Add TAX lines
  await prisma.folioLine.create({
    data: { folioId: folioOpen.id, type: 'TAX', description: 'Taxe', unitPrice: 2000, quantity: 1, amount: 2000 }
  });
  await prisma.folioLine.create({
    data: { folioId: folioClosed.id, type: 'TAX', description: 'Taxe', unitPrice: 2000, quantity: 1, amount: 2000 }
  });

  console.log(`Initial setup: Reservation ${res1.id} has 1 OPEN folio (with TAX) and 1 CLOSED folio (with TAX).`);

  // 4. Try updating via PUT (should strip taxExempt)
  console.log('Testing PUT to modify taxExempt (should be ignored)...');
  await fetch(`${API_URL}/reservations/${res1.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ specialRequests: 'Test', taxExempt: true, taxExemptReason: 'Should ignore' })
  });
  
  let check = await prisma.reservation.findUnique({ where: { id: res1.id } });
  if (check?.taxExempt === false) {
    console.log('✅ PUT ignored taxExempt fields successfully.');
  } else {
    console.error('❌ PUT allowed taxExempt modification!');
  }

  // 5. Try updating via PATCH without reason
  console.log('Testing PATCH without reason (should fail)...');
  const patchNoReason = await fetch(`${API_URL}/reservations/${res1.id}/tax-exemption`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ taxExempt: true, taxExemptReason: '' })
  });
  if (patchNoReason.status === 400) {
    console.log('✅ PATCH without reason correctly rejected (400).');
  } else {
    console.error(`❌ PATCH without reason allowed! Status: ${patchNoReason.status}`);
  }

  // 6. Try updating via PATCH properly
  console.log('Testing PATCH properly...');
  const patchOk = await fetch(`${API_URL}/reservations/${res1.id}/tax-exemption`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ taxExempt: true, taxExemptReason: 'Diplomat' })
  });
  if (patchOk.ok) {
    console.log('✅ PATCH applied successfully.');
  } else {
    console.error(`❌ PATCH failed: ${patchOk.status}`);
  }

  // 7. Verify Retroactive Deletion/Adjustment
  const linesOpen = await prisma.folioLine.findMany({ where: { folioId: folioOpen.id, type: 'TAX' } });
  if (linesOpen.length === 0) {
    console.log('✅ TAX line on OPEN folio was deleted.');
  } else {
    console.error('❌ TAX line on OPEN folio was NOT deleted.');
  }

  const adjFolio = await prisma.folio.findFirst({
    where: { reservationId: res1.id, parentFolioId: folioClosed.id, type: 'ADJUSTMENT' },
    include: { lines: true }
  });
  if (adjFolio && adjFolio.lines.length === 1 && parseFloat(adjFolio.lines[0].amount as any) === -2000) {
    console.log('✅ ADJUSTMENT folio correctly created with negative TAX line for the CLOSED folio.');
  } else {
    console.error('❌ ADJUSTMENT folio was NOT created correctly.');
  }

  // Cleanup
  await prisma.folioLine.deleteMany({ where: { folioId: adjFolio?.id } });
  await prisma.folio.deleteMany({ where: { id: adjFolio?.id } });
  await prisma.folioLine.deleteMany({ where: { folioId: folioClosed.id } });
  await prisma.folioLine.deleteMany({ where: { folioId: folioOpen.id } });
  await prisma.folio.deleteMany({ where: { reservationId: res1.id } });
  await prisma.reservation.delete({ where: { id: res1.id } });
}

run();
