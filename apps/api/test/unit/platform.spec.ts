import { OptionalJwtAuthGuard } from '../../src/auth/guards/optional-jwt-auth.guard';
import { JwtStrategy } from '../../src/auth/strategies/jwt.strategy';
import { PrismaService } from '../../src/database/prisma.service';
import { S3StorageAdapterPlaceholder } from '../../src/storage/s3-storage.adapter.placeholder';

describe('PrismaService lifecycle', () => {
  it('connects and disconnects through PrismaClient lifecycle hooks', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(connect).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});

describe('JwtStrategy', () => {
  it('maps a JWT payload to the authenticated user shape', () => {
    const config = {
      get: jest.fn((key: string) => (key === 'jwt.secret' ? 'secret' : undefined)),
    };
    const strategy = new JwtStrategy(config as never);

    expect(strategy.validate({ sub: 'user-id', email: 'user@example.com' })).toEqual({
      id: 'user-id',
      email: 'user@example.com',
    });
  });
});

describe('OptionalJwtAuthGuard', () => {
  it('allows requests even when JWT authentication fails', async () => {
    const guard = new OptionalJwtAuthGuard();
    jest.spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate').mockImplementationOnce(() => {
      throw new Error('missing token');
    });

    await expect(guard.canActivate({} as never)).resolves.toBe(true);
  });
});

describe('S3StorageAdapterPlaceholder', () => {
  it('throws explicit MVP errors for every operation', async () => {
    const adapter = new S3StorageAdapterPlaceholder();

    expect(() => adapter.save()).toThrow('S3/MinIO storage adapter is not implemented for the MVP.');
    expect(() => adapter.createReadStream()).toThrow('S3/MinIO storage adapter is not implemented for the MVP.');
    expect(() => adapter.delete()).toThrow('S3/MinIO storage adapter is not implemented for the MVP.');
  });
});
