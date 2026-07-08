import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShareLinkResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  fileAssetId: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  downloadCount: number;

  @ApiPropertyOptional()
  passwordProtected?: boolean;
}
