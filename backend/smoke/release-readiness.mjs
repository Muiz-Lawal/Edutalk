const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredVars.filter((key) => !process.env[key] || process.env[key].trim() === '');

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { ok: res.ok, status: res.status, body: json };
}

(async function main() {
  console.log(`Checking deployment readiness for ${BACKEND_URL}`);

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const checks = [
    { name: 'health', url: `${BACKEND_URL}/api/health` },
    { name: 'ready', url: `${BACKEND_URL}/api/ready` },
  ];

  let failed = false;
  for (const check of checks) {
    try {
      const response = await fetchJson(check.url);
      if (!response.ok) {
        console.error(`[FAIL] ${check.name} -> HTTP ${response.status}:`, response.body);
        failed = true;
        continue;
      }

      console.log(`[OK] ${check.name} -> HTTP ${response.status}: ${JSON.stringify(response.body)}`);
    } catch (error) {
      console.error(`[FAIL] ${check.name} -> ${error.message}`);
      failed = true;
    }
  }

  if (failed) {
    process.exit(2);
  }

  console.log('Release readiness check passed.');
})();
