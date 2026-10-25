/**
 * Starts the API, storefront and admin panel together in one terminal
 * (works on Windows, macOS and Linux). Ctrl+C stops everything.
 *
 *   npm run dev                   # API :4000, storefront :3000, admin :3001
 *   npm run dev -- --db           # also start the embedded PostgreSQL (no Docker / install needed)
 *   npm run dev -- --db --seed    # ...and apply migrations + seed demo data before starting
 */
import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = new Set(process.argv.slice(2));
const withDb = args.has('--db');
const withSeed = args.has('--seed');

const colors = { db: 35, api: 36, user: 32, admin: 33 };
const children = [];

function start(name, cmd, cwd) {
  // On macOS/Linux each app gets its own process group so stopAll() can stop the whole tree.
  const child = spawn(cmd, {
    cwd: resolve(root, cwd),
    shell: true,
    detached: process.platform !== 'win32',
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  const prefix = `\x1b[${colors[name]}m[${name}]\x1b[0m `;
  const pipe = (stream, out) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop();
      for (const line of lines) out.write(prefix + line + '\n');
    });
  };
  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}exited with code ${code}`);
    if (!stopping) stopAll(code ?? 1);
  });
  children.push(child);
  return child;
}

function waitForPort(port, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((done, fail) => {
    const attempt = () => {
      const socket = connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.end(); done(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) fail(new Error(`Nothing listening on port ${port}`));
        else setTimeout(attempt, 1000);
      });
    };
    attempt();
  });
}

let stopping = false;
function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode !== null) continue;
    if (process.platform === 'win32') spawnSync(`taskkill /pid ${child.pid} /T /F`, { shell: true, stdio: 'ignore' });
    else {
      try { process.kill(-child.pid, 'SIGINT'); } catch {}
    }
  }
  setTimeout(() => process.exit(code), 5000).unref();
}
process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

async function main() {
  if (withDb) {
    start('db', 'npm run db:dev', 'khilona_backend');
    await waitForPort(5432);
    // The embedded server creates its databases right after it starts listening.
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (withSeed) {
    console.log('[dev] Applying migrations and seeding demo data...');
    const result = spawnSync('npx prisma generate && npm run prisma:deploy && npm run seed', {
      cwd: resolve(root, 'khilona_backend'),
      shell: true,
      stdio: 'inherit',
    });
    if (result.status !== 0) return stopAll(result.status ?? 1);
  }
  start('api', 'npm run start:dev', 'khilona_backend');
  start('user', 'npm run dev', 'khilona_userpanel');
  start('admin', 'npm run dev', 'khilona_adminpanel');
  console.log(`
[dev] Starting... open in your browser once compiled:
      Storefront   http://localhost:3000
      Admin panel  http://localhost:3001   (admin@khilona.in / Admin@12345)
      API docs     http://localhost:4000/api/docs
      Press Ctrl+C to stop.
`);
}

main().catch((err) => {
  console.error('[dev]', err.message);
  stopAll(1);
});
