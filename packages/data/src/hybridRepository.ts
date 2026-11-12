import {
  CloudEntitlementError,
  LastWriteWinsConflictStrategy,
  getErrorMessage,
  type EntityBase,
  type IConflictResolutionStrategy,
  type IKeyValueStore,
  type IRemoteSyncTransport,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncRecordEnvelope,
  type SyncReport,
  type UserPlan
} from '@framework/core';
import type { IEntityStoreDriver } from './entityStore.js';

export interface HybridSyncRepositoryOptions {
  appId: string;
  userId: string;
  deviceId: string;
  entityName: string;
  store: IEntityStoreDriver;
  kv: IKeyValueStore;
  transport?: IRemoteSyncTransport;
  /** Estrategia de mezcla al aplicar cambios remotos; por defecto `LastWriteWinsConflictStrategy`. */
  conflictStrategy?: IConflictResolutionStrategy;
  defaultMode?: StorageMode;
  defaultPlan?: UserPlan;
  autoSyncInCloudMode?: boolean;
}

/**
 * Repositorio local-first con respaldo opcional en la nube (**Patrón Repository + Observer + Strategy**).
 *
 * Garantías de diseño:
 * 1. **Modo Local (`plan: 'free'` o `mode: 'local'`)**:
 *    Lee y escribe únicamente en `IEntityStoreDriver` local (SQLite en Android / localStorage en Web).
 *    Nunca realiza tráfico de red ni guarda registros fuera del dispositivo.
 * 2. **Modo Nube (`plan: 'pro'` y `mode: 'cloud'`)**:
 *    Sigue escribiendo primero en local (offline-first, respuesta instantánea en UI) y después
 *    empuja los registros `pending` hacia el servidor mediante `IRemoteSyncTransport`.
 * 3. **Coalescing Single-Flight**:
 *    Si llegan múltiples peticiones simultáneas de `syncNow()`, comparten la misma promesa `inFlightSync`
 *    para evitar duplicar rondas HTTP concurrentes.
 */
export class HybridSyncRepository<T extends EntityBase> implements ISyncableRepository<T> {
  readonly entityName: string;

  private readonly appId: string;
  private readonly userId: string;
  private readonly deviceId: string;
  private readonly store: IEntityStoreDriver;
  private readonly kv: IKeyValueStore;
  private readonly transport?: IRemoteSyncTransport;
  private readonly conflictStrategy: IConflictResolutionStrategy;
  private readonly defaultMode: StorageMode;
  private readonly defaultPlan: UserPlan;
  private readonly autoSyncInCloudMode: boolean;

  private readonly statusListeners = new Set<(status: StorageStatus) => void>();
  private inFlightSync: Promise<SyncReport> | null = null;
  private isSyncing = false;
  private lastSyncError: string | null = null;

  constructor(options: HybridSyncRepositoryOptions) {
    this.appId = options.appId;
    this.userId = options.userId;
    this.deviceId = options.deviceId;
    this.entityName = options.entityName;
    this.store = options.store;
    this.kv = options.kv;
    this.transport = options.transport;
    this.conflictStrategy = options.conflictStrategy ?? new LastWriteWinsConflictStrategy();
    this.defaultMode = options.defaultMode ?? 'local';
    this.defaultPlan = options.defaultPlan ?? 'free';
    this.autoSyncInCloudMode = options.autoSyncInCloudMode ?? true;
  }

  private kvKey(suffix: string): string {
    return `repo:${this.appId}:${this.userId}:${this.entityName}:${suffix}`;
  }

  private async readMode(): Promise<StorageMode> {
    const raw = await this.kv.get(this.kvKey('mode'));
    return raw === 'cloud' || raw === 'local' ? raw : this.defaultMode;
  }

  private async readPlan(): Promise<UserPlan> {
    const raw = await this.kv.get(this.kvKey('plan'));
    return raw === 'pro' || raw === 'free' ? raw : this.defaultPlan;
  }

  private async readCursor(): Promise<string | null> {
    return this.kv.get(this.kvKey('cursor'));
  }

  private async readLastSyncedAt(): Promise<string | null> {
    return this.kv.get(this.kvKey('lastSyncedAt'));
  }

