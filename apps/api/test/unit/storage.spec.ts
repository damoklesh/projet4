import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { LocalStorageAdapter } from '../../src/storage/local-storage.adapter';
import { StorageService } from '../../src/storage/storage.service';
import type { StoragePort } from '../../src/storage/storage.port';

describe('StorageService', () => {
  const storage = {
    save: jest.fn(),
    createReadStream: jest.fn(),
    delete: jest.fn(),
  } as jest.Mocked<StoragePort>;

  let service: StorageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StorageService(storage);
  });

  it('delegates save to the configured storage port', async () => {
    const input = {
      storageName: 'file.txt',
      stream: Readable.from(['hello']),
    };
    storage.save.mockResolvedValue({
      storageName: 'file.txt',
      storagePath: '/uploads/file.txt',
      size: 5,
    });

    await expect(service.save(input)).resolves.toEqual({
      storageName: 'file.txt',
      storagePath: '/uploads/file.txt',
      size: 5,
    });
    expect(storage.save).toHaveBeenCalledWith(input);
  });

  it('delegates read streams and deletion to the configured storage port', async () => {
    const stream = Readable.from(['hello']);
    storage.createReadStream.mockReturnValue(stream as never);
    storage.delete.mockResolvedValue(undefined);

    expect(service.createReadStream('/uploads/file.txt')).toBe(stream);
    await expect(service.delete('/uploads/file.txt')).resolves.toBeUndefined();

    expect(storage.createReadStream).toHaveBeenCalledWith('/uploads/file.txt');
    expect(storage.delete).toHaveBeenCalledWith('/uploads/file.txt');
  });
});

describe('LocalStorageAdapter', () => {
  let rootPath: string;

  beforeEach(async () => {
    rootPath = await mkdtemp(join(tmpdir(), 'datashare-storage-'));
  });

  afterEach(async () => {
    await rm(rootPath, { force: true, recursive: true });
  });

  it('saves files below the configured local root and returns metadata', async () => {
    const config = {
      get: jest.fn((key: string) => (key === 'storage.localRoot' ? rootPath : undefined)),
    } as unknown as ConfigService;
    const adapter = new LocalStorageAdapter(config);

    const stored = await adapter.save({
      storageName: 'nested/document.txt',
      stream: Readable.from(['hello']),
    });

    expect(stored).toEqual({
      storageName: 'nested/document.txt',
      storagePath: join(rootPath, 'nested/document.txt'),
      size: 5,
    });
    await expect(readFile(stored.storagePath, 'utf8')).resolves.toBe('hello');
  });

  it('creates read streams and deletes stored files', async () => {
    const filePath = join(rootPath, 'document.txt');
    await writeFile(filePath, 'hello');
    const config = {
      get: jest.fn((key: string) => (key === 'storage.localRoot' ? rootPath : undefined)),
    } as unknown as ConfigService;
    const adapter = new LocalStorageAdapter(config);

    const stream = adapter.createReadStream(filePath);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    expect(Buffer.concat(chunks).toString('utf8')).toBe('hello');
    await expect(adapter.delete(filePath)).resolves.toBeUndefined();
  });
});
