import {
  ValidationError,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncReport,
  type UserPlan
} from '@framework/core';
import type {
  CreatePresetInput,
  IPresetModel,
  PresetEntity,
  UpdatePresetInput
} from './contracts.js';

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function createUuidLike(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const DEFAULT_SEED_PRESETS: CreatePresetInput[] = [
  {
    name: 'Enfoque Profundo',
    notes: 'Lluvia suave y luz cálida para sesiones largas de código.',
    ambientLevel: 65,
    warmthLevel: 40,
    focusMinutes: 50
  },
  {
    name: 'Lectura Nocturna',
    notes: 'Ambiente mínimo con baja intensidad para lectura tranquila.',
    ambientLevel: 30,
    warmthLevel: 80,
    focusMinutes: 25
  }
];

export class PresetModel implements IPresetModel {
  private presets: PresetEntity[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly unsubRepoStatus: () => void;
  private seededOnce = false;

  constructor(private readonly repository: ISyncableRepository<PresetEntity>) {
    this.unsubRepoStatus = this.repository.subscribeStatus(() => {
      this.notify();
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getPresetsSnapshot(): PresetEntity[] {
    return [...this.presets];
  }

  async loadPresets(): Promise<PresetEntity[]> {
    let items = await this.repository.list();

    if (!this.seededOnce) {
      const allIncludingDeleted = await this.repository.list({ includeDeleted: true });
      this.seededOnce = true;
      if (allIncludingDeleted.length === 0) {
        for (let i = 0; i < DEFAULT_SEED_PRESETS.length; i += 1) {
          const seed = DEFAULT_SEED_PRESETS[i]!;
          const now = new Date().toISOString();
          await this.repository.save({
            id: createUuidLike(),
            name: seed.name,
            notes: seed.notes ?? '',
            ambientLevel: clampNumber(seed.ambientLevel ?? 50, 0, 100),
            warmthLevel: clampNumber(seed.warmthLevel ?? 50, 0, 100),
            focusMinutes: clampNumber(seed.focusMinutes ?? 25, 5, 120),
            isFavorite: i === 0,
            isActive: i === 0,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            version: 1
          });
        }
        items = await this.repository.list();
      }
    }

    this.presets = items;
    this.notify();
    return this.getPresetsSnapshot();
  }

  async createPreset(input: CreatePresetInput): Promise<PresetEntity> {
    const cleanName = input.name.trim();
    if (!cleanName) {
      throw new ValidationError('El nombre de la escena no puede estar vacío.');
    }

    const now = new Date().toISOString();
    const created = await this.repository.save({
      id: createUuidLike(),
      name: cleanName,
      notes: (input.notes ?? '').trim(),
      ambientLevel: clampNumber(input.ambientLevel ?? 60, 0, 100),
      warmthLevel: clampNumber(input.warmthLevel ?? 50, 0, 100),
      focusMinutes: clampNumber(input.focusMinutes ?? 30, 5, 120),
      isFavorite: false,
      isActive: this.presets.length === 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });

    await this.loadPresets();
    return created;
  }

  async updatePreset(id: string, patch: UpdatePresetInput): Promise<PresetEntity> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('La escena seleccionada ya no existe.');
    }

    const nextName = patch.name !== undefined ? patch.name.trim() : current.name;
    if (!nextName) {
      throw new ValidationError('El nombre de la escena no puede quedar vacío.');
    }

    const updated: PresetEntity = {
      ...current,
      name: nextName,
      notes: patch.notes !== undefined ? patch.notes.trim() : current.notes,
      ambientLevel:
        patch.ambientLevel !== undefined
          ? clampNumber(patch.ambientLevel, 0, 100)
          : current.ambientLevel,
      warmthLevel:
        patch.warmthLevel !== undefined
          ? clampNumber(patch.warmthLevel, 0, 100)
          : current.warmthLevel,
      focusMinutes:
        patch.focusMinutes !== undefined
          ? clampNumber(patch.focusMinutes, 5, 120)
          : current.focusMinutes,
      isFavorite: patch.isFavorite ?? current.isFavorite,
      isActive: patch.isActive ?? current.isActive
    };

    const saved = await this.repository.save(updated);

    if (patch.isActive === true) {
      const others = (await this.repository.list()).filter(
        (item) => item.id !== id && item.isActive
      );
      for (const other of others) {
        await this.repository.save({ ...other, isActive: false });
      }
    }

    await this.loadPresets();
    return saved;
  }

  async deletePreset(id: string): Promise<void> {
    await this.repository.remove(id);
    await this.loadPresets();
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
    await this.loadPresets();
    return status;
  }

  async syncNow(): Promise<SyncReport> {
    const report = await this.repository.syncNow();
    await this.loadPresets();
    return report;
  }

  dispose(): void {
    this.unsubRepoStatus();
    this.listeners.clear();
  }
}
