import { ApiProperty } from '@nestjs/swagger';
import { UserPublicDto } from '../../users/dto/user-public.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: 'Bearer';

  @ApiProperty({ example: 3600 })
  expiresIn: number;

  @ApiProperty({ type: UserPublicDto })
  user: UserPublicDto;
}
