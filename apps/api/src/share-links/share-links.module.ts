import { Module } from '@nestjs/common';
import { ExpirationModule } from '../expiration/expiration.module';
import { StorageModule } from '../storage/storage.module';
import { ShareLinksController } from './share-links.controller';
import { ShareLinksRepository } from './share-links.repository';
import { ShareLinksService } from './share-links.service';

@Module({
  imports: [ExpirationModule, StorageModule],
  controllers: [ShareLinksController],
  providers: [ShareLinksService, ShareLinksRepository],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
