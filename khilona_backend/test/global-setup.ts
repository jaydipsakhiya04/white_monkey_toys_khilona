import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { TEST_DATABASE_URL } from './setup-env';

/** Applies migrations to the test database before the suite runs. */
export default async function globalSetup() {
  execSync('npx prisma migrate deploy', {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
