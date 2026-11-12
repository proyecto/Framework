import type { ISqlDriver, SqlMigration } from '@framework/core';

export const FRAMEWORK_LOCAL_MIGRATIONS: SqlMigration[] = [
  {
    version: 1,
    name: 'create_framework_local_tables',
    up: [
      `CREATE TABLE IF NOT EXISTS _fw_kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS _fw_local_entities (
        entity_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        version INTEGER NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        PRIMARY KEY (entity_name, record_id)
      )`,
      `CREATE INDEX IF NOT EXISTS idx_fw_local_entities_sync
       ON _fw_local_entities (entity_name, sync_status, updated_at)`
    ]
  }
];

const driverQueues = new WeakMap<ISqlDriver, Promise<unknown>>();

function runSerializedOnDriver<T>(driver: ISqlDriver, task: () => Promise<T>): Promise<T> {
  const previous = driverQueues.get(driver) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(task);
  driverQueues.set(driver, next);
  return next;
}

export class MigrationRunner {
  constructor(private readonly driver: ISqlDriver) {}

  async run(migrations: SqlMigration[]): Promise<number[]> {
    return runSerializedOnDriver(this.driver, async () => {
      await this.driver.initialize();
      await this.driver.execute(
        `CREATE TABLE IF NOT EXISTS _fw_migrations (
          version INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL
        )`
      );

      const appliedRows = await this.driver.query<{ version: number }>(
        `SELECT version FROM _fw_migrations ORDER BY version ASC`
      );
      const appliedSet = new Set(appliedRows.map((row) => Number(row.version)));
      const newlyApplied: number[] = [];

      const sorted = [...migrations].sort((a, b) => a.version - b.version);
      for (const migration of sorted) {
        if (appliedSet.has(migration.version)) continue;

        await this.driver.transaction(async (tx) => {
          for (const statement of migration.up) {
            await tx.execute(statement);
          }
          await tx.execute(
            `INSERT INTO _fw_migrations (version, name, applied_at) VALUES (?, ?, ?)`,
            [migration.version, migration.name, new Date().toISOString()]
          );
        });

        newlyApplied.push(migration.version);
      }

      return newlyApplied;
    });
  }
}
