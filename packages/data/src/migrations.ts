import { AsyncMutex, type ISqlDriver, type SqlMigration } from '@framework/core';

/**
 * Migraciones locales estándar creadas automáticamente en cada dispositivo
 * (Android Expo SQLite o libSQL local).
 *
 * - `_fw_kv`: metadatos de configuración y estado de sincronización (plan, modo, cursor).
 * - `_fw_local_entities`: caché local-first serializada por entidad y `record_id`, con estado
 *   `sync_status` (`pending` o `synced`) y soporte de borrado lógico (`deleted_at`).
 */
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

/** Registro débil (WeakMap) que asocia un `AsyncMutex` único por cada instancia de driver SQL. */
const driverMutexes = new WeakMap<ISqlDriver, AsyncMutex>();

function getMutexForDriver(driver: ISqlDriver): AsyncMutex {
  let mutex = driverMutexes.get(driver);
  if (!mutex) {
    mutex = new AsyncMutex();
    driverMutexes.set(driver, mutex);
  }
  return mutex;
}

/**
 * Ejecutor idempotente y transaccional de migraciones SQL versionadas.
 *
 * Patrón: **Command Sequence + Concurrency Monitor (`AsyncMutex`)**.
 * Serializa cualquier corrida de migraciones sobre el mismo `ISqlDriver` para evitar
 * bloqueos concurrentes cuando varios repositorios o stores arrancan en paralelo.
 */
export class MigrationRunner {
  constructor(private readonly driver: ISqlDriver) {}

  async run(migrations: SqlMigration[]): Promise<number[]> {
    return getMutexForDriver(this.driver).run(async () => {
      await this.driver.initialize();

      // Tabla de control de versiones aplicadas en esta base de datos.
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

      // Se aplican estrictamente en orden ascendente de versión dentro de transacciones atómicas.
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

/**
 * Patrón: **Lazy Memoized Initializer**.
 * Reutilizado por `SqlKeyValueStore` y `SqlEntityStoreDriver` para ejecutar las migraciones
 * una sola vez bajo demanda. Si la inicialización falla transitoriamente, limpia la promesa
 * en caché para permitir reintentos posteriores sin dejar el store bloqueado.
 */
export function createMigrationInitializer(
  driver: ISqlDriver,
  migrations: SqlMigration[] = FRAMEWORK_LOCAL_MIGRATIONS
): () => Promise<void> {
  let readyPromise: Promise<void> | null = null;

  return () => {
    if (!readyPromise) {
      readyPromise = new MigrationRunner(driver)
        .run(migrations)
        .then(() => undefined)
        .catch((err) => {
          readyPromise = null;
          throw err;
        });
    }
    return readyPromise;
  };
}