  /** Recalcula y difunde el estado de almacenamiento a todos los observadores (Modelo/UI). */
  private async notifyStatus(): Promise<StorageStatus> {
    const status = await this.getStorageStatus();
    for (const listener of this.statusListeners) {
      listener(status);
    }
    return status;
  }

  /**
   * Intenta sincronizar en segundo plano tras una mutación local solo si el usuario está en
   * modo Nube + plan Pro. Un fallo de red queda reflejado en `lastSyncError` sin perder el cambio local.
   */
  private async syncAfterLocalMutationIfEnabled(): Promise<void> {
    const status = await this.getStorageStatus();
    if (!status.cloudEnabled || !this.autoSyncInCloudMode || !this.transport) return;

    try {
      await this.syncNow();
    } catch (error) {
      this.lastSyncError = getErrorMessage(error);
      await this.notifyStatus();
    }
  }

  subscribeStatus(listener: (status: StorageStatus) => void): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  async getPendingCount(): Promise<number> {
    return this.store.countPending(this.entityName);
  }

  async getStorageStatus(): Promise<StorageStatus> {
    const [mode, plan, pendingChanges, lastSyncedAt] = await Promise.all([
      this.readMode(),
      this.readPlan(),
      this.getPendingCount(),
      this.readLastSyncedAt()
    ]);

    return {
      mode,
      plan,
      cloudEnabled: mode === 'cloud' && plan === 'pro',
      pendingChanges,
      lastSyncedAt,
      isSyncing: this.isSyncing,
      lastSyncError: this.lastSyncError
    };
  }

  async list(options?: { includeDeleted?: boolean }): Promise<T[]> {
    const records = await this.store.list<T>(this.entityName);
    const includeDeleted = options?.includeDeleted ?? false;
    return records
      .map((entry) => entry.entity)
      .filter((entity) => includeDeleted || entity.deletedAt === null);
  }

  async findById(id: string): Promise<T | null> {
    const found = await this.store.getById<T>(this.entityName, id);
    if (!found || found.entity.deletedAt !== null) return null;
    return found.entity;
  }

  async save(entity: T): Promise<T> {
    const existing = await this.store.getById<T>(this.entityName, entity.id);
    const now = new Date().toISOString();
    const nextEntity: T = {
      ...entity,
      createdAt: existing?.entity.createdAt ?? entity.createdAt ?? now,
      updatedAt: now,
      version: Math.max((existing?.entity.version ?? 0) + 1, entity.version || 1)
    };

    await this.store.upsert(this.entityName, nextEntity, 'pending');
    await this.notifyStatus();
    await this.syncAfterLocalMutationIfEnabled();

    return nextEntity;
  }

  /**
   * Realiza un borrado lógico mediante tombstone (`deletedAt != null`) e incrementa `version`
   * para poder propagar la eliminación al resto de dispositivos cuando sincronice la nube.
   */
  async remove(id: string): Promise<void> {
    const existing = await this.store.getById<T>(this.entityName, id);
    if (!existing) return;

    const now = new Date().toISOString();
    const tombstone: T = {
      ...existing.entity,
      updatedAt: now,
      deletedAt: now,
      version: existing.entity.version + 1
    };

    await this.store.upsert(this.entityName, tombstone, 'pending');
    await this.notifyStatus();
    await this.syncAfterLocalMutationIfEnabled();
  }

  async setPlan(plan: UserPlan): Promise<StorageStatus> {
    if (this.transport) {
      try {
        await this.transport.setEntitlement(this.appId, this.userId, plan);
      } catch (error) {
        this.lastSyncError = getErrorMessage(error);
      }
    }

    await this.kv.set(this.kvKey('plan'), plan);
    if (plan === 'free') {
      // Al bajar a plan gratuito forzamos vuelta inmediata a modo solo local.
      await this.kv.set(this.kvKey('mode'), 'local');
    }
    this.lastSyncError = null;
    return this.notifyStatus();
  }

  async setStorageMode(mode: StorageMode): Promise<StorageStatus> {
    const plan = await this.readPlan();
    if (mode === 'cloud' && plan !== 'pro') {
      throw new CloudEntitlementError(
        'Activa el plan Pro para guardar y sincronizar tus datos en la nube.'
      );
    }

    await this.kv.set(this.kvKey('mode'), mode);
    this.lastSyncError = null;
    await this.notifyStatus();

    if (mode === 'cloud' && this.transport) {
      try {
        await this.syncNow();
      } catch (error) {
        this.lastSyncError = getErrorMessage(error);
        await this.notifyStatus();
      }
    }

    return this.getStorageStatus();
  }

