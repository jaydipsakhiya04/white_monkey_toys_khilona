import { Inject, Injectable, Logger, UnsupportedMediaTypeException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import sharp, { type OutputInfo } from 'sharp';
import { STORAGE_PROVIDER, StorageProvider } from './storage/storage.provider';

export const UPLOAD_FOLDERS = ['products', 'categories', 'store'] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const MAX_DIMENSION = 1600;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger('Uploads');

  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  /**
   * Validates the real image content (not just the MIME header), strips metadata,
   * auto-rotates, downsizes to max 1600px and converts to WebP.
   */
  async uploadImage(file: Express.Multer.File, folder: UploadFolder, actorEmail: string) {
    let output: { data: Buffer; info: OutputInfo };
    try {
      const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 40_000_000 });
      const meta = await image.metadata();
      if (!meta.format || !['jpeg', 'png', 'webp', 'avif', 'gif', 'heif'].includes(meta.format)) {
        throw new Error(`format ${meta.format}`);
      }
      output = await image
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer({ resolveWithObject: true });
    } catch (err) {
      this.logger.warn(`Rejected upload "${file.originalname}": ${(err as Error).message}`);
      throw new UnsupportedMediaTypeException('The file is not a valid image. Use JPG, PNG, WebP, AVIF or GIF.');
    }

    const now = new Date();
    const key = `${folder}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.webp`;
    const stored = await this.storage.put(key, output.data, 'image/webp');
    this.logger.log(`${actorEmail} uploaded ${key} (${Math.round(output.info.size / 1024)} KB)`);

    return {
      url: stored.url,
      width: output.info.width,
      height: output.info.height,
      size: output.info.size,
      contentType: 'image/webp' as const,
    };
  }
}
