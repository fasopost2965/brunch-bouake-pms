async function run() {
  console.log('Testing Check-in Logic...');
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
    token = data.access_token;
  } catch (err: any) {
    console.error('Failed to login:', err.message);
    process.exit(1);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // We use reservation id: 1 (created in the previous test)
  const reservationId = 1;

  // 2. Room 101 starts as CLEAN and OPERATIONAL by default, let's mark it as DIRTY
  console.log('Setting Room 101 to DIRTY...');
  await fetch(`${API_URL}/settings/rooms/1`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ cleanlinessStatus: 'DIRTY' })
  });

  // 3. Try to check-in without override (Should FAIL)
  console.log('Trying check-in without override...');
  const resFail = await fetch(`${API_URL}/reservations/${reservationId}/checkin`, {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  });
  console.log(`Status: ${resFail.status} (Expected 400)`);
  console.log(await resFail.json());

  // 4. Try to check-in with override (Should SUCCEED)
  console.log('Trying check-in with override...');
  const resSuccess = await fetch(`${API_URL}/reservations/${reservationId}/checkin`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ override: true, overrideReason: 'Client insisted, room is almost clean' })
  });
  console.log(`Status: ${resSuccess.status} (Expected 200/201)`);
  console.log(await resSuccess.json());
}

run();
