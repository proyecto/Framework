import * as SQLite from 'expo-sqlite';
import type {
  ISqlDriver,
  ISqlTransaction,
  SqlExecuteResult,
  SqlValue
} from '@framework/core';

function normalizeParams(params?: SqlValue[]): SQLite.SQLiteBindParams {
  if (!params || params.length === 0) return [];
  return params.map((value) => (typeof value === 'boolean' ? (value ? 1 : 0) : value));
}

/**
 * Isolates all `expo-sqlite` imports behind the pure `@framework/core` ISqlDriver contract.
 * When upgrading Expo SDK versions, ONLY this lightweight adapter needs verification.
 */
export class ExpoSqliteDriver implements ISqlDriver {
  readonly driverName = 'expo-sqlite';
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private initPromise: Promise<void> | null = null;
  private writeQueue: Promise<unknown> = Promise.resolve();

  constructor(private readonly databaseName = 'framework_app.db') {}

  private getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = SQLite.openDatabaseAsync(this.databaseName);
    }
    return this.dbPromise;
  }

  initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const db = await this.getDb();
        await db.execAsync(
          'PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;'
        );
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
    const db = await this.getDb();
    return this.enqueueWrite(async () => {
      const res = await db.runAsync(sql, normalizeParams(params));
      return {
        rowsAffected: res.changes,
        lastInsertRowId: res.lastInsertRowId
      };
    });
  }

  async query<TRow = Record<string, unknown>>(
    sql: string,
    params?: SqlValue[]
  ): Promise<TRow[]> {
    await this.initialize();
    const db = await this.getDb();
    return db.getAllAsync<TRow>(sql, normalizeParams(params));
  }

  async transaction<T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T> {
    await this.initialize();
    const db = await this.getDb();
    return this.enqueueWrite(async () => {
      let result!: T;

      if (typeof db.withExclusiveTransactionAsync === 'function') {
        await db.withExclusiveTransactionAsync(async (txn) => {
          const wrapped: ISqlTransaction = {
            execute: async (sql, params) => {
              const res = await txn.runAsync(sql, normalizeParams(params));
              return {
                rowsAffected: res.changes,
                lastInsertRowId: res.lastInsertRowId
              };
            },
            query: async <TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]) =>
              txn.getAllAsync<TRow>(sql, normalizeParams(params))
          };
          result = await fn(wrapped);
        });
        return result;
      }

      await db.withTransactionAsync(async () => {
        const wrapped: ISqlTransaction = {
          execute: async (sql, params) => {
            const res = await db.runAsync(sql, normalizeParams(params));
            return {
              rowsAffected: res.changes,
              lastInsertRowId: res.lastInsertRowId
            };
          },
          query: async <TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]) =>
            db.getAllAsync<TRow>(sql, normalizeParams(params))
        };
        result = await fn(wrapped);
      });
      return result;
    });
  }

  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    await db.closeAsync();
    this.dbPromise = null;
    this.initPromise = null;
  }
}
