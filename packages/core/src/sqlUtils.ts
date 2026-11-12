import type { SqlValue } from './storage.js';

/**
 * Representa un valor SQL primitivo listo para ser enlazado por los drivers
 * subyacentes de SQLite / libSQL (`expo-sqlite` y `@libsql/client`).
 */
export type SqlBindPrimitive = string | number | null | Uint8Array;

/**
 * Patrón: **Monitor / Mutex Asíncrono (Concurrency Guard)**.
 *
 * Centraliza la serialización de operaciones asíncronas sobre un mismo recurso
 * (por ejemplo, escrituras o migraciones en SQLite local) para evitar condiciones
 * de carrera y errores `SQLITE_BUSY` cuando múltiples llamadas del controlador o
 * de la vista concurren al iniciar la aplicación.
 *
 * Se aloja en `@framework/core` para que tanto `@framework/data` (MigrationRunner),
 * `@framework/data-libsql` (Node/Turso) como `@framework/expo-adapter` (Android)
 * compartan exactamente la misma implementación sin duplicar colas de promesas.
 */
export class AsyncMutex {
  private tail: Promise<unknown> = Promise.resolve();

  /**
   * Encola `task` detrás de la operación anterior y garantiza ejecución estrictamente
   * secuencial (FIFO), incluso si la tarea previa falló.
   */
  run<T>(task: () => Promise<T>): Promise<T> {
    const next = this.tail.catch(() => undefined).then(task);
    this.tail = next;
    return next;
  }
}

/**
 * Normaliza los parámetros SQL del framework al formato aceptado por SQLite y libSQL.
 *
 * SQLite no posee tipo booleano nativo, por lo que convierte `true -> 1` y `false -> 0`
 * de forma uniforme tanto en Android (`expo-sqlite`) como en Node.js (`@libsql/client`).
 */
export function normalizeSqlParams(params?: SqlValue[]): SqlBindPrimitive[] {
  if (!params || params.length === 0) return [];
  return params.map((value) => (typeof value === 'boolean' ? (value ? 1 : 0) : value));
}

