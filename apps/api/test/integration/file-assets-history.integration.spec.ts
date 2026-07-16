import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { ProblemDetailsFilter } from '../../src/common/filters/problem-details.filter';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import { ExpirationModule } from '../../src/expiration/expiration.module';
import { FileAssetsController } from '../../src/file-assets/file-assets.controller';
import { FileAssetsRepository } from '../../src/file-assets/file-assets.repository';
import { FileAssetsService } from '../../src/file-assets/file-assets.service';
import { StorageService } from '../../src/storage/storage.service';

describe('GET /me/file-assets', () => {
  const repository = {
    createWithShareLink: jest.fn(),
    listForOwner: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };
  const storage = {
    save: jest.fn(),
    delete: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') {
        return 'test-secret';
      }

      if (key === 'api.corsOrigin') {
        return 'http://localhost:5173';
      }

      return undefined;
    }),
  };

  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        ExpirationModule,
      ],
      controllers: [FileAssetsController],
      providers: [
        FileAssetsService,
        JwtStrategy,
        {
          provide: FileAssetsRepository,
          useValue: repository,
        },
        {
          provide: StorageService,
          useValue: storage,
        },
        {
          provide: ConfigService,
          useValue: config,
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
    jwtService = moduleRef.get(JwtService);
    await app.init();

    repository.listForOwner.mockResolvedValue({
      items: [createFileAsset()],
      total: 1,
    });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns the authenticated user file history with pagination and public fields only', async () => {
    const token = jwtService.sign({ sub: 'user-a', email: 'user-a@example.com' });

    const response = await request(app.getHttpServer())
      .get('/me/file-assets?page=1&pageSize=10&status=active&tag=facture&sort=uploadedAt&order=desc')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(repository.listForOwner).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        status: 'active',
        tag: 'facture',
        sort: 'uploadedAt',
        order: 'desc',
      }),
    );
    expect(response.body).toMatchObject({
      status: 'success',
      data: {
        items: [
          {
            id: 'file-id',
            fileName: 'document.pdf',
            mimeType: 'application/pdf',
            size: 245760,
            status: 'active',
            isPasswordProtected: true,
            tags: [{ id: 'tag-id', name: 'facture' }],
            shareLink: {
              url: 'http://localhost:5173/share/share-token',
              token: 'share-token',
              isPasswordProtected: true,
            },
          },
        ],
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('storagePath');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('ownerId');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('uses query defaults from US05', async () => {
    const token = jwtService.sign({ sub: 'user-a', email: 'user-a@example.com' });

    await request(app.getHttpServer()).get('/me/file-assets').set('Authorization', `Bearer ${token}`).expect(200);

    expect(repository.listForOwner).toHaveBeenCalledWith(
      'user-a',
      expect.objectContaining({
        page: 1,
        pageSize: 10,
        status: 'active',
        sort: 'uploadedAt',
        order: 'desc',
      }),
    );
  });

  it('returns 401 application/problem+json without a JWT', async () => {
    await request(app.getHttpServer())
      .get('/me/file-assets')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(401);
  });

  it('never receives a user id from the URL and isolates by authenticated user id', async () => {
    const token = jwtService.sign({ sub: 'user-b', email: 'user-b@example.com' });
    repository.listForOwner.mockResolvedValue({
      items: [createFileAsset({ id: 'user-b-file', originalName: 'user-b.pdf' })],
      total: 1,
    });

    await request(app.getHttpServer())
      .get('/me/file-assets?userId=user-a')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(400);

    await request(app.getHttpServer())
      .get('/me/file-assets')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.items[0].id).toBe('user-b-file');
      });
    expect(repository.listForOwner).toHaveBeenLastCalledWith('user-b', expect.any(Object));
  });

  it('returns pagination metadata for more files than pageSize', async () => {
    const token = jwtService.sign({ sub: 'user-a', email: 'user-a@example.com' });
    repository.listForOwner.mockResolvedValue({
      items: [createFileAsset({ id: 'file-page-2' })],
      total: 25,
    });

    await request(app.getHttpServer())
      .get('/me/file-assets?page=2&pageSize=10&status=all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.pagination).toEqual({
          page: 2,
          pageSize: 10,
          totalItems: 25,
          totalPages: 3,
        });
      });
  });

  it('returns an empty page when no files match filters', async () => {
    const token = jwtService.sign({ sub: 'user-a', email: 'user-a@example.com' });
    repository.listForOwner.mockResolvedValue({
      items: [],
      total: 0,
    });

    await request(app.getHttpServer())
      .get('/me/file-assets?status=expired&tag=facture')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.items).toEqual([]);
        expect(body.data.pagination).toEqual({
          page: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
        });
      });
  });

  it('keeps expired files in history without an actionable share link', async () => {
    const token = jwtService.sign({ sub: 'user-a', email: 'user-a@example.com' });
    repository.listForOwner.mockResolvedValue({
      items: [
        createFileAsset({
          expiredAt: new Date('2026-07-16T10:30:00.000Z'),
          storageName: null,
          storagePath: null,
          shareLinkExpiresAt: new Date('2026-07-15T10:30:00.000Z'),
        }),
      ],
      total: 1,
    });

    await request(app.getHttpServer())
      .get('/me/file-assets?status=expired')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.items[0]).toMatchObject({
          id: 'file-id',
          fileName: 'document.pdf',
          status: 'expired',
          isPasswordProtected: false,
          shareLink: {
            url: '',
            token: '',
            isPasswordProtected: false,
          },
        });
      });
  });

  it('validates pagination, status, tag, sort and order query parameters', async () => {
    const token = jwtService.sign({ sub: 'user-a', email: 'user-a@example.com' });

    await request(app.getHttpServer())
      .get('/me/file-assets?page=0&pageSize=101&status=deleted&tag=tag-name-that-is-far-too-long-for-us05&sort=bad&order=bad')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(400);
  });
});

function createFileAsset(
  overrides: Partial<{
    id: string;
    originalName: string;
    expiredAt: Date | null;
    storageName: string | null;
    storagePath: string | null;
    shareLinkExpiresAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 'file-id',
    ownerId: 'user-a',
    originalName: overrides.originalName ?? 'document.pdf',
    storageName: overrides.storageName === undefined ? 'stored-document.pdf' : overrides.storageName,
    storagePath: overrides.storagePath === undefined ? '/storage/document.pdf' : overrides.storagePath,
    mimeType: 'application/pdf',
    size: BigInt(245760),
    uploadedAt: new Date('2026-07-08T10:30:00.000Z'),
    expiredAt: overrides.expiredAt ?? null,
    deletedAt: null,
    shareLink: {
      id: 'share-id',
      fileAssetId: overrides.id ?? 'file-id',
      token: 'share-token',
      passwordHash: 'hashed-password',
      createdAt: new Date('2026-07-08T10:30:00.000Z'),
      expiresAt: overrides.shareLinkExpiresAt ?? new Date('2099-07-15T10:30:00.000Z'),
      downloadCount: 0,
    },
    fileTags: [
      {
        fileAssetId: overrides.id ?? 'file-id',
        tagId: 'tag-id',
        createdAt: new Date('2026-07-08T10:30:00.000Z'),
        tag: {
          id: 'tag-id',
          userId: 'user-a',
          name: 'facture',
          createdAt: new Date('2026-07-08T10:30:00.000Z'),
        },
      },
    ],
  };
}
