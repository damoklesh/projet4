import { ApiProperty } from '@nestjs/swagger';
import type { FileStatus } from '@datashare/shared';
import { UploadedFileTagResponseDto, UploadedShareLinkResponseDto } from './file-asset.response';

export class FileAssetHistoryItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ enum: ['active', 'expired', 'deleted'] })
  status: FileStatus;

  @ApiProperty()
  isPasswordProtected: boolean;

  @ApiProperty({ type: [UploadedFileTagResponseDto] })
  tags: UploadedFileTagResponseDto[];

  @ApiProperty({ type: UploadedShareLinkResponseDto })
  shareLink: UploadedShareLinkResponseDto;
}

export class FileAssetHistoryPaginationResponseDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  pageSize: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  totalPages: number;
}

export class FileAssetHistoryResponseDto {
  @ApiProperty({ type: [FileAssetHistoryItemResponseDto] })
  items: FileAssetHistoryItemResponseDto[];

  @ApiProperty({ type: FileAssetHistoryPaginationResponseDto })
  pagination: FileAssetHistoryPaginationResponseDto;
}
