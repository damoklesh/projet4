import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ExpirationService } from '../../src/expiration/expiration.service';
import { StorageService } from '../../src/storage/storage.service';
import { FileAssetsRepository } from '../../src/file-assets/file-assets.repository';
import { FileAssetsService } from '../../src/file-assets/file-assets.service';

describe('FileAssetsService.create', () => {
  const testTmpDir = join(process.cwd(), 'test/tmp');
  const tempFilePath = join(testTmpDir, 'upload.txt');
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'api.corsOrigin') {
        return 'http://localhost:5173';
      }

      if (key === 'shareLinks.defaultTtlDays') {
        return 7;
      }

      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;
  const expirationService = new ExpirationService();
  const repository = {
    createWithShareLink: jest.fn(),
  } as unknown as jest.Mocked<Pick<FileAssetsRepository, 'createWithShareLink'>>;
  const storage = {
    save: jest.fn(),
  } as unknown as jest.Mocked<Pick<StorageService, 'save'>>;

  let service: FileAssetsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    await mkdir(testTmpDir, { recursive: true });
    await writeFile(tempFilePath, 'hello');
    service = new FileAssetsService(
      config,
      expirationService,
      repository as unknown as FileAssetsRepository,
      storage as unknown as StorageService,
    );
  });

  it('stores the binary through StorageService and persists metadata, share link and tags', async () => {
    storage.save.mockResolvedValue({
      storageName: 'storage-name-document.pdf',
      storagePath: '/local/uploads/storage-name-document.pdf',
      size: 5,
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
        passwordHash: input.passwordHash ?? null,
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

    const response = await service.create({
      ownerId: 'user-id',
      file: createUploadedFile({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 5,
      }),
      dto: {
        password: 'secret1',
        expirationDays: 7,
        tags: 'facture,facture',
      },
    });

    expect(storage.save).toHaveBeenCalledWith({
      storageName: expect.stringContaining('document.pdf'),
      stream: expect.anything(),
    });
    expect(repository.createWithShareLink).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'user-id',
        originalName: 'document.pdf',
        storagePath: '/local/uploads/storage-name-document.pdf',
        mimeType: 'application/pdf',
        size: 5,
        token: expect.stringMatching(/^[a-f0-9]{24}$/),
        tags: ['facture'],
      }),
    );
    const persistedPasswordHash = repository.createWithShareLink.mock.calls[0][0].passwordHash;
    expect(persistedPasswordHash).not.toBe('secret1');
    await expect(bcrypt.compare('secret1', persistedPasswordHash as string)).resolves.toBe(true);
    expect(response).toMatchObject({
      fileAsset: {
        id: 'file-id',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        size: 5,
        status: 'active',
        isPasswordProtected: true,
        tags: [{ id: 'tag-id', name: 'facture' }],
      },
      shareLink: {
        url: expect.stringMatching(/^http:\/\/localhost:5173\/share\/[a-f0-9]{24}$/),
        token: expect.stringMatching(/^[a-f0-9]{24}$/),
        isPasswordProtected: true,
      },
    });
    expect(JSON.stringify(response)).not.toContain('storagePath');
    expect(JSON.stringify(response)).not.toContain('passwordHash');
  });

  it('defaults expirationDays to 7 when omitted', async () => {
    storage.save.mockResolvedValue({
      storageName: 'storage-name-document.pdf',
      storagePath: '/local/uploads/storage-name-document.pdf',
      size: 5,
    });
    repository.createWithShareLink.mockResolvedValue({
      id: 'file-id',
      ownerId: 'user-id',
      originalName: 'document.pdf',
      storageName: 'storage-name-document.pdf',
      storagePath: '/local/uploads/storage-name-document.pdf',
      mimeType: 'application/pdf',
      size: BigInt(5),
      uploadedAt: new Date(),
      deletedAt: null,
      shareLink: {
        id: 'share-id',
        fileAssetId: 'file-id',
        token: '1234567890abcdef12345678',
        passwordHash: null,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        downloadCount: 0,
      },
      fileTags: [],
    });

    await service.create({
      ownerId: 'user-id',
      file: createUploadedFile({
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: 5,
      }),
      dto: {},
    });

    const expiresAt = repository.createWithShareLink.mock.calls[0][0].expiresAt;
    const daysFromNow = (expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysFromNow).toBeGreaterThan(6.9);
    expect(daysFromNow).toBeLessThanOrEqual(7);
  });

  it('rejects oversized files before storage', async () => {
    await expect(
      service.create({
        ownerId: 'user-id',
        file: createUploadedFile({
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 1_073_741_825,
        }),
        dto: {},
      }),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rejects forbidden file extensions before storage', async () => {
    await expect(
      service.create({
        ownerId: 'user-id',
        file: createUploadedFile({
          originalname: 'malware.exe',
          mimetype: 'application/octet-stream',
          size: 5,
        }),
        dto: {},
      }),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  it('rejects tags longer than 30 characters', async () => {
    await expect(
      service.create({
        ownerId: 'user-id',
        file: createUploadedFile({
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 5,
        }),
        dto: {
          tags: 'a-very-long-tag-name-over-thirty-characters',
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.save).not.toHaveBeenCalled();
  });

  function createUploadedFile(input: {
    originalname: string;
    mimetype: string;
    size: number;
  }): Express.Multer.File {
    return {
      fieldname: 'file',
      originalname: input.originalname,
      encoding: '7bit',
      mimetype: input.mimetype,
      size: input.size,
      destination: testTmpDir,
      filename: 'upload.txt',
      path: tempFilePath,
      stream: undefined as never,
      buffer: undefined as never,
    };
  }
});
