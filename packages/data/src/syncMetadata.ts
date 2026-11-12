import type { IKeyValueStore, StorageMode, UserPlan } from '@framework/core';

export interface SyncMetadataStoreOptions {
  kv: IKeyValueStore;
  namespacePrefix: string;
  defaultMode: StorageMode;
  defaultPlan: UserPlan;
}

/**
 * Patrón: **Single Responsibility / State Store Helper**.
 *
 * Encapsula la serialización y el prefijado de claves en `IKeyValueStore` para los
 * metadatos operativos de sincronización (`mode`, `plan`, `cursor`, `lastSyncedAt`),
 * manteniendo a `HybridSyncRepository` enfocado únicamente en entidades y replicación.
 */
export class SyncMetadataStore {
  private readonly kv: IKeyValueStore;
  private readonly namespacePrefix: string;
  private readonly defaultMode: StorageMode;
  private readonly defaultPlan: UserPlan;

  constructor(options: SyncMetadataStoreOptions) {
    this.kv = options.kv;
    this.namespacePrefix = options.namespacePrefix;
    this.defaultMode = options.defaultMode;
    this.defaultPlan = options.defaultPlan;
  }

  private key(suffix: string): string {
    return `${this.namespacePrefix}:${suffix}`;
  }

  async getMode(): Promise<StorageMode> {
    const raw = await this.kv.get(this.key('mode'));
    return raw === 'cloud' || raw === 'local' ? raw : this.defaultMode;
  }

  async setMode(mode: StorageMode): Promise<void> {
    await this.kv.set(this.key('mode'), mode);
  }

  async getPlan(): Promise<UserPlan> {
    const raw = await this.kv.get(this.key('plan'));
    return raw === 'pro' || raw === 'free' ? raw : this.defaultPlan;
  }

  async setPlan(plan: UserPlan): Promise<void> {
    await this.kv.set(this.key('plan'), plan);
  }

  async getCursor(): Promise<string | null> {
    return this.kv.get(this.key('cursor'));
  }

  async setCursor(cursor: string): Promise<void> {
    await this.kv.set(this.key('cursor'), cursor);
  }

  async getLastSyncedAt(): Promise<string | null> {
    return this.kv.get(this.key('lastSyncedAt'));
  }

  async setLastSyncedAt(isoTimestamp: string): Promise<void> {
    await this.kv.set(this.key('lastSyncedAt'), isoTimestamp);
  }
}

