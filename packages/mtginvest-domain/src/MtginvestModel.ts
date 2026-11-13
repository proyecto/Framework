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
import { SEED_CARDS } from './seeds.js';

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
            language: seed.language ?? 'EN',
            quantity: Math.max(1, Number(seed.quantity ?? 1)),
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
      } else {
        // Si ya existían datos de una versión previa (ej. solo las 7 cartas de prueba),
        // completamos automáticamente el inventario con todas las cartas faltantes de las semillas.
        for (const seed of SEED_CARDS) {
          const alreadyExists = history.some(
            (c) =>
              c.title.trim().toLowerCase() === seed.title.trim().toLowerCase() &&
              (c.editionCode?.trim().toLowerCase() === seed.editionCode?.trim().toLowerCase() ||
                c.edition.trim().toLowerCase() === (seed.edition ?? '').trim().toLowerCase())
          );
          if (!alreadyExists) {
            const now = new Date().toISOString();
            await this.repository.save({
              id: generateId(),
              title: seed.title,
              nameEn: seed.nameEn,
              edition: seed.edition ?? 'Desconocida',
              editionCode: seed.editionCode,
              language: seed.language ?? 'EN',
              quantity: Math.max(1, Number(seed.quantity ?? 1)),
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
        }
        // Aseguramos que las cartas existentes tengan cantidad e idioma definidos
        for (const item of history) {
          const matchingSeed = SEED_CARDS.find(
            (s) => s.title.trim().toLowerCase() === item.title.trim().toLowerCase()
          );
          const needsQty = item.quantity === undefined || isNaN(item.quantity) || item.quantity < 1;
          const needsLang = !item.language;
          if (needsQty || needsLang) {
            await this.repository.save({
              ...item,
              quantity: needsQty ? (matchingSeed?.quantity ?? 1) : item.quantity,
              language: needsLang ? (matchingSeed?.language ?? 'EN') : item.language,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      items = await this.repository.list();
    }

    this.items = items;
    this.notify();
    return this.getSnapshot();
  }

  async resetToSeed(): Promise<CardEntity[]> {
    const all = await this.repository.list({ includeDeleted: true });
    for (const card of all) {
      await this.repository.remove(card.id);
    }
    for (const seed of SEED_CARDS) {
      const now = new Date().toISOString();
      await this.repository.save({
        id: generateId(),
        title: seed.title,
        nameEn: seed.nameEn,
        edition: seed.edition ?? 'Desconocida',
        editionCode: seed.editionCode,
        language: seed.language ?? 'EN',
        quantity: Math.max(1, Number(seed.quantity ?? 1)),
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
    this.seededOnce = true;
    const items = await this.repository.list();
    this.items = items;
    this.notify();
    return this.getSnapshot();
  }

  async importMissingSeeds(): Promise<CardEntity[]> {
    const history = await this.repository.list({ includeDeleted: true });
    for (const seed of SEED_CARDS) {
      const alreadyExists = history.some(
        (c) =>
          c.title.trim().toLowerCase() === seed.title.trim().toLowerCase() &&
          (c.editionCode?.trim().toLowerCase() === seed.editionCode?.trim().toLowerCase() ||
            c.edition.trim().toLowerCase() === (seed.edition ?? '').trim().toLowerCase())
      );
      if (!alreadyExists) {
        const now = new Date().toISOString();
        await this.repository.save({
          id: generateId(),
          title: seed.title,
          nameEn: seed.nameEn,
          edition: seed.edition ?? 'Desconocida',
          editionCode: seed.editionCode,
          language: seed.language ?? 'EN',
          quantity: Math.max(1, Number(seed.quantity ?? 1)),
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
    }
    const items = await this.repository.list();
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
    const quantity = Math.max(1, Number(input.quantity ?? 1));
    const language = (input.language?.trim().toUpperCase()) || 'EN';
    const now = new Date().toISOString();

    const created = await this.repository.save({
      id: generateId(),
      title,
      nameEn: input.nameEn?.trim(),
      edition: input.edition?.trim() || 'General',
      editionCode: input.editionCode?.trim(),
      language,
      quantity,
      currentPrice,
      previousPrice,
      condition: input.condition ?? 'NM',
      imageUrl: input.imageUrl?.trim() || undefined,
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });
    await this.loadItems();
    return created;
  }

  async updateCard(
    id: string,
    patch: Partial<
      Pick<
        CardEntity,
        'title' | 'nameEn' | 'edition' | 'editionCode' | 'language' | 'quantity' | 'currentPrice' | 'previousPrice' | 'condition' | 'imageUrl'
      >
    >
  ): Promise<CardEntity> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('La carta seleccionada ya no existe.');
    }

    const title = patch.title !== undefined ? patch.title.trim() : current.title;
    if (!title) {
      throw new ValidationError('El nombre de la carta no puede estar vacío.');
    }

    const updated: CardEntity = {
      ...current,
      title,
      nameEn: patch.nameEn !== undefined ? (patch.nameEn.trim() || undefined) : current.nameEn,
      edition: patch.edition !== undefined ? (patch.edition.trim() || current.edition) : current.edition,
      editionCode: patch.editionCode !== undefined ? (patch.editionCode.trim() || undefined) : current.editionCode,
      language: patch.language !== undefined ? (patch.language.trim().toUpperCase() || 'EN') : (current.language ?? 'EN'),
      quantity: patch.quantity !== undefined ? Math.max(1, Number(patch.quantity)) : current.quantity,
      currentPrice: patch.currentPrice !== undefined ? Number(patch.currentPrice) : current.currentPrice,
      previousPrice: patch.previousPrice !== undefined ? Number(patch.previousPrice) : current.previousPrice,
      condition: patch.condition !== undefined ? patch.condition : current.condition,
      imageUrl: patch.imageUrl !== undefined ? (patch.imageUrl?.trim() || undefined) : current.imageUrl,
      updatedAt: new Date().toISOString()
    };

    const saved = await this.repository.save(updated);
    await this.loadItems();
    return saved;
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
