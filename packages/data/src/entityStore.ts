import type { EntityBase, ISqlDriver, SyncStatus } from '@framework/core';
import { createMigrationInitializer } from './migrations.js';

/** Registro persistido localmente junto a su estado de cola de sincronización. */
export interface StoredEntityRecord<T extends EntityBase> {
  entity: T;
  syncStatus: SyncStatus;
}

/**
 * Contrato de bajo nivel (**Patrón Adapter / Storage Driver**) para almacenar entidades en el dispositivo.
 *
 * Implementaciones intercambiables:
 * - `SqlEntityStoreDriver`: SQLite en Android (`ExpoSqliteDriver`) o libSQL local (`LibSqlDriver`).
 * - `WebLocalStorageEntityStore`: caché local del navegador (`localStorage`).
 * - `InMemoryEntityStoreDriver`: doble de memoria para tests unitarios.
 */
export interface IEntityStoreDriver {
  ensureInitialized(): Promise<void>;
  list<T extends EntityBase>(entityName: string): Promise<StoredEntityRecord<T>[]>;
  getById<T extends EntityBase>(
    entityName: string,
    id: string
  ): Promise<StoredEntityRecord<T> | null>;
  upsert<T extends EntityBase>(
    entityName: string,
    entity: T,
    syncStatus: SyncStatus
  ): Promise<void>;
  markSynced(
    entityName: string,
    idsAndVersions: Array<{ id: string; version: number }>
  ): Promise<void>;
  countPending(entityName: string): Promise<number>;
}

interface SqlEntityRow {
  payload_json: string;
  sync_status: string;
}

/**
 * Adaptador SQL para entidades locales-first sobre cualquier `ISqlDriver`.
 * Guarda cada entidad como JSON + columnas indexadas (`version`, `updated_at`, `deleted_at`, `sync_status`)
 * evitando tener que migrar esquemas cada vez que se añade una nueva app simple.
 */
export class SqlEntityStoreDriver implements IEntityStoreDriver {
  private readonly initializeOnce: () => Promise<void>;

  constructor(private readonly driver: ISqlDriver) {
    this.initializeOnce = createMigrationInitializer(driver);
  }

  ensureInitialized(): Promise<void> {
    return this.initializeOnce();
  }

  async list<T extends EntityBase>(entityName: string): Promise<StoredEntityRecord<T>[]> {
    await this.ensureInitialized();
    const rows = await this.driver.query<SqlEntityRow>(
      `SELECT payload_json, sync_status
       FROM _fw_local_entities
       WHERE entity_name = ?
       ORDER BY updated_at DESC`,
      [entityName]
    );
    return rows.map((row) => ({
      entity: JSON.parse(row.payload_json) as T,
      syncStatus: row.sync_status === 'synced' ? 'synced' : 'pending'
    }));
  }

  async getById<T extends EntityBase>(
    entityName: string,
    id: string
  ): Promise<StoredEntityRecord<T> | null> {
    await this.ensureInitialized();
    const rows = await this.driver.query<SqlEntityRow>(
      `SELECT payload_json, sync_status
       FROM _fw_local_entities
       WHERE entity_name = ? AND record_id = ?
       LIMIT 1`,
      [entityName, id]
    );
    const row = rows[0];
    if (!row) return null;
    return {
      entity: JSON.parse(row.payload_json) as T,
      syncStatus: row.sync_status === 'synced' ? 'synced' : 'pending'
    };
  }

  async upsert<T extends EntityBase>(
    entityName: string,
    entity: T,
    syncStatus: SyncStatus
  ): Promise<void> {
    await this.ensureInitialized();
    await this.driver.execute(
      `INSERT INTO _fw_local_entities (
         entity_name, record_id, payload_json, version, updated_at, deleted_at, sync_status
       ) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(entity_name, record_id) DO UPDATE SET
         payload_json = excluded.payload_json,
         version = excluded.version,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at,
         sync_status = excluded.sync_status`,
      [
        entityName,
        entity.id,
        JSON.stringify(entity),
        entity.version,
        entity.updatedAt,
        entity.deletedAt,
        syncStatus
      ]
    );
  }

  /**
   * Marca como `synced` únicamente si la versión local sigue coincidiendo con la subida,
   * evitando borrar por error una edición más nueva ocurrida mientras viajaba la petición HTTP.
   */
  async markSynced(
    entityName: string,
    idsAndVersions: Array<{ id: string; version: number }>
  ): Promise<void> {
    await this.ensureInitialized();
    if (idsAndVersions.length === 0) return;

    await this.driver.transaction(async (tx) => {
      for (const item of idsAndVersions) {
        await tx.execute(
          `UPDATE _fw_local_entities
           SET sync_status = 'synced'
           WHERE entity_name = ? AND record_id = ? AND version = ?`,
          [entityName, item.id, item.version]
        );
      }
    });
  }

