// end-to-end-certificate.mjs
// Run: node smoke/end-to-end-certificate.mjs
const BASE = process.env.BASE || 'http://localhost:5001/api';

async function postJson(path, body, token){
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'content-type':'application/json', ...(token?{authorization:`Bearer ${token}`}:{}) }, body: JSON.stringify(body)});
  return res;
}
async function getJson(path, token){
  const res = await fetch(`${BASE}${path}`, { headers: { ...(token?{authorization:`Bearer ${token}`}:{}) } });
  return res;
}

async function run(){
  console.log('Start end-to-end certificate smoke');

  // 1) Create student user (register)
  const student = { email: `smoke-student+${Date.now()}@example.com`, password: 'Test1234!', firstName: 'Smoke', lastName: 'Student' };
  let r = await postJson('/auth/register', student);
  if (!r.ok) { console.error('Register failed', await r.text()); return process.exit(2); }
  const reg = await r.json();
  const studentId = reg.user && (reg.user.id || reg.user._id) || reg.id || null;
  console.log('Registered student id', studentId);

  // login student
  r = await postJson('/auth/login', { email: student.email, password: student.password });
  if (!r.ok) { console.error('Student login failed', await r.text()); return process.exit(2); }
  const ld = await r.json();
  const studentToken = ld.token || ld.accessToken || (ld.result && ld.result.token);
  console.log('Student token length', studentToken?.length || 0);

  // 2) Create host user (register + upgrade)
  const host = { email: `smoke-host+${Date.now()}@example.com`, password: 'Test1234!', firstName: 'Host', lastName: 'User' };
  r = await postJson('/auth/register', host);
  if (!r.ok) { console.error('Host register failed', await r.text()); return process.exit(2); }
  const hostReg = await r.json();
  r = await postJson('/auth/login', { email: host.email, password: host.password });
  const hostLogin = await r.json();
  const hostToken = hostLogin.token || hostLogin.accessToken || (hostLogin.result && hostLogin.result.token);

  // upgrade host
  r = await postJson('/auth/upgrade-to-host', { displayName: 'Smoke Host' }, hostToken);
  console.log('Upgrade host status', r.status);

  // create a class as host
  const classBody = { title: 'Smoke Test Class', description: 'E2E test class', category: 'Technology', monthlyPrice: 100, minPurchaseDays: 1, schedule: [{ dayOfWeek: 1, startTime: '12:00', duration: 60 }] };
  r = await postJson('/classes', classBody, hostToken);
  if (!r.ok) { console.error('Create class failed', await r.text()); return process.exit(2); }
  const classRes = await r.json();
  const classObj = classRes.class || classRes.data || classRes;
  const classId = classObj && (classObj._id || classObj.id || classObj.classId);
  console.log('Created class', classId);
  // 3) Enroll student (create subscription) via direct DB insert (test-only helper) to avoid payment provider issues
  const { execSync } = await import('child_process');
  const scriptPath = './smoke/create-subscription-direct.mjs';
  console.log('Creating subscription directly via script for', student.email, 'class', classId);
  try {
    // run from backend cwd so imports (dotenv, mongoose) resolve against backend/package.json
    // Use admin login to create a test subscription via the dev-only admin route
    const adminCreds = { email: 'admin@edutalk.com', password: 'Admin123456!' };
    const adminLoginRes = await postJson('/auth/login', adminCreds);
    if (!adminLoginRes.ok) { console.error('Admin login failed', await adminLoginRes.text()); return process.exit(2); }
    const adminLoginBody = await adminLoginRes.json();
    const adminToken = adminLoginBody.token || adminLoginBody.accessToken || (adminLoginBody.result && adminLoginBody.result.token);

    console.log('Creating subscription via admin testing route for user', studentId);
    r = await postJson('/admin/testing/create-subscription', { userId: studentId, classId, numberOfDays: 1 }, adminToken);
    if (!r.ok) { console.error('Admin create-subscription failed', await r.text()); return process.exit(2); }
    const createSub = await r.json();
    const enrollmentId = createSub.subscriptionId || createSub.subscriptionId || (createSub.data && createSub.data.subscriptionId);
    console.log('Enrollment Id:', enrollmentId);

    // 4) Mark progress complete (if progress API exists)
    r = await postJson('/progress/complete', { enrollmentId }, hostToken);
    console.log('Progress complete status', r.status);

    // 5) Generate certificate
    r = await postJson('/certificates', { enrollmentId }, studentToken);
  } catch (err) {
    console.error('Failed to create subscription via admin route', err.message);
    return process.exit(2);
  }

  // 4) Mark progress complete (if progress API exists)
  r = await postJson('/progress/complete', { enrollmentId }, hostToken);
  console.log('Progress complete status', r.status);

  // 5) Generate certificate
  r = await postJson('/certificates', { enrollmentId }, studentToken);
  if (!r.ok) { console.error('Generate certificate failed', await r.text()); return process.exit(2); }
  const cert = await r.json();
  const certId = cert.data && (cert.data._id || cert.data.certificateId) || cert._id;
  console.log('Certificate id', certId);

  // 6) Download certificate metadata then fetch PDF
  r = await getJson('/certificates/' + certId + '/download', studentToken);
  const dl = await r.json();
  console.log('Download metadata', dl);
  const pdfUrl = dl.data && dl.data.pdfUrl;
  if (!pdfUrl) { console.error('No pdfUrl returned'); return process.exit(2); }

  // fetch the PDF
  const pdfRes = await fetch(`http://localhost:5001${pdfUrl}`);
  console.log('PDF fetch status', pdfRes.status);
  if (pdfRes.ok) {
    const buf = await pdfRes.arrayBuffer();
    console.log('PDF size', buf.byteLength);
  } else {
    console.error('Failed to fetch PDF');
    console.error(await pdfRes.text());
    process.exit(2);
  }

  console.log('End-to-end certificate smoke completed successfully');
}

run().catch(err=>{ console.error('Unhandled', err); process.exit(3); });
