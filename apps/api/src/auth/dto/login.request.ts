import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginRequestDto {
  @ApiProperty({ example: 'user@datashare.local' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}
