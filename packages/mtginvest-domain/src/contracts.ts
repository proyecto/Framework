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

export const APP_ID = 'mtginvest';
export const ENTITY_NAME = 'cards';

export type CardTrend = 'up' | 'down' | 'flat';

/** Entidad de carta de MTG con seguimiento de inversión y cotización. */
export interface CardEntity extends EntityBase {
  title: string;              // Nombre en castellano o principal (ej. "Ángel de Serra")
  nameEn?: string;            // Nombre original en inglés (ej. "Serra Angel")
  edition: string;            // Nombre de la edición (ej. "Unlimited Edition")
  editionCode?: string;       // Código del set (ej. "2ED", "3ED")
  quantity: number;           // Cantidad de cartas que se poseen (ej. 1, 4)
  currentPrice: number;       // Último valor de mercado registrado (€)
  previousPrice: number;      // Valor anterior de referencia o compra (€)
  condition?: string;         // Estado (NM, LP, EX, PL, PO)
  isFavorite: boolean;
}

export interface CreateCardInput {
  title: string;
  nameEn?: string;
  edition?: string;
  editionCode?: string;
  quantity?: number;
  currentPrice?: number;
  previousPrice?: number;
  condition?: string;
}

/** Calcula la variación absoluta, porcentual y la tendencia estilo bursátil por unidad. */
export function calculateCardReturn(card: { currentPrice: number; previousPrice: number }): {
  diff: number;
  percent: number;
  trend: CardTrend;
} {
  const diff = Number((card.currentPrice - card.previousPrice).toFixed(2));
  const percent =
    card.previousPrice > 0
      ? Number(((diff / card.previousPrice) * 100).toFixed(1))
      : 0;
  const trend: CardTrend = diff > 0.005 ? 'up' : diff < -0.005 ? 'down' : 'flat';
  return { diff, percent, trend };
}

/** Estado inmutable proyectado hacia la vista de MTGInvest. */
export interface MtginvestViewState {
  items: CardEntity[];
  loading: boolean;
  busy: boolean;
  errorMessage: string | null;
  storage: StorageStatus;
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
        'title' | 'nameEn' | 'edition' | 'editionCode' | 'quantity' | 'currentPrice' | 'previousPrice' | 'condition'
      >
    >
  ): Promise<CardEntity>;
  updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<CardEntity>;
  deleteItem(id: string): Promise<void>;
  resetToSeed(): Promise<CardEntity[]>;
  importMissingSeeds(): Promise<CardEntity[]>;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
}

/** Contrato del Controlador (C). */
export interface IMtginvestController extends IController<MtginvestViewState, ViewEvent> {
  createItem(input: CreateCardInput): Promise<void>;
  updateCard(
    id: string,
    patch: Partial<
      Pick<
        CardEntity,
        'title' | 'nameEn' | 'edition' | 'editionCode' | 'quantity' | 'currentPrice' | 'previousPrice' | 'condition'
      >
    >
  ): Promise<void>;
  updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<void>;
  deleteItem(id: string): Promise<void>;
  resetToSeed(): Promise<void>;
  importMissingSeeds(): Promise<void>;
  upgradeToProAndEnableCloud(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

/** Módulo enchufable al backend reutilizable `@framework/server`. */
export const SERVER_MODULE: RegisteredAppModule = {
  appId: APP_ID
};
