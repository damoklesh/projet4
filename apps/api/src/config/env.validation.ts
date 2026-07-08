type EnvRecord = Record<string, unknown>;

export function validateEnv(config: EnvRecord): EnvRecord {
  const required = ['DATABASE_URL'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0 && config.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return config;
}
