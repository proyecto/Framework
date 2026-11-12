import fs from 'node:fs';
import { IncomingMessage, ServerResponse } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { PassThrough } from 'node:stream';
import type { Socket } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import {
  HttpSyncTransport,
  HybridSyncRepository,
  InMemoryEntityStoreDriver,
  MemoryKeyValueStore,
  SqlEntityStoreDriver,
  SqlKeyValueStore
} from '@framework/data';
import { createLibSqlDriver } from '@framework/data-libsql';
import {
  EXAMPLE_APP_ID,
  EXAMPLE_SERVER_MODULE,
  PRESET_ENTITY_NAME,
  PresetController,
  PresetModel,
  type PresetEntity
} from '@framework/example-domain';
import {
  SqlEntitlementProvider,
  createFrameworkServer,
  type FrameworkServerInstance
} from './index.js';

function createServerFetch(server: FrameworkServerInstance): typeof fetch {
  return async (input, init) => {
    const rawUrl = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const parsed = new URL(rawUrl, 'http://localhost');
    const method = init?.method ?? 'GET';
    const headers: Record<string, string> = {};
    if (init?.headers) {
      const h = new Headers(init.headers);
      h.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
    }

    const reqStream = new PassThrough() as unknown as Socket;
    const req = new IncomingMessage(reqStream);
    req.url = `${parsed.pathname}${parsed.search}`;
    req.method = method;
    req.headers = headers;

    const bodyText =
      typeof init?.body === 'string'
        ? init.body
        : init?.body instanceof Uint8Array
          ? Buffer.from(init.body).toString('utf8')
          : '';
    if (bodyText) {
      req.push(bodyText);
    }
    req.push(null);

    const chunks: Buffer[] = [];
    const res = new ServerResponse(req);
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    await new Promise<void>((resolve, reject) => {
      res.write = ((chunk: unknown, ...rest: unknown[]) => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        return (originalWrite as (...a: unknown[]) => boolean)(chunk, ...rest);
      }) as typeof res.write;

      res.end = ((chunk?: unknown, ...rest: unknown[]) => {
        if (chunk && typeof chunk !== 'function') {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        }
        const result = (originalEnd as (...a: unknown[]) => ServerResponse)(chunk, ...rest);
        resolve();
        return result;
      }) as typeof res.end;

      server.handleRequest(req, res).catch(reject);
    });

    const responseHeaders = new Headers();
    for (const [k, v] of Object.entries(res.getHeaders())) {
      if (v !== undefined) {
        responseHeaders.set(k, Array.isArray(v) ? v.join(', ') : String(v));
      }
    }

    return new Response(Buffer.concat(chunks).toString('utf8'), {
      status: res.statusCode,
      headers: responseHeaders
    });
  };
}

