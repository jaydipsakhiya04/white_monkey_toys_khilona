import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { createValidationPipe, SanitizePipe } from './common/pipes/validation';
import { APP_CONFIG, AppConfig } from './config/configuration';

/**
 * Applies global HTTP configuration. Shared by main.ts and the e2e tests so tests
 * exercise exactly the production pipeline.
 */
export function configureApp(app: NestExpressApplication): AppConfig {
  const config = app.get<AppConfig>(APP_CONFIG);

  app.setGlobalPrefix('api');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      // Images are loaded cross-origin by the storefront/admin.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // JSON API: a CSP adds nothing and would break the Swagger UI.
      contentSecurityPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '1mb' });

  app.enableCors({
    origin: (origin, cb) => {
      // Allow non-browser clients (no Origin header) and configured origins only.
      if (!origin || config.corsOrigins.includes(origin.replace(/\/+$/, ''))) return cb(null, true);
      cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  if (config.storage.provider === 'local') {
    app.useStaticAssets(resolve(process.cwd(), config.storage.localDir), {
      prefix: '/uploads',
      maxAge: '30d',
      immutable: true,
      index: false,
      dotfiles: 'deny',
    });
  }

  app.useGlobalPipes(new SanitizePipe(), createValidationPipe());
  app.enableShutdownHooks();

  if (config.swaggerEnabled) {
    const doc = new DocumentBuilder()
      .setTitle('Khilona API')
      .setDescription(
        'REST API for the Khilona shop: storefront catalogue, cart validation, guest orders and the admin panel.\n\n' +
          'All responses use the envelope `{ success, message, data }`; errors use `{ success: false, statusCode, message, errors[] }`.\n\n' +
          'Admin endpoints require `Authorization: Bearer <accessToken>` from `POST /api/auth/login`.',
      )
      .setVersion('1.0.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addCookieAuth('khilona_rt')
      .build();
    const document = SwaggerModule.createDocument(app, doc);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      customSiteTitle: 'Khilona API Docs',
      swaggerOptions: { persistAuthorization: true, tagsSorter: 'alpha', docExpansion: 'none' },
    });
  }

  return config;
}
