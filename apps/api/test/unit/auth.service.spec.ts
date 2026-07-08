import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';

describe('AuthService.register', () => {
  const usersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  } as unknown as jest.Mocked<Pick<UsersService, 'findByEmail' | 'createUser'>>;
  const jwtService = {
    sign: jest.fn(),
  } as unknown as jest.Mocked<Pick<JwtService, 'sign'>>;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService as unknown as UsersService, jwtService as unknown as JwtService);
  });

  it('hashes and salts the password before creating the user', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'stored-hash',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtService.sign.mockReturnValue('jwt-token');

    await service.register({ email: 'user@example.com', password: 'Password123' });

    expect(usersService.createUser).toHaveBeenCalledTimes(1);
    const [, passwordHash] = usersService.createUser.mock.calls[0];
    expect(passwordHash).not.toBe('Password123');
    await expect(bcrypt.compare('Password123', passwordHash)).resolves.toBe(true);
  });

  it('rejects duplicate email addresses before hashing or persistence', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'existing-user-id',
      email: 'user@example.com',
      passwordHash: 'hash',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(service.register({ email: 'user@example.com', password: 'Password123' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(usersService.createUser).not.toHaveBeenCalled();
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('returns a bearer JWT payload and public user data only', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    jwtService.sign.mockReturnValue('jwt-token');

    const response = await service.register({ email: 'user@example.com', password: 'Password123' });

    expect(response).toEqual({
      accessToken: 'jwt-token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: 'user-id',
        email: 'user@example.com',
        avatar: null,
      },
    });
    expect(JSON.stringify(response)).not.toContain('password');
    expect(JSON.stringify(response)).not.toContain('passwordHash');
  });
});
