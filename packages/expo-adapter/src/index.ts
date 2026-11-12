import * as SQLite from 'expo-sqlite';
import {
  AsyncMutex,
  normalizeSqlParams,
  type ISqlDriver,
  type ISqlTransaction,
  type SqlExecuteResult,
  type SqlValue
} from '@framework/core';

type SqliteExecutorLike = Pick<SQLite.SQLiteDatabase, 'runAsync' | 'getAllAsync'>;

/**
 * Adapta una conexión o transacción de `expo-sqlite` al contrato neutro `ISqlTransaction`,
 * reutilizando la normalización de parámetros de `@framework/core`.
 */
function wrapSqliteExecutor(executor: SqliteExecutorLike): ISqlTransaction {
  return {
    execute: async (sql: string, params?: SqlValue[]): Promise<SqlExecuteResult> => {
      const res = await executor.runAsync(
        sql,
        normalizeSqlParams(params) as SQLite.SQLiteBindParams
      );
      return {
        rowsAffected: res.changes,
        lastInsertRowId: res.lastInsertRowId
      };
    },
    query: async <TRow = Record<string, unknown>>(
      sql: string,
      params?: SqlValue[]
    ): Promise<TRow[]> =>
      executor.getAllAsync<TRow>(
        sql,
        normalizeSqlParams(params) as SQLite.SQLiteBindParams
      )
  };
}

/**
 * Patrón: **Adapter + Anti-Corruption Boundary (`expo-sqlite` -> `ISqlDriver`)**.
 *
 * Aísla TODAS las importaciones de `expo-sqlite` dentro de este único archivo.
 * Ventaja estratégica: cuando actualices de versión el SDK de Expo (por ejemplo SDK 58 -> 59),
 * únicamente deberás verificar o ajustar este adaptador sin tocar el resto del framework ni las apps.
 */
export class ExpoSqliteDriver implements ISqlDriver {
  readonly driverName = 'expo-sqlite';
  private dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly writeMutex = new AsyncMutex();

  constructor(private readonly databaseName = 'framework_app.db') {}

  private getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = SQLite.openDatabaseAsync(this.databaseName);
    }
    return this.dbPromise;
  }

  /** Abre la base de datos SQLite del dispositivo y habilita modo WAL para lecturas fluidas. */
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

  async execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult> {
    await this.initialize();
    const db = await this.getDb();
    return this.writeMutex.run(() => wrapSqliteExecutor(db).execute(sql, params));
  }

  async query<TRow = Record<string, unknown>>(
    sql: string,
    params?: SqlValue[]
  ): Promise<TRow[]> {
    await this.initialize();
    const db = await this.getDb();
    return wrapSqliteExecutor(db).query<TRow>(sql, params);
  }

  async transaction<T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T> {
    await this.initialize();
    const db = await this.getDb();
    return this.writeMutex.run(async () => {
      let result!: T;

      // Usa transacción exclusiva cuando la versión de expo-sqlite lo soporta.
      if (typeof db.withExclusiveTransactionAsync === 'function') {
        await db.withExclusiveTransactionAsync(async (txn) => {
          result = await fn(wrapSqliteExecutor(txn));
        });
        return result;
      }

      // Respaldo compatible para implementaciones/versiones sin `withExclusiveTransactionAsync`.
      await db.withTransactionAsync(async () => {
        result = await fn(wrapSqliteExecutor(db));
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
