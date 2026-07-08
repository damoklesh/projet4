import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { UserPublicDto } from './dto/user-public.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  createUser(email: string, passwordHash: string): Promise<User> {
    return this.usersRepository.create({ email, passwordHash });
  }

  toPublicDto(user: Pick<User, 'id' | 'email' | 'avatar'>): UserPublicDto {
    return {
      id: user.id,
      email: user.email,
      avatar: user.avatar,
    };
  }
}
