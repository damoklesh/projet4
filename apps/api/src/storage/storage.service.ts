import { Inject, Injectable } from '@nestjs/common';
import type { ReadStream } from 'node:fs';
import type { SaveFileInput, StoragePort, StoredFile } from './storage.port';
import { STORAGE_PORT } from './storage.port';

@Injectable()
export class StorageService implements StoragePort {
  constructor(@Inject(STORAGE_PORT) private readonly storage: StoragePort) {}

  save(input: SaveFileInput): Promise<StoredFile> {
    return this.storage.save(input);
  }

  createReadStream(storagePath: string): ReadStream {
    return this.storage.createReadStream(storagePath);
  }

  delete(storagePath: string): Promise<void> {
    return this.storage.delete(storagePath);
  }
}
