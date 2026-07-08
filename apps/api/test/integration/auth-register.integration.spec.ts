import { Controller, Get, INestApplication, UseGuards, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { CurrentUser } from '../../src/common/decorators/current-user.decorator';
import { ProblemDetailsFilter } from '../../src/common/filters/problem-details.filter';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import type { AuthenticatedUser } from '../../src/common/types/authenticated-user.type';
import { UsersService } from '../../src/users/users.service';

@Controller('test-protected')
class ProtectedController {
  @Get()
  @UseGuards(JwtAuthGuard)
  getProtected(@CurrentUser() user: AuthenticatedUser) {
    return {
      userId: user.id,
      email: user.email,
    };
  }
}

describe('POST /auth/register', () => {
  const usersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
  };

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController, ProtectedController],
      providers: [
        AuthService,
        JwtStrategy,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'jwt.secret') {
                return 'test-secret';
              }

              return undefined;
            },
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new ProblemDetailsFilter());
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates an account and returns the expected JSON envelope without password fields', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'success',
      message: 'Compte créé avec succès.',
      data: {
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: {
          id: 'user-id',
          email: 'user@example.com',
          avatar: null,
        },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('password');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('persists a password hash instead of the clear password', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(201);

    expect(usersService.createUser).toHaveBeenCalledWith(
      'user@example.com',
      expect.not.stringMatching(/^Password123$/),
    );
  });

  it('returns 409 application/problem+json when the email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'existing-user-id',
      email: 'user@example.com',
      passwordHash: 'hash',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect('Content-Type', /application\/problem\+json/)
      .expect(409);
  });

  it.each([
    ['invalid email', { email: 'not-an-email', password: 'Password123' }],
    ['short password', { email: 'user@example.com', password: 'short' }],
  ])('returns 400 application/problem+json for %s', async (_caseName, body) => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(body)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(400);
  });

  it('allows the returned JWT to access a protected endpoint', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(201);

    const token = registerResponse.body.data.accessToken;

    await request(app.getHttpServer())
      .get('/test-protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual({
          userId: 'user-id',
          email: 'user@example.com',
        });
      });
  });
});
