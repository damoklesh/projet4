import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UploadFileRequestDto {
  @ApiPropertyOptional({ description: 'Optional link password, minimum 6 characters.' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 7, default: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  expirationDays?: number;

  @ApiPropertyOptional({
    description: 'Comma-separated tag names. Each tag is limited to 30 characters.',
  })
  @IsOptional()
  @IsString()
  tags?: string;
}
