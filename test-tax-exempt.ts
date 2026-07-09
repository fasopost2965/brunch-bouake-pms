import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing TAX exemption...');
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

  // 2. Create an exempt reservation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const taxRes = await prisma.reservation.create({
    data: {
      guestId: 1,
      checkInDate: new Date(),
      checkOutDate: tomorrow,
      agreedRate: 25000,
      source: 'DIRECT',
      createdById: 1,
      status: 'CHECKED_IN',
      adultsCount: 2,
      taxExempt: true,
      taxExemptReason: 'Resident local',
    }
  });
  
  const taxFolio = await prisma.folio.create({
    data: {
      reservationId: taxRes.id,
      type: 'MAIN',
      status: 'OPEN'
    }
  });

  // Try to add TAX line
  const lineReq = await fetch(`${API_URL}/folios/${taxFolio.id}/lines`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'TAX',
      description: 'Taxe de séjour',
      quantity: 1,
      unitPrice: 0,
    })
  });
  
  if (lineReq.status === 400) {
    console.log('✅ TAX line correctly REJECTED due to tax exemption (400 BadRequest).');
    const body = await lineReq.json();
    console.log('Error message:', body.message);
  } else {
    console.error(`❌ TAX line was NOT rejected. Status: ${lineReq.status}`);
  }

  // Cleanup
  await prisma.folioLine.deleteMany({ where: { folioId: taxFolio.id } });
  await prisma.folio.delete({ where: { id: taxFolio.id } });
  await prisma.reservation.delete({ where: { id: taxRes.id } });
}

run();
