import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing Billing Module (Immutability & MAIN + ADJUSTMENT)...');
  const API_URL = 'http://localhost:3001/api';

  // 1. Give permissions to Admin role
  console.log('Ensuring Admin has billing permissions...');
  const role = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (role) {
    const perms = ['reservations.write', 'billing.write', 'billing.adjustment.create'];
    for (const code of perms) {
      const p = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, module: 'phase3' }
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
        update: {},
        create: { roleId: role.id, permissionId: p.id }
      });
    }
  }

  // 2. Authenticate
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

  // 3. Create Reservation (should auto-create MAIN Folio)
  console.log('Creating Reservation (this will auto-create MAIN folio)...');
  const resReq = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      guestId: 1,
      roomId: null,
      checkInDate: '2026-09-01T14:00:00Z',
      checkOutDate: '2026-09-05T12:00:00Z',
      agreedRate: 150000,
      source: 'DIRECT',
    })
  });
  
  if (!resReq.ok) {
    const errorText = await resReq.text();
    console.error(`❌ Reservation creation failed: ${resReq.status} - ${errorText}`);
    process.exit(1);
  }
  
  const reservation = await resReq.json();
  
  // Wait a little for DB to catch up if needed
  await new Promise(r => setTimeout(r, 500));

  const mainFolio = await prisma.folio.findFirst({
    where: { reservationId: reservation.id, type: 'MAIN' }
  });

  if (!mainFolio) {
    console.error('❌ MAIN Folio was not automatically created!');
    process.exit(1);
  }
  console.log(`✅ MAIN Folio automatically created (ID: ${mainFolio.id})`);

  // 4. Add ACCOMMODATION line (should pull agreedRate)
  console.log('Adding Accommodation line to MAIN folio...');
  const lineReq = await fetch(`${API_URL}/folios/${mainFolio.id}/lines`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'ACCOMMODATION',
      description: 'Nuitée',
      quantity: 1,
      unitPrice: 0, // Should be overridden by backend
      amount: 0,    // Should be overridden by backend
    })
  });
  const line = await lineReq.json();

  if (parseFloat(line.unitPrice) === 150000) {
    console.log('✅ FolioLine used agreedRate from reservation.');
  } else {
    console.error(`❌ FolioLine used wrong unitPrice: ${line.unitPrice}`);
  }

  // 5. Add Payment to balance the folio to 0
  console.log('Adding Payment of 150000 to balance folio...');
  await fetch(`${API_URL}/folios/${mainFolio.id}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      amount: 150000,
      method: 'CASH',
    })
  });

  // 6. Close the Folio
  console.log('Closing MAIN folio...');
  const closeReq = await fetch(`${API_URL}/folios/${mainFolio.id}/close`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  const closeRes = await closeReq.json();

  if (closeRes.closedFolio.status === 'CLOSED') {
    console.log(`✅ MAIN Folio closed. Invoice generated: ${closeRes.invoice.legalNumber}`);
  } else {
    console.error('❌ Failed to close MAIN Folio.');
  }

  // 7. Immutability Test
  console.log('Testing Immutability: trying to add line to CLOSED folio...');
  const blockReq = await fetch(`${API_URL}/folios/${mainFolio.id}/lines`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'SERVICE',
      description: 'Breakfast',
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
    })
  });

  if (blockReq.status === 403) {
    console.log('✅ TEST PASSED: 403 Forbidden - Immutability enforced!');
  } else {
    console.error(`❌ TEST FAILED: Allowed to modify closed folio (Status: ${blockReq.status})`);
  }

  // 8. Adjustment Scenario
  console.log('Creating ADJUSTMENT folio...');
  const adjReq = await fetch(`${API_URL}/reservations/${reservation.id}/folios/adjustment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ justification: 'Forgot to add breakfast charge' })
  });
  const adjFolio = await adjReq.json();

  console.log(`✅ ADJUSTMENT Folio created (ID: ${adjFolio.id}, Parent ID: ${adjFolio.parentFolioId})`);

  console.log('Adding line to ADJUSTMENT folio...');
  await fetch(`${API_URL}/folios/${adjFolio.id}/lines`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'ADJUSTMENT',
      description: 'Breakfast (forgotten)',
      quantity: 1,
      unitPrice: 5000,
      amount: 5000,
      isAdjustment: true,
    })
  });

  console.log('Adding payment to ADJUSTMENT folio...');
  await fetch(`${API_URL}/folios/${adjFolio.id}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount: 5000, method: 'CASH' })
  });

  console.log('Closing ADJUSTMENT folio...');
  const closeAdjReq = await fetch(`${API_URL}/folios/${adjFolio.id}/close`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  const closeAdjRes = await closeAdjReq.json();

  console.log(`✅ ADJUSTMENT Folio closed. Invoice generated: ${closeAdjRes.invoice.legalNumber}`);
}

run();
