// ─────────────────────────────────────────────────────────────────────────────
// @mevis/infrastructure-secrets
// Provides a secure abstraction for resolving sensitive platform values from
// environment variables. Allows future migration to Vault/AWS Secrets Manager
// without changing consuming services.
// ─────────────────────────────────────────────────────────────────────────────

export type SecretKey =
  | 'JWT_SECRET'
  | 'DB_PASSWORD'
  | 'DB_URL'
  | 'SMTP_PASSWORD'
  | 'SMS_API_KEY'
  | 'ENCRYPTION_KEY'
  | 'STORAGE_ACCESS_KEY'
  | 'STORAGE_SECRET_KEY';

export interface SecretsProvider {
  /**
   * Retrieve a secret by key. Throws if the value is absent and `required` is true.
   */
  get(key: SecretKey, required?: boolean): string | undefined;

  /**
   * Retrieve a secret, throwing a SecretsError when absent.
   */
  require(key: SecretKey): string;
}

export class SecretsError extends Error {
  constructor(public readonly key: string) {
    super(
      `Required secret "${key}" is not set. Populate the environment variable before starting the service.`,
    );
    this.name = 'SecretsError';
  }
}

/**
 * Environment-variable-backed secrets provider.
 * Isolation point: swap this adapter for a Vault/AWS adapter without
 * touching any business service code.
 */
export class EnvSecretsProvider implements SecretsProvider {
  get(key: SecretKey, required = false): string | undefined {
    const value = process.env[key];
    if (!value && required) throw new SecretsError(key);
    return value;
  }

  require(key: SecretKey): string {
    const value = process.env[key];
    if (!value) throw new SecretsError(key);
    return value;
  }
}

/** Default singleton — consumers import this directly. */
export const secrets: SecretsProvider = new EnvSecretsProvider();
