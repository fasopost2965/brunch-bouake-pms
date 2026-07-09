async function run() {
  console.log('Creating real data for Brunch Bouake PMS via Settings API...');
  const API_URL = 'http://localhost:3001/api';

  // 1. Authenticate as Admin
  let token;
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brunchbouake.com',
        password: 'admin_pass_2026',
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    token = data.access_token;
  } catch (err: any) {
    console.error('Failed to login:', err.message);
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const createRoomType = async (payload: any) => {
    const res = await fetch(`${API_URL}/settings/room-types`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.message && data.message.includes('Unique constraint failed')) {
        console.log(`RoomType ${payload.name} already exists, fetching it...`);
        const allTypesRes = await fetch(`${API_URL}/settings/room-types`, { headers });
        const allTypes = await allTypesRes.json();
        return allTypes.find((t: any) => t.name === payload.name);
      }
      throw new Error(`Failed to create RoomType ${payload.name}: ${JSON.stringify(data)}`);
    }
    return data;
  };

  const createRoom = async (payload: any) => {
    const res = await fetch(`${API_URL}/settings/rooms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.message && data.message.includes('Unique constraint failed')) {
        console.log(`Room ${payload.number} already exists.`);
        return { number: payload.number, skip: true };
      }
      throw new Error(`Failed to create Room ${payload.number}: ${JSON.stringify(data)}`);
    }
    return data;
  }

  try {
    // 1. Chambre
    console.log('Creating RoomType: Chambre...');
    const chambreType = await createRoomType({
      name: 'Chambre',
      description: 'Chambre avec salle de bain privative',
      amenities: ['wifi', 'climatisation', 'eau_chaude'],
      capacity: 2,
      baseRate: 15000,
    });

    const chambres = [];
    for (let i = 1; i <= 4; i++) {
      const num = `C${i}`;
      console.log(`Creating Room: ${num}...`);
      const room = await createRoom({ number: num, roomTypeId: chambreType.id, floor: 1 });
      chambres.push(room);
    }

    // 2. Studio
    console.log('Creating RoomType: Studio...');
    const studioType = await createRoomType({
      name: 'Studio',
      description: 'Chambre avec salon et cuisine équipée',
      amenities: ['wifi', 'climatisation', 'eau_chaude', 'cuisine_equipee'],
      capacity: 2,
      baseRate: 25000,
    });

    const studios = [];
    for (let i = 1; i <= 4; i++) {
      const num = `S${i}`;
      console.log(`Creating Room: ${num}...`);
      const room = await createRoom({ number: num, roomTypeId: studioType.id, floor: 1 });
      studios.push(room);
    }

    // 3. Appartement
    console.log('Creating RoomType: Appartement...');
    const appartementType = await createRoomType({
      name: 'Appartement',
      description: 'Spacieux appartement avec plusieurs chambres, grand salon et cuisine',
      amenities: ['wifi', 'climatisation', 'eau_chaude', 'cuisine_equipee', 'balcon'],
      capacity: 4,
      baseRate: 45000,
    });

    console.log('\n=== RÉSUMÉ DE L\'INVENTAIRE ===\n');
    console.log('--- CHAMBRES (Tarif de base: 15 000 FCFA) ---');
    chambres.forEach((r: any) => {
      if(!r.skip) console.log(`- Numéro: ${r.number} | Étage: ${r.floor} | Type: Chambre`);
    });

    console.log('\n--- STUDIOS (Tarif de base: 25 000 FCFA) ---');
    studios.forEach((r: any) => {
      if(!r.skip) console.log(`- Numéro: ${r.number} | Étage: ${r.floor} | Type: Studio`);
    });

    console.log('\n--- APPARTEMENTS (Tarif de base: 45 000 FCFA) ---');
    console.log('0 unité physique créée pour l\'instant.');

  } catch (err: any) {
    console.error('An error occurred:', err.message);
  }
}

run();
