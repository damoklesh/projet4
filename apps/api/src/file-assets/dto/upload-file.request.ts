import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UploadFileRequestDto {
  @ApiPropertyOptional({ description: 'Optional link password.' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 30, default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  expiresInDays?: number;

  @ApiPropertyOptional({ description: 'Comma-separated tag names for authenticated users.' })
  @IsOptional()
  @IsString()
  tags?: string;
}
