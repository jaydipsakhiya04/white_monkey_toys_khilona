/**
 * Local development PostgreSQL runner (no Docker / system install needed).
 *
 * Downloads real PostgreSQL 16 binaries via `embedded-postgres` and runs a
 * cluster in `./.pgdata`. Intended for local development and tests ONLY.
 * In production, point DATABASE_URL at a managed PostgreSQL instance.
 *
 *   npm run db:dev        # start (keeps running until Ctrl+C)
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const port = Number(process.env.EMBEDDED_PG_PORT ?? 5432);
const user = process.env.EMBEDDED_PG_USER ?? 'postgres';
const password = process.env.EMBEDDED_PG_PASSWORD ?? 'postgres';
const databaseDir = resolve(process.cwd(), '.pgdata');
const databases = ['khilona', 'khilona_test'];

const pg = new EmbeddedPostgres({ databaseDir, user, password, port, persistent: true });

async function main() {
  if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) {
    console.log(`[dev-db] Initialising cluster in ${databaseDir}`);
    await pg.initialise();
  }
  await pg.start();
  for (const name of databases) {
    try {
      await pg.createDatabase(name);
      console.log(`[dev-db] Created database "${name}"`);
    } catch {
      // already exists
    }
  }
  console.log(`[dev-db] PostgreSQL ready on postgresql://${user}:${password}@localhost:${port}`);
  console.log('[dev-db] Press Ctrl+C to stop.');
}

async function shutdown() {
  console.log('\n[dev-db] Stopping PostgreSQL...');
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main().catch(async (err) => {
  console.error('[dev-db] Failed to start PostgreSQL:', err);
  try { await pg.stop(); } catch {}
  process.exit(1);
});
