export default () => ({
  api: {
    port: Number.parseInt(process.env.API_PORT ?? '3000', 10),
    corsOrigin: process.env.API_CORS_ORIGIN ?? 'http://localhost:5173',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-only-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    localRoot: process.env.LOCAL_STORAGE_ROOT ?? 'storage/uploads',
  },
  shareLinks: {
    defaultTtlDays: Number.parseInt(process.env.DEFAULT_SHARE_LINK_TTL_DAYS ?? '7', 10),
  },
});
