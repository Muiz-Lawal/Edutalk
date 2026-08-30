import assert from 'assert';

const API = process.env.API_URL || 'http://localhost:5001/api';
const admins = [
  { email: 'super@test.local', password: 'Password123!' },
  { email: 'finance@test.local', password: 'Password123!' },
  { email: 'moderator@test.local', password: 'Password123!' },
  { email: 'support@test.local', password: 'Password123!' },
  { email: 'admin@test.local', password: 'Password123!' },
];

async function login(email, password) {
  const res = await fetch(`${API}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch (e) { body = text; }
  return { status: res.status, body };
}

(async function run() {
  for (const a of admins) {
    console.log('\n---');
    console.log('Testing', a.email);
    const loginRes = await login(a.email, a.password);
    console.log('Login status:', loginRes.status);
    if (loginRes.status !== 200) {
      console.log('Login failed body:', loginRes.body);
      continue;
    }

    const token = loginRes.body.token || loginRes.body?.token?.token || loginRes.body?.token?.authToken || loginRes.body?.token;
    const user = loginRes.body.user || loginRes.body?.user;
    console.log('Logged in user role:', user?.adminRole, 'isAdmin:', user?.isAdmin);

    // Fetch dashboard stats (correct API path)
    const dash = await get('/admin/dashboard/stats', token);
    console.log('/admin/dashboard/stats ->', dash.status, typeof dash.body === 'object' ? JSON.stringify(Object.keys(dash.body)) : String(dash.body).slice(0,200));

    // Fetch users (sample)
    const users = await get('/admin/users?page=1&limit=5', token);
    console.log('/admin/users ->', users.status);
    if (users.status === 200 && Array.isArray(users.body?.data || users.body)) {
      const list = users.body.data || users.body;
      console.log('Sample user fields for first entry:', list[0] ? Object.keys(list[0]) : 'no users');
      // check for email exposure
      const exposedEmail = list[0] && list[0].email;
      console.log('First user email field present?:', !!exposedEmail);
    } else {
      console.log('Users response body preview:', JSON.stringify(users.body).slice(0,400));
    }

    // Try to fetch a host/student route that should be disallowed for admin client UI but may be accessible server-side
    const hostDash = await get('/host-dashboard', token);
    console.log('/host-dashboard ->', hostDash.status);

  }
})();
