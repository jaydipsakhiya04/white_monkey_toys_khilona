import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = configureApp(app);
  await app.listen(config.port);

  const logger = new Logger('Bootstrap');
  logger.log(`Khilona API running on ${config.appUrl}/api (${config.env})`);
  if (config.swaggerEnabled) logger.log(`Swagger docs at ${config.appUrl}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to start Khilona API:', err);
  process.exit(1);
});
