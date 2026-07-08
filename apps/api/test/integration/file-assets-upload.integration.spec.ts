import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { ProblemDetailsFilter } from '../../src/common/filters/problem-details.filter';
import { ApiResponseInterceptor } from '../../src/common/interceptors/api-response.interceptor';
import { ExpirationModule } from '../../src/expiration/expiration.module';
import { FileAssetsController } from '../../src/file-assets/file-assets.controller';
import { FileAssetsRepository } from '../../src/file-assets/file-assets.repository';
import { FileAssetsService } from '../../src/file-assets/file-assets.service';
import { StorageService } from '../../src/storage/storage.service';

describe('POST /file-assets', () => {
  const repository = {
    createWithShareLink: jest.fn(),
    listForOwner: jest.fn(),
  };
  const storage = {
    save: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') {
        return 'test-secret';
      }

      if (key === 'api.corsOrigin') {
        return 'http://localhost:5173';
      }

      if (key === 'shareLinks.defaultTtlDays') {
        return 7;
      }

      return undefined;
    }),
  };

  let app: INestApplication;
  let jwtService: JwtService;
  let testTmpDir: string;
  let uploadFixturePath: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    testTmpDir = await mkdtemp(join(tmpdir(), 'datashare-upload-test-'));
    uploadFixturePath = join(testTmpDir, 'document.pdf');
    await writeFile(uploadFixturePath, 'pdf-content');

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

    storage.save.mockResolvedValue({
      storageName: 'stored-document.pdf',
      storagePath: '/local/uploads/stored-document.pdf',
      size: 11,
    });
    repository.createWithShareLink.mockImplementation(async (input) => ({
      id: 'file-id',
      ownerId: input.ownerId,
      originalName: input.originalName,
      storageName: input.storageName,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      size: BigInt(input.size),
      uploadedAt: new Date('2026-07-08T10:30:00.000Z'),
      deletedAt: null,
      shareLink: {
        id: 'share-id',
        fileAssetId: 'file-id',
        token: input.token,
        passwordHash: input.passwordHash,
        createdAt: new Date('2026-07-08T10:30:00.000Z'),
        expiresAt: input.expiresAt,
        downloadCount: 0,
      },
      fileTags: [
        {
          fileAssetId: 'file-id',
          tagId: 'tag-id',
          createdAt: new Date('2026-07-08T10:30:00.000Z'),
          tag: {
            id: 'tag-id',
            userId: input.ownerId,
            name: 'facture',
            createdAt: new Date('2026-07-08T10:30:00.000Z'),
          },
        },
      ],
    }));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }

    if (testTmpDir) {
      await rm(testTmpDir, { force: true, recursive: true });
    }
  });

  it('creates a file asset and one share link for the authenticated user', async () => {
    const token = jwtService.sign({ sub: 'user-id', email: 'user@example.com' });

    const response = await request(app.getHttpServer())
      .post('/file-assets')
      .set('Authorization', `Bearer ${token}`)
      .field('password', 'secret1')
      .field('expirationDays', '7')
      .field('tags', 'facture')
      .attach('file', uploadFixturePath)
      .expect(201);

    expect(response.body).toMatchObject({
      status: 'success',
      message: 'Fichier téléversé avec succès.',
      data: {
        fileAsset: {
          id: 'file-id',
          fileName: 'document.pdf',
          mimeType: 'application/pdf',
          size: 11,
          status: 'active',
          isPasswordProtected: true,
          tags: [{ id: 'tag-id', name: 'facture' }],
        },
        shareLink: {
          url: expect.stringMatching(/^http:\/\/localhost:5173\/share\/[a-f0-9]{24}$/),
          token: expect.stringMatching(/^[a-f0-9]{24}$/),
          isPasswordProtected: true,
        },
      },
    });
    expect(repository.createWithShareLink).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-id',
        originalName: 'document.pdf',
        passwordHash: expect.not.stringMatching(/^secret1$/),
        tags: ['facture'],
      }),
    );
    expect(JSON.stringify(response.body)).not.toContain('storagePath');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer())
      .post('/file-assets')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(401);
  });

  it.each([
    ['short password', { password: '12345' }],
    ['expiration lower than 1', { expirationDays: '0' }],
    ['expiration higher than 7', { expirationDays: '8' }],
  ])('returns 400 application/problem+json for %s', async (_caseName, fields) => {
    const token = jwtService.sign({ sub: 'user-id', email: 'user@example.com' });
    let requestBuilder = request(app.getHttpServer()).post('/file-assets').set('Authorization', `Bearer ${token}`);

    for (const [key, value] of Object.entries(fields)) {
      requestBuilder = requestBuilder.field(key, value);
    }

    await requestBuilder
      .attach('file', uploadFixturePath)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(400);
  });

  it('returns 415 application/problem+json for forbidden file extensions', async () => {
    const token = jwtService.sign({ sub: 'user-id', email: 'user@example.com' });
    const forbiddenFixturePath = join(testTmpDir, 'malware.exe');
    await writeFile(forbiddenFixturePath, 'nope');

    await request(app.getHttpServer())
      .post('/file-assets')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', forbiddenFixturePath)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(415);
  });
});
