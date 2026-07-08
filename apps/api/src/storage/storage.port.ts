import type { ReadStream } from 'node:fs';
import type { Readable } from 'node:stream';

export const STORAGE_PORT = Symbol('STORAGE_PORT');

export interface SaveFileInput {
  stream: Readable;
  storageName: string;
}

export interface StoredFile {
  storageName: string;
  storagePath: string;
  size: number;
}

export interface StoragePort {
  save(input: SaveFileInput): Promise<StoredFile>;
  createReadStream(storagePath: string): ReadStream;
  delete(storagePath: string): Promise<void>;
}
