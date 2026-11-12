import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  CloudEntitlementError,
  FrameworkError,
  ValidationError,
  getErrorMessage,
  type ISqlDriver,
  type RegisteredAppModule,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncRecordEnvelope,
  type UserPlan
} from '@framework/core';
import { MigrationRunner } from '@framework/data';
import { createLibSqlDriver, type LibSqlDriverConfig } from '@framework/data-libsql';
import {
  SERVER_MIGRATIONS,
  SqlEntitlementProvider,
  type IServerEntitlementProvider
} from './schema.js';

export interface FrameworkServerOptions {
  port?: number;
  host?: string;
  driver?: ISqlDriver;
  database?: LibSqlDriverConfig;
  apps?: RegisteredAppModule[];
  entitlementProvider?: IServerEntitlementProvider;
  corsOrigins?: string[];
  allowDemoPlanSwitch?: boolean;
}

export interface FrameworkServerInstance {
  readonly port: number;
  readonly host: string;
  readonly url: string;
  readonly driver: ISqlDriver;
  start(): Promise<string>;
  stop(): Promise<void>;
  handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void>;
}

interface ExistingRecordRow {
  entity: string;
  record_id: string;
  payload_json: string;
  version: number;
  updated_at: string;
  deleted_at: string | null;
  server_seq: number;
}

