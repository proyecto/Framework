import { createClient, type Client, type InValue, type Transaction } from '@libsql/client';
import {
  AsyncMutex,
  FrameworkError,
  normalizeSqlParams,
  type ISqlDriver,
  type ISqlTransaction,
  type SqlExecuteResult,
  type SqlValue
} from '@framework/core';

/**
 * Configuración discriminada para instanciar libSQL en modo local (archivo o memoria)
 * o en modo remoto apuntando a un cluster **Turso**.
 */
export type LibSqlDriverConfig =
  | {
      mode: 'local';
      /** Ej. `'file:./data/framework.db'` o `':memory:'` */
      url: string;
    }
  | {
      mode: 'turso';
      /** Ej. `'libsql://mi-org.turso.io'` */
      url: string;
      authToken: string;
    };

/**
 * Adapta un `Client` o una `Transaction` de `@libsql/client` al contrato uniforme `ISqlTransaction`,
 * evitando duplicar la conversión de filas y `lastInsertRowId` entre operaciones directas y transacciones.
 */
function wrapLibSqlExecutor(executor: Pick<Client | Transaction, 'execute'>): ISqlTransaction {
  return {
    execute: async (sql: string, params?: SqlValue[]): Promise<SqlExecuteResult> => {
      const res = await executor.execute({
        sql,
        args: normalizeSqlParams(params) as InValue[]
      });
      return {
        rowsAffected: res.rowsAffected,
        lastInsertRowId:
          res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : undefined
      };
    },
    query: async <TRow = Record<string, unknown>>(
      sql: string,
      params?: SqlValue[]
    ): Promise<TRow[]> => {
      const res = await executor.execute({
        sql,
        args: normalizeSqlParams(params) as InValue[]
      });
      return res.rows.map((row) => ({ ...row }) as unknown as TRow);
    }
  };
}

/**
 * Patrón: **Adapter (`@libsql/client` -> `ISqlDriver`)**.
 *
 * Permite que el mismo código del servidor y de los repositorios funcione tanto con un
 * archivo SQLite/libSQL local como contra Turso en producción sin modificar ni una consulta SQL.
 * Emplea `AsyncMutex` para serializar escrituras locales y activar `WAL + busy_timeout`.
 */
export class LibSqlDriver implements ISqlDriver {
  readonly driverName: string;
  private readonly client: Client;
  private readonly rootExecutor: ISqlTransaction;
  private readonly writeMutex = new AsyncMutex();
  private initPromise: Promise<void> | null = null;

  constructor(private readonly config: LibSqlDriverConfig) {
    if (config.mode === 'turso') {
      if (!config.url || !config.authToken) {
        throw new FrameworkError(
          'CONFIGURATION_ERROR',
          'Turso requiere "url" y "authToken" configurados.',
          500
        );
      }
      this.driverName = 'libsql-turso';
      this.client = createClient({
        url: config.url,
        authToken: config.authToken
      });
    } else {
      if (!config.url) {
        throw new FrameworkError(
          'CONFIGURATION_ERROR',
          'libSQL local requiere una ruta/URL válida (ej. "file:./data/app.db").',
          500
        );
      }
      this.driverName = 'libsql-local';
      this.client = createClient({
        url: config.url
      });
    }

    this.rootExecutor = wrapLibSqlExecutor(this.client);
  }

  /** Configura pragmas de durabilidad y concurrencia una sola vez en archivos locales. */
  initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (this.config.mode === 'local' && this.config.url !== ':memory:') {
          await this.client.execute('PRAGMA busy_timeout = 5000');
          await this.client.execute('PRAGMA journal_mode = WAL');
          await this.client.execute('PRAGMA foreign_keys = ON');
        }
      })().catch((err) => {
        this.initPromise = null;
        throw err;
      });
    }
    return this.initPromise;
  }

  async execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult> {
    await this.initialize();
    return this.writeMutex.run(() => this.rootExecutor.execute(sql, params));
  }

  async query<TRow = Record<string, unknown>>(
    sql: string,
    params?: SqlValue[]
  ): Promise<TRow[]> {
    await this.initialize();
    return this.rootExecutor.query<TRow>(sql, params);
  }

  async transaction<T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T> {
    await this.initialize();
    return this.writeMutex.run(async () => {
      const tx = await this.client.transaction('write');
      const wrapped = wrapLibSqlExecutor(tx);

      try {
        const result = await fn(wrapped);
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        tx.close();
      }
    });
  }

  async close(): Promise<void> {
    this.client.close();
  }
}

/**
 * Patrón: **Factory Method** para crear una instancia tipada de `LibSqlDriver`.
 */
export function createLibSqlDriver(config: LibSqlDriverConfig): LibSqlDriver {
  return new LibSqlDriver(config);
}

/**
 * Patrón: **Factory Method por Configuración (Environment-driven)**.
 * Cambia entre libSQL local y Turso en la nube leyendo únicamente variables de entorno:
 * - `STORAGE_DRIVER=local|turso` (por defecto `local`)
 * - `LIBSQL_LOCAL_URL=file:./data/framework.db`
 * - `TURSO_DATABASE_URL=libsql://...`
 * - `TURSO_AUTH_TOKEN=...`
 */
export function createLibSqlDriverFromEnv(
  env: Record<string, string | undefined> = process.env
): LibSqlDriver {
  const mode = env.STORAGE_DRIVER === 'turso' ? 'turso' : 'local';
  if (mode === 'turso') {
    return new LibSqlDriver({
      mode: 'turso',
      url: env.TURSO_DATABASE_URL ?? '',
      authToken: env.TURSO_AUTH_TOKEN ?? ''
    });
  }
  return new LibSqlDriver({
    mode: 'local',
    url: env.LIBSQL_LOCAL_URL ?? 'file:./data/framework.db'
  });
}
