export interface StoredFile {
  key: string;
  url: string;
}

/** Storage abstraction: swap local disk for any S3-compatible bucket via STORAGE_PROVIDER. */
export interface StorageProvider {
  put(key: string, body: Buffer, contentType: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
