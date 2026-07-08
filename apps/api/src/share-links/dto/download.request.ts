import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DownloadRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  password?: string;
}
