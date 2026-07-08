import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { createReadStream, promises as fsPromises } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { ExpirationService } from '../expiration/expiration.service';
import { StorageService } from '../storage/storage.service';
import { FileAssetHistoryItemResponseDto } from './dto/file-asset-history-item.response';
import { FileAssetResponseDto } from './dto/file-asset.response';
import { FileAssetHistoryQueryDto } from './dto/file-asset-status-filter.dto';
import { UploadFileRequestDto } from './dto/upload-file.request';
import { FileAssetsRepository } from './file-assets.repository';

type UploadedFile = Express.Multer.File;

@Injectable()
export class FileAssetsService {
  constructor(
    private readonly config: ConfigService,
    private readonly expirationService: ExpirationService,
    private readonly fileAssetsRepository: FileAssetsRepository,
    private readonly storageService: StorageService,
  ) {}

  async create(input: {
    file?: UploadedFile;
    ownerId?: string;
    dto: UploadFileRequestDto;
  }): Promise<FileAssetResponseDto> {
    if (!input.file) {
      throw new BadRequestException('A multipart file field named "file" is required.');
    }

    const storageName = `${randomUUID()}-${sanitizeFileName(input.file.originalname)}`;
    const storedFile = await this.storageService.save({
      storageName,
      stream: createReadStream(input.file.path),
    });

    await fsPromises.rm(input.file.path, { force: true });

    const token = randomUUID();
    const expiresAt = this.createExpiryDate(input.dto.expiresInDays);
    const passwordHash = input.dto.password ? await bcrypt.hash(input.dto.password, 12) : null;

    const created = await this.fileAssetsRepository.createWithShareLink({
      ownerId: input.ownerId ?? null,
      originalName: input.file.originalname,
      storageName: storedFile.storageName,
      storagePath: storedFile.storagePath,
      mimeType: input.file.mimetype,
      size: storedFile.size,
      token,
      expiresAt,
      passwordHash,
    });

    if (!created.shareLink) {
      throw new BadRequestException('File asset was created without a share link.');
    }

    return {
      id: created.id,
      originalName: created.originalName,
      mimeType: created.mimeType,
      size: Number(created.size),
      uploadedAt: created.uploadedAt,
      status: this.expirationService.getFunctionalStatus({
        deletedAt: created.deletedAt,
        expiresAt: created.shareLink.expiresAt,
      }),
      shareToken: created.shareLink.token,
      expiresAt: created.shareLink.expiresAt,
      ownerId: created.ownerId,
    };
  }

  async getHistory(
    ownerId: string,
    query: FileAssetHistoryQueryDto,
  ): Promise<{ items: FileAssetHistoryItemResponseDto[]; total: number; page: number; pageSize: number }> {
    const result = await this.fileAssetsRepository.listForOwner(ownerId, query);

    return {
      items: result.items.map((asset) => {
        const shareLink = asset.shareLink;
        return {
          id: asset.id,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          size: Number(asset.size),
          uploadedAt: asset.uploadedAt,
          expiresAt: shareLink?.expiresAt ?? asset.uploadedAt,
          status: this.expirationService.getFunctionalStatus({
            deletedAt: asset.deletedAt,
            expiresAt: shareLink?.expiresAt ?? asset.uploadedAt,
          }),
          downloadCount: shareLink?.downloadCount ?? 0,
          tags: asset.fileTags.map((fileTag) => fileTag.tag.name),
        };
      }),
      total: result.total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async delete(fileAssetId: string, ownerId: string): Promise<{ deleted: true }> {
    const asset = await this.fileAssetsRepository.findOwnedById(fileAssetId, ownerId);

    if (!asset) {
      throw new NotFoundException('File asset not found.');
    }

    if (asset.ownerId !== ownerId) {
      throw new ForbiddenException('You can delete only your own files.');
    }

    await this.storageService.delete(asset.storagePath);
    await this.fileAssetsRepository.markDeleted(fileAssetId);

    return { deleted: true };
  }

  private createExpiryDate(expiresInDays?: number): Date {
    const ttlDays = expiresInDays ?? this.config.get<number>('shareLinks.defaultTtlDays') ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    return expiresAt;
  }
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}
