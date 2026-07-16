import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../storage/storage.service';
import { FileAssetsRepository } from './file-assets.repository';

@Injectable()
export class FileExpirationCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FileExpirationCleanupService.name);

  constructor(
    private readonly fileAssetsRepository: FileAssetsRepository,
    private readonly storageService: StorageService,
  ) {}

  onApplicationBootstrap(): void {
    void this.runCleanupSafely();
  }

  @Cron(CronExpression.EVERY_HOUR)
  handleExpiredFileCleanup(): void {
    void this.runCleanupSafely();
  }

  async cleanupExpiredFiles(now = new Date()): Promise<number> {
    const expiredFiles = await this.fileAssetsRepository.listExpiredWithStorage(now);
    let cleaned = 0;

    for (const fileAsset of expiredFiles) {
      if (!fileAsset.storagePath) {
        continue;
      }

      try {
        await this.storageService.delete(fileAsset.storagePath);
        await this.fileAssetsRepository.markExpired(fileAsset.id);
        cleaned += 1;
      } catch (error) {
        this.logger.error(`Could not cleanup expired file asset ${fileAsset.id}`, error);
      }
    }

    return cleaned;
  }

  private async runCleanupSafely(): Promise<void> {
    try {
      await this.cleanupExpiredFiles();
    } catch (error) {
      this.logger.error('Could not run expired file cleanup', error);
    }
  }
}
