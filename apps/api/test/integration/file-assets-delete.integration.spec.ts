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

describe('DELETE /file-assets/:fileAssetId', () => {
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

    storage.delete.mockResolvedValue(undefined);
    repository.deleteById.mockResolvedValue(createFileAsset({ ownerId: 'user-id' }));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('deletes an owned file and returns the US06 envelope', async () => {
    repository.findById.mockResolvedValue(createFileAsset({ ownerId: 'user-id' }));
    const token = jwtService.sign({ sub: 'user-id', email: 'user@example.com' });

    await request(app.getHttpServer())
      .delete('/file-assets/file-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual({
          status: 'success',
          message: 'Fichier supprimÃ© avec succÃ¨s.',
          data: {
            id: 'file-id',
            status: 'deleted',
          },
        });
    });

    expect(storage.delete).toHaveBeenCalledWith('/storage/document.pdf');
    expect(repository.deleteById).toHaveBeenCalledWith('file-id');
  });

  it('rejects deletion of another user file with 403 application/problem+json', async () => {
    repository.findById.mockResolvedValue(createFileAsset({ ownerId: 'other-user-id' }));
    const token = jwtService.sign({ sub: 'user-id', email: 'user@example.com' });

    await request(app.getHttpServer())
      .delete('/file-assets/file-id')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(403)
      .expect(({ body }) => {
        expect(body.detail).toBe('You can delete only your own files.');
      });

    expect(storage.delete).not.toHaveBeenCalled();
    expect(repository.deleteById).not.toHaveBeenCalled();
  });

  it('returns 404 application/problem+json when the file does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    const token = jwtService.sign({ sub: 'user-id', email: 'user@example.com' });

    await request(app.getHttpServer())
      .delete('/file-assets/missing-file-id')
      .set('Authorization', `Bearer ${token}`)
      .expect('Content-Type', /application\/problem\+json/)
      .expect(404);
  });

  it('returns 401 application/problem+json without a JWT', async () => {
    await request(app.getHttpServer())
      .delete('/file-assets/file-id')
      .expect('Content-Type', /application\/problem\+json/)
      .expect(401);
  });
});

function createFileAsset(input: { ownerId: string; deletedAt?: Date | null }) {
  return {
    id: 'file-id',
    ownerId: input.ownerId,
    originalName: 'document.pdf',
    storageName: 'stored-document.pdf',
    storagePath: '/storage/document.pdf',
    mimeType: 'application/pdf',
    size: BigInt(12),
    uploadedAt: new Date('2026-07-08T10:30:00.000Z'),
    expiredAt: null,
    deletedAt: input.deletedAt ?? null,
    shareLink: {
      id: 'share-id',
      fileAssetId: 'file-id',
      token: 'share-token',
      passwordHash: null,
      createdAt: new Date('2026-07-08T10:30:00.000Z'),
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      downloadCount: 0,
    },
  };
}
