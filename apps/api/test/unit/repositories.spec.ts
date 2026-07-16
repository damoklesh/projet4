import { FileAssetsRepository } from '../../src/file-assets/file-assets.repository';
import type { FileAssetSort } from '../../src/file-assets/dto/file-asset-status-filter.dto';
import { ShareLinksRepository } from '../../src/share-links/share-links.repository';

describe('ShareLinksRepository', () => {
  const prisma = {
    shareLink: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('finds a share link by token with its file asset', async () => {
    const repository = new ShareLinksRepository(prisma as never);
    prisma.shareLink.findUnique.mockResolvedValue({ id: 'share-id' });

    await expect(repository.findByToken('token')).resolves.toEqual({ id: 'share-id' });

    expect(prisma.shareLink.findUnique).toHaveBeenCalledWith({
      where: { token: 'token' },
      include: {
        fileAsset: true,
      },
    });
  });

  it('increments the download count atomically', async () => {
    const repository = new ShareLinksRepository(prisma as never);
    prisma.shareLink.update.mockResolvedValue({ id: 'share-id', downloadCount: 2 });

    await expect(repository.incrementDownloadCount('share-id')).resolves.toEqual({
      id: 'share-id',
      downloadCount: 2,
    });

    expect(prisma.shareLink.update).toHaveBeenCalledWith({
      where: { id: 'share-id' },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  });
});

describe('FileAssetsRepository', () => {
  const prisma = {
    $transaction: jest.fn(),
    fileAsset: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a file asset, share link and tags inside a transaction', async () => {
    const tx = {
      fileAsset: {
        create: jest.fn().mockResolvedValue({ id: 'file-id' }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'file-id', fileTags: [] }),
      },
      tag: {
        upsert: jest.fn().mockResolvedValue({ id: 'tag-id' }),
      },
      fileTag: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.$transaction.mockImplementation((callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx));
    const repository = new FileAssetsRepository(prisma as never);
    const expiresAt = new Date('2026-07-09T10:30:00.000Z');

    await expect(
      repository.createWithShareLink({
        ownerId: 'user-id',
        originalName: 'document.pdf',
        storageName: 'stored-document.pdf',
        storagePath: '/uploads/stored-document.pdf',
        mimeType: 'application/pdf',
        size: 12,
        token: 'token',
        expiresAt,
        passwordHash: 'hash',
        tags: ['facture'],
      }),
    ).resolves.toEqual({ id: 'file-id', fileTags: [] });

    expect(tx.fileAsset.create).toHaveBeenCalledWith({
      data: {
        ownerId: 'user-id',
        originalName: 'document.pdf',
        storageName: 'stored-document.pdf',
        storagePath: '/uploads/stored-document.pdf',
        mimeType: 'application/pdf',
        size: BigInt(12),
        shareLink: {
          create: {
            token: 'token',
            expiresAt,
            passwordHash: 'hash',
          },
        },
      },
    });
    expect(tx.tag.upsert).toHaveBeenCalledWith({
      where: {
        userId_name: {
          userId: 'user-id',
          name: 'facture',
        },
      },
      update: {},
      create: {
        userId: 'user-id',
        name: 'facture',
      },
    });
    expect(tx.fileTag.upsert).toHaveBeenCalledWith({
      where: {
        fileAssetId_tagId: {
          fileAssetId: 'file-id',
          tagId: 'tag-id',
        },
      },
      update: {},
      create: {
        fileAssetId: 'file-id',
        tagId: 'tag-id',
      },
    });
    expect(tx.fileAsset.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: 'file-id' },
      include: {
        shareLink: true,
        fileTags: {
          include: {
            tag: true,
          },
        },
      },
    });
  });

  it.each<[string | undefined, FileAssetSort, 'asc' | 'desc', Record<string, unknown>]>([
    ['active', 'expiresAt', 'asc', { shareLink: { expiresAt: 'asc' } }],
    ['expired', 'fileName', 'desc', { originalName: 'desc' }],
    [undefined, 'size', 'asc', { size: 'asc' }],
    [undefined, 'uploadedAt', 'desc', { uploadedAt: 'desc' }],
  ])('lists files for owner with %s status and %s sorting', async (status, sort, order, orderBy) => {
    prisma.$transaction.mockResolvedValue([[{ id: 'file-id' }], 1]);
    const repository = new FileAssetsRepository(prisma as never);

    await expect(
      repository.listForOwner('user-id', {
        status: status as never,
        tag: status === 'active' ? 'facture' : undefined,
        sort,
        order: order as never,
        page: 2,
        pageSize: 10,
      }),
    ).resolves.toEqual({
      items: [{ id: 'file-id' }],
      total: 1,
    });

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: {
          shareLink: true,
          fileTags: {
            include: {
              tag: true,
            },
          },
        },
        skip: 10,
        take: 10,
        orderBy,
      }),
    );
    expect(prisma.fileAsset.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        ownerId: 'user-id',
      }),
    });
  });

  it('finds a file asset by id with its share link', async () => {
    const repository = new FileAssetsRepository(prisma as never);
    prisma.fileAsset.findUnique.mockResolvedValue({ id: 'file-id' });

    await expect(repository.findById('file-id')).resolves.toEqual({ id: 'file-id' });

    expect(prisma.fileAsset.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'file-id',
      },
      include: {
        shareLink: true,
      },
    });
  });

  it('deletes a file asset by id', async () => {
    const repository = new FileAssetsRepository(prisma as never);
    prisma.fileAsset.delete.mockResolvedValue({ id: 'file-id' });

    await expect(repository.deleteById('file-id')).resolves.toEqual({ id: 'file-id' });

    expect(prisma.fileAsset.delete).toHaveBeenCalledWith({
      where: { id: 'file-id' },
    });
  });

  it('lists expired file assets that still have physical storage', async () => {
    const repository = new FileAssetsRepository(prisma as never);
    const now = new Date('2026-07-16T10:30:00.000Z');
    prisma.fileAsset.findMany.mockResolvedValue([{ id: 'file-id' }]);

    await expect(repository.listExpiredWithStorage(now)).resolves.toEqual([{ id: 'file-id' }]);

    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith({
      where: {
        expiredAt: null,
        storagePath: { not: null },
        shareLink: {
          expiresAt: { lte: now },
        },
      },
      include: {
        shareLink: true,
      },
      take: 100,
      orderBy: {
        shareLink: {
          expiresAt: 'asc',
        },
      },
    });
  });

  it('marks an expired file as no longer stored', async () => {
    const repository = new FileAssetsRepository(prisma as never);
    prisma.fileAsset.update.mockResolvedValue({ id: 'file-id' });

    await expect(repository.markExpired('file-id')).resolves.toEqual({ id: 'file-id' });

    expect(prisma.fileAsset.update).toHaveBeenCalledWith({
      where: { id: 'file-id' },
      data: {
        expiredAt: expect.any(Date),
        storageName: null,
        storagePath: null,
      },
    });
  });
});
