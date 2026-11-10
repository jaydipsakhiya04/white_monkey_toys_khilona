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
process.env.STOREFRONT_REVALIDATE_SECRET = '';
process.env.THROTTLE_GLOBAL_LIMIT = '100000';
process.env.THROTTLE_LOGIN_LIMIT = '100000';
process.env.THROTTLE_ORDER_LIMIT = '100000';
process.env.THROTTLE_TRACK_LIMIT = '100000';
process.env.ORDER_NUMBER_PREFIX = 'WMT';
// most suites exercise guest checkout; customer.e2e-spec switches login-required back on to test it
process.env.ORDERS_REQUIRE_LOGIN = 'false';
process.env.STORAGE_PROVIDER = 'local';
process.env.STORAGE_LOCAL_DIR = 'uploads-test';
process.env.SWAGGER_ENABLED = 'false';
process.env.COOKIE_SECURE = 'false';
