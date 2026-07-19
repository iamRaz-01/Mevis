// ─────────────────────────────────────────────────────────────────────────────
// @mevis/infrastructure-configuration
// Centralizes configuration loading, validation, and strongly-typed exposure.
// Consumers must never access process.env directly; use this package instead.
// ─────────────────────────────────────────────────────────────────────────────

export type Environment = 'development' | 'test' | 'staging' | 'production';

export interface ServiceConfig {
  readonly serviceName: string;
  readonly environment: Environment;
  readonly port: number;
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  readonly version: string;
}

export interface DatabaseConfig {
  readonly url: string;
  readonly poolMin: number;
  readonly poolMax: number;
}

export interface StorageConfig {
  readonly provider: 'local' | 's3' | 'gcs';
  readonly basePath: string;
  readonly maxFileSizeBytes: number;
}

export interface NotificationConfig {
  readonly emailEnabled: boolean;
  readonly smsEnabled: boolean;
  readonly webhookEnabled: boolean;
  readonly smtpHost: string;
  readonly smtpPort: number;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new ConfigurationError(`Required environment variable "${key}" is not set.`);
  }
  return value;
}

function envInt(key: string, fallback?: number): number {
  const raw = process.env[key];
  if (raw === undefined) {
    if (fallback !== undefined) return fallback;
    throw new ConfigurationError(`Required environment variable "${key}" is not set.`);
  }
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed))
    throw new ConfigurationError(
      `Environment variable "${key}" must be a valid integer, got "${raw}".`,
    );
  return parsed;
}

function envBool(key: string, fallback = false): boolean {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === 'true' || raw === '1';
}

/** Load and validate strongly-typed service config. */
export function loadServiceConfig(serviceName: string): ServiceConfig {
  const env_ = env('NODE_ENV', 'development') as Environment;
  const validEnvs: Environment[] = ['development', 'test', 'staging', 'production'];
  if (!validEnvs.includes(env_)) {
    throw new ConfigurationError(
      `Invalid NODE_ENV "${env_}". Must be one of: ${validEnvs.join(', ')}.`,
    );
  }
  return {
    serviceName,
    environment: env_,
    port: envInt('PORT', 3000),
    logLevel: env('LOG_LEVEL', 'info') as ServiceConfig['logLevel'],
    version: env('npm_package_version', '0.0.0'),
  };
}

/** Load and validate database config. */
export function loadDatabaseConfig(): DatabaseConfig {
  return {
    url: env('DB_URL', ''),
    poolMin: envInt('DB_POOL_MIN', 2),
    poolMax: envInt('DB_POOL_MAX', 10),
  };
}

/** Load and validate storage config. */
export function loadStorageConfig(): StorageConfig {
  const provider = env('STORAGE_PROVIDER', 'local');
  if (!['local', 's3', 'gcs'].includes(provider)) {
    throw new ConfigurationError(
      `Invalid STORAGE_PROVIDER "${provider}". Must be local | s3 | gcs.`,
    );
  }
  return {
    provider: provider as StorageConfig['provider'],
    basePath: env('STORAGE_BASE_PATH', './uploads'),
    maxFileSizeBytes: envInt('STORAGE_MAX_FILE_SIZE_BYTES', 52_428_800), // 50 MB
  };
}

/** Load notification config. */
export function loadNotificationConfig(): NotificationConfig {
  return {
    emailEnabled: envBool('NOTIFICATION_EMAIL_ENABLED', true),
    smsEnabled: envBool('NOTIFICATION_SMS_ENABLED', false),
    webhookEnabled: envBool('NOTIFICATION_WEBHOOK_ENABLED', false),
    smtpHost: env('SMTP_HOST', 'localhost'),
    smtpPort: envInt('SMTP_PORT', 25),
  };
}