  async countPending(entityName: string): Promise<number> {
    await this.ensureInitialized();
    const rows = await this.driver.query<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM _fw_local_entities
       WHERE entity_name = ? AND sync_status = 'pending'`,
      [entityName]
    );
    return Number(rows[0]?.count ?? 0);
  }
}

/**
 * Adaptador en memoria RAM (con clonado defensivo mediante `structuredClone`)
 * para aislar pruebas unitarias sin tocar disco ni sistema de archivos.
 */
export class InMemoryEntityStoreDriver implements IEntityStoreDriver {
  private readonly tables = new Map<string, Map<string, StoredEntityRecord<EntityBase>>>();

  async ensureInitialized(): Promise<void> {}

  private getTable(entityName: string): Map<string, StoredEntityRecord<EntityBase>> {
    let table = this.tables.get(entityName);
    if (!table) {
      table = new Map();
      this.tables.set(entityName, table);
    }
    return table;
  }

  async list<T extends EntityBase>(entityName: string): Promise<StoredEntityRecord<T>[]> {
    const table = this.getTable(entityName);
    return Array.from(table.values())
      .map((entry) => ({
        entity: structuredClone(entry.entity) as T,
        syncStatus: entry.syncStatus
      }))
      .sort((a, b) => b.entity.updatedAt.localeCompare(a.entity.updatedAt));
  }

  async getById<T extends EntityBase>(
    entityName: string,
    id: string
  ): Promise<StoredEntityRecord<T> | null> {
    const found = this.getTable(entityName).get(id);
    if (!found) return null;
    return {
      entity: structuredClone(found.entity) as T,
      syncStatus: found.syncStatus
    };
  }

  async upsert<T extends EntityBase>(
    entityName: string,
    entity: T,
    syncStatus: SyncStatus
  ): Promise<void> {
    this.getTable(entityName).set(entity.id, {
      entity: structuredClone(entity),
      syncStatus
    });
  }

  async markSynced(
    entityName: string,
    idsAndVersions: Array<{ id: string; version: number }>
  ): Promise<void> {
    const table = this.getTable(entityName);
    for (const item of idsAndVersions) {
      const existing = table.get(item.id);
      if (existing && existing.entity.version === item.version) {
        existing.syncStatus = 'synced';
      }
    }
  }

  async countPending(entityName: string): Promise<number> {
    let count = 0;
    for (const entry of this.getTable(entityName).values()) {
      if (entry.syncStatus === 'pending') count += 1;
    }
    return count;
  }
}

/**
 * Adaptador para aplicaciones Web en modo local-only usando `globalThis.localStorage`.
 * Si el usuario no activa la nube Pro, sus datos jamás salen del navegador local.
 */
export class WebLocalStorageEntityStore implements IEntityStoreDriver {
  constructor(private readonly namespace = 'fw_entities') {}

  async ensureInitialized(): Promise<void> {}

  private storageKey(entityName: string): string {
    return `${this.namespace}:${entityName}`;
  }

  private readMap<T extends EntityBase>(
    entityName: string
  ): Record<string, StoredEntityRecord<T>> {
    if (typeof globalThis.localStorage === 'undefined') return {};
    try {
      const raw = globalThis.localStorage.getItem(this.storageKey(entityName));
      if (!raw) return {};
      return JSON.parse(raw) as Record<string, StoredEntityRecord<T>>;
    } catch {
      return {};
    }
  }

  private writeMap<T extends EntityBase>(
    entityName: string,
    map: Record<string, StoredEntityRecord<T>>
  ): void {
    if (typeof globalThis.localStorage === 'undefined') return;
    globalThis.localStorage.setItem(this.storageKey(entityName), JSON.stringify(map));
  }

  async list<T extends EntityBase>(entityName: string): Promise<StoredEntityRecord<T>[]> {
    const map = this.readMap<T>(entityName);
    return Object.values(map).sort((a, b) =>
      b.entity.updatedAt.localeCompare(a.entity.updatedAt)
    );
  }

  async getById<T extends EntityBase>(
    entityName: string,
    id: string
  ): Promise<StoredEntityRecord<T> | null> {
    const map = this.readMap<T>(entityName);
    return map[id] ?? null;
  }

  async upsert<T extends EntityBase>(
    entityName: string,
    entity: T,
    syncStatus: SyncStatus
  ): Promise<void> {
    const map = this.readMap<T>(entityName);
    map[entity.id] = { entity, syncStatus };
    this.writeMap(entityName, map);
  }

  async markSynced(
    entityName: string,
    idsAndVersions: Array<{ id: string; version: number }>
  ): Promise<void> {
    const map = this.readMap<EntityBase>(entityName);
    let dirty = false;
    for (const item of idsAndVersions) {
      const entry = map[item.id];
      if (entry && entry.entity.version === item.version) {
        entry.syncStatus = 'synced';
        dirty = true;
      }
    }
    if (dirty) {
      this.writeMap(entityName, map);
    }
  }

  async countPending(entityName: string): Promise<number> {
    const map = this.readMap<EntityBase>(entityName);
    return Object.values(map).filter((entry) => entry.syncStatus === 'pending').length;
  }
}
