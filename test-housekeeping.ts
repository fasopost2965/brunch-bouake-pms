import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing Housekeeping Module...');
  const API_URL = 'http://localhost:3001/api';

  // 1. Give permissions to Admin role
  console.log('Ensuring Admin has housekeeping and maintenance permissions...');
  const role = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (role) {
    const perms = ['housekeeping.write', 'maintenance.write'];
    for (const code of perms) {
      const p = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, module: 'phase2' }
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

  // We know room 1 (C1) is currently DIRTY from the check-out test in phase 1 (or we can just force it).
  console.log('Ensuring Room 1 (C1) is DIRTY...');
  await prisma.room.update({ where: { id: 1 }, data: { cleanlinessStatus: 'DIRTY' } });

  console.log('Creating a Housekeeping task for Room 1 (STAYOVER_CLEAN)...');
  const taskRes = await fetch(`${API_URL}/housekeeping/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      roomId: 1,
      type: 'STAYOVER_CLEAN',
      status: 'TODO'
    })
  });
  const task = await taskRes.json();
  console.log(`Task created with ID: ${task.id}`);

  console.log('Completing the task...');
  const completeRes = await fetch(`${API_URL}/housekeeping/tasks/${task.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'DONE' })
  });
  const completedTask = await completeRes.json();

  console.log('Checking Room 1 cleanlinessStatus...');
  const room = await prisma.room.findUnique({ where: { id: 1 } });
  console.log(`Room 1 cleanlinessStatus: ${room?.cleanlinessStatus}`);

  if (room?.cleanlinessStatus === 'CLEAN') {
    console.log('✅ TEST PASSED: Housekeeping task completion automatically updated room cleanliness to CLEAN.');
  } else {
    console.error('❌ TEST FAILED: Room cleanliness was not updated to CLEAN.');
  }

  // Test Inspection
  console.log('\n--- Testing Inspection Task ---');
  console.log('Creating Inspection task for Room 1...');
  const inspRes = await fetch(`${API_URL}/housekeeping/tasks`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      roomId: 1,
      type: 'INSPECTION',
      status: 'TODO'
    })
  });
  const inspTask = await inspRes.json();

  console.log('Attempting to complete without result (should fail)...');
  const failRes = await fetch(`${API_URL}/housekeeping/tasks/${inspTask.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'DONE' })
  });
  console.log(`Status: ${failRes.status} (Expected 400)`);

  console.log('Completing Inspection task with DIRTY result...');
  const succRes = await fetch(`${API_URL}/housekeeping/tasks/${inspTask.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ status: 'DONE', inspectionResult: 'DIRTY' })
  });
  
  const roomAfterInsp = await prisma.room.findUnique({ where: { id: 1 } });
  console.log(`Room 1 cleanlinessStatus after inspection: ${roomAfterInsp?.cleanlinessStatus}`);

  if (roomAfterInsp?.cleanlinessStatus === 'DIRTY') {
    console.log('✅ TEST PASSED: Inspection result automatically updated room cleanliness to DIRTY.');
  } else {
    console.error('❌ TEST FAILED: Room cleanliness was not updated to DIRTY.');
  }
}

run();
