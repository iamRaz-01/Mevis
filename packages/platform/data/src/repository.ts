import type { DatabaseClient } from './database';
import { ConcurrencyError, EntityNotFoundError } from './errors';

export interface Identifiable<ID> {
  id: ID;
  version?: number;
}

export interface Repository<T extends Identifiable<ID>, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  deleteById(id: ID): Promise<void>;
}

/**
 * In-Memory Adapter (valuable for fast unit testing and offline development)
 */
export class MemoryRepository<T extends Identifiable<ID>, ID> implements Repository<T, ID> {
  protected readonly store = new Map<ID, T>();

  constructor(private readonly entityName: string) {}

  async findById(id: ID): Promise<T | null> {
    const item = this.store.get(id);
    return item ? { ...item } : null;
  }

  async findAll(): Promise<T[]> {
    return Array.from(this.store.values()).map((item) => ({ ...item }));
  }

  async save(entity: T): Promise<T> {
    if (entity.id === undefined || entity.id === null) {
      throw new Error('Entity must have a defined ID to save in memory storage.');
    }

    const existing = this.store.get(entity.id);
    const versionedEntity = { ...entity };

    if (existing) {
      // Optimistic locking checks
      if (existing.version !== undefined && versionedEntity.version !== undefined) {
        if (existing.version !== versionedEntity.version) {
          throw new ConcurrencyError(this.entityName, String(entity.id));
        }
        versionedEntity.version++;
      }
    } else {
      if (versionedEntity.version !== undefined) {
        versionedEntity.version = 1;
      }
    }

    this.store.set(entity.id, versionedEntity);
    return versionedEntity;
  }

  async deleteById(id: ID): Promise<void> {
    if (!this.store.has(id)) {
      throw new EntityNotFoundError(this.entityName, String(id));
    }
    this.store.delete(id);
  }
}

/**
 * Relational / SQL Database Adapter
 */
export class RelationalRepository<T extends Identifiable<ID>, ID> implements Repository<T, ID> {
  constructor(
    protected readonly db: DatabaseClient,
    protected readonly tableName: string,
    protected readonly columns: string[],
    protected readonly entityName: string,
  ) {}

  async findById(id: ID): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1;`;
    const rows = await this.db.query<T>(sql, [id]);
    return rows[0] || null;
  }

  async findAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName};`;
    return await this.db.query<T>(sql);
  }

  async save(entity: T): Promise<T> {
    const existing = await this.findById(entity.id);

    if (existing) {
      // Update scenario with optimistic lock checking
      if (existing.version !== undefined && entity.version !== undefined) {
        if (existing.version !== entity.version) {
          throw new ConcurrencyError(this.entityName, String(entity.id));
        }
      }

      const nextVersion = entity.version !== undefined ? entity.version + 1 : undefined;
      const setClauses = this.columns
        .filter((col) => col !== 'id')
        .map((col) => `${col} = ?`)
        .join(', ');

      const params = this.columns
        .filter((col) => col !== 'id')
        .map((col) => {
          if (col === 'version') return nextVersion;
          return (entity as unknown as Record<string, unknown>)[col];
        });

      let sql = `UPDATE ${this.tableName} SET ${setClauses} WHERE id = ?`;
      const sqlParams = [...params, entity.id];

      if (entity.version !== undefined) {
        sql += ' AND version = ?';
        sqlParams.push(entity.version);
      }
      sql += ';';

      await this.db.execute(sql, sqlParams);
      return {
        ...entity,
        ...(nextVersion !== undefined ? { version: nextVersion } : {}),
      };
    } else {
      // Insert scenario
      const versionedEntity = { ...entity };
      if (versionedEntity.version !== undefined) {
        versionedEntity.version = 1;
      }

      const colsStr = this.columns.join(', ');
      const placeholders = this.columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${this.tableName} (${colsStr}) VALUES (${placeholders});`;

      const params = this.columns.map((col) => {
        if (col === 'version') return versionedEntity.version;
        return (versionedEntity as unknown as Record<string, unknown>)[col];
      });

      await this.db.execute(sql, params);
      return versionedEntity;
    }
  }

  async deleteById(id: ID): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new EntityNotFoundError(this.entityName, String(id));
    }
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?;`;
    await this.db.execute(sql, [id]);
  }
}
