// admin-smoke-run.mjs - compact admin smoke script
// Usage: node smoke/admin-smoke-run.mjs

const BASE = process.env.BASE || 'http://localhost:5001/api';
const adminCreds = { email: 'admin@edutalk.com', password: 'Admin123456!' };

async function postJson(url, body, token){
  const headers = { 'content-type':'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
}
async function getJson(url, token){
  const headers = {};
  if (token) headers['authorization'] = `Bearer ${token}`;
  return await fetch(url, { headers });
}

async function run(){
  console.log('Admin smoke: logging in');
  let res = await postJson(`${BASE}/auth/login`, adminCreds);
  if (!res.ok) {
    console.error('Login failed', res.status);
    console.error(await res.text());
    process.exit(2);
  }
  const data = await res.json();
  const token = data.token || data.accessToken || (data.result && data.result.token);
  if (!token) {
    console.error('No token returned from login', data);
    process.exit(2);
  }
  console.log('Logged in, token length:', token.length);

  async function safeGet(path){
    const r = await getJson(`${BASE}${path}`, token);
    const txt = await r.text();
    let json = null;
    try{ json = JSON.parse(txt); } catch(e){ json = txt; }
    console.log(`GET ${path} -> ${r.status}`);
    return { status: r.status, body: json };
  }
  async function safePost(path, body){
    const r = await postJson(`${BASE}${path}`, body, token);
    const txt = await r.text();
    let json = null;
    try{ json = JSON.parse(txt); } catch(e){ json = txt; }
    console.log(`POST ${path} -> ${r.status}`);
    return { status: r.status, body: json };
  }

  // Dashboard
  await safeGet('/admin/dashboard/stats');

  // Users
  const usersRes = await safeGet('/admin/users');
  const users = Array.isArray(usersRes.body) ? usersRes.body : (usersRes.body && usersRes.body.users) || [];
  console.log('Users count:', Array.isArray(users) ? users.length : typeof users);

  // Moderation queue
  const mq = await safeGet('/admin/moderation/queue');
  const queue = Array.isArray(mq.body) ? mq.body : (mq.body && mq.body.items) || [];
  console.log('Moderation queue length:', queue.length);
  if (queue.length > 0) {
    const first = queue[0];
    const contentId = first._id || first.id || first.contentId;
    if (contentId) {
      console.log('Attempting approve for', contentId);
      await safePost(`/admin/moderation/approve/${contentId}`, {});
      console.log('Attempting reject for same item (to test both endpoints)');
      await safePost(`/admin/moderation/reject/${contentId}`, { reason: 'smoke-test' });
    }
  }

  // Suspend/unsuspend first non-admin user if present
  const targetUser = (users || []).find(u=>!u.roles || !u.roles.includes('admin')) || users[0];
  if (targetUser && (targetUser._id || targetUser.id)){
    const uid = targetUser._id || targetUser.id;
    console.log('Suspending user', uid);
    await safePost(`/admin/users/${uid}/suspend`, { reason: 'smoke-test' });
    console.log('Unsuspending user', uid);
    await safePost(`/admin/users/${uid}/unsuspend`, {});
  } else {
    console.log('No suitable user found to suspend/unsuspend');
  }

  // Email jobs utilities
  await safeGet('/admin/utilities/email-jobs');

  // Settings
  await safeGet('/admin/settings');

  console.log('Admin smoke completed');
}

run().catch(err=>{ console.error('Unhandled error in admin smoke', err); process.exit(3); });
