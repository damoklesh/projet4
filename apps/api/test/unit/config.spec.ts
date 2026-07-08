import configuration from '../../src/config/configuration';
import { validateEnv } from '../../src/config/env.validation';

describe('configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses development defaults when optional environment variables are absent', () => {
    delete process.env.API_PORT;
    delete process.env.API_CORS_ORIGIN;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.STORAGE_DRIVER;
    delete process.env.LOCAL_STORAGE_ROOT;
    delete process.env.DEFAULT_SHARE_LINK_TTL_DAYS;

    expect(configuration()).toEqual({
      api: {
        port: 3000,
        corsOrigin: 'http://localhost:5173',
      },
      jwt: {
        secret: 'dev-only-change-me',
        expiresIn: '1d',
      },
      storage: {
        driver: 'local',
        localRoot: 'storage/uploads',
      },
      shareLinks: {
        defaultTtlDays: 7,
      },
    });
  });

  it('maps environment variables to typed config values', () => {
    process.env.API_PORT = '4000';
    process.env.API_CORS_ORIGIN = 'https://web.example.test';
    process.env.JWT_SECRET = 'secret';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.STORAGE_DRIVER = 's3';
    process.env.LOCAL_STORAGE_ROOT = '/data/uploads';
    process.env.DEFAULT_SHARE_LINK_TTL_DAYS = '3';

    expect(configuration()).toMatchObject({
      api: {
        port: 4000,
        corsOrigin: 'https://web.example.test',
      },
      jwt: {
        secret: 'secret',
        expiresIn: '2h',
      },
      storage: {
        driver: 's3',
        localRoot: '/data/uploads',
      },
      shareLinks: {
        defaultTtlDays: 3,
      },
    });
  });
});

describe('validateEnv', () => {
  it('allows missing DATABASE_URL outside production', () => {
    expect(validateEnv({ NODE_ENV: 'test' })).toEqual({ NODE_ENV: 'test' });
  });

  it('throws when production config misses DATABASE_URL', () => {
    expect(() => validateEnv({ NODE_ENV: 'production' })).toThrow(
      'Missing required environment variables: DATABASE_URL',
    );
  });
});
