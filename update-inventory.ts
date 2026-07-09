async function run() {
  console.log('Updating inventory (capacities and floors)...');
  const API_URL = 'http://localhost:3001/api';

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

  // 1. Fetch Room Types
  const roomTypesRes = await fetch(`${API_URL}/settings/room-types`, { headers });
  const roomTypes = await roomTypesRes.json();

  // 2. Update Capacities
  for (const rt of roomTypes) {
    let newCapacity = 2;
    if (rt.name === 'Chambre') newCapacity = 2;
    else if (rt.name === 'Studio') newCapacity = 3;
    else if (rt.name === 'Appartement') newCapacity = 4;

    console.log(`Updating ${rt.name} capacity to ${newCapacity}...`);
    await fetch(`${API_URL}/settings/room-types/${rt.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ capacity: newCapacity })
    });
  }

  // 3. Fetch Rooms
  const roomsRes = await fetch(`${API_URL}/settings/rooms`, { headers });
  const rooms = await roomsRes.json();

  // 4. Update Studio Floors
  for (const room of rooms) {
    if (room.roomType.name === 'Studio') {
      console.log(`Updating Room ${room.number} to floor 2...`);
      await fetch(`${API_URL}/settings/rooms/${room.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ floor: 2 })
      });
    }
  }

  console.log('Inventory update complete.');
}

run();
