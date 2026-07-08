import { ApiProperty } from '@nestjs/swagger';
import type { FileStatus } from '@datashare/shared';

export class FileAssetHistoryItemResponseDto {
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

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ enum: ['active', 'expired', 'deleted'] })
  status: FileStatus;

  @ApiProperty()
  downloadCount: number;

  @ApiProperty({ type: [String] })
  tags: string[];
}
