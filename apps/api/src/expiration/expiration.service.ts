import { Injectable } from '@nestjs/common';
import type { FileStatus } from '@datashare/shared';

@Injectable()
export class ExpirationService {
  getFunctionalStatus(input: { deletedAt?: Date | null; expiresAt: Date }): FileStatus {
    if (input.deletedAt) {
      return 'deleted';
    }

    return this.isExpired(input.expiresAt) ? 'expired' : 'active';
  }

  isExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() <= Date.now();
  }
}
