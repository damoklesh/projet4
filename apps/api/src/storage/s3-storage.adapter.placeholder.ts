import { Injectable } from '@nestjs/common';
import type { ReadStream } from 'node:fs';
import type { StoragePort, StoredFile } from './storage.port';

@Injectable()
export class S3StorageAdapterPlaceholder implements StoragePort {
  save(): Promise<StoredFile> {
    throw new Error('S3/MinIO storage adapter is not implemented for the MVP.');
  }

  createReadStream(): ReadStream {
    throw new Error('S3/MinIO storage adapter is not implemented for the MVP.');
  }

  delete(): Promise<void> {
    throw new Error('S3/MinIO storage adapter is not implemented for the MVP.');
  }
}
