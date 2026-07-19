import type { DatabaseClient } from './database';
import { Repository, RelationalRepository, Identifiable } from './repository';
import { TransactionError } from './errors';

export interface UnitOfWork {
  start(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  getRepository<T extends Identifiable<ID>, ID>(entityName: string): Repository<T, ID>;
}

export interface EntityMapping {
  tableName: string;
  columns: string[];
}

export class RelationalUnitOfWork implements UnitOfWork {
  private inTransaction = false;
  private readonly repositories = new Map<string, Repository<Identifiable<unknown>, unknown>>();

  constructor(
    private readonly db: DatabaseClient,
    private readonly mappings: Map<string, EntityMapping>,
  ) {}

  async start(): Promise<void> {
    if (this.inTransaction) {
      throw new TransactionError('Unit of Work transaction is already active.');
    }
    await this.db.beginTransaction();
    this.inTransaction = true;
  }

  async commit(): Promise<void> {
    if (!this.inTransaction) {
      throw new TransactionError('No active Unit of Work transaction to commit.');
    }
    try {
      await this.db.commitTransaction();
      this.inTransaction = false;
    } catch (err) {
      await this.rollback();
      throw err;
    }
  }

  async rollback(): Promise<void> {
    if (this.inTransaction) {
      try {
        await this.db.rollbackTransaction();
      } finally {
        this.inTransaction = false;
      }
    }
  }

  getRepository<T extends Identifiable<ID>, ID>(entityName: string): Repository<T, ID> {
    let repo = this.repositories.get(entityName);
    if (!repo) {
      const mapping = this.mappings.get(entityName);
      if (!mapping) {
        throw new Error(`No database mapping registered for entity "${entityName}".`);
      }
      repo = new RelationalRepository<T, ID>(
        this.db,
        mapping.tableName,
        mapping.columns,
        entityName,
      );
      this.repositories.set(
        entityName,
        repo as unknown as Repository<Identifiable<unknown>, unknown>,
      );
    }
    return repo as unknown as Repository<T, ID>;
  }
}
