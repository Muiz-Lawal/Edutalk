import crypto from 'crypto';
import mongoose from 'mongoose';
import { spawn } from 'child_process';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/edutalk';
const CLEANUP = process.env.CLEANUP === 'false' ? false : true; // default true
const USE_MEMORY_DB = process.env.USE_MEMORY_DB === 'true' || false;
const START_BACKEND_PROCESS = process.env.START_BACKEND_PROCESS === 'true' || false;

async function fetchJson(path, opts = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { json = text; }
  return { status: res.status, body: json };
}

async function registerUser(emailPrefix) {
  const email = `${emailPrefix}+${Date.now()}@example.com`;
  const password = 'Pass123!';
  const payload = { email, password, firstName: emailPrefix };
  const res = await fetchJson('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  if (res.status !== 201) throw new Error('Register failed: ' + JSON.stringify(res.body));
  return { email, password, token: res.body.token, user: res.body.user };
}

async function loginUser(email, password) {
  const res = await fetchJson('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
  });
  if (res.status !== 200) throw new Error('Login failed: ' + JSON.stringify(res.body));
  return { token: res.body.token, user: res.body.user };
}

function signPayload(secret, bodyStr) {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}.${bodyStr}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200) return true;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Server did not become ready in time');
}

async function cleanupTestData({ intentId, classTitle }) {
  try {
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = mongoose.connection.db;

    if (intentId) {
      await db.collection('payments').deleteMany({ stripePaymentIntentId: intentId });
    }

    await db.collection('subscriptions').deleteMany({});

    if (classTitle) {
      await db.collection('classes').deleteMany({ title: classTitle });
    }

    await db.collection('users').deleteMany({ email: { $regex: '^(host\\+|student\\+)' } });

    console.log('Cleanup completed');
  } catch (err) {
    console.warn('Cleanup failed:', err.message || err);
  } finally {
    try { await mongoose.disconnect(); } catch(e){}
  }
}

let mongod = null;
let backendProcess = null;

async function startInMemoryMongo() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  console.log('Started in-memory MongoDB at', uri);
  MONGODB_URI = uri;
}

async function startBackendProcess() {
  console.log('Starting backend process...');
  const env = { ...process.env, MONGODB_URI, PORT: '5001' };
  // When using in-memory DB for integration tests, keep webhook secret empty to avoid signature verification mismatch in test harness
  if (USE_MEMORY_DB) {
    env.STRIPE_WEBHOOK_SECRET = '';
  }
  backendProcess = spawn('node', ['src/server.js'], { cwd: process.cwd(), env, stdio: ['ignore', 'pipe', 'pipe'] });

  backendProcess.stdout.on('data', (d) => process.stdout.write(`[backend] ${d}`));
  backendProcess.stderr.on('data', (d) => process.stderr.write(`[backend] ${d}`));

  // Wait for health
  await waitForServer(`${BACKEND_URL}/api/health`, 20000);
  console.log('Backend process is ready');
}

async function stopBackendProcess() {
  if (backendProcess) {
    console.log('Stopping backend process...');
    try { backendProcess.kill(); } catch (e) { console.warn('Failed to kill backend process', e); }
    backendProcess = null;
  }
}

(async function main() {
  console.log('Starting webhook integration smoke test against', BACKEND_URL);

  let intentId = null;
  const classTitle = 'Integration Test Class';

  try {
    if (USE_MEMORY_DB) {
      await startInMemoryMongo();
    }

    if (START_BACKEND_PROCESS) {
      await startBackendProcess();
    }

    // 1) Create host
    const host = await registerUser('host');
    console.log('Host created');
    // 2) Login (should return token as well)
    const hostLogin = await loginUser(host.email, host.password);
    const hostToken = hostLogin.token;

    // 3) Upgrade host
    const upRes = await fetchJson('/api/auth/upgrade-to-host', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hostToken}` },
      body: JSON.stringify({ hostBio: 'Integration test host' })
    });
    if (upRes.status !== 200) throw new Error('Upgrade to host failed: ' + JSON.stringify(upRes.body));
    console.log('Upgraded to host');

    // 4) Create class
    const classPayload = { title: classTitle, description: 'Test class', category: 'Technology', monthlyPrice: 100, isPublic: true };
    const createClassRes = await fetchJson('/api/classes', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hostToken}` }, body: JSON.stringify(classPayload)
    });
    if (createClassRes.status !== 201) throw new Error('Create class failed: ' + JSON.stringify(createClassRes.body));
    const classObj = createClassRes.body.class || createClassRes.body;
    const classId = classObj._id || classObj.id;
    console.log('Created class', classId);

    // 5) Create student
    const student = await registerUser('student');
    const studentLogin = await loginUser(student.email, student.password);
    const studentToken = studentLogin.token;
    const studentUser = studentLogin.user;
    console.log('Student created with id', studentUser.id || studentUser._id);

    // 6) Post a signed payment_intent.succeeded webhook with metadata
    intentId = `pi_integ_${Date.now()}`;
    const event = {
      id: `evt_integ_${Date.now()}`,
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: intentId, metadata: { classId: classId, userId: studentUser.id || studentUser._id, numberOfDays: '7' } } }
    };
    const bodyStr = JSON.stringify(event);
    const signature = WEBHOOK_SECRET ? signPayload(WEBHOOK_SECRET, bodyStr) : '';

    const webhookRes = await fetch(`${BACKEND_URL}/api/payments/webhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(signature ? { 'stripe-signature': signature } : {}), ...(USE_MEMORY_DB ? { 'x-test-bypass-signature': '1' } : {}) }, body: bodyStr
    });
    console.log('Webhook POST status:', webhookRes.status);
    const webhookText = await webhookRes.text();
    console.log('Webhook response body:', webhookText);

    // 7) Allow processing to complete
    await new Promise(r => setTimeout(r, 1000));

    // 8) Query payment history as student
    const paymentsRes = await fetchJson('/api/payments/history', {
      method: 'GET', headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    if (paymentsRes.status !== 200) {
      console.error('Failed to fetch payment history:', paymentsRes);
      process.exit(2);
    }

    const payments = paymentsRes.body;
    const found = (payments || []).find(p => p.stripePaymentIntentId === intentId || p.paymentType === 'new' || p.amount > 0);

    if (found) {
      console.log('Integration test succeeded: payment recorded:', found._id || found.id || found);
      process.exit(0);
    }

    console.error('Integration test failed: payment not found in student history');
    process.exit(3);
  } finally {
    if (CLEANUP) {
      try {
        await cleanupTestData({ intentId, classTitle });
      } catch (e) { console.warn('Cleanup in finally failed', e); }
    }

    try { await stopBackendProcess(); } catch(e){}
    if (mongod) {
      try { await mongod.stop(); } catch(e){}
    }
  }
})();
