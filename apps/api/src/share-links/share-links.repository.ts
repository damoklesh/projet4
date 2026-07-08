import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ShareLinksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByToken(token: string) {
    return this.prisma.shareLink.findUnique({
      where: { token },
      include: {
        fileAsset: true,
      },
    });
  }

  incrementDownloadCount(id: string) {
    return this.prisma.shareLink.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });
  }
}
