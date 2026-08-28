const API_BASE = process.env.BACKEND_URL || 'http://localhost:5001/api';

function ok(name, passed, info = '') {
  console.log(`[${passed ? 'OK ' : 'FAIL'}] ${name}${info ? ' - ' + info : ''}`);
}

function randEmail() {
  const t = Date.now();
  return `smoke+${t}@example.com`;
}

async function run() {
  console.log('Starting compact smoke tests against', API_BASE);

  // Test 1: Register
  const email = randEmail();
  const password = 'Passw0rd!';
  let token = null;
  let userId = null;
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'Test' }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    token = body.token || body.data?.token || null;
    userId = body.user?.id || body.data?.user?._id || body.user?._id || null;
    ok('Register', !!token, token ? `userId=${userId}` : JSON.stringify(body));
  } catch (err) {
    ok('Register', false, err.message);
    process.exit(2);
  }

  // Test 2: Login
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    token = body.token || body.data?.token || body.token;
    ok('Login', !!token);
  } catch (err) {
    ok('Login', false, err.message);
    process.exit(3);
  }

  const authHeader = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Test 3: Upgrade to host
  try {
    const res = await fetch(`${API_BASE}/auth/upgrade-to-host`, {
      method: 'POST',
      headers: authHeader,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    ok('Upgrade to host', true);
  } catch (err) {
    ok('Upgrade to host', false, err.message);
    process.exit(4);
  }

  // Test 4: Create class
  let classId = null;
  try {
    const payload = {
      title: 'Smoke Test Class ' + Date.now(),
      description: 'Created by smoke test',
      category: 'Technology',
      monthlyPrice: 10,
      minPurchaseDays: 1,
      schedule: [ { dayOfWeek: 1, startTime: '10:00', duration: 60 } ],
      visibility: 'public'
    };
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    classId = body._id || body.id || body.data?._id || body.class?._id || null;
    ok('Create class', !!classId, classId ? `classId=${classId}` : JSON.stringify(body));
  } catch (err) {
    ok('Create class', false, err.message);
    process.exit(5);
  }

  // Test 5: Create payment intent (mocked locally if Stripe not configured)
  let clientSecret = null;
  try {
    const res = await fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ classId, numberOfDays: 7 }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    clientSecret = body.clientSecret || body.client_secret || null;
    ok('Create payment intent', !!clientSecret, clientSecret ? `amount=${body.amount}` : JSON.stringify(body));
  } catch (err) {
    ok('Create payment intent', false, err.message);
    // continue even if payment intent failed
  }

  // Test 6: Send verification email (uses sendEmail util; will mock if provider not configured)
  try {
    const res = await fetch(`${API_BASE}/user/send-verification`, {
      method: 'POST',
      headers: authHeader,
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    ok('Send verification email', true);
  } catch (err) {
    ok('Send verification email', false, err.message);
  }

  // Test 7: Get my-classes and class detail
  try {
    const res1 = await fetch(`${API_BASE}/classes/my-classes`, { headers: authHeader });
    const list = await res1.json();
    if (!res1.ok) throw new Error(JSON.stringify(list));
    const found = Array.isArray(list) ? list.find(c => c._id === classId || c.id === classId) : (Array.isArray(list.data) ? list.data.find(c => c._id === classId) : false);
    ok('Get my-classes', !!found);

    const res2 = await fetch(`${API_BASE}/classes/${classId}`);
    const detail = await res2.json();
    if (!res2.ok) throw new Error(JSON.stringify(detail));
    ok('Get class detail', !!detail && (detail._id || detail.id));
  } catch (err) {
    ok('My-classes / class detail', false, err.message);
    process.exit(6);
  }

  console.log('\nCompact smoke tests completed successfully.');
  process.exit(0);
}

run().catch((e)=>{ console.error('Unexpected error', e); process.exit(10); });
