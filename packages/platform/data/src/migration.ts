import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DatabaseClient } from './database';
import { MigrationError } from './errors';

export interface MigrationRunner {
  runMigrations(migrationDir: string): Promise<void>;
}

export class SqlMigrationRunner implements MigrationRunner {
  constructor(private readonly db: DatabaseClient) {}

  /**
   * Runs all unapplied SQL migrations in order.
   */
  async runMigrations(migrationDir: string): Promise<void> {
    if (!fs.existsSync(migrationDir)) {
      throw new MigrationError(`Migrations directory "${migrationDir}" does not exist.`);
    }

    // 1. Ensure schema_migrations exists
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);

    // 2. Read migration files
    const files = fs
      .readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // guarantees ordering, e.g. V1__init.sql, V2__add_field.sql

    // 3. Resolve applied migrations
    const appliedRows = await this.db.query<{ version: string }>(
      'SELECT version FROM schema_migrations;',
    );
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    for (const file of files) {
      const version = file.split('__')[0];
      if (!version) {
        throw new MigrationError(
          `Invalid migration filename structure for "${file}". Use V{num}__description.sql`,
        );
      }

      if (appliedVersions.has(version)) {
        continue; // skip already applied migration
      }

      const filePath = path.join(migrationDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      process.stdout.write(`[MigrationRunner]: Applying migration "${file}"...\n`);

      // Run each migration file inside a transaction
      await this.db.beginTransaction();
      try {
        // SQLite permits multiple statements separated by semicolons under execute or query
        const statements = sqlContent
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const stmt of statements) {
          await this.db.execute(`${stmt};`);
        }

        // Record applied migration
        await this.db.execute(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
          [version, new Date().toISOString()],
        );

        await this.db.commitTransaction();
      } catch (err) {
        await this.db.rollbackTransaction();
        throw new MigrationError(
          `Failed to apply migration "${file}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}
