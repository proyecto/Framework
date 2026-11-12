import { createClient, type Client, type InValue } from '@libsql/client';
import {
  FrameworkError,
  type ISqlDriver,
  type ISqlTransaction,
  type SqlExecuteResult,
  type SqlValue
} from '@framework/core';

export type LibSqlDriverConfig =
  | {
      mode: 'local';
      /** e.g. 'file:./data/framework.db' or ':memory:' */
      url: string;
    }
  | {
      mode: 'turso';
      /** e.g. 'libsql://your-db-org.turso.io' */
      url: string;
      authToken: string;
    };

function normalizeArgs(params?: SqlValue[]): InValue[] {
  if (!params || params.length === 0) return [];
  return params.map((value) => {
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value;
  });
}

export class LibSqlDriver implements ISqlDriver {
  readonly driverName: string;
  private readonly client: Client;
  private initPromise: Promise<void> | null = null;
  private writeQueue: Promise<unknown> = Promise.resolve();

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
  }

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

  private enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
    const next = this.writeQueue.catch(() => undefined).then(fn);
    this.writeQueue = next;
    return next;
  }

  async execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult> {
    await this.initialize();
    return this.enqueueWrite(async () => {
      const res = await this.client.execute({
        sql,
        args: normalizeArgs(params)
      });
      return {
        rowsAffected: res.rowsAffected,
        lastInsertRowId:
          res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : undefined
      };
    });
  }

  async query<TRow = Record<string, unknown>>(
    sql: string,
    params?: SqlValue[]
  ): Promise<TRow[]> {
    await this.initialize();
    const res = await this.client.execute({
      sql,
      args: normalizeArgs(params)
    });
    return res.rows.map((row) => ({ ...row }) as unknown as TRow);
  }

  async transaction<T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T> {
    await this.initialize();
    return this.enqueueWrite(async () => {
      const tx = await this.client.transaction('write');
      const wrapped: ISqlTransaction = {
        execute: async (sql, params) => {
          const res = await tx.execute({
            sql,
            args: normalizeArgs(params)
          });
          return {
            rowsAffected: res.rowsAffected,
            lastInsertRowId:
              res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : undefined
          };
        },
        query: async <TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]) => {
          const res = await tx.execute({
            sql,
            args: normalizeArgs(params)
          });
          return res.rows.map((row) => ({ ...row }) as unknown as TRow);
        }
      };

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

export function createLibSqlDriver(config: LibSqlDriverConfig): LibSqlDriver {
  return new LibSqlDriver(config);
}

/**
 * Helper to create a LibSqlDriver from standard environment variables:
 * - STORAGE_DRIVER=local|turso (default: local)
 * - LIBSQL_LOCAL_URL=file:./data/framework.db
 * - TURSO_DATABASE_URL=libsql://...
 * - TURSO_AUTH_TOKEN=...
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
