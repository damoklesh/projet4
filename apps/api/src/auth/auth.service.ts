import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth.response';
import { LoginRequestDto } from './dto/login.request';
import { RegisterRequestDto } from './dto/register.request';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new ConflictException('An account already exists for this email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.createUser(dto.email, passwordHash);

    return this.createAuthResponse(user.id, user.email);
  }

  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createAuthResponse(user.id, user.email);
  }

  private createAuthResponse(userId: string, email: string): AuthResponseDto {
    const payload: JwtPayload = { sub: userId, email };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: userId,
        email,
      },
    };
  }
}
