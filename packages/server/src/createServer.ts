import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type {
  IConflictResolutionStrategy,
  ISqlDriver,
  RegisteredAppModule
} from '@framework/core';
import { MigrationRunner } from '@framework/data';
import { createLibSqlDriver, type LibSqlDriverConfig } from '@framework/data-libsql';
import { createServerRequestHandler } from './router.js';
import {
  SERVER_MIGRATIONS,
  SqlEntitlementProvider,
  type IServerEntitlementProvider
} from './schema.js';
import { CloudSyncService } from './syncService.js';

export interface FrameworkServerOptions {
  port?: number;
  host?: string;
  driver?: ISqlDriver;
  database?: LibSqlDriverConfig;
  apps?: RegisteredAppModule[];
  entitlementProvider?: IServerEntitlementProvider;
  conflictStrategy?: IConflictResolutionStrategy;
  corsOrigins?: string[];
  allowDemoPlanSwitch?: boolean;
  maxBodyBytes?: number;
}

/** Controlador de ciclo de vida del servidor Node.js reutilizable. */
export interface FrameworkServerInstance {
  readonly port: number;
  readonly host: string;
  readonly url: string;
  readonly driver: ISqlDriver;
  start(): Promise<string>;
  stop(): Promise<void>;
  handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
}

/** Garantiza que exista la carpeta padre cuando se configura una base de datos SQLite en archivo local. */
function ensureLocalSqliteDir(config?: LibSqlDriverConfig): void {
  if (!config || config.mode !== 'local') return;
  if (!config.url.startsWith('file:')) return;
  const rawPath = config.url.slice('file:'.length).split('?')[0] ?? '';
  if (!rawPath || rawPath === ':memory:') return;
  fs.mkdirSync(path.dirname(path.resolve(rawPath)), { recursive: true });
}

/**
 * Patrón: **Facade + Composition Root** del backend multi-aplicación.
 *
 * Ensambla en un único punto legible:
 * 1. Driver SQL (`ISqlDriver`, local libSQL o Turso mediante configuración).
 * 2. Migraciones base del servidor + migraciones de cada módulo de aplicación registrado.
 * 3. Proveedor de suscripciones (`IServerEntitlementProvider`).
 * 4. Servicio de sincronización incremental (`CloudSyncService` + `IConflictResolutionStrategy`).
 * 5. Enrutador HTTP declarativo (`createServerRequestHandler`).
 */
export async function createFrameworkServer(
  options: FrameworkServerOptions = {}
): Promise<FrameworkServerInstance> {
  ensureLocalSqliteDir(options.database);

  const driver =
    options.driver ??
    createLibSqlDriver(
      options.database ?? {
        mode: 'local',
        url: 'file:./data/framework-server.db'
      }
    );

  // 1. Ejecuta migraciones globales del servidor y de cada app registrada.
  const migrationRunner = new MigrationRunner(driver);
  await migrationRunner.run(SERVER_MIGRATIONS);

  const appModules = new Map<string, RegisteredAppModule>();
  for (const mod of options.apps ?? []) {
    appModules.set(mod.appId, mod);
    if (mod.migrations && mod.migrations.length > 0) {
      await migrationRunner.run(mod.migrations);
    }
  }

  // 2. Compone servicios de negocio y router HTTP.
  const entitlements = options.entitlementProvider ?? new SqlEntitlementProvider(driver);
  const syncService = new CloudSyncService(driver, entitlements, options.conflictStrategy);

  const handleRequest = createServerRequestHandler({
    driver,
    entitlements,
    syncService,
    appModules,
    corsOrigins: options.corsOrigins ?? ['*'],
    allowDemoPlanSwitch: options.allowDemoPlanSwitch ?? true,
    maxBodyBytes: options.maxBodyBytes
  });

  // 3. Gestión de socket HTTP Node.js (`start` / `stop`).
  let httpServer: http.Server | null = null;
  let boundHost = options.host ?? '127.0.0.1';
  let boundPort = options.port ?? 4000;

  return {
    get port() {
      return boundPort;
    },
    get host() {
      return boundHost;
    },
    get url() {
      return `http://${boundHost}:${boundPort}`;
    },
    driver,
    handleRequest,
    start: async () => {
      if (httpServer) return `http://${boundHost}:${boundPort}`;
      httpServer = http.createServer((req, res) => {
        void handleRequest(req, res);
      });
      await new Promise<void>((resolve, reject) => {
        httpServer!.once('error', reject);
        httpServer!.listen(boundPort, boundHost, () => {
          const address = httpServer!.address();
          if (address && typeof address === 'object') {
            boundPort = address.port;
            boundHost = address.address;
          }
          resolve();
        });
      });
      return `http://${boundHost}:${boundPort}`;
    },
    stop: async () => {
      if (httpServer) {
        await new Promise<void>((resolve, reject) => {
          httpServer!.close((err) => (err ? reject(err) : resolve()));
        });
        httpServer = null;
      }
      await driver.close();
    }
  };
}
