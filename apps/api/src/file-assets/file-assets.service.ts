import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'node:crypto';
import { createReadStream, promises as fsPromises } from 'node:fs';
import { extname } from 'node:path';
import { ExpirationService } from '../expiration/expiration.service';
import { StorageService } from '../storage/storage.service';
import { DeleteFileAssetResponseDto } from './dto/delete-file-asset.response';
import { FileAssetHistoryResponseDto } from './dto/file-asset-history-item.response';
import { FileAssetResponseDto } from './dto/file-asset.response';
import { FileAssetHistoryQueryDto } from './dto/file-asset-status-filter.dto';
import { UploadFileRequestDto } from './dto/upload-file.request';
import { FileAssetsRepository } from './file-assets.repository';

type UploadedFile = Express.Multer.File;

const MAX_UPLOAD_SIZE_BYTES = 1_073_741_824;
const FORBIDDEN_EXTENSIONS = new Set(['.bat', '.cmd', '.com', '.dll', '.exe', '.msi', '.scr', '.sh']);
const DEFAULT_EXPIRATION_DAYS = 7;

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
    ownerId: string;
    dto: UploadFileRequestDto;
  }): Promise<FileAssetResponseDto> {
    if (!input.file) {
      throw new BadRequestException('A multipart file field named "file" is required.');
    }

    try {
      this.validateFile(input.file);
      const tags = parseTags(input.dto.tags);

      const storageName = `${randomUUID()}-${sanitizeFileName(input.file.originalname)}`;
      const storedFile = await this.storageService.save({
        storageName,
        stream: createReadStream(input.file.path),
      });

      const token = generateShareToken();
      const expiresAt = this.createExpiryDate(input.dto.expirationDays);
      const passwordHash = input.dto.password ? await bcrypt.hash(input.dto.password, 12) : null;
      const isPasswordProtected = Boolean(passwordHash);

      const created = await this.fileAssetsRepository.createWithShareLink({
        ownerId: input.ownerId,
        originalName: input.file.originalname,
        storageName: storedFile.storageName,
        storagePath: storedFile.storagePath,
        mimeType: input.file.mimetype,
        size: storedFile.size,
        token,
        expiresAt,
        passwordHash,
        tags,
      });

      if (!created.shareLink) {
        throw new BadRequestException('File asset was created without a share link.');
      }

      return {
        fileAsset: {
          id: created.id,
          fileName: created.originalName,
          mimeType: created.mimeType,
          size: Number(created.size),
          uploadedAt: created.uploadedAt,
          expiresAt: created.shareLink.expiresAt,
          status: this.expirationService.getFunctionalStatus({
            deletedAt: created.deletedAt,
            expiredAt: created.expiredAt,
            expiresAt: created.shareLink.expiresAt,
          }),
          isPasswordProtected,
          tags: created.fileTags.map((fileTag) => ({
            id: fileTag.tag.id,
            name: fileTag.tag.name,
          })),
        },
        shareLink: {
          url: this.createShareUrl(created.shareLink.token),
          token: created.shareLink.token,
          expiresAt: created.shareLink.expiresAt,
          isPasswordProtected,
        },
      };
    } finally {
      await fsPromises.rm(input.file.path, { force: true });
    }
  }

  async getHistory(
    ownerId: string,
    query: FileAssetHistoryQueryDto,
  ): Promise<FileAssetHistoryResponseDto> {
    const result = await this.fileAssetsRepository.listForOwner(ownerId, query);

    return {
      items: result.items.map((asset) => {
        const shareLink = asset.shareLink;
        const expiresAt = shareLink?.expiresAt ?? asset.expiredAt ?? asset.uploadedAt;
        const status = this.expirationService.getFunctionalStatus({
          deletedAt: asset.deletedAt,
          expiredAt: asset.expiredAt,
          expiresAt,
        });
        const actionableShareToken = status === 'active' ? (shareLink?.token ?? '') : '';
        const isShareLinkActionable = actionableShareToken.length > 0;
        const isPasswordProtected = isShareLinkActionable && Boolean(shareLink?.passwordHash);

        return {
          id: asset.id,
          fileName: asset.originalName,
          mimeType: asset.mimeType,
          size: Number(asset.size),
          uploadedAt: asset.uploadedAt,
          expiresAt,
          status,
          isPasswordProtected,
          tags: asset.fileTags.map((fileTag) => ({
            id: fileTag.tag.id,
            name: fileTag.tag.name,
          })),
          shareLink: {
            url: isShareLinkActionable ? this.createShareUrl(actionableShareToken) : '',
            token: actionableShareToken,
            expiresAt,
            isPasswordProtected,
          },
        };
      }),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: result.total,
        totalPages: Math.ceil(result.total / query.pageSize),
      },
    };
  }

  async delete(fileAssetId: string, ownerId: string): Promise<DeleteFileAssetResponseDto> {
    const asset = await this.fileAssetsRepository.findById(fileAssetId);

    if (!asset) {
      throw new NotFoundException('File asset not found.');
    }

    if (asset.ownerId !== ownerId) {
      throw new ForbiddenException('You can delete only your own files.');
    }

    if (asset.storagePath) {
      await this.storageService.delete(asset.storagePath);
    }

    await this.fileAssetsRepository.deleteById(fileAssetId);

    return {
      id: fileAssetId,
      status: 'deleted',
    };
  }

  private validateFile(file: UploadedFile): void {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new PayloadTooLargeException('File size must not exceed 1 GB.');
    }

    if (FORBIDDEN_EXTENSIONS.has(extname(file.originalname).toLowerCase())) {
      throw new UnsupportedMediaTypeException('This file type is not allowed.');
    }
  }

  private createExpiryDate(expirationDays?: number): Date {
    const ttlDays = expirationDays ?? this.config.get<number>('shareLinks.defaultTtlDays') ?? DEFAULT_EXPIRATION_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);
    return expiresAt;
  }

  private createShareUrl(token: string): string {
    const webOrigin = this.config.get<string>('api.corsOrigin') ?? 'http://localhost:5173';
    return `${webOrigin.replace(/\/$/, '')}/share/${token}`;
  }
}

function parseTags(rawTags?: string): string[] {
  if (!rawTags) {
    return [];
  }

  const tags = rawTags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const uniqueTags = [...new Set(tags)];

  for (const tag of uniqueTags) {
    if (tag.length > 30) {
      throw new BadRequestException('Tag names must not exceed 30 characters.');
    }
  }

  return uniqueTags;
}

function generateShareToken(): string {
  return randomBytes(12).toString('hex');
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}
