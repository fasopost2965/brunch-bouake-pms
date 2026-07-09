import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing Maintenance Module (Multi-incidents)...');
  const API_URL = 'http://localhost:3001/api';

  // 1. Authenticate as Admin
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

  // Ensure Room 1 is OPERATIONAL before test
  await prisma.room.update({ where: { id: 1 }, data: { technicalStatus: 'OPERATIONAL' } });
  
  console.log('Creating Incident #1 on Room 1...');
  const inc1Res = await fetch(`${API_URL}/maintenance/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ roomId: 1, description: 'AC is leaking', status: 'OPEN' })
  });
  const inc1 = await inc1Res.json();

  let room = await prisma.room.findUnique({ where: { id: 1 } });
  console.log(`Room 1 technicalStatus after Incident #1: ${room?.technicalStatus}`);

  console.log('Creating Incident #2 on Room 1...');
  const inc2Res = await fetch(`${API_URL}/maintenance/issues`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ roomId: 1, description: 'TV is not working', status: 'OPEN' })
  });
  const inc2 = await inc2Res.json();

  room = await prisma.room.findUnique({ where: { id: 1 } });
  console.log(`Room 1 technicalStatus after Incident #2: ${room?.technicalStatus}`);

  console.log('Resolving Incident #1...');
  await fetch(`${API_URL}/maintenance/issues/${inc1.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'RESOLVED' })
  });

  room = await prisma.room.findUnique({ where: { id: 1 } });
  console.log(`Room 1 technicalStatus after resolving Incident #1: ${room?.technicalStatus}`);
  
  if (room?.technicalStatus === 'MAINTENANCE') {
    console.log('✅ TEST PASSED: Room is STILL in MAINTENANCE because Incident #2 is OPEN.');
  } else {
    console.error('❌ TEST FAILED: Room technicalStatus became OPERATIONAL too early!');
  }

  console.log('Resolving Incident #2...');
  await fetch(`${API_URL}/maintenance/issues/${inc2.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'RESOLVED' })
  });

  room = await prisma.room.findUnique({ where: { id: 1 } });
  console.log(`Room 1 technicalStatus after resolving Incident #2: ${room?.technicalStatus}`);

  if (room?.technicalStatus === 'OPERATIONAL') {
    console.log('✅ TEST PASSED: Room is now OPERATIONAL since all incidents are RESOLVED.');
  } else {
    console.error('❌ TEST FAILED: Room technicalStatus is still MAINTENANCE!');
  }
}

run();
