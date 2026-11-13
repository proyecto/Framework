import {
  ValidationError,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncReport,
  type UserPlan
} from '@framework/core';
import type {
  CreateCardInput,
  CardEntity,
  IMtginvestModel
} from './contracts.js';

function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function generateId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Modelo MVC de MTGInvest. */
export class MtginvestModel implements IMtginvestModel {
  private items: CardEntity[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly unsubRepo: () => void;

  constructor(private readonly repository: ISyncableRepository<CardEntity>) {
    this.unsubRepo = this.repository.subscribeStatus(() => {
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

  getSnapshot(): CardEntity[] {
    return [...this.items];
  }

  async loadItems(): Promise<CardEntity[]> {
    this.items = await this.repository.list();
    this.notify();
    return this.getSnapshot();
  }

  async createItem(input: CreateCardInput): Promise<CardEntity> {
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError('El título no puede estar vacío.');
    }
    const now = new Date().toISOString();
    const created = await this.repository.save({
      id: generateId(),
      title,
      intensity: clampIntensity(input.intensity ?? 50),
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });
    await this.loadItems();
    return created;
  }

  async updateIntensity(id: string, intensity: number): Promise<CardEntity> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('El elemento seleccionado ya no existe.');
    }
    const saved = await this.repository.save({
      ...current,
      intensity: clampIntensity(intensity)
    });
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

  dispose(): void {
    this.unsubRepo();
    this.listeners.clear();
  }
}
