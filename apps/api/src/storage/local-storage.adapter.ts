import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, createWriteStream, promises as fsPromises } from 'node:fs';
import type { ReadStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { SaveFileInput, StoragePort, StoredFile } from './storage.port';

@Injectable()
export class LocalStorageAdapter implements StoragePort {
  private readonly rootPath: string;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.rootPath = resolve(config.get<string>('storage.localRoot') ?? 'storage/uploads');
  }

  async save(input: SaveFileInput): Promise<StoredFile> {
    const storagePath = join(this.rootPath, input.storageName);
    await fsPromises.mkdir(dirname(storagePath), { recursive: true });
    await pipeline(input.stream, createWriteStream(storagePath));
    const stat = await fsPromises.stat(storagePath);

    return {
      storageName: input.storageName,
      storagePath,
      size: stat.size,
    };
  }

  createReadStream(storagePath: string): ReadStream {
    return createReadStream(storagePath);
  }

  async delete(storagePath: string): Promise<void> {
    await fsPromises.rm(storagePath, { force: true });
  }
}
