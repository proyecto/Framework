import type { IKeyValueStore, ISqlDriver } from '@framework/core';
import { createMigrationInitializer } from './migrations.js';

/**
 * Adaptador **IKeyValueStore -> ISqlDriver** (Expo SQLite en Android o libSQL en Node).
 * Almacena configuraciones locales del repositorio (`mode`, `plan`, cursor de sync).
 */
export class SqlKeyValueStore implements IKeyValueStore {
  private readonly ensureReady: () => Promise<void>;

  constructor(private readonly driver: ISqlDriver) {
    this.ensureReady = createMigrationInitializer(driver);
  }

  async get(key: string): Promise<string | null> {
    await this.ensureReady();
    const rows = await this.driver.query<{ value: string }>(
      `SELECT value FROM _fw_kv WHERE key = ? LIMIT 1`,
      [key]
    );
    return rows[0]?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    await this.ensureReady();
    await this.driver.execute(
      `INSERT INTO _fw_kv (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, new Date().toISOString()]
    );
  }

  async remove(key: string): Promise<void> {
    await this.ensureReady();
    await this.driver.execute(`DELETE FROM _fw_kv WHERE key = ?`, [key]);
  }
}

/**
 * Adaptador **IKeyValueStore -> Memoria RAM**.
 * Diseñado para tests unitarios rápidos y entornos efímeros sin disco.
 */
export class MemoryKeyValueStore implements IKeyValueStore {
  private readonly store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Adaptador **IKeyValueStore -> Browser `localStorage`**.
 * Aísla prefijos por namespace para que varias aplicaciones web compartan dominio sin colisiones.
 */
export class WebStorageKeyValueStore implements IKeyValueStore {
  constructor(private readonly namespace = 'fw_kv') {}

  private keyFor(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get(key: string): Promise<string | null> {
    if (typeof globalThis.localStorage === 'undefined') return null;
    try {
      return globalThis.localStorage.getItem(this.keyFor(key));
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (typeof globalThis.localStorage === 'undefined') return;
    try {
      globalThis.localStorage.setItem(this.keyFor(key), value);
    } catch {
      // Ignora restricciones de cuota o navegación privada en navegadores restrictivos.
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof globalThis.localStorage === 'undefined') return;
    try {
      globalThis.localStorage.removeItem(this.keyFor(key));
    } catch {
      // Ignora errores de almacenamiento bloqueado por políticas del navegador.
    }
  }
}
