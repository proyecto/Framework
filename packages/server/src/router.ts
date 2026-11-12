import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  FrameworkError,
  ValidationError,
  getErrorMessage,
  type ISqlDriver,
  type RegisteredAppModule,
  type SyncPushRequest,
  type UserPlan
} from '@framework/core';
import type { IServerEntitlementProvider } from './schema.js';
import type { CloudSyncService } from './syncService.js';

export const DEFAULT_MAX_BODY_BYTES = 1_048_576;

export interface ServerRouterDependencies {
  driver: ISqlDriver;
  entitlements: IServerEntitlementProvider;
  syncService: CloudSyncService;
  appModules: ReadonlyMap<string, RegisteredAppModule>;
  corsOrigins: string[];
  allowDemoPlanSwitch: boolean;
  maxBodyBytes?: number;
}

interface RouteContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  params: string[];
}

interface RouteDefinition {
  method: string;
  pattern: RegExp;
  handler: (ctx: RouteContext) => Promise<void>;
}

/** Lee y parsea de forma segura el cuerpo JSON de una petición HTTP Node aplicando límite de tamaño. */
async function readJsonBody(
  req: IncomingMessage,
  maxBodyBytes: number
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.byteLength;
    if (totalBytes > maxBodyBytes) {
      throw new FrameworkError(
        'VALIDATION_ERROR',
        `El cuerpo de la petición excede el límite permitido (${maxBodyBytes} bytes).`,
        413
      );
    }
    chunks.push(buffer);
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

function applyCors(
  req: IncomingMessage,
  res: ServerResponse,
  corsOrigins: string[]
): void {
  const requestOrigin = req.headers.origin;
  if (corsOrigins.includes('*')) {
    res.setHeader('access-control-allow-origin', '*');
  } else if (requestOrigin && corsOrigins.includes(requestOrigin)) {
    res.setHeader('access-control-allow-origin', requestOrigin);
  }
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type,authorization');
}

/**
 * Patrón: **Front Controller + Declarative Route Table + Error Middleware**.
 *
 * Construye el manejador HTTP central del backend reutilizable a partir de una tabla
 * declarativa de rutas, separando el enrutamiento HTTP de la lógica de sincronización
 * (`CloudSyncService`) y de la persistencia (`ISqlDriver`).
 */
export function createServerRequestHandler(
  deps: ServerRouterDependencies
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  const maxBodyBytes = deps.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  const routes: RouteDefinition[] = [
    {
      method: 'GET',
      pattern: /^\/health$/,
      handler: async ({ res }) => {
        await deps.driver.query('SELECT 1 AS ok');
        sendJson(res, 200, {
          ok: true,
          driver: deps.driver.driverName,
          registeredApps: Array.from(deps.appModules.keys())
        });
      }
    },
    {
      method: 'GET',
      pattern: /^\/api\/v1\/apps\/([^/]+)\/entitlements$/,
      handler: async ({ res, url, params }) => {
        const appId = decodeURIComponent(params[0] ?? '');
        const userId = url.searchParams.get('userId') ?? 'default-user';
        const status = await deps.entitlements.getEntitlement(appId, userId);
        sendJson(res, 200, status);
      }
    },
    {
      method: 'POST',
      pattern: /^\/api\/v1\/apps\/([^/]+)\/entitlements$/,
      handler: async ({ req, res, params }) => {
        if (!deps.allowDemoPlanSwitch) {
          throw new FrameworkError(
            'ENTITLEMENT_REQUIRED',
            'El cambio directo de plan está deshabilitado en este servidor.',
            403
          );
        }
        const appId = decodeURIComponent(params[0] ?? '');
        const body = (await readJsonBody(req, maxBodyBytes)) as { userId?: string; plan?: UserPlan };
        const userId = body.userId?.trim() || 'default-user';
        const plan: UserPlan = body.plan === 'pro' ? 'pro' : 'free';
        const status = await deps.entitlements.setEntitlement(appId, userId, plan);
        sendJson(res, 200, status);
      }
    },
    {
      method: 'POST',
      pattern: /^\/api\/v1\/apps\/([^/]+)\/sync$/,
      handler: async ({ req, res, params }) => {
        const appId = decodeURIComponent(params[0] ?? '');
        const body = (await readJsonBody(req, maxBodyBytes)) as Partial<SyncPushRequest>;
        const pullResponse = await deps.syncService.sync(appId, body);
        sendJson(res, 200, pullResponse);
      }
    },
    {
      method: 'GET',
      pattern: /^\/api\/v1\/apps\/([^/]+)\/entities\/([^/]+)$/,
      handler: async ({ res, url, params }) => {
        const appId = decodeURIComponent(params[0] ?? '');
        const entity = decodeURIComponent(params[1] ?? '');
        const userId = url.searchParams.get('userId') ?? 'default-user';
        const items = await deps.syncService.listEntities(appId, userId, entity);
        sendJson(res, 200, { items });
      }
    },
    {
      method: 'POST',
      pattern: /^\/api\/v1\/apps\/([^/]+)\/actions\/([^/]+)$/,
      handler: async ({ req, res, url, params }) => {
        const appId = decodeURIComponent(params[0] ?? '');
        const actionName = decodeURIComponent(params[1] ?? '');
        const mod = deps.appModules.get(appId);
        const handler = mod?.actions?.[actionName];
        if (!handler) {
          throw new FrameworkError(
            'NOT_FOUND',
            `Acción "${actionName}" no registrada para la app "${appId}".`,
            404
          );
        }

        const body = await readJsonBody(req, maxBodyBytes);
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
          driver: deps.driver,
          body,
          query
        });
        sendJson(res, 200, { ok: true, result });
      }
    }
  ];

  return async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    applyCors(req, res, deps.corsOrigins);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const method = req.method ?? 'GET';

      for (const route of routes) {
        if (route.method !== method) continue;
        const match = url.pathname.match(route.pattern);
        if (!match) continue;

        await route.handler({
          req,
          res,
          url,
          params: match.slice(1)
        });
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
}

