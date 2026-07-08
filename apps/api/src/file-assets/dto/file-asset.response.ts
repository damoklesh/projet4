import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FileStatus } from '@datashare/shared';

export class FileAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty({ enum: ['active', 'expired', 'deleted'] })
  status: FileStatus;

  @ApiProperty()
  shareToken: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional({ nullable: true })
  ownerId?: string | null;
}
