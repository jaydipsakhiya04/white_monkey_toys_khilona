/**
 * Environment for e2e tests. Uses a separate database (TEST_DATABASE_URL or khilona_test)
 * so tests never touch development data.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(__dirname, '../.env'), quiet: true });

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/khilona_test?schema=public';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.JWT_EXPIRES_IN = '15m';
process.env.THROTTLE_GLOBAL_LIMIT = '100000';
process.env.THROTTLE_LOGIN_LIMIT = '100000';
process.env.THROTTLE_ORDER_LIMIT = '100000';
process.env.STORAGE_PROVIDER = 'local';
process.env.STORAGE_LOCAL_DIR = 'uploads-test';
process.env.SWAGGER_ENABLED = 'false';
process.env.COOKIE_SECURE = 'false';
