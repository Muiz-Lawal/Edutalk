import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const TOKEN = process.env.TEST_CLEANUP_TOKEN || '';

(async function main(){
  const res = await fetch(`${BACKEND_URL}/__test/cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(TOKEN ? { 'x-test-cleanup-token': TOKEN } : {}) },
    body: JSON.stringify({ reason: 'smoke-test-cleanup' })
  });

  const text = await res.text();
  console.log('Cleanup response status:', res.status);
  console.log('Body:', text);
  process.exit(res.status === 200 ? 0 : 2);
})();
