import { parseDurationToSeconds } from '../common/utils/duration';

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  isProduction: boolean;
  port: number;
  appUrl: string;
  trustProxy: boolean;
  swaggerEnabled: boolean;
  corsOrigins: string[];
  timezone: string;
  orderNumberPrefix: string;
  jwt: {
    secret: string;
    expiresIn: string;
    expiresInSeconds: number;
    refreshTtlDays: number;
  };
  cookie: {
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    domain?: string;
  };
  throttle: {
    globalLimit: number;
    loginLimit: number;
    orderLimit: number;
  };
  storage: {
    provider: 'local' | 's3';
    localDir: string;
    publicUrl: string;
    bucket?: string;
    region: string;
    endpoint?: string;
    accessKey?: string;
    secretKey?: string;
    forcePathStyle: boolean;
    maxFileSizeBytes: number;
  };
}

const bool = (v: string | undefined, fallback: boolean) =>
  v === undefined || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());

const int = (v: string | undefined, fallback: number) => {
  const n = Number.parseInt(v ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
};

const trimSlash = (s: string) => s.replace(/\/+$/, '');

/**
 * Validates environment variables once at boot and exposes a typed config object.
 * Fails fast in production when security-relevant values are missing or weak.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const nodeEnv = (env.NODE_ENV ?? 'development') as AppConfig['env'];
  const isProduction = nodeEnv === 'production';
  const errors: string[] = [];

  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required');

  const jwtSecret = env.JWT_SECRET ?? '';
  if (!jwtSecret) errors.push('JWT_SECRET is required');
  else if (isProduction && (jwtSecret.length < 32 || jwtSecret.startsWith('change-me'))) {
    errors.push('JWT_SECRET must be a random string of at least 32 characters in production');
  }

  const jwtExpiresIn = env.JWT_EXPIRES_IN || '15m';
  const expiresInSeconds = parseDurationToSeconds(jwtExpiresIn);
  if (!expiresInSeconds) errors.push(`JWT_EXPIRES_IN "${jwtExpiresIn}" is not a valid duration (e.g. 900, 15m, 1h)`);

  const provider = (env.STORAGE_PROVIDER || 'local') as 'local' | 's3';
  if (!['local', 's3'].includes(provider)) errors.push('STORAGE_PROVIDER must be "local" or "s3"');
  if (provider === 's3') {
    for (const key of ['STORAGE_BUCKET', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY']) {
      if (!env[key]) errors.push(`${key} is required when STORAGE_PROVIDER=s3`);
    }
  }

  const sameSite = (env.COOKIE_SAMESITE || 'lax').toLowerCase() as AppConfig['cookie']['sameSite'];
  if (!['lax', 'strict', 'none'].includes(sameSite)) errors.push('COOKIE_SAMESITE must be lax, strict or none');

  if (errors.length) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }

  const port = int(env.PORT, 4000);
  const appUrl = trimSlash(env.APP_URL || `http://localhost:${port}`);

  return {
    env: nodeEnv,
    isProduction,
    port,
    appUrl,
    trustProxy: bool(env.TRUST_PROXY, false),
    swaggerEnabled: bool(env.SWAGGER_ENABLED, !isProduction),
    corsOrigins: (env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001')
      .split(',')
      .map((o) => trimSlash(o.trim()))
      .filter(Boolean),
    timezone: env.APP_TIMEZONE || 'Asia/Kolkata',
    orderNumberPrefix: (env.ORDER_NUMBER_PREFIX || 'KH').toUpperCase(),
    jwt: {
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
      expiresInSeconds: expiresInSeconds ?? 900,
      refreshTtlDays: int(env.REFRESH_TOKEN_TTL_DAYS, 7),
    },
    cookie: {
      secure: bool(env.COOKIE_SECURE, isProduction),
      sameSite,
      domain: env.COOKIE_DOMAIN || undefined,
    },
    throttle: {
      globalLimit: int(env.THROTTLE_GLOBAL_LIMIT, 300),
      loginLimit: int(env.THROTTLE_LOGIN_LIMIT, 5),
      orderLimit: int(env.THROTTLE_ORDER_LIMIT, 10),
    },
    storage: {
      provider,
      localDir: env.STORAGE_LOCAL_DIR || 'uploads',
      publicUrl: trimSlash(env.STORAGE_PUBLIC_URL || (provider === 'local' ? `${appUrl}/uploads` : '')),
      bucket: env.STORAGE_BUCKET || undefined,
      region: env.STORAGE_REGION || 'auto',
      endpoint: env.STORAGE_ENDPOINT || undefined,
      accessKey: env.STORAGE_ACCESS_KEY || undefined,
      secretKey: env.STORAGE_SECRET_KEY || undefined,
      forcePathStyle: bool(env.STORAGE_FORCE_PATH_STYLE, false),
      maxFileSizeBytes: int(env.UPLOAD_MAX_FILE_SIZE_MB, 5) * 1024 * 1024,
    },
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');
