import { ApiProperty } from '@nestjs/swagger';
import type { FileStatus } from '@datashare/shared';

export class ShareLinkMetadataResponseDto {
  @ApiProperty()
  token: string;

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

  @ApiProperty()
  isPasswordProtected: boolean;

  @ApiProperty({ enum: ['active', 'expired', 'deleted'] })
  status: FileStatus;
}
