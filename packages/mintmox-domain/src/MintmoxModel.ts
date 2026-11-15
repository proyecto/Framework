import {
  ValidationError,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncReport,
  type UserPlan
} from '@framework/core';
import {
  getCardCollections,
  type CardmarketSyncResult,
  type CreateCardInput,
  type CardEntity,
  type CardMarketPrices,
  type CardPricePoint,
  type IMintmoxModel,
  type IMtginvestModel,
  type ImportCardsOptions,
  type ImportCardsResult
} from './contracts.js';
import type { IScryfallApiClient } from './scryfall.js';
import { SEED_CARDS } from './seeds.js';
import { SEED_PRICE_HISTORIES } from './priceHistory.js';
import { exportCardsToCsv, exportCardsToJson } from './importExport.js';

function generateId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Modelo MVC de MintMox. */
export class MintmoxModel implements IMintmoxModel {
  private items: CardEntity[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly unsubRepo: () => void;
  private seededOnce = false;

  constructor(private readonly repository: ISyncableRepository<CardEntity>) {
    this.unsubRepo = this.repository.subscribeStatus(() => {
      this.notify();
    });
  }

  dispose(): void {
    this.unsubRepo();
    this.listeners.clear();
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
        for (let idx = 0; idx < SEED_CARDS.length; idx++) {
          const seed = SEED_CARDS[idx]!;
          const seedId = `CARD-${String(idx + 1).padStart(5, '0')}`;
          const now = new Date().toISOString();
          const curPrice = seed.currentPrice ?? 0;
          const prevPrice = seed.previousPrice ?? seed.currentPrice ?? 0;
          const seedMarketPrices: CardMarketPrices = seed.marketPrices ?? {
            cardmarket: curPrice,
            tcgplayer: Number((curPrice * 1.08).toFixed(2)),
            cardKingdom: Number((curPrice * 1.18).toFixed(2)),
            manapool: Number((curPrice * 1.07).toFixed(2))
          };
          await this.repository.save({
            id: generateId(),
            title: seed.title,
            nameEn: seed.nameEn,
            edition: seed.edition ?? 'Desconocida',
            editionCode: seed.editionCode,
            language: seed.language ?? 'EN',
            quantity: Math.max(1, Number(seed.quantity ?? 1)),
            currentPrice: curPrice,
            previousPrice: prevPrice,
            marketPrices: seedMarketPrices,
            condition: seed.condition ?? 'NM',
            isFavorite: false,
            priceHistory: SEED_PRICE_HISTORIES[seedId] ?? [],
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            version: 1
          });
        }
        items = await this.repository.list();
      }
    }

