import { FileExpirationCleanupService } from '../../src/file-assets/file-expiration-cleanup.service';
import { FileAssetsRepository } from '../../src/file-assets/file-assets.repository';
import { StorageService } from '../../src/storage/storage.service';

describe('FileExpirationCleanupService', () => {
  const repository = {
    listExpiredWithStorage: jest.fn(),
    markExpired: jest.fn(),
  } as unknown as jest.Mocked<Pick<FileAssetsRepository, 'listExpiredWithStorage' | 'markExpired'>>;
  const storage = {
    delete: jest.fn(),
  } as unknown as jest.Mocked<Pick<StorageService, 'delete'>>;

  let service: FileExpirationCleanupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FileExpirationCleanupService(
      repository as unknown as FileAssetsRepository,
      storage as unknown as StorageService,
    );
  });

  it('deletes expired physical files and keeps a historical expired database row', async () => {
    const now = new Date('2026-07-16T10:30:00.000Z');
    repository.listExpiredWithStorage.mockResolvedValue([
      {
        id: 'file-id',
        storagePath: '/storage/document.pdf',
      } as Awaited<ReturnType<FileAssetsRepository['listExpiredWithStorage']>>[number],
    ]);
    storage.delete.mockResolvedValue(undefined);
    repository.markExpired.mockResolvedValue({ id: 'file-id' } as never);

    await expect(service.cleanupExpiredFiles(now)).resolves.toBe(1);

    expect(repository.listExpiredWithStorage).toHaveBeenCalledWith(now);
    expect(storage.delete).toHaveBeenCalledWith('/storage/document.pdf');
    expect(repository.markExpired).toHaveBeenCalledWith('file-id');
  });

  it('runs one cleanup pass when the application starts', () => {
    repository.listExpiredWithStorage.mockResolvedValue([]);

    service.onApplicationBootstrap();

    expect(repository.listExpiredWithStorage).toHaveBeenCalledWith(expect.any(Date));
  });
});
