const requiredVariables = ['DATABASE_URL', 'JWT_SECRET'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = requiredVariables.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const jwtSecret = String(config.JWT_SECRET);

  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  if (config.PORT && Number.isNaN(Number(config.PORT))) {
    throw new Error('PORT must be a number');
  }

  return config;
}
