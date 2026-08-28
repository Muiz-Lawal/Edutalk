#!/usr/bin/env node
import { spawn } from 'child_process';

const backendUrl = process.env.BACKEND_URL || process.argv[2] || 'http://localhost:5001';
const env = { ...process.env, BACKEND_URL: backendUrl };

function run(cmd, args, name) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', env, shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${name} exited ${code}`))));
  });
}

(async () => {
  try {
    console.log('Running release-readiness smoke against', backendUrl);
    await run('node', ['backend/smoke/release-readiness.mjs'], 'release-readiness');

    console.log('Running webhook-integration smoke against', backendUrl);
    await run('node', ['backend/smoke/webhook-integration.mjs'], 'webhook-integration');

    console.log('All smoke scripts passed');
    process.exit(0);
  } catch (err) {
    console.error('Smoke scripts failed:', err.message);
    process.exit(1);
  }
})();
