import { Module } from '@nestjs/common';
import { LocalStorageAdapter } from './local-storage.adapter';
import { STORAGE_PORT } from './storage.port';
import { StorageService } from './storage.service';

@Module({
  providers: [
    StorageService,
    {
      provide: STORAGE_PORT,
      useClass: LocalStorageAdapter,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
