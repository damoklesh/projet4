import { ApiProperty } from '@nestjs/swagger';
import type { FileStatus } from '@datashare/shared';

export class UploadedFileTagResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class UploadedFileAssetResponseDto {
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
}

export class UploadedShareLinkResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  isPasswordProtected: boolean;
}

export class FileAssetResponseDto {
  @ApiProperty({ type: UploadedFileAssetResponseDto })
  fileAsset: UploadedFileAssetResponseDto;

  @ApiProperty({ type: UploadedShareLinkResponseDto })
  shareLink: UploadedShareLinkResponseDto;
}
