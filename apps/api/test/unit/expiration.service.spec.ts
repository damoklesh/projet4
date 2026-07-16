import { ExpirationService } from '../../src/expiration/expiration.service';

describe('ExpirationService', () => {
  const service = new ExpirationService();

  it('marks deleted files as deleted', () => {
    expect(
      service.getFunctionalStatus({
        deletedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).toBe('deleted');
  });

  it('marks past share links as expired', () => {
    expect(
      service.getFunctionalStatus({
        deletedAt: null,
        expiresAt: new Date(Date.now() - 60_000),
      }),
    ).toBe('expired');
  });

  it('marks files already purged by the cleanup job as expired', () => {
    expect(
      service.getFunctionalStatus({
        deletedAt: null,
        expiredAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).toBe('expired');
  });
});
