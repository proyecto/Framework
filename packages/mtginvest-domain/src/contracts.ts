import type {
  EntityBase,
  IController,
  IModel,
  RegisteredAppModule,
  StorageMode,
  StorageStatus,
  SyncReport,
  UserPlan,
  ViewEvent
} from '@framework/core';
import type { IScryfallApiClient } from './scryfall.js';

export const APP_ID = 'mtginvest';
export const ENTITY_NAME = 'cards';
export const DEFAULT_COLLECTION = 'Principal';

export type CardTrend = 'up' | 'down' | 'flat';

/** Punto histórico de cotización de una carta. */
export interface CardPricePoint {
  date: string;  // Formato 'YYYY-MM-DD'
  price: number; // Cotización unitaria en €
}

/** Entidad de carta de MTG con seguimiento de inversión y cotización. */
export interface CardEntity extends EntityBase {
  title: string;              // Nombre en castellano o principal (ej. "Ángel de Serra")
  nameEn?: string;            // Nombre original en inglés (ej. "Serra Angel")
  edition: string;            // Nombre de la edición (ej. "Unlimited Edition")
  editionCode?: string;       // Código del set (ej. "2ED", "3ED")
  language?: string;          // Idioma de la carta (ej. "EN", "ES", "IT", "FR")
  quantity: number;           // Cantidad de cartas que se poseen (ej. 1, 4)
  currentPrice: number;       // Último valor de mercado registrado (€)
  previousPrice: number;      // Valor anterior de referencia o última cotización (€)
  buyPrice?: number;          // Precio de compra unitario original / Coste de adquisición (€)
  isFoil?: boolean;           // Versión foil / brillante (Scryfall consulta eur_foil)
  isAltered?: boolean;        // Carta alterada artísticamente (full art, bordes extendidos, pintura)
  isSigned?: boolean;         // Carta firmada (por artista o jugador)
  condition?: string;         // Estado (NM, LP, EX, PL, PO)
  isFavorite: boolean;
  imageUrl?: string;          // URL del arte/carta resuelta desde Scryfall
  scryfallId?: string;        // UUID canónico en Scryfall para optimizar consultas directas
  collection?: string;        // Colección principal o concatenada (ej. "Principal", "Trade Binder")
  collections?: string[];     // Lista de todas las colecciones a las que pertenece la carta
  priceHistory?: CardPricePoint[]; // Historial de cotizaciones temporales
  lastPriceSyncDate?: string; // Fecha 'YYYY-MM-DD' de la última actualización exitosa desde Cardmarket
}

export interface CreateCardInput {
  title: string;
  nameEn?: string;
  edition?: string;
  editionCode?: string;
  language?: string;
  quantity?: number;
  currentPrice?: number;
  previousPrice?: number;
  buyPrice?: number;
  isFoil?: boolean;
  isAltered?: boolean;
  isSigned?: boolean;
  condition?: string;
  imageUrl?: string;
  scryfallId?: string;
  collection?: string;
  collections?: string[];
  priceHistory?: CardPricePoint[];
  lastPriceSyncDate?: string;
}

/**
 * Obtiene la lista canónica y sin duplicados de colecciones a las que pertenece una carta.
 * Soporta arrays `collections` o cadenas delimitadas en `collection`.
 * Si no tiene ninguna asignada, devuelve `[DEFAULT_COLLECTION]`.
 */
export function getCardCollections(card: {
  collections?: string[] | null;
  collection?: string | null;
}): string[] {
  const set = new Set<string>();
  if (Array.isArray(card.collections)) {
    for (const c of card.collections) {
      if (typeof c === 'string') {
        const trimmed = c.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  if (typeof card.collection === 'string') {
    for (const part of card.collection.split(/[,;|]/)) {
      const trimmed = part.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  if (set.size === 0) {
    set.add(DEFAULT_COLLECTION);
  }
  return Array.from(set);
}

export interface ImportCardsOptions {
  replace?: boolean;
}

export interface ImportCardsResult {
  importedCount: number;
  replaced: boolean;
}

/** Calcula la variación absoluta, porcentual y la tendencia estilo bursátil por unidad. */
export function calculateCardReturn(card: {
  currentPrice: number;
  previousPrice: number;
  buyPrice?: number;
}): {
  diff: number;
  percent: number;
  trend: CardTrend;
} {
  const basePrice =
    card.buyPrice !== undefined && card.buyPrice > 0 ? card.buyPrice : card.previousPrice;
  const diff = Number((card.currentPrice - basePrice).toFixed(2));
  const percent =
    basePrice > 0
      ? Number(((diff / basePrice) * 100).toFixed(1))
      : 0;
  const trend: CardTrend = diff > 0.005 ? 'up' : diff < -0.005 ? 'down' : 'flat';
  return { diff, percent, trend };
}

/** Resultado de la sincronización de precios de Cardmarket. */
export interface CardmarketSyncResult {
  alreadyUpToDate: boolean;
  updatedCount: number;
  totalCards: number;
  syncDate: string;
}

/** Estado inmutable proyectado hacia la vista de MTGInvest. */
export interface MtginvestViewState {
  items: CardEntity[];
  loading: boolean;
  busy: boolean;
  errorMessage: string | null;
  storage: StorageStatus;
  isSyncingPrices?: boolean;
  lastPriceSyncDate?: string | null;
}

/** Contrato del Modelo (M). */
export interface IMtginvestModel extends IModel {
  getSnapshot(): CardEntity[];
  loadItems(): Promise<CardEntity[]>;
  createItem(input: CreateCardInput): Promise<CardEntity>;
  updateCard(
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
  ): Promise<CardEntity>;
  updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<CardEntity>;
  syncCardmarketPrices(
    scryfallClient: IScryfallApiClient,
    options?: { force?: boolean }
  ): Promise<CardmarketSyncResult>;
  deleteItem(id: string): Promise<void>;
  resetToSeed(): Promise<CardEntity[]>;
  clearInventory(): Promise<CardEntity[]>;
  importCards(cards: CreateCardInput[], options?: ImportCardsOptions): Promise<ImportCardsResult>;
  exportToJson(): string;
  exportToCsv(): string;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
  dispose?(): void;
}

/** Contrato del Controlador (C). */
export interface IMtginvestController extends IController<MtginvestViewState, ViewEvent> {
  readonly scryfallClient: IScryfallApiClient;
  createItem(input: CreateCardInput): Promise<void>;
  updateCard(
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
  ): Promise<void>;
  getCardImageUrl(card: CardEntity): Promise<string | null>;
  updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<void>;
  syncCardmarketPrices(options?: { force?: boolean }): Promise<CardmarketSyncResult>;
  deleteItem(id: string): Promise<void>;
  resetToSeed(): Promise<void>;
  clearInventory(): Promise<void>;
  importCards(cards: CreateCardInput[], options?: ImportCardsOptions): Promise<ImportCardsResult>;
  exportToJson(): string;
  exportToCsv(): string;
  upgradeToProAndEnableCloud(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

/** Módulo enchufable al backend reutilizable `@framework/server`. */
export const SERVER_MODULE: RegisteredAppModule = {
  appId: APP_ID
};
