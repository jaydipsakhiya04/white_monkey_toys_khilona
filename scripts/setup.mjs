/**
 * One-time local setup (works on Windows, macOS and Linux).
 *
 *   npm run setup
 *
 * 1. Creates the env files from the .env.example templates (never overwrites).
 * 2. Installs dependencies for the API, storefront and admin panel.
 * 3. Generates the Prisma client.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

const envFiles = [
  ['khilona_backend/.env.example', 'khilona_backend/.env'],
  ['khilona_userpanel/.env.example', 'khilona_userpanel/.env.local'],
  ['khilona_adminpanel/.env.example', 'khilona_adminpanel/.env.local'],
];

function run(cmd, cwd = root) {
  console.log(`\n[setup] > ${cmd}${cwd === root ? '' : `   (in ${cwd.slice(root.length + 1)})`}`);
  const result = spawnSync(cmd, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`[setup] Failed: ${cmd}`);
    process.exit(result.status ?? 1);
  }
}

for (const [from, to] of envFiles) {
  if (existsSync(resolve(root, to))) {
    console.log(`[setup] ${to} already exists — kept`);
  } else {
    copyFileSync(resolve(root, from), resolve(root, to));
    console.log(`[setup] Created ${to}`);
  }
}

for (const app of ['khilona_backend', 'khilona_userpanel', 'khilona_adminpanel']) {
  run('npm install', resolve(root, app));
}

run('npx prisma generate', resolve(root, 'khilona_backend'));

console.log(`
[setup] Done. Next:
  npm run start:all       # first time: start PostgreSQL, create tables + demo data, start all apps
  npm run dev:db          # later runs (embedded PostgreSQL + all apps)
  npm run dev             # later runs, if your own PostgreSQL / Docker database is already running
`);