  /**
   * Ejecuta una ronda completa de sincronización, reutilizando cualquier ronda ya en curso.
   */
  async syncNow(): Promise<SyncReport> {
    if (this.inFlightSync) {
      return this.inFlightSync;
    }

    this.inFlightSync = this.executeSync();
    try {
      return await this.inFlightSync;
    } finally {
      this.inFlightSync = null;
    }
  }

  /**
   * Flujo de sincronización paso a paso:
   * 1. Verifica modo Nube + plan Pro y existencia de transporte.
   * 2. Valida entitlement real en servidor (si fue revocado, degrada a `free`/`local`).
   * 3. Recolecta registros locales `pending` y los envía junto al último `sinceCursor`.
   * 4. Marca la instantánea subida como `synced` (respetando versiones concurrentes).
   * 5. Aplica los cambios remotos entrantes usando `this.conflictStrategy` (Patrón Strategy).
   * 6. Actualiza el nuevo cursor monotónico y timestamp de última sincronización.
   */
  private async executeSync(): Promise<SyncReport> {
    const [mode, plan] = await Promise.all([this.readMode(), this.readPlan()]);
    if (mode !== 'cloud' || plan !== 'pro') {
      throw new CloudEntitlementError(
        'La sincronización en la nube solo está disponible en modo Nube con plan Pro.'
      );
    }

    if (!this.transport) {
      throw new CloudEntitlementError(
        'No hay un servidor de sincronización configurado para el modo Nube.'
      );
    }

    this.isSyncing = true;
    this.lastSyncError = null;
    await this.notifyStatus();

    try {
      const entitlement = await this.transport.checkEntitlement(this.appId, this.userId);
      if (!entitlement.cloudSyncAllowed) {
        await this.kv.set(this.kvKey('plan'), 'free');
        await this.kv.set(this.kvKey('mode'), 'local');
        throw new CloudEntitlementError(
          'Tu suscripción en el servidor no autoriza la sincronización en la nube.'
        );
      }

      const allLocal = await this.store.list<T>(this.entityName);
      const pendingRecords = allLocal.filter((entry) => entry.syncStatus === 'pending');

      const pushedSnapshot = pendingRecords.map((entry) => ({
        id: entry.entity.id,
        version: entry.entity.version
      }));

      const changes: SyncRecordEnvelope[] = pendingRecords.map((entry) => ({
        entity: this.entityName,
        recordId: entry.entity.id,
        payload: entry.entity as unknown as Record<string, unknown>,
        version: entry.entity.version,
        updatedAt: entry.entity.updatedAt,
        deletedAt: entry.entity.deletedAt
      }));

      const sinceCursor = await this.readCursor();
      const response = await this.transport.sync({
        appId: this.appId,
        userId: this.userId,
        deviceId: this.deviceId,
        sinceCursor,
        changes
      });

      await this.store.markSynced(this.entityName, pushedSnapshot);

      let pulledCount = 0;
      for (const remote of response.changes) {
        if (remote.entity !== this.entityName) continue;
        const local = await this.store.getById<T>(this.entityName, remote.recordId);
        const incomingEntity = remote.payload as unknown as T;

        if (
          this.conflictStrategy.shouldAcceptIncoming(incomingEntity, local?.entity, {
            acceptEqualVersion: false
          })
        ) {
          await this.store.upsert(this.entityName, incomingEntity, 'synced');
          pulledCount += 1;
        }
      }

      const syncedAt = new Date().toISOString();
      await this.kv.set(this.kvKey('cursor'), response.serverCursor);
      await this.kv.set(this.kvKey('lastSyncedAt'), syncedAt);

      return {
        pushed: pushedSnapshot.length,
        pulled: pulledCount,
        syncedAt,
        mode: 'cloud'
      };
    } catch (error) {
      this.lastSyncError = getErrorMessage(error);
      throw error;
    } finally {
      this.isSyncing = false;
      await this.notifyStatus();
    }
  }
}
