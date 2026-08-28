// end-to-end-run2.mjs - improved: fetch my-certificates to resolve certificate _id
const BASE = process.env.BASE || 'http://localhost:5001/api';
async function postJson(path, body, token){
  const headers = { 'content-type':'application/json' };
  if (token) headers['authorization'] = `Bearer ${token}`;
  return await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
}
async function getJson(path, token){
  const headers = {};
  if (token) headers['authorization'] = `Bearer ${token}`;
  return await fetch(`${BASE}${path}`, { headers });
}

async function run(){
  console.log('Start improved end-to-end certificate smoke');
  const student = { email: `smoke-student+${Date.now()}@example.com`, password: 'Test1234!', firstName: 'Smoke', lastName: 'Student' };
  let r = await postJson('/auth/register', student);
  if (!r.ok) { console.error('Register failed', await r.text()); return process.exit(2); }
  const reg = await r.json();
  const studentId = reg.user && (reg.user.id || reg.user._id) || reg.id || null;
  console.log('Registered student id', studentId);
  r = await postJson('/auth/login', { email: student.email, password: student.password });
  const ld = await r.json(); const studentToken = ld.token || ld.accessToken || (ld.result && ld.result.token);

  // host create
  const host = { email: `smoke-host+${Date.now()}@example.com`, password: 'Test1234!', firstName: 'Host', lastName: 'User' };
  r = await postJson('/auth/register', host); r = await postJson('/auth/login', { email: host.email, password: host.password });
  const hostLogin = await r.json(); const hostToken = hostLogin.token || hostLogin.accessToken || (hostLogin.result && hostLogin.result.token);
  await postJson('/auth/upgrade-to-host', { displayName: 'Smoke Host' }, hostToken);
  const classBody = { title: 'Smoke Test Class '+Date.now(), description: 'E2E test class', category: 'Technology', monthlyPrice: 100, minPurchaseDays: 1, schedule: [{ dayOfWeek: 1, startTime: '12:00', duration: 60 }] };
  r = await postJson('/classes', classBody, hostToken); const classRes = await r.json(); const classObj = classRes.class || classRes.data || classRes; const classId = classObj && (classObj._id || classObj.id || classObj.classId);
  console.log('Created class', classId);

  // enroll via admin test route
  const adminCreds = { email: 'admin@edutalk.com', password: 'Admin123456!' };
  const adminLoginRes = await postJson('/auth/login', adminCreds); const adminLoginBody = await adminLoginRes.json(); const adminToken = adminLoginBody.token || adminLoginBody.accessToken || (adminLoginBody.result && adminLoginBody.result.token);
  r = await postJson('/admin/testing/create-subscription', { userId: studentId, classId, numberOfDays: 1 }, adminToken);
  const createSub = await r.json();
  const enrollmentId = createSub.subscriptionId || createSub.subscriptionId || (createSub.data && createSub.data.subscriptionId) || createSub.data?._id || createSub._id || createSub.subscriptionId;
  console.log('Enrollment Id:', enrollmentId);

  // mark progress
  if (hostToken) { r = await postJson('/progress/complete', { enrollmentId }, hostToken); console.log('Progress complete status', r.status); }

  // generate certificate (student)
  r = await postJson('/certificates', { enrollmentId }, studentToken);
  if (!r.ok) { console.error('Generate certificate failed', await r.text()); return process.exit(2); }
  const cert = await r.json(); console.log('Generate certificate response', cert);

  // fetch my certificates to find the generated certificate _id
  r = await getJson('/certificates/my-certificates', studentToken);
  if (!r.ok) { console.error('Fetch my-certificates failed', r.status, await r.text()); return process.exit(2); }
  const myList = await r.json();
  const found = (Array.isArray(myList) ? myList : (myList.data || [])).find(c => c.enrollmentId === enrollmentId || c.enrollmentId === enrollmentId || c.certificateNumber === (cert.data && cert.data.certificateNumber));
  const certId = found && (found._id || found.id || found.certificateId || found.certificateNumber);
  console.log('Resolved certId from my-certificates', certId);
  if (!certId) { console.error('Could not resolve certificate id'); return process.exit(2); }

  // download metadata
  r = await getJson('/certificates/' + certId + '/download', studentToken);
  if (!r.ok) { console.error('Download metadata failed', r.status, await r.text()); return process.exit(2); }
  const dl = await r.json(); console.log('Download metadata', dl);
  const pdfUrl = dl.data && dl.data.pdfUrl;
  if (!pdfUrl) { console.error('No pdfUrl returned'); return process.exit(2); }
  const pdfRes = await fetch(`http://localhost:5001${pdfUrl}`);
  console.log('PDF fetch status', pdfRes.status);
  if (pdfRes.ok) { const buf = await pdfRes.arrayBuffer(); console.log('PDF size', buf.byteLength); } else { console.error('Failed to fetch PDF', await pdfRes.text()); return process.exit(2); }

  console.log('End-to-end certificate improved run completed successfully');
}

run().catch(err=>{ console.error('Unhandled', err); process.exit(3); });
