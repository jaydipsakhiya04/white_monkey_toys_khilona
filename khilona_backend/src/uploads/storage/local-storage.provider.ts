import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { StorageProvider, StoredFile } from './storage.provider';

/** Stores files on local disk; served by the API at /uploads (see main.ts). */
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(
    localDir: string,
    private readonly publicUrl: string,
  ) {
    this.root = resolve(process.cwd(), localDir);
  }

  async put(key: string, body: Buffer): Promise<StoredFile> {
    const path = this.safePath(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    return { key, url: `${this.publicUrl}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await rm(this.safePath(key), { force: true });
  }

  private safePath(key: string) {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) throw new Error('Invalid storage key');
    return path;
  }
}
