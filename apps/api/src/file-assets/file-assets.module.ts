import { Module } from '@nestjs/common';
import { ExpirationModule } from '../expiration/expiration.module';
import { StorageModule } from '../storage/storage.module';
import { FileAssetsController } from './file-assets.controller';
import { FileAssetsRepository } from './file-assets.repository';
import { FileAssetsService } from './file-assets.service';

@Module({
  imports: [ExpirationModule, StorageModule],
  controllers: [FileAssetsController],
  providers: [FileAssetsService, FileAssetsRepository],
  exports: [FileAssetsService],
})
export class FileAssetsModule {}
