const API_BASE = process.env.BACKEND_URL || 'http://localhost:5001/api';

function ok(name, passed, info = '') {
  console.log(`[${passed ? 'OK ' : 'FAIL'}] ${name}${info ? ' - ' + info : ''}`);
}

function randEmail() { return `smoke+${Date.now()}@example.com`; }

async function run() {
  console.log('Starting confirm+certificate (v2) smoke tests against', API_BASE);

  const email = randEmail();
  const password = 'Passw0rd!';
  let token = null;
  let userId = null;

  // Register
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: 'Smoke', lastName: 'User' })
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    token = body.token || body.data?.token || null;
    ok('Register', !!token, token ? `userId=${body.user?._id||body.user?.id||''}` : JSON.stringify(body));
  } catch (err) { ok('Register', false, err.message); process.exit(2); }

  // Login
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));
    token = body.token || body.data?.token || token;
    ok('Login', !!token);
  } catch (err) { ok('Login', false, err.message); process.exit(3); }

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Upgrade to host
  try {
    const res = await fetch(`${API_BASE}/auth/upgrade-to-host`, { method: 'POST', headers: authHeader });
    const body = await res.json(); if (!res.ok) throw new Error(JSON.stringify(body)); ok('Upgrade to host', true);
  } catch (err) { ok('Upgrade to host', false, err.message); process.exit(4); }

  // Create class
  let classId = null;
  try {
    const payload = { title: 'ConfirmTest ' + Date.now(), description: 'Confirm flow class', category: 'Technology', monthlyPrice: 10, minPurchaseDays: 1, schedule: [{ dayOfWeek: 1, startTime: '10:00', duration: 60 }], visibility: 'public' };
    const res = await fetch(`${API_BASE}/classes`, { method: 'POST', headers: authHeader, body: JSON.stringify(payload) });
    const body = await res.json(); if (!res.ok) throw new Error(JSON.stringify(body));
    classId = body._id || body.id || body.data?._id || body.class?._id || (body.class && body.class._id) || null;
    ok('Create class', !!classId, classId ? `classId=${classId}` : JSON.stringify(body));
  } catch (err) { ok('Create class', false, err.message); process.exit(5); }

  // Create payment intent
  let clientSecret = null;
  try {
    const res = await fetch(`${API_BASE}/payments/create-intent`, { method: 'POST', headers: authHeader, body: JSON.stringify({ classId, numberOfDays: 7 }) });
    const body = await res.json(); if (!res.ok) throw new Error(JSON.stringify(body)); clientSecret = body.clientSecret || body.client_secret || body.clientSecretValue || null; ok('Create payment intent', !!clientSecret, clientSecret ? `amount=${body.amount}` : JSON.stringify(body));
  } catch (err) { ok('Create payment intent', false, err.message); process.exit(6); }

  // Confirm payment
  let subscriptionId = null;
  try {
    const paymentIntentId = clientSecret;
    const res = await fetch(`${API_BASE}/payments/confirm`, { method: 'POST', headers: authHeader, body: JSON.stringify({ paymentIntentId, classId, numberOfDays: 7 }) });
    const body = await res.json(); if (!res.ok) throw new Error(JSON.stringify(body));
    subscriptionId = body.subscription?.id || body.subscriptionId || body.subscription?._id || null;
    ok('Confirm payment', !!subscriptionId, subscriptionId ? `subscriptionId=${subscriptionId}` : JSON.stringify(body));
  } catch (err) { ok('Confirm payment', false, err.message); process.exit(7); }

  // Generate certificate
  try {
    const res = await fetch(`${API_BASE}/certificates`, { method: 'POST', headers: authHeader, body: JSON.stringify({ enrollmentId: subscriptionId }) });
    const body = await res.json(); if (!res.ok) throw new Error(JSON.stringify(body));
    const certId = body.data?._id || body.data?.id || body.data?.certificateId || body.data?._id || null;
    ok('Generate certificate', !!certId, certId ? `certificateId=${certId}` : JSON.stringify(body));
  } catch (err) { ok('Generate certificate', false, err.message); process.exit(8); }

  console.log('\nConfirm + certificate (v2) flow completed successfully.'); process.exit(0);
}

run().catch(e=>{ console.error('Unexpected', e); process.exit(20); });