    // Enriquecimiento suave para que cualquier inventario existente disponga de las 4 tiendas
    let didMigrate = false;
    for (const item of items) {
      const mp = item.marketPrices ?? {};
      const needsUpdate =
        !item.marketPrices ||
        mp.cardKingdom === undefined ||
        mp.manapool === undefined ||
        mp.tcgplayer === undefined;

      if (needsUpdate && item.currentPrice > 0) {
        const baseEur = mp.cardmarket ?? item.currentPrice;
        const baseUsd = mp.tcgplayer ?? Number((baseEur * 1.08).toFixed(2));
        const updatedMp: CardMarketPrices = {
          cardmarket: baseEur,
          tcgplayer: baseUsd,
          cardKingdom: mp.cardKingdom ?? Number((baseUsd * 1.10).toFixed(2)),
          manapool: mp.manapool ?? Number((baseUsd * 0.99).toFixed(2))
        };
        await this.repository.save({
          ...item,
          marketPrices: updatedMp
        });
        didMigrate = true;
      }
    }
    if (didMigrate) {
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
    for (let idx = 0; idx < SEED_CARDS.length; idx++) {
      const seed = SEED_CARDS[idx]!;
      const seedId = `CARD-${String(idx + 1).padStart(5, '0')}`;
      const now = new Date().toISOString();
      const curPrice = seed.currentPrice ?? 0;
      const prevPrice = seed.previousPrice ?? seed.currentPrice ?? 0;
      const seedMarketPrices: CardMarketPrices = seed.marketPrices ?? {
        cardmarket: curPrice,
        tcgplayer: Number((curPrice * 1.08).toFixed(2)),
        cardKingdom: Number((curPrice * 1.18).toFixed(2)),
        manapool: Number((curPrice * 1.07).toFixed(2))
      };
      await this.repository.save({
        id: generateId(),
        title: seed.title,
        nameEn: seed.nameEn,
        edition: seed.edition ?? 'Desconocida',
        editionCode: seed.editionCode,
        language: seed.language ?? 'EN',
        quantity: Math.max(1, Number(seed.quantity ?? 1)),
        currentPrice: curPrice,
        previousPrice: prevPrice,
        marketPrices: seedMarketPrices,
        condition: seed.condition ?? 'NM',
        isFavorite: false,
        priceHistory: SEED_PRICE_HISTORIES[seedId] ?? [],
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

  async clearInventory(): Promise<CardEntity[]> {
    const all = await this.repository.list({ includeDeleted: true });
    for (const card of all) {
      await this.repository.remove(card.id);
    }
    this.items = [];
    this.notify();
    return [];
  }

  async importCards(
    cards: CreateCardInput[],
    options: ImportCardsOptions = {}
  ): Promise<ImportCardsResult> {
    if (!cards || cards.length === 0) {
      throw new ValidationError('No se proporcionaron cartas válidas para importar.');
    }

    const replace = Boolean(options.replace);

    if (replace) {
      const existing = await this.repository.list();
      for (const card of existing) {
        await this.repository.remove(card.id);
      }
    }

    let count = 0;
    for (const cardInput of cards) {
      const title = cardInput.title?.trim();
      if (!title) continue;
      const currentPrice = Number(cardInput.currentPrice ?? 0);
      const previousPrice = Number(cardInput.previousPrice ?? currentPrice);
      const buyPrice =
        cardInput.buyPrice !== undefined ? Number(cardInput.buyPrice) : previousPrice;
      const isFoil = Boolean(cardInput.isFoil);
      const isAltered = Boolean(cardInput.isAltered);
      const isSigned = Boolean(cardInput.isSigned);
      const quantity = Math.max(1, Number(cardInput.quantity ?? 1));
      const language = cardInput.language?.trim().toUpperCase() || 'EN';
      const now = new Date().toISOString();

      await this.repository.save({
        id: generateId(),
        title,
        nameEn: cardInput.nameEn?.trim(),
        edition: cardInput.edition?.trim() || 'General',
        editionCode: cardInput.editionCode?.trim(),
        language,
        quantity,
        currentPrice,
        previousPrice,
        buyPrice,
        isFoil,
        isAltered,
        isSigned,
        condition: cardInput.condition ?? 'NM',
        imageUrl: cardInput.imageUrl?.trim() || undefined,
        scryfallId: cardInput.scryfallId?.trim() || undefined,
        collection: getCardCollections(cardInput).join(', '),
        collections: getCardCollections(cardInput),
        lastPriceSyncDate: cardInput.lastPriceSyncDate?.trim() || undefined,
        priceHistory: cardInput.priceHistory ?? [],
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        version: 1
      });
      count++;
    }

    await this.loadItems();
    return {
      importedCount: count,
      replaced: replace
    };
  }

  exportToJson(): string {
    return exportCardsToJson(this.items);
  }

  exportToCsv(): string {
    return exportCardsToCsv(this.items);
  }

  async createItem(input: CreateCardInput): Promise<CardEntity> {
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError('El nombre de la carta no puede estar vacío.');
    }
    const currentPrice = Number(input.currentPrice ?? 0);
    const previousPrice = Number(input.previousPrice ?? currentPrice);
    const buyPrice = input.buyPrice !== undefined ? Number(input.buyPrice) : previousPrice;
    const isFoil = Boolean(input.isFoil);
    const isAltered = Boolean(input.isAltered);
    const isSigned = Boolean(input.isSigned);
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
      buyPrice,
      marketPrices: input.marketPrices ? { ...input.marketPrices } : undefined,
      isFoil,
      isAltered,
      isSigned,
      condition: input.condition ?? 'NM',
      imageUrl: input.imageUrl?.trim() || undefined,
      scryfallId: input.scryfallId?.trim() || undefined,
      collection: getCardCollections(input).join(', '),
      collections: getCardCollections(input),
      lastPriceSyncDate: input.lastPriceSyncDate?.trim() || undefined,
      priceHistory: input.priceHistory ?? [],
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
        | 'title'
        | 'nameEn'
        | 'edition'
        | 'editionCode'
        | 'language'
        | 'quantity'
        | 'currentPrice'
        | 'previousPrice'
        | 'buyPrice'
        | 'marketPrices'
        | 'isFoil'
        | 'isAltered'
        | 'isSigned'
        | 'condition'
        | 'imageUrl'
        | 'scryfallId'
        | 'collection'
        | 'collections'
        | 'priceHistory'
        | 'lastPriceSyncDate'
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

    let nextCollections: string[] = current.collections && current.collections.length > 0
      ? current.collections
      : getCardCollections(current);
    if (patch.collections !== undefined) {
      nextCollections = getCardCollections({ collections: patch.collections });
    } else if (patch.collection !== undefined) {
      nextCollections = getCardCollections({ collection: patch.collection });
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
      buyPrice: patch.buyPrice !== undefined ? Number(patch.buyPrice) : current.buyPrice,
      marketPrices: patch.marketPrices !== undefined ? patch.marketPrices : current.marketPrices,
      isFoil: patch.isFoil !== undefined ? Boolean(patch.isFoil) : current.isFoil,
      isAltered: patch.isAltered !== undefined ? Boolean(patch.isAltered) : current.isAltered,
      isSigned: patch.isSigned !== undefined ? Boolean(patch.isSigned) : current.isSigned,
      condition: patch.condition !== undefined ? patch.condition : current.condition,
      imageUrl: patch.imageUrl !== undefined ? (patch.imageUrl?.trim() || undefined) : current.imageUrl,
      scryfallId: patch.scryfallId !== undefined ? (patch.scryfallId.trim() || undefined) : current.scryfallId,
      collection: nextCollections.join(', '),
      collections: nextCollections,
      priceHistory: patch.priceHistory !== undefined ? patch.priceHistory : current.priceHistory,
      lastPriceSyncDate: patch.lastPriceSyncDate !== undefined ? patch.lastPriceSyncDate : current.lastPriceSyncDate,
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

  /**
   * Sincroniza en lote todas las cotizaciones de Cardmarket mediante Scryfall (POST /cards/collection).
   * Respeta los límites de la API (1 lote de hasta 75 cartas y máximo 1 ejecución diaria salvo que se fuerce).
   */
  async syncCardmarketPrices(
    scryfallClient: IScryfallApiClient,
    options?: { force?: boolean }
  ): Promise<CardmarketSyncResult> {
    const todayStr = new Date().toISOString().slice(0, 10);

    if (this.items.length === 0) {
      return {
        alreadyUpToDate: true,
        updatedCount: 0,
        totalCards: 0,
        syncDate: todayStr
      };
    }

    // Si no se fuerza, y ya se han sincronizado hoy todas las cartas existentes Y todas tienen imagen, evitamos llamadas innecesarias
    const allHaveImages = this.items.length > 0 && this.items.every((c) => Boolean(c.imageUrl));
    const allSyncedToday = this.items.length > 0 && this.items.every((c) => c.lastPriceSyncDate === todayStr);

    if (!options?.force && allHaveImages && allSyncedToday) {
      return {
        alreadyUpToDate: true,
        updatedCount: 0,
        totalCards: this.items.length,
        syncDate: todayStr
      };
    }

    // Construcción de identificadores para el endpoint por lotes de Scryfall
    const identifiers = this.items.map((card) => {
      if (card.scryfallId) {
        return { id: card.scryfallId };
      }
      const set = card.editionCode?.trim().toLowerCase();
      const name = card.nameEn?.trim() || card.title.trim();
      return set ? { name, set } : { name };
    });

    const collectionResult = await scryfallClient.getCardsCollection(identifiers);
    let updatedCount = 0;

    for (const item of this.items) {
      // Búsqueda de coincidencia entre las cartas devueltas por Scryfall
      const cardData = collectionResult.data.find((sf) => {
        if (item.scryfallId && sf.id === item.scryfallId) return true;
        const sfName = sf.name.toLowerCase();
        const matchesName =
          (item.nameEn && sfName === item.nameEn.toLowerCase()) ||
          sfName === item.title.toLowerCase();
        if (!matchesName) return false;
        if (item.editionCode && sf.set) {
          return sf.set.toLowerCase() === item.editionCode.toLowerCase();
        }
        return true;
      });

      if (!cardData) {
        // Si no se encontró por set exacto en el lote, pero no tiene imagen, intentamos resolverla con el resolver flexible
        let fallbackImageUrl = item.imageUrl;
        if (!fallbackImageUrl) {
          try {
            fallbackImageUrl = (await scryfallClient.resolveCardImageUrl(item)) ?? undefined;
          } catch {}
        }
        await this.repository.save({
          ...item,
          imageUrl: fallbackImageUrl,
          lastPriceSyncDate: todayStr,
          updatedAt: new Date().toISOString()
        });
        continue;
      }

      // El precio en euros de Scryfall proviene directamente de Cardmarket (eur = normal, eurFoil = foil)
      const eurPriceStr = item.isFoil
        ? (cardData.prices?.eurFoil ?? cardData.prices?.eur)
        : (cardData.prices?.eur ?? cardData.prices?.eurFoil);
      const eurPrice = eurPriceStr ? parseFloat(eurPriceStr) : null;
      const isValidPrice = typeof eurPrice === 'number' && !isNaN(eurPrice) && eurPrice > 0;

      // El precio en dólares de Scryfall proviene directamente de TCGplayer (usd = normal, usdFoil = foil)
      const usdPriceStr = item.isFoil
        ? (cardData.prices?.usdFoil ?? cardData.prices?.usd)
        : (cardData.prices?.usd ?? cardData.prices?.usdFoil);
      const usdPrice = usdPriceStr ? parseFloat(usdPriceStr) : null;
      const isValidUsd = typeof usdPrice === 'number' && !isNaN(usdPrice) && usdPrice > 0;

      const currentPrice = isValidPrice ? eurPrice : item.currentPrice;
      const previousPrice =
        isValidPrice && eurPrice !== item.currentPrice ? item.currentPrice : item.previousPrice;

      // Actualización de cotizaciones por tienda
      const marketPrices: CardMarketPrices = { ...(item.marketPrices ?? {}) };
      if (isValidPrice) marketPrices.cardmarket = eurPrice;
      if (isValidUsd) marketPrices.tcgplayer = usdPrice;

      // Preservamos o calculamos las cotizaciones de Card Kingdom y ManaPool
      // (si el usuario las importó desde su Excel, se conservan intactas)
      if (marketPrices.cardKingdom === undefined) {
        if (isValidUsd) {
          marketPrices.cardKingdom = Number((usdPrice * 1.10).toFixed(2));
        } else if (isValidPrice) {
          marketPrices.cardKingdom = Number((eurPrice * 1.18).toFixed(2));
        }
      }
      if (marketPrices.manapool === undefined) {
        if (isValidUsd) {
          marketPrices.manapool = Number((usdPrice * 0.99).toFixed(2));
        } else if (isValidPrice) {
          marketPrices.manapool = Number((eurPrice * 1.07).toFixed(2));
        }
      }

      // Actualización del histórico diario multitienda para la gráfica temporal
      const priceHistory = [...(item.priceHistory ?? [])];
      if (isValidPrice || isValidUsd || marketPrices.cardKingdom || marketPrices.manapool) {
        const todayIdx = priceHistory.findIndex((p) => p.date === todayStr);
        const pointData: CardPricePoint = {
          date: todayStr,
          price: currentPrice,
          cardmarket: marketPrices.cardmarket,
          tcgplayer: marketPrices.tcgplayer,
          cardKingdom: marketPrices.cardKingdom,
          manapool: marketPrices.manapool
        };
        if (todayIdx >= 0) {
          priceHistory[todayIdx] = pointData;
        } else {
          priceHistory.push(pointData);
        }
      }

      const imageUrl =
        item.imageUrl ??
        cardData.imageUris?.small ??
        cardData.imageUris?.normal ??
        cardData.imageUris?.large ??
        cardData.cardFaces?.[0]?.imageUris?.small ??
        cardData.cardFaces?.[0]?.imageUris?.normal;

      const scryfallId = item.scryfallId ?? cardData.id;

      await this.repository.save({
        ...item,
        currentPrice,
        previousPrice,
        marketPrices,
        priceHistory,
        imageUrl,
        scryfallId,
        lastPriceSyncDate: todayStr,
        updatedAt: new Date().toISOString()
      });

      if (isValidPrice) {
        updatedCount++;
      }
    }

    await this.loadItems();
    return {
      alreadyUpToDate: false,
      updatedCount,
      totalCards: this.items.length,
      syncDate: todayStr
    };
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

export { MintmoxModel as MtginvestModel };
