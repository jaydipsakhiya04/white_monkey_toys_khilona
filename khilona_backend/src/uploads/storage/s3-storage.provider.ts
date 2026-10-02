import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AppConfig } from '../../config/configuration';
import { StorageProvider, StoredFile } from './storage.provider';

/** Any S3-compatible object storage: AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces… */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: AppConfig['storage']) {
    this.bucket = config.bucket!;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle,
      credentials: { accessKeyId: config.accessKey!, secretAccessKey: config.secretKey! },
    });
    this.publicUrl =
      config.publicUrl ||
      (config.endpoint
        ? `${config.endpoint.replace(/\/+$/, '')}/${this.bucket}`
        : `https://${this.bucket}.s3.${config.region}.amazonaws.com`);
  }

  async put(key: string, body: Buffer, contentType: string): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return { key, url: `${this.publicUrl}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
