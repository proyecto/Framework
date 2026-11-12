import { describe, expect, it } from 'vitest';
import {
  HybridSyncRepository,
  InMemoryEntityStoreDriver,
  MemoryKeyValueStore
} from './index.js';
import type { EntityBase, IRemoteSyncTransport, SyncPushRequest } from '@framework/core';

interface SampleItem extends EntityBase {
  title: string;
}

describe('HybridSyncRepository conflict & mode guarantees', () => {
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
});

