import { GoneException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

    this.ensureShareLinkIsAvailable(shareLink);

    return {
      token: shareLink.token,
      fileName: shareLink.fileAsset.originalName,
      mimeType: shareLink.fileAsset.mimeType,
      size: Number(shareLink.fileAsset.size),
      uploadedAt: shareLink.fileAsset.uploadedAt,
      expiresAt: shareLink.expiresAt,
      isPasswordProtected: Boolean(shareLink.passwordHash),
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

    this.ensureShareLinkIsAvailable(shareLink);

    if (shareLink.passwordHash) {
      const passwordMatches = dto.password
        ? await bcrypt.compare(dto.password, shareLink.passwordHash)
        : false;

      if (!passwordMatches) {
        throw new UnauthorizedException('A valid password is required.');
      }
    }

    if (!shareLink.fileAsset.storagePath) {
      throw new GoneException('Shared file is no longer stored.');
    }

    const stream = this.storageService.createReadStream(shareLink.fileAsset.storagePath);
    await this.shareLinksRepository.incrementDownloadCount(shareLink.id);

    return {
      stream,
      fileName: shareLink.fileAsset.originalName,
      mimeType: shareLink.fileAsset.mimeType,
      size: Number(shareLink.fileAsset.size),
    };
  }

  private ensureShareLinkIsAvailable(shareLink: {
    expiresAt: Date;
    fileAsset: { deletedAt: Date | null };
  }): void {
    if (shareLink.fileAsset.deletedAt) {
      throw new GoneException('Shared file has been deleted.');
    }

    if (this.expirationService.isExpired(shareLink.expiresAt)) {
      throw new GoneException('Share link has expired.');
    }
  }
}
