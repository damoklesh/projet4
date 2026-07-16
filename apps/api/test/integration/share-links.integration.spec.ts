import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { Readable } from 'node:stream';
import request from 'supertest';
import { ProblemDetailsFilter } from '../../src/common/filters/problem-details.filter';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import { ExpirationModule } from '../../src/expiration/expiration.module';
import { ShareLinksController } from '../../src/share-links/share-links.controller';
import { ShareLinksRepository } from '../../src/share-links/share-links.repository';
import { ShareLinksService } from '../../src/share-links/share-links.service';
import { StorageService } from '../../src/storage/storage.service';

describe('Public share links', () => {
  const repository = {
    findByToken: jest.fn(),
    incrementDownloadCount: jest.fn(),
  };
  const storage = {
    createReadStream: jest.fn(),
  };

  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      imports: [ExpirationModule],
      controllers: [ShareLinksController],
      providers: [
        ShareLinksService,
        {
          provide: ShareLinksRepository,
          useValue: repository,
        },
        {
          provide: StorageService,
          useValue: storage,
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

    repository.incrementDownloadCount.mockResolvedValue(undefined);
    storage.createReadStream.mockReturnValue(Readable.from('file-content'));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns public metadata for a valid active token', async () => {
    repository.findByToken.mockResolvedValue(createShareLink());

    const response = await request(app.getHttpServer()).get('/share-links/public-token').expect(200);

    expect(response.body).toMatchObject({
      status: 'success',
      message: 'OK',
      data: {
        token: 'public-token',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 12,
        status: 'active',
        isPasswordProtected: false,
      },
    });
    expect(JSON.stringify(response.body)).not.toContain('storagePath');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('ownerId');
  });

  it('returns 404 application/problem+json for an unknown token', async () => {
    repository.findByToken.mockResolvedValue(null);

    await request(app.getHttpServer())
      .get('/share-links/unknown-token')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(404);
  });

  it('returns 410 application/problem+json for an expired token', async () => {
    repository.findByToken.mockResolvedValue(
      createShareLink({
        expiresAt: new Date('2000-01-01T00:00:00.000Z'),
      }),
    );

    await request(app.getHttpServer())
      .get('/share-links/public-token')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(410)
      .expect(({ body }) => {
        expect(body.detail).toBe('Share link has expired.');
      });
  });

  it('returns 410 application/problem+json when the shared file was deleted', async () => {
    repository.findByToken.mockResolvedValue(
      createShareLink({
        fileAsset: {
          deletedAt: new Date('2026-07-08T10:30:00.000Z'),
        },
      }),
    );

    await request(app.getHttpServer())
      .post('/share-links/public-token/download')
      .send({})
      .expect('Content-Type', /application\/problem\+json/)
      .expect(410)
      .expect(({ body }) => {
        expect(body.detail).toBe('Shared file has been deleted.');
      });
  });

  it('returns 410 application/problem+json when the physical file was already purged', async () => {
    repository.findByToken.mockResolvedValue(
      createShareLink({
        fileAsset: {
          storagePath: null,
        },
      }),
    );

    await request(app.getHttpServer())
      .post('/share-links/public-token/download')
      .send({})
      .expect('Content-Type', /application\/problem\+json/)
      .expect(410)
      .expect(({ body }) => {
        expect(body.detail).toBe('Shared file is no longer stored.');
      });

    expect(storage.createReadStream).not.toHaveBeenCalled();
    expect(repository.incrementDownloadCount).not.toHaveBeenCalled();
  });

  it('streams an unprotected active file and increments the download count', async () => {
    repository.findByToken.mockResolvedValue(createShareLink({ mimeType: 'application/octet-stream' }));

    await request(app.getHttpServer())
      .post('/share-links/public-token/download')
      .send({})
      .expect(200)
      .expect('Content-Type', /application\/octet-stream/)
      .expect('Content-Length', '12')
      .expect('Content-Disposition', /attachment; filename="document.pdf"/);

    expect(storage.createReadStream).toHaveBeenCalledWith('/storage/document.pdf');
    expect(repository.incrementDownloadCount).toHaveBeenCalledWith('share-id');
  });

  it.each([
    ['without password', undefined],
    ['with wrong password', 'wrong-secret'],
  ])('returns 401 application/problem+json for a protected link %s', async (_caseName, password) => {
    repository.findByToken.mockResolvedValue(
      createShareLink({
        passwordHash: await bcrypt.hash('secret123', 12),
      }),
    );

    const body = password ? { password } : {};

    await request(app.getHttpServer())
      .post('/share-links/public-token/download')
      .send(body)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(401)
      .expect(({ body: problem }) => {
        expect(problem.detail).toBe('A valid password is required.');
      });

    expect(storage.createReadStream).not.toHaveBeenCalled();
    expect(repository.incrementDownloadCount).not.toHaveBeenCalled();
  });

  it('streams a protected active file when the password is correct', async () => {
    repository.findByToken.mockResolvedValue(
      createShareLink({
        mimeType: 'application/octet-stream',
        passwordHash: await bcrypt.hash('secret123', 12),
      }),
    );

    await request(app.getHttpServer())
      .post('/share-links/public-token/download')
      .send({ password: 'secret123' })
      .expect(200)
      .expect('Content-Type', /application\/octet-stream/);

    expect(storage.createReadStream).toHaveBeenCalledWith('/storage/document.pdf');
    expect(repository.incrementDownloadCount).toHaveBeenCalledWith('share-id');
  });
});

function createShareLink(overrides: {
  expiresAt?: Date;
  passwordHash?: string | null;
  mimeType?: string;
  fileAsset?: Partial<{
    deletedAt: Date | null;
    expiredAt: Date | null;
    storagePath: string | null;
  }>;
} = {}) {
  const fileAsset = {
    id: 'file-id',
    ownerId: 'user-id',
    originalName: 'document.pdf',
    storageName: 'stored-document.pdf',
    storagePath: '/storage/document.pdf',
    mimeType: overrides.mimeType ?? 'application/pdf',
    size: BigInt(12),
    uploadedAt: new Date('2026-07-08T10:30:00.000Z'),
    expiredAt: null,
    deletedAt: null,
    ...overrides.fileAsset,
  };

  return {
    id: 'share-id',
    fileAssetId: 'file-id',
    token: 'public-token',
    passwordHash: overrides.passwordHash ?? null,
    createdAt: new Date('2026-07-08T10:30:00.000Z'),
    expiresAt: overrides.expiresAt ?? new Date('2099-01-01T00:00:00.000Z'),
    downloadCount: 0,
    fileAsset,
  };
}
