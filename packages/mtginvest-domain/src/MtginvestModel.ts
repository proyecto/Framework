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

const SEED_CARDS: CreateCardInput[] = [
  {
    title: 'Ángel de Serra',
    nameEn: 'Serra Angel',
    edition: 'Unlimited Edition',
    editionCode: '2ed',
    previousPrice: 29.79,
    currentPrice: 72.22,
    condition: 'PL'
  },
  {
    title: 'Demonic Tutor',
    nameEn: 'Demonic Tutor',
    edition: 'Revised Edition',
    editionCode: '3ed',
    previousPrice: 37.79,
    currentPrice: 38.16,
    condition: 'EX'
  },
  {
    title: 'Relámpago',
    nameEn: 'Lightning Bolt',
    edition: 'Unlimited Edition',
    editionCode: '2ed',
    previousPrice: 41.79,
    currentPrice: 21.76,
    condition: 'LP'
  },
  {
    title: 'Cavar túneles',
    nameEn: 'Burrowing',
    edition: 'Unlimited Edition',
    editionCode: '2ed',
    previousPrice: 3.79,
    currentPrice: 1.42,
    condition: 'LP'
  },
  {
    title: 'Dragón shivano',
    nameEn: 'Shivan Dragon',
    edition: 'Revised Edition',
    editionCode: '3ed',
    previousPrice: 13.79,
    currentPrice: 9.74,
    condition: 'LP'
  },
  {
    title: 'Ira de Dios',
    nameEn: 'Wrath of God',
    edition: 'Revised Edition',
    editionCode: '3ed',
    previousPrice: 16.79,
    currentPrice: 7.85,
    condition: 'NM'
  },
  {
    title: 'Black Lotus',
    nameEn: 'Black Lotus',
    edition: 'Unlimited Edition',
    editionCode: '2ed',
    previousPrice: 11200.0,
    currentPrice: 12450.0,
    condition: 'EX'
  }
];

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
  private seededOnce = false;

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
    let items = await this.repository.list();

    if (!this.seededOnce) {
      this.seededOnce = true;
      const history = await this.repository.list({ includeDeleted: true });
      if (history.length === 0) {
        for (const seed of SEED_CARDS) {
          const now = new Date().toISOString();
          await this.repository.save({
            id: generateId(),
            title: seed.title,
            nameEn: seed.nameEn,
            edition: seed.edition ?? 'Desconocida',
            editionCode: seed.editionCode,
            currentPrice: seed.currentPrice ?? 0,
            previousPrice: seed.previousPrice ?? seed.currentPrice ?? 0,
            condition: seed.condition ?? 'NM',
            isFavorite: false,
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
    return this.getSnapshot();
  }

  async createItem(input: CreateCardInput): Promise<CardEntity> {
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError('El nombre de la carta no puede estar vacío.');
    }
    const currentPrice = Number(input.currentPrice ?? 0);
    const previousPrice = Number(input.previousPrice ?? currentPrice);
    const now = new Date().toISOString();

    const created = await this.repository.save({
      id: generateId(),
      title,
      nameEn: input.nameEn?.trim(),
      edition: input.edition?.trim() || 'General',
      editionCode: input.editionCode?.trim(),
      currentPrice,
      previousPrice,
      condition: input.condition ?? 'NM',
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });
    await this.loadItems();
    return created;
  }

  async updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<CardEntity> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('La carta seleccionada ya no existe.');
    }
    const nextCurrent = Number(currentPrice);
    const nextPrev = previousPrice !== undefined ? Number(previousPrice) : current.currentPrice;

    const saved = await this.repository.save({
      ...current,
      currentPrice: nextCurrent,
      previousPrice: nextPrev,
      updatedAt: new Date().toISOString()
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
}
