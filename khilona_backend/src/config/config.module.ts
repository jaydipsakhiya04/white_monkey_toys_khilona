import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_CONFIG, loadConfig } from './configuration';

/** Loads `.env` and exposes the validated, typed AppConfig under the APP_CONFIG token. */
@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true })],
  providers: [{ provide: APP_CONFIG, useFactory: () => loadConfig(process.env) }],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