describe('@framework/server + LibSQL local/cloud sync end-to-end', () => {
  const cleanups: Array<() => Promise<void>> = [];

  afterEach(async () => {
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      if (fn) await fn();
    }
  });

  it('keeps free users strictly local and syncs multi-device data once upgraded to Pro', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-sync-test-'));
    const serverDbPath = path.join(tmpDir, 'server-libsql.db');
    const mobileDbPath = path.join(tmpDir, 'mobile-local.db');

    const server: FrameworkServerInstance = await createFrameworkServer({
      port: 0,
      host: '127.0.0.1',
      database: {
        mode: 'local',
        url: `file:${serverDbPath}`
      },
      apps: [EXAMPLE_SERVER_MODULE]
    });
    const fetchImpl = createServerFetch(server);
    const baseUrl = 'http://localhost';

    cleanups.push(async () => {
      await server.stop();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    // Health check reports local libSQL driver & registered example app
    const healthRes = await fetchImpl(`${baseUrl}/health`);
    const healthJson = (await healthRes.json()) as {
      ok: boolean;
      driver: string;
      registeredApps: string[];
    };
    expect(healthJson.ok).toBe(true);
    expect(healthJson.driver).toBe('libsql-local');
    expect(healthJson.registeredApps).toContain(EXAMPLE_APP_ID);

    // Client A (simulating Expo Android on-device SQLite via ISqlDriver)
    const mobileDriver = createLibSqlDriver({ mode: 'local', url: `file:${mobileDbPath}` });
    cleanups.push(async () => {
      await mobileDriver.close();
    });

    const mobileRepo = new HybridSyncRepository<PresetEntity>({
      appId: EXAMPLE_APP_ID,
      userId: 'rafael',
      deviceId: 'android-1',
      entityName: PRESET_ENTITY_NAME,
      store: new SqlEntityStoreDriver(mobileDriver),
      kv: new SqlKeyValueStore(mobileDriver),
      transport: new HttpSyncTransport({ baseUrl, fetchImpl }),
      defaultMode: 'local',
      defaultPlan: 'free'
    });
    const mobileController = new PresetController(new PresetModel(mobileRepo));
    await mobileController.init();
    await mobileController.createPreset({
      name: 'Escena Offline Móvil',
      ambientLevel: 70
    });

    // While Free, ZERO records exist on the server
    const freeServerRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/entities/${PRESET_ENTITY_NAME}?userId=rafael`
    );
    const freeServerData = (await freeServerRes.json()) as { items: PresetEntity[] };
    expect(freeServerData.items).toHaveLength(0);

    // Free user attempting direct sync gets rejected
    await expect(mobileRepo.syncNow()).rejects.toThrow(/Pro|Nube/i);

    // Client A pays for Pro & enables Cloud Sync -> local presets push to server!
    await mobileController.upgradeToProAndEnableCloud();
    expect({
      errorMessage: mobileController.getState().errorMessage,
      storage: mobileController.getState().storage
    }).toMatchObject({
      errorMessage: null,
      storage: {
        plan: 'pro',
        mode: 'cloud',
        cloudEnabled: true,
        pendingChanges: 0
      }
    });

    const proServerRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/entities/${PRESET_ENTITY_NAME}?userId=rafael`
    );
    const proServerData = (await proServerRes.json()) as { items: PresetEntity[] };
    expect(proServerData.items.some((p) => p.name === 'Escena Offline Móvil')).toBe(true);

    // Client B (simulating React Web View) logs in as the same Pro user and syncs!
    const webRepo = new HybridSyncRepository<PresetEntity>({
      appId: EXAMPLE_APP_ID,
      userId: 'rafael',
      deviceId: 'web-1',
      entityName: PRESET_ENTITY_NAME,
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      transport: new HttpSyncTransport({ baseUrl, fetchImpl }),
      defaultMode: 'local',
      defaultPlan: 'free'
    });
    const webController = new PresetController(new PresetModel(webRepo));
    await webController.upgradeToProAndEnableCloud();

    const pulledOnWeb = webController
      .getState()
      .presets.find((p) => p.name === 'Escena Offline Móvil');
    expect(pulledOnWeb).toBeDefined();

    // Client B moves a slider and syncs automatically; Client A pulls the change!
    await webController.updateSlider(pulledOnWeb!.id, 'ambientLevel', 95);
    await mobileController.syncNow();

    const syncedBackOnMobile = mobileController
      .getState()
      .presets.find((p) => p.id === pulledOnWeb!.id);
    expect(syncedBackOnMobile?.ambientLevel).toBe(95);

    // Custom reusable server MVC action endpoint works out-of-the-box
    const statsRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/actions/stats`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'rafael' })
      }
    );
    const statsJson = (await statsRes.json()) as {
      ok: boolean;
      result: { cloudPresetsCount: number };
    };
    expect(statsJson.ok).toBe(true);
    expect(statsJson.result.cloudPresetsCount).toBeGreaterThanOrEqual(3);

    mobileController.dispose();
    webController.dispose();
  });

  it('enforces HTTP security boundaries (403, 400, 413, 404) and LWW conflict protection on server', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fw-sec-test-'));
    const serverDbPath = path.join(tmpDir, 'server-sec.db');

    const server: FrameworkServerInstance = await createFrameworkServer({
      port: 0,
      host: '127.0.0.1',
      database: { mode: 'local', url: `file:${serverDbPath}` },
      apps: [EXAMPLE_SERVER_MODULE],
      allowDemoPlanSwitch: false,
      maxBodyBytes: 512
    });
    cleanups.push(async () => {
      await server.stop();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const fetchImpl = createServerFetch(server);
    const baseUrl = 'http://localhost';

    // 403 cuando allowDemoPlanSwitch está deshabilitado
    const forbiddenRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/entitlements`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u1', plan: 'pro' })
      }
    );
    expect(forbiddenRes.status).toBe(403);

    // 400 si el JSON está corrupto
    const invalidJsonRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/sync`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{invalid-json'
      }
    );
    expect(invalidJsonRes.status).toBe(400);

    // 400 si falta userId en sync
    const missingUserRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/sync`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ deviceId: 'd1', changes: [] })
      }
    );
    expect(missingUserRes.status).toBe(400);

    // 413 si el cuerpo excede maxBodyBytes
    const tooLargeRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/sync`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u1', deviceId: 'd1', changes: 'x'.repeat(600) })
      }
    );
    expect(tooLargeRes.status).toBe(413);

    // 404 para acción o ruta inexistente
    const missingActionRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/actions/unknown-action`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'u1' })
      }
    );
    expect(missingActionRes.status).toBe(404);

    const missingRouteRes = await fetchImpl(`${baseUrl}/api/v1/does-not-exist`);
    expect(missingRouteRes.status).toBe(404);

    // LWW en servidor: habilitamos plan pro vía SqlEntitlementProvider y verificamos que un push antiguo no sobrescribe uno más nuevo
    await new SqlEntitlementProvider(server.driver).setEntitlement(EXAMPLE_APP_ID, 'u-lww', 'pro');

    const newerPush = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/sync`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-lww',
          deviceId: 'd-new',
          changes: [
            {
              entity: PRESET_ENTITY_NAME,
              recordId: 'r-1',
              payload: { id: 'r-1', name: 'Newer' },
              version: 2,
              updatedAt: '2026-01-02T00:00:00.000Z',
              deletedAt: null
            }
          ]
        })
      }
    );
    expect(newerPush.status).toBe(200);
    expect(((await newerPush.json()) as { acceptedCount: number }).acceptedCount).toBe(1);

    const stalePush = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/sync`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: 'u-lww',
          deviceId: 'd-stale',
          changes: [
            {
              entity: PRESET_ENTITY_NAME,
              recordId: 'r-1',
              payload: { id: 'r-1', name: 'Stale' },
              version: 5,
              updatedAt: '2026-01-01T00:00:00.000Z',
              deletedAt: null
            }
          ]
        })
      }
    );
    expect(stalePush.status).toBe(200);
    expect(((await stalePush.json()) as { acceptedCount: number }).acceptedCount).toBe(0);

    const listRes = await fetchImpl(
      `${baseUrl}/api/v1/apps/${EXAMPLE_APP_ID}/entities/${PRESET_ENTITY_NAME}?userId=u-lww`
    );
    const listJson = (await listRes.json()) as { items: Array<{ name: string }> };
    expect(listJson.items).toHaveLength(1);
    expect(listJson.items[0]?.name).toBe('Newer');
  });
});
