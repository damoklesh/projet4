import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { FileAssetHistoryQueryDto } from './dto/file-asset-status-filter.dto';

@Injectable()
export class FileAssetsRepository {
  constructor(private readonly prisma: PrismaService) {}

  createWithShareLink(input: {
    ownerId: string;
    originalName: string;
    storageName: string;
    storagePath: string;
    mimeType: string;
    size: number;
    token: string;
    expiresAt: Date;
    passwordHash?: string | null;
    tags?: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const fileAsset = await tx.fileAsset.create({
        data: {
          ownerId: input.ownerId,
          originalName: input.originalName,
          storageName: input.storageName,
          storagePath: input.storagePath,
          mimeType: input.mimeType,
          size: BigInt(input.size),
          shareLink: {
            create: {
              token: input.token,
              expiresAt: input.expiresAt,
              passwordHash: input.passwordHash,
            },
          },
        },
      });

      for (const tagName of input.tags ?? []) {
        const tag = await tx.tag.upsert({
          where: {
            userId_name: {
              userId: input.ownerId,
              name: tagName,
            },
          },
          update: {},
          create: {
            userId: input.ownerId,
            name: tagName,
          },
        });

        await tx.fileTag.upsert({
          where: {
            fileAssetId_tagId: {
              fileAssetId: fileAsset.id,
              tagId: tag.id,
            },
          },
          update: {},
          create: {
            fileAssetId: fileAsset.id,
            tagId: tag.id,
          },
        });
      }

      return tx.fileAsset.findUniqueOrThrow({
        where: { id: fileAsset.id },
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
  }

  async listForOwner(ownerId: string, query: FileAssetHistoryQueryDto) {
    const now = new Date();
    const where: Prisma.FileAssetWhereInput = {
      ownerId,
      deletedAt: null,
      ...(query.status === 'active' && {
        shareLink: { expiresAt: { gt: now } },
      }),
      ...(query.status === 'expired' && {
        shareLink: { expiresAt: { lte: now } },
      }),
      ...(query.tag && {
        fileTags: {
          some: {
            tag: {
              userId: ownerId,
              name: query.tag,
            },
          },
        },
      }),
    };

    const orderBy = toPrismaOrderBy(query.sort, query.order);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.fileAsset.findMany({
        where,
        include: {
          shareLink: true,
          fileTags: {
            include: {
              tag: true,
            },
          },
        },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy,
      }),
      this.prisma.fileAsset.count({ where }),
    ]);

    return { items, total };
  }

  findOwnedById(fileAssetId: string, ownerId: string) {
    return this.prisma.fileAsset.findFirst({
      where: {
        id: fileAssetId,
        ownerId,
      },
      include: {
        shareLink: true,
      },
    });
  }

  markDeleted(fileAssetId: string) {
    return this.prisma.fileAsset.update({
      where: { id: fileAssetId },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

function toPrismaOrderBy(sort: string, order: Prisma.SortOrder): Prisma.FileAssetOrderByWithRelationInput {
  if (sort === 'expiresAt') {
    return {
      shareLink: {
        expiresAt: order,
      },
    };
  }

  if (sort === 'fileName') {
    return { originalName: order };
  }

  if (sort === 'size') {
    return { size: order };
  }

  return { uploadedAt: order };
}
