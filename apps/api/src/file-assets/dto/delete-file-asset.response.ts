import { ApiProperty } from '@nestjs/swagger';

export class DeleteFileAssetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['deleted'] })
  status: 'deleted';
}
