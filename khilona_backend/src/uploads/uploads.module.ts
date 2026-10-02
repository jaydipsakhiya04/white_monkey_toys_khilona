import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { APP_CONFIG, AppConfig } from '../config/configuration';
import { LocalStorageProvider } from './storage/local-storage.provider';
import { S3StorageProvider } from './storage/s3-storage.provider';
import { STORAGE_PROVIDER } from './storage/storage.provider';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.storage.maxFileSizeBytes, files: 1, fields: 5 },
      }),
    }),
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    {
      provide: STORAGE_PROVIDER,
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) =>
        config.storage.provider === 's3'
          ? new S3StorageProvider(config.storage)
          : new LocalStorageProvider(config.storage.localDir, config.storage.publicUrl),
    },
  ],
})
export class UploadsModule {}
