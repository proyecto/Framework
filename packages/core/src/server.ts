import type { ISqlDriver, SqlMigration, StorageMode } from './storage.js';

export interface AppRuntimeConfig {
  appId: string;
  appName: string;
  apiBaseUrl?: string;
  defaultStorageMode: StorageMode;
  defaultUserId: string;
}

export interface ServerActionContext {
  appId: string;
  userId: string;
  driver: ISqlDriver;
  body: unknown;
  query: Record<string, string>;
}

export type ServerActionHandler = (ctx: ServerActionContext) => Promise<unknown>;

export interface RegisteredAppModule {
  appId: string;
  migrations?: SqlMigration[];
  actions?: Record<string, ServerActionHandler>;
}

