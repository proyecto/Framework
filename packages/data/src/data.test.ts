import { describe, expect, it } from 'vitest';
import {
  HttpSyncTransport,
  HybridSyncRepository,
  InMemoryEntityStoreDriver,
  MemoryKeyValueStore,
  MigrationRunner
} from './index.js';
import type {
  EntityBase,
  IRemoteSyncTransport,
  ISqlDriver,
  ISqlTransaction,
  SqlExecuteResult,
  SyncPushRequest
} from '@framework/core';

interface SampleItem extends EntityBase {
  title: string;
}

function createFakeSqlDriver(options: { failOnSqlContains?: string } = {}): {
  driver: ISqlDriver;
  executed: string[];
  appliedVersions: number[];
} {
  const executed: string[] = [];
  const appliedVersions: number[] = [];

  const driver: ISqlDriver = {
    driverName: 'fake-memory-sql',
    initialize: async () => {},
    execute: async (sql: string): Promise<SqlExecuteResult> => {
      executed.push(sql);
      return { rowsAffected: 1 };
    },
    query: async <TRow = Record<string, unknown>>(sql: string): Promise<TRow[]> => {
      if (sql.includes('FROM _fw_migrations')) {
        return appliedVersions.map((version) => ({ version })) as unknown as TRow[];
      }
      return [];
    },
    transaction: async <T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T> => {
      const stagedVersions: number[] = [];
      const stagedSql: string[] = [];
      const tx: ISqlTransaction = {
        execute: async (sql, params) => {
          if (options.failOnSqlContains && sql.includes(options.failOnSqlContains)) {
            throw new Error('Simulated SQL failure');
          }
          stagedSql.push(sql);
          if (sql.includes('INSERT INTO _fw_migrations') && typeof params?.[0] === 'number') {
            stagedVersions.push(params[0]);
          }
          return { rowsAffected: 1 };
        },
        query: async () => []
      };
      const result = await fn(tx);
      executed.push(...stagedSql);
      appliedVersions.push(...stagedVersions);
      return result;
    },
    close: async () => {}
  };

  return { driver, executed, appliedVersions };
}

describe('HybridSyncRepository conflict, coalescing & mode guarantees', () => {
  it('merges newer remote updates on sync without losing local pending edits', async () => {
    const store = new InMemoryEntityStoreDriver();
    const kv = new MemoryKeyValueStore();
    const pushedRequests: SyncPushRequest[] = [];

    const transport: IRemoteSyncTransport = {
      checkEntitlement: async (appId, userId) => ({
        appId,
        userId,
        plan: 'pro',
        cloudSyncAllowed: true,
        updatedAt: '2026-01-01T00:00:00.000Z'
      }),
      setEntitlement: async (appId, userId, plan) => ({
        appId,
        userId,
        plan,
        cloudSyncAllowed: plan === 'pro',
        updatedAt: '2026-01-01T00:00:00.000Z'
      }),
      sync: async (req) => {
        pushedRequests.push(req);
        return {
          serverCursor: '2',
          acceptedCount: req.changes.length,
          changes: [
            {
              entity: 'items',
              recordId: 'remote-1',
              version: 1,
              updatedAt: '2026-11-12T00:00:00.000Z',
              deletedAt: null,
              payload: {
                id: 'remote-1',
                title: 'Desde la nube',
                createdAt: '2026-11-12T00:00:00.000Z',
                updatedAt: '2026-11-12T00:00:00.000Z',
                deletedAt: null,
                version: 1
              }
            }
          ]
        };
      }
    };

    const repo = new HybridSyncRepository<SampleItem>({
      appId: 'test-app',
      userId: 'u1',
      deviceId: 'd1',
      entityName: 'items',
      store,
      kv,
      transport,
      defaultMode: 'local',
      defaultPlan: 'free'
    });

    await repo.save({
      id: 'local-1',
      title: 'Creado en local',
      createdAt: '2026-11-11T00:00:00.000Z',
      updatedAt: '2026-11-11T00:00:00.000Z',
      deletedAt: null,
      version: 1
    });

    expect(pushedRequests).toHaveLength(0);
    await repo.setPlan('pro');
    await repo.setStorageMode('cloud');

    expect(pushedRequests).toHaveLength(1);
    const items = await repo.list();
    expect(items.map((i) => i.id).sort()).toEqual(['local-1', 'remote-1']);
  });

  it('coalesces concurrent syncNow() calls and preserves newer local edits against stale remote records', async () => {
    const store = new InMemoryEntityStoreDriver();
    const kv = new MemoryKeyValueStore();
    let syncCalls = 0;

    const transport: IRemoteSyncTransport = {
      checkEntitlement: async (appId, userId) => ({
        appId,
        userId,
        plan: 'pro',
        cloudSyncAllowed: true,
        updatedAt: '2026-11-12T00:00:00.000Z'
      }),
      setEntitlement: async (appId, userId, plan) => ({
        appId,
        userId,
        plan,
        cloudSyncAllowed: plan === 'pro',
        updatedAt: '2026-11-12T00:00:00.000Z'
      }),
      sync: async (req) => {
        syncCalls += 1;
        await new Promise((r) => setTimeout(r, 15));
        return {
          serverCursor: '5',
          acceptedCount: req.changes.length,
          changes: [
            {
              entity: 'items',
              recordId: 'item-1',
              version: 1,
              updatedAt: '2020-01-01T00:00:00.000Z', // más antiguo que el local
              deletedAt: null,
              payload: {
                id: 'item-1',
                title: 'Versión obsoleta remota',
                createdAt: '2020-01-01T00:00:00.000Z',
                updatedAt: '2020-01-01T00:00:00.000Z',
                deletedAt: null,
                version: 1
              }
            }
          ]
        };
      }
    };

    const repo = new HybridSyncRepository<SampleItem>({
      appId: 'test-app',
      userId: 'u1',
      deviceId: 'd1',
      entityName: 'items',
      store,
      kv,
      transport,
      defaultMode: 'local',
      defaultPlan: 'free',
      autoSyncInCloudMode: false
    });

    await repo.save({
      id: 'item-1',
      title: 'Edición más reciente local',
      createdAt: '2026-11-11T00:00:00.000Z',
      updatedAt: '2026-11-11T00:00:00.000Z',
      deletedAt: null,
      version: 1
    });
    await repo.setPlan('pro');
    await repo.setStorageMode('cloud');
    expect(syncCalls).toBe(1);

    // Reiniciamos contador y verificamos que dos syncNow() simultáneos se coalescen en una única ronda HTTP.
    syncCalls = 0;
    const [r1, r2] = await Promise.all([repo.syncNow(), repo.syncNow()]);
    expect(syncCalls).toBe(1);
    expect(r1).toEqual(r2);
    expect((await repo.findById('item-1'))?.title).toBe('Edición más reciente local');

    // Soft-delete crea tombstone pero lo oculta en list() estándar.
    await repo.remove('item-1');
    expect(await repo.list()).toHaveLength(0);
    expect(await repo.list({ includeDeleted: true })).toHaveLength(1);
  });
});

