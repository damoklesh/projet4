import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { FileStatusFilter } from '@datashare/shared';

export type FileAssetSort = 'uploadedAt' | 'expiresAt' | 'fileName' | 'size';
export type SortOrder = 'asc' | 'desc';

export class FileAssetHistoryQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;

  @ApiPropertyOptional({ enum: ['active', 'expired', 'all'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'expired', 'all'])
  status: FileStatusFilter = 'active';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  tag?: string;

  @ApiPropertyOptional({ enum: ['uploadedAt', 'expiresAt', 'fileName', 'size'], default: 'uploadedAt' })
  @IsOptional()
  @IsIn(['uploadedAt', 'expiresAt', 'fileName', 'size'])
  sort: FileAssetSort = 'uploadedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order: SortOrder = 'desc';
}
