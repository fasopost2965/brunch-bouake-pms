import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Testing KPI Calculation (Rule 7.5 - Maintenance exclusion)...');
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

  // 2. Clear maintenance status on all rooms first for a clean state
  await prisma.room.updateMany({ data: { technicalStatus: 'OPERATIONAL' } });
  
  const initialKpiRes = await fetch(`${API_URL}/rooms/kpi`, { headers });
  const initialKpi = await initialKpiRes.json();
  
  console.log('Initial KPI State:');
  console.log(`- Total Physical Rooms: ${initialKpi.totalPhysical}`);
  console.log(`- Maintenance Rooms: ${initialKpi.maintenanceRooms}`);
  console.log(`- Available Inventory: ${initialKpi.availableInventory}`);

  if (initialKpi.totalPhysical !== initialKpi.availableInventory) {
    console.error('❌ Mismatch in initial available inventory!');
  }

  // 3. Put Room 1 in MAINTENANCE
  console.log('\nPutting Room 1 in MAINTENANCE...');
  await prisma.room.update({ where: { id: 1 }, data: { technicalStatus: 'MAINTENANCE' } });

  // 4. Fetch KPI again
  const newKpiRes = await fetch(`${API_URL}/rooms/kpi`, { headers });
  const newKpi = await newKpiRes.json();

  console.log('\nNew KPI State:');
  console.log(`- Total Physical Rooms: ${newKpi.totalPhysical}`);
  console.log(`- Maintenance Rooms: ${newKpi.maintenanceRooms}`);
  console.log(`- Available Inventory: ${newKpi.availableInventory}`);

  if (newKpi.maintenanceRooms === 1 && newKpi.availableInventory === initialKpi.availableInventory - 1) {
    console.log('\n✅ TEST PASSED: Room in maintenance was successfully excluded from available inventory!');
  } else {
    console.error('\n❌ TEST FAILED: Room in maintenance was NOT properly excluded from available inventory.');
  }

  // Clean up
  await prisma.room.update({ where: { id: 1 }, data: { technicalStatus: 'OPERATIONAL' } });
}

run();
