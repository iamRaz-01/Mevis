import { PlatformError } from '@mevis/platform-communication';

export class DataPlatformError extends PlatformError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = 'DataPlatformError';
  }
}

export class ConcurrencyError extends DataPlatformError {
  constructor(entityName: string, id: string | number) {
    super(
      409,
      'CONCURRENCY_CONFLICT',
      `Concurrent modification detected on entity "${entityName}" with ID ${id}.`,
    );
  }
}

export class TransactionError extends DataPlatformError {
  constructor(message: string) {
    super(500, 'TRANSACTION_FAILURE', message);
  }
}

export class MigrationError extends DataPlatformError {
  constructor(message: string) {
    super(500, 'MIGRATION_FAILURE', message);
  }
}

export class EntityNotFoundError extends DataPlatformError {
  constructor(entityName: string, id: string | number) {
    super(404, 'ENTITY_NOT_FOUND', `Entity "${entityName}" with ID ${id} not found.`);
  }
}
