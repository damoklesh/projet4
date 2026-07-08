import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { ProblemDetailsFilter } from '../../src/common/filters/problem-details.filter';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import { UsersService } from '../../src/users/users.service';

describe('POST /auth/login', () => {
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
      controllers: [AuthController],
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
            get: (key: string) => (key === 'jwt.secret' ? 'test-secret' : undefined),
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

  it('returns a JWT and public user data for valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      passwordHash: await bcrypt.hash('Password123', 12),
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'Password123' })
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'success',
      message: 'Connexion réussie.',
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

  it.each(['unknown email', 'wrong password'])(
    'returns 401 application/problem+json for %s',
    async (caseName) => {
      usersService.findByEmail.mockResolvedValue(
        caseName === 'unknown email'
          ? null
          : {
              id: 'user-id',
              email: 'user@example.com',
              passwordHash: await bcrypt.hash('Password123', 12),
              avatar: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@example.com', password: 'WrongPassword123' })
        .expect('Content-Type', /application\/problem\+json/)
        .expect(401)
        .expect(({ body }) => {
          expect(body.detail).toBe('Invalid email or password.');
        });
    },
  );

  it('returns 400 application/problem+json for invalid email format', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: 'Password123' })
      .expect('Content-Type', /application\/problem\+json/)
      .expect(400);
  });
});