describe('MigrationRunner & HttpSyncTransport reliability', () => {
  it('runs migrations in ascending order idempotently and rolls back failed migrations', async () => {
    const { driver, appliedVersions } = createFakeSqlDriver();
    const runner = new MigrationRunner(driver);

    const first = await runner.run([
      { version: 2, name: 'second', up: ['CREATE TABLE t2 (id TEXT)'] },
      { version: 1, name: 'first', up: ['CREATE TABLE t1 (id TEXT)'] }
    ]);
    expect(first).toEqual([1, 2]);
    expect(appliedVersions).toEqual([1, 2]);

    const second = await runner.run([
      { version: 1, name: 'first', up: ['CREATE TABLE t1 (id TEXT)'] },
      { version: 2, name: 'second', up: ['CREATE TABLE t2 (id TEXT)'] }
    ]);
    expect(second).toEqual([]);

    const failing = createFakeSqlDriver({ failOnSqlContains: 'BROKEN_SQL' });
    await expect(
      new MigrationRunner(failing.driver).run([
        { version: 3, name: 'broken', up: ['BROKEN_SQL STATEMENT'] }
      ])
    ).rejects.toThrow(/Simulated SQL failure/);
    expect(failing.appliedVersions).toEqual([]);
  });

  it('maps HTTP 402 and network failures to structured FrameworkErrors', async () => {
    const paymentRequiredTransport = new HttpSyncTransport({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () =>
        new Response(JSON.stringify({ error: 'Requiere Pro' }), { status: 402 })
    });

    await expect(
      paymentRequiredTransport.sync({
        appId: 'a',
        userId: 'u',
        deviceId: 'd',
        sinceCursor: null,
        changes: []
      })
    ).rejects.toMatchObject({ code: 'ENTITLEMENT_REQUIRED', statusCode: 402 });

    const offlineTransport = new HttpSyncTransport({
      baseUrl: 'https://api.example.test',
      fetchImpl: async () => {
        throw new Error('ECONNREFUSED');
      }
    });

    await expect(offlineTransport.checkEntitlement('a', 'u')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      statusCode: 503
    });
  });
});
