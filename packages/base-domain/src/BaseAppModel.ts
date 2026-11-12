import {
  ObservableModel,
  ValidationError,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncReport,
  type UserPlan
} from '@framework/core';
import type {
  BaseWorkspaceItem,
  CreateBaseItemInput,
  IBaseAppModel
} from './contracts.js';

const DEFAULT_SEED_ITEMS: CreateBaseItemInput[] = [
  {
    title: 'Elemento Base 01',
    description: 'Plantilla estándar dentro de los límites visuales del framework.',
    level: 65
  },
  {
    title: 'Elemento Base 02',
    description: 'Ejemplo secundario para comprobar filtros, selección y estado activo.',
    level: 35
  }
];

/** Restringe valores de slider al rango porcentual entero `[0, 100]`. */
function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Genera IDs portables sin acoplar el dominio a Node.js ni al DOM del navegador. */
function createPortableId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return `base_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Implementación del **Modelo (M)** de la App Base (`IBaseAppModel`).
 *
 * Patrones aplicados:
 * - **Observer (`ObservableModel`)**: Hereda suscripción y limpieza automática del repositorio.
 * - **Repository (`ISyncableRepository`)**: Totalmente agnóstico de `expo-sqlite`, `localStorage` o Turso.
 */
export class BaseAppModel extends ObservableModel implements IBaseAppModel {
  private items: BaseWorkspaceItem[] = [];
  private seededOnce = false;

  constructor(private readonly repository: ISyncableRepository<BaseWorkspaceItem>) {
    super();
    this.registerCleanup(
      this.repository.subscribeStatus(() => {
        this.notify();
      })
    );
  }

  getItemsSnapshot(): BaseWorkspaceItem[] {
    return [...this.items];
  }

  /** Carga elementos activos; si la base jamás tuvo registros ni tombstones, siembra los ejemplos iniciales. */
  async loadItems(): Promise<BaseWorkspaceItem[]> {
    let items = await this.repository.list();

    if (!this.seededOnce) {
      const history = await this.repository.list({ includeDeleted: true });
      this.seededOnce = true;
      if (history.length === 0) {
        for (let i = 0; i < DEFAULT_SEED_ITEMS.length; i += 1) {
          const seed = DEFAULT_SEED_ITEMS[i]!;
          const now = new Date().toISOString();
          await this.repository.save({
            id: createPortableId(),
            title: seed.title,
            description: seed.description ?? '',
            level: clampPercent(seed.level ?? 50),
            enabled: i === 0,
            isPrimary: i === 0,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            version: 1
          });
        }
        items = await this.repository.list();
      }
    }

    this.items = items;
    this.notify();
    return this.getItemsSnapshot();
  }

  async createItem(input: CreateBaseItemInput): Promise<BaseWorkspaceItem> {
    const cleanTitle = input.title.trim();
    if (!cleanTitle) {
      throw new ValidationError('El título no puede estar vacío.');
    }

    const now = new Date().toISOString();
    const created = await this.repository.save({
      id: createPortableId(),
      title: cleanTitle,
      description: (input.description ?? '').trim(),
      level: clampPercent(input.level ?? 50),
      enabled: true,
      isPrimary: this.items.length === 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });

    await this.loadItems();
    return created;
  }

  async updateItem(
    id: string,
    patch: Partial<
      Pick<BaseWorkspaceItem, 'title' | 'description' | 'level' | 'enabled' | 'isPrimary'>
    >
  ): Promise<BaseWorkspaceItem> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('El elemento seleccionado ya no existe.');
    }

    const nextTitle = patch.title !== undefined ? patch.title.trim() : current.title;
    if (!nextTitle) {
      throw new ValidationError('El título no puede quedar vacío.');
    }

    const saved = await this.repository.save({
      ...current,
      title: nextTitle,
      description: patch.description !== undefined ? patch.description.trim() : current.description,
      level: patch.level !== undefined ? clampPercent(patch.level) : current.level,
      enabled: patch.enabled ?? current.enabled,
      isPrimary: patch.isPrimary ?? current.isPrimary
    });

    // Invariante de dominio: solo puede existir un elemento principal activo simultáneamente.
    if (patch.isPrimary === true) {
      const others = (await this.repository.list()).filter((item) => item.id !== id && item.isPrimary);
      for (const other of others) {
        await this.repository.save({ ...other, isPrimary: false });
      }
    }

    await this.loadItems();
    return saved;
  }

  async deleteItem(id: string): Promise<void> {
    await this.repository.remove(id);
    await this.loadItems();
  }

  async getStorageStatus(): Promise<StorageStatus> {
    return this.repository.getStorageStatus();
  }

  async setPlan(plan: UserPlan): Promise<StorageStatus> {
    const status = await this.repository.setPlan(plan);
    this.notify();
    return status;
  }

  async setStorageMode(mode: StorageMode): Promise<StorageStatus> {
    const status = await this.repository.setStorageMode(mode);
    await this.loadItems();
    return status;
  }

  async syncNow(): Promise<SyncReport> {
    const report = await this.repository.syncNow();
    await this.loadItems();
    return report;
  }
}
