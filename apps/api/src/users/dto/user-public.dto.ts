import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserPublicDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional({ nullable: true })
  avatar?: string | null;
}
