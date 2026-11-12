import type { ISqlDriver, SqlMigration } from './storage.js';

/**
 * Contexto inyectado por el servidor reutilizable (`@framework/server`) a cada acción
 * personalizada registrada por una aplicación cliente.
 */
export interface ServerActionContext {
  appId: string;
  userId: string;
  driver: ISqlDriver;
  body: unknown;
  query: Record<string, string>;
}

/** Manejador asíncrono (Patrón **Command**) para acciones específicas de una app en backend. */
export type ServerActionHandler = (ctx: ServerActionContext) => Promise<unknown>;

/**
 * Patrón: **Plugin / App Module Registration**.
 * Permite que múltiples aplicaciones compartan la misma instancia de backend Node.js
 * aportando sus propias migraciones SQL y endpoints de acción aislados por `appId`.
 */
export interface RegisteredAppModule {
  appId: string;
  migrations?: SqlMigration[];
  actions?: Record<string, ServerActionHandler>;
}
