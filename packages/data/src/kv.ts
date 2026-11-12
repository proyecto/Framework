import type { IKeyValueStore, ISqlDriver } from '@framework/core';
import { FRAMEWORK_LOCAL_MIGRATIONS, MigrationRunner } from './migrations.js';

export class SqlKeyValueStore implements IKeyValueStore {
  private readyPromise: Promise<void> | null = null;

  constructor(private readonly driver: ISqlDriver) {}

  private ensureReady(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = new MigrationRunner(this.driver)
        .run(FRAMEWORK_LOCAL_MIGRATIONS)
        .then(() => undefined)
        .catch((err) => {
          this.readyPromise = null;
          throw err;
        });
    }
    return this.readyPromise;
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
      // Ignore storage quota errors in restricted browser contexts.
    }
  }

  async remove(key: string): Promise<void> {
    if (typeof globalThis.localStorage === 'undefined') return;
    try {
      globalThis.localStorage.removeItem(this.keyFor(key));
    } catch {
      // Ignore storage restrictions.
    }
  }
}
