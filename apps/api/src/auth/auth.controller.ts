import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { ApiResponse } from '../common/types/api-response.type';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth.response';
import { LoginRequestDto } from './dto/login.request';
import { RegisterRequestDto } from './dto/register.request';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    return {
      status: 'success',
      message: 'Compte créé avec succès.',
      data: await this.authService.register(dto),
    };
  }

  @Post('login')
  async login(@Body() dto: LoginRequestDto): Promise<ApiResponse<AuthResponseDto>> {
    return {
      status: 'success',
      message: 'Connexion réussie.',
      data: await this.authService.login(dto),
    };
  }
}
