import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import type { ReadStream } from 'node:fs';
import { ExpirationService } from '../expiration/expiration.service';
import { StorageService } from '../storage/storage.service';
import { DownloadRequestDto } from './dto/download.request';
import { ShareLinkMetadataResponseDto } from './dto/share-link-metadata.response';
import { ShareLinksRepository } from './share-links.repository';

export interface DownloadFileResult {
  stream: ReadStream;
  fileName: string;
  mimeType: string;
  size: number;
}

@Injectable()
export class ShareLinksService {
  constructor(
    private readonly expirationService: ExpirationService,
    private readonly shareLinksRepository: ShareLinksRepository,
    private readonly storageService: StorageService,
  ) {}

  async getMetadata(token: string): Promise<ShareLinkMetadataResponseDto> {
    const shareLink = await this.shareLinksRepository.findByToken(token);

    if (!shareLink) {
      throw new NotFoundException('Share link not found.');
    }

    return {
      token: shareLink.token,
      fileName: shareLink.fileAsset.originalName,
      mimeType: shareLink.fileAsset.mimeType,
      size: Number(shareLink.fileAsset.size),
      uploadedAt: shareLink.fileAsset.uploadedAt,
      expiresAt: shareLink.expiresAt,
      passwordProtected: Boolean(shareLink.passwordHash),
      status: this.expirationService.getFunctionalStatus({
        deletedAt: shareLink.fileAsset.deletedAt,
        expiresAt: shareLink.expiresAt,
      }),
    };
  }

  async download(token: string, dto: DownloadRequestDto): Promise<DownloadFileResult> {
    const shareLink = await this.shareLinksRepository.findByToken(token);

    if (!shareLink) {
      throw new NotFoundException('Share link not found.');
    }

    if (shareLink.fileAsset.deletedAt || this.expirationService.isExpired(shareLink.expiresAt)) {
      throw new ForbiddenException('Share link is no longer available.');
    }

    if (shareLink.passwordHash) {
      const passwordMatches = dto.password
        ? await bcrypt.compare(dto.password, shareLink.passwordHash)
        : false;

      if (!passwordMatches) {
        throw new ForbiddenException('A valid password is required.');
      }
    }

    await this.shareLinksRepository.incrementDownloadCount(shareLink.id);

    return {
      stream: this.storageService.createReadStream(shareLink.fileAsset.storagePath),
      fileName: shareLink.fileAsset.originalName,
      mimeType: shareLink.fileAsset.mimeType,
      size: Number(shareLink.fileAsset.size),
    };
  }
}