function ensureLocalSqliteDir(config?: LibSqlDriverConfig): void {
  if (!config || config.mode !== 'local') return;
  if (!config.url.startsWith('file:')) return;
  const rawPath = config.url.slice('file:'.length).split('?')[0] ?? '';
  if (!rawPath || rawPath === ':memory:') return;
  const dir = path.dirname(path.resolve(rawPath));
  fs.mkdirSync(dir, { recursive: true });
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ValidationError('El cuerpo de la petición no es un JSON válido.');
  }
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

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

  const migrationRunner = new MigrationRunner(driver);
  await migrationRunner.run(SERVER_MIGRATIONS);

  const appModules = new Map<string, RegisteredAppModule>();
  for (const mod of options.apps ?? []) {
    appModules.set(mod.appId, mod);
    if (mod.migrations && mod.migrations.length > 0) {
      await migrationRunner.run(mod.migrations);
    }
  }

  const entitlements = options.entitlementProvider ?? new SqlEntitlementProvider(driver);
  const allowDemoPlanSwitch = options.allowDemoPlanSwitch ?? true;
  const corsOrigins = options.corsOrigins ?? ['*'];

  const applyCors = (req: IncomingMessage, res: ServerResponse): void => {
    const requestOrigin = req.headers.origin;
    if (corsOrigins.includes('*')) {
      res.setHeader('access-control-allow-origin', '*');
    } else if (requestOrigin && corsOrigins.includes(requestOrigin)) {
      res.setHeader('access-control-allow-origin', requestOrigin);
    }
    res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type,authorization');
  };

  const handleRequest = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    applyCors(req, res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const pathname = url.pathname;
      const method = req.method ?? 'GET';

      if (method === 'GET' && pathname === '/health') {
        await driver.query('SELECT 1 AS ok');
        sendJson(res, 200, {
          ok: true,
          driver: driver.driverName,
          registeredApps: Array.from(appModules.keys())
        });
        return;
      }

      const entitlementMatch = pathname.match(/^\/api\/v1\/apps\/([^/]+)\/entitlements$/);
      if (entitlementMatch) {
        const appId = decodeURIComponent(entitlementMatch[1] ?? '');
        if (method === 'GET') {
          const userId = url.searchParams.get('userId') ?? 'default-user';
          const status = await entitlements.getEntitlement(appId, userId);
          sendJson(res, 200, status);
          return;
        }
        if (method === 'POST') {
          if (!allowDemoPlanSwitch) {
            throw new FrameworkError(
              'ENTITLEMENT_REQUIRED',
              'El cambio directo de plan está deshabilitado en este servidor.',
              403
            );
          }
          const body = (await readJsonBody(req)) as { userId?: string; plan?: UserPlan };
          const userId = body.userId?.trim() || 'default-user';
          const plan: UserPlan = body.plan === 'pro' ? 'pro' : 'free';
          const status = await entitlements.setEntitlement(appId, userId, plan);
          sendJson(res, 200, status);
          return;
        }
      }

      const syncMatch = pathname.match(/^\/api\/v1\/apps\/([^/]+)\/sync$/);
      if (syncMatch && method === 'POST') {
        const appId = decodeURIComponent(syncMatch[1] ?? '');
        const body = (await readJsonBody(req)) as Partial<SyncPushRequest>;
        const userId = body.userId?.trim();
        if (!userId) {
          throw new ValidationError('El campo "userId" es obligatorio para sincronizar.');
        }

        const entitlement = await entitlements.getEntitlement(appId, userId);
        if (!entitlement.cloudSyncAllowed) {
          throw new CloudEntitlementError(
            'El usuario no tiene un plan Pro activo para usar la nube.'
          );
        }

        const sinceSeq = body.sinceCursor ? Number(body.sinceCursor) || 0 : 0;
        const incomingChanges = Array.isArray(body.changes) ? body.changes : [];

        const pullResponse = await driver.transaction<SyncPullResponse>(async (tx) => {
          const maxRows = await tx.query<{ max_seq: number }>(
            `SELECT COALESCE(MAX(server_seq), 0) AS max_seq
             FROM _fw_server_records
             WHERE app_id = ? AND user_id = ?`,
            [appId, userId]
          );
          let nextSeq = Number(maxRows[0]?.max_seq ?? 0);
          let acceptedCount = 0;
          const acceptedKeys = new Set<string>();

          for (const change of incomingChanges) {
            if (!change.entity || !change.recordId) continue;
            const existingRows = await tx.query<ExistingRecordRow>(
              `SELECT entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
               FROM _fw_server_records
               WHERE app_id = ? AND user_id = ? AND entity = ? AND record_id = ?
               LIMIT 1`,
              [appId, userId, change.entity, change.recordId]
            );
            const existing = existingRows[0];
            const shouldAccept =
              !existing ||
              change.updatedAt > existing.updated_at ||
              (change.updatedAt === existing.updated_at &&
                change.version >= Number(existing.version));

            if (shouldAccept) {
              nextSeq += 1;
              acceptedCount += 1;
              acceptedKeys.add(`${change.entity}:${change.recordId}`);

              await tx.execute(
                `INSERT INTO _fw_server_records (
                   app_id, user_id, entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(app_id, user_id, entity, record_id) DO UPDATE SET
                   payload_json = excluded.payload_json,
                   version = excluded.version,
                   updated_at = excluded.updated_at,
                   deleted_at = excluded.deleted_at,
                   server_seq = excluded.server_seq`,
                [
                  appId,
                  userId,
                  change.entity,
                  change.recordId,
                  JSON.stringify(change.payload),
                  change.version,
                  change.updatedAt,
                  change.deletedAt ?? null,
                  nextSeq
                ]
              );
            }
          }

          const changedRows = await tx.query<ExistingRecordRow>(
            `SELECT entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
             FROM _fw_server_records
             WHERE app_id = ? AND user_id = ? AND server_seq > ?
             ORDER BY server_seq ASC`,
            [appId, userId, sinceSeq]
          );

          const changesToPull: SyncRecordEnvelope[] = changedRows
            .filter((row) => !acceptedKeys.has(`${row.entity}:${row.record_id}`))
            .map((row) => ({
              entity: row.entity,
              recordId: row.record_id,
              payload: JSON.parse(row.payload_json) as Record<string, unknown>,
              version: Number(row.version),
              updatedAt: row.updated_at,
              deletedAt: row.deleted_at
            }));

          return {
            serverCursor: String(nextSeq),
            acceptedCount,
            changes: changesToPull
          };
        });

        sendJson(res, 200, pullResponse);
        return;
      }

      const entitiesMatch = pathname.match(/^\/api\/v1\/apps\/([^/]+)\/entities\/([^/]+)$/);
      if (entitiesMatch && method === 'GET') {
        const appId = decodeURIComponent(entitiesMatch[1] ?? '');
        const entity = decodeURIComponent(entitiesMatch[2] ?? '');
        const userId = url.searchParams.get('userId') ?? 'default-user';
        const rows = await driver.query<ExistingRecordRow>(
          `SELECT entity, record_id, payload_json, version, updated_at, deleted_at, server_seq
           FROM _fw_server_records
           WHERE app_id = ? AND user_id = ? AND entity = ? AND deleted_at IS NULL
           ORDER BY updated_at DESC`,
          [appId, userId, entity]
        );
        sendJson(res, 200, {
          items: rows.map((row) => JSON.parse(row.payload_json) as Record<string, unknown>)
        });
        return;
      }

      const actionMatch = pathname.match(/^\/api\/v1\/apps\/([^/]+)\/actions\/([^/]+)$/);
      if (actionMatch && method === 'POST') {
        const appId = decodeURIComponent(actionMatch[1] ?? '');
        const actionName = decodeURIComponent(actionMatch[2] ?? '');
        const mod = appModules.get(appId);
        const handler = mod?.actions?.[actionName];
        if (!handler) {
          throw new FrameworkError(
            'NOT_FOUND',
            `Acción "${actionName}" no registrada para la app "${appId}".`,
            404
          );
        }
        const body = await readJsonBody(req);
        const query: Record<string, string> = {};
        for (const [k, v] of url.searchParams.entries()) {
          query[k] = v;
        }
        const userId =
          typeof (body as { userId?: unknown }).userId === 'string'
            ? (body as { userId: string }).userId
            : url.searchParams.get('userId') ?? 'default-user';
        const result = await handler({
          appId,
          userId,
          driver,
          body,
          query
        });
        sendJson(res, 200, { ok: true, result });
        return;
      }

      sendJson(res, 404, { error: 'Ruta no encontrada.' });
    } catch (error) {
      if (error instanceof FrameworkError) {
        sendJson(res, error.statusCode, { error: error.message, code: error.code });
        return;
      }
      sendJson(res, 500, {
        error: getErrorMessage(error),
        code: 'INTERNAL_ERROR'
      });
    }
  };

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

