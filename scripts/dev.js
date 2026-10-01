import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const services = [
  {
    name: 'backend',
    cwd: path.join(root, 'backend'),
    entry: path.join(root, 'backend', 'node_modules', 'nodemon', 'bin', 'nodemon.js'),
    args: ['src/server.js'],
  },
  {
    name: 'frontend',
    cwd: path.join(root, 'frontend'),
    entry: path.join(root, 'frontend', 'node_modules', 'vite', 'bin', 'vite.js'),
    args: ['--host', '0.0.0.0'],
  },
];

const missing = services.filter(({ entry }) => !existsSync(entry));
if (missing.length) {
  console.error(`Install dependencies before starting: ${missing.map(({ name }) => `npm install --prefix ${name}`).join(' and ')}`);
  process.exit(1);
}

const children = [];
let shuttingDown = false;

function stopChildren(signal = 'SIGTERM') {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill(signal);
  }
}

for (const service of services) {
  const child = spawn(process.execPath, [service.entry, ...service.args], {
    cwd: service.cwd,
    stdio: 'inherit',
  });
  children.push(child);
  console.log(`Starting ${service.name}...`);
  child.once('error', (error) => {
    console.error(`Could not start ${service.name}: ${error.message}`);
    process.exitCode = 1;
    stopChildren();
  });
  child.once('exit', (code, signal) => {
    if (!shuttingDown) {
      process.exitCode = code ?? (signal ? 1 : 0);
      stopChildren();
    }
  });
}

process.once('SIGINT', () => stopChildren('SIGINT'));
process.once('SIGTERM', () => stopChildren('SIGTERM'));
