import { DatabaseSync } from 'node:sqlite';
import { TransactionError } from './errors';

export interface DatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<void>;
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  close(): Promise<void>;
}

export class SqliteDatabaseAdapter implements DatabaseClient {
  private readonly db: DatabaseSync;
  private inTransaction = false;

  constructor(filePath: string) {
    this.db = new DatabaseSync(filePath);
  }

  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...(params as Array<string | number | bigint | Buffer | Uint8Array | null>)) as T[];
      return rows;
    } catch (err) {
      throw new Error(
        `SQL Query Failed: ${sql}. Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    try {
      const stmt = this.db.prepare(sql);
      stmt.run(...(params as Array<string | number | bigint | Buffer | Uint8Array | null>));
    } catch (err) {
      throw new Error(
        `SQL Execution Failed: ${sql}. Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async beginTransaction(): Promise<void> {
    if (this.inTransaction) {
      throw new TransactionError('A transaction is already in progress.');
    }
    await this.execute('BEGIN TRANSACTION;');
    this.inTransaction = true;
  }

  async commitTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new TransactionError('No active transaction to commit.');
    }
    await this.execute('COMMIT;');
    this.inTransaction = false;
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.inTransaction) {
      throw new TransactionError('No active transaction to rollback.');
    }
    await this.execute('ROLLBACK;');
    this.inTransaction = false;
  }

  async close(): Promise<void> {
    this.db.close();
  }
}
