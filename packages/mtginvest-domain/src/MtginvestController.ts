import {
  BaseController,
  CloudEntitlementError,
  getErrorMessage,
  type StorageMode,
  type ViewEvent
} from '@framework/core';
import type {
  CardEntity,
  CardmarketSyncResult,
  CreateCardInput,
  IMtginvestController,
  IMtginvestModel,
  ImportCardsOptions,
  ImportCardsResult,
  MtginvestViewState
} from './contracts.js';
import type { IScryfallApiClient } from './scryfall.js';
import { ScryfallApiClient } from './ScryfallApiClient.js';

const INITIAL_STATE: MtginvestViewState = {
  items: [],
  loading: true,
  busy: false,
  isSyncingPrices: false,
  lastPriceSyncDate: null,
  errorMessage: null,
  storage: {
    mode: 'local',
    plan: 'free',
    cloudEnabled: false,
    pendingChanges: 0,
    lastSyncedAt: null,
    isSyncing: false,
    lastSyncError: null
  }
};

/** Controlador MVC de MTGInvest. */
export class MtginvestController
  extends BaseController<MtginvestViewState, ViewEvent>
  implements IMtginvestController
{
  public readonly scryfallClient: IScryfallApiClient;
  private readonly unsubModel: () => void;

  constructor(
    private readonly model: IMtginvestModel,
    scryfallClient?: IScryfallApiClient
  ) {
    super(INITIAL_STATE);
    this.scryfallClient = scryfallClient ?? new ScryfallApiClient();
    this.unsubModel = this.model.subscribe(() => {
      void this.syncStateFromModel();
    });
  }

  private async syncStateFromModel(): Promise<void> {
    if (this.isDisposed()) return;
    const [items, storage] = [this.model.getSnapshot(), await this.model.getStorageStatus()];
    this.setState({ items, storage });
  }

  private async executeCommand<T = void>(
    trackBusy: boolean,
    task: () => Promise<T>
  ): Promise<T> {
    this.setState(trackBusy ? { busy: true, errorMessage: null } : { errorMessage: null });
    try {
      const result = await task();
      await this.syncStateFromModel();
      if (trackBusy) this.setState({ busy: false });
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState(trackBusy ? { busy: false, errorMessage: message } : { errorMessage: message });
      if (error instanceof CloudEntitlementError) {
        this.emitViewEvent({ type: 'upgrade-required', message });
      } else {
        this.emitViewEvent({ type: 'error', message });
      }
      throw error;
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized()) {
      await this.syncStateFromModel();
      return;
    }
    this.setState({ loading: true, errorMessage: null });
    try {
      const [items, storage] = await Promise.all([
        this.model.loadItems(),
        this.model.getStorageStatus()
      ]);
      this.markInitialized();
      this.setState({ items, storage, loading: false });
    } catch (error) {
      this.setState({ loading: false, errorMessage: getErrorMessage(error) });
    }
  }

  async createItem(input: CreateCardInput): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.createItem(input);
    });
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
        | 'isFoil'
        | 'isAltered'
        | 'isSigned'
        | 'condition'
        | 'imageUrl'
        | 'scryfallId'
        | 'collection'
        | 'priceHistory'
        | 'lastPriceSyncDate'
      >
    >
  ): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.updateCard(id, patch);
    });
  }

  async getCardImageUrl(card: CardEntity): Promise<string | null> {
    if (card.imageUrl) {
      return card.imageUrl;
    }
    const resolved = await this.scryfallClient.resolveCardImageUrl(card);
    if (resolved) {
      void this.model.updateCard(card.id, { imageUrl: resolved }).catch(() => {});
    }
    return resolved;
  }

  async updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<void> {
    await this.executeCommand(false, async () => {
      await this.model.updatePrices(id, currentPrice, previousPrice);
    });
  }

  async syncCardmarketPrices(options?: { force?: boolean }): Promise<CardmarketSyncResult> {
    this.setState({ isSyncingPrices: true });
    try {
      const result = await this.model.syncCardmarketPrices(this.scryfallClient, options);
      await this.syncStateFromModel();
      this.setState({
        isSyncingPrices: false,
        lastPriceSyncDate: result.syncDate
      });
      if (!result.alreadyUpToDate && result.updatedCount > 0) {
        this.emitViewEvent({
          type: 'toast',
          message: `Cotizaciones de Cardmarket actualizadas (${result.updatedCount} cartas).`
        });
      }
      return result;
    } catch {
      this.setState({ isSyncingPrices: false });
      return {
        alreadyUpToDate: false,
        updatedCount: 0,
        totalCards: this.getState().items.length,
        syncDate: new Date().toISOString().slice(0, 10)
      };
    }
  }

  async deleteItem(id: string): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.deleteItem(id);
    });
  }

  async resetToSeed(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.resetToSeed();
    });
  }

  async clearInventory(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.clearInventory();
    });
    this.emitViewEvent({
      type: 'toast',
      message: 'Inventario vaciado por completo'
    });
  }

  async importCards(
    cards: CreateCardInput[],
    options?: ImportCardsOptions
  ): Promise<ImportCardsResult> {
    const result = await this.executeCommand(true, async () => {
      return await this.model.importCards(cards, options);
    });
    this.emitViewEvent({
      type: 'toast',
      message: result.replaced
        ? `Cartera reemplazada con ${result.importedCount} carta(s).`
        : `Importadas ${result.importedCount} carta(s) a la cartera.`
    });
    return result;
  }

  exportToJson(): string {
    return this.model.exportToJson();
  }

  exportToCsv(): string {
    return this.model.exportToCsv();
  }

  async upgradeToProAndEnableCloud(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.setPlan('pro');
      await this.model.setStorageMode('cloud');
    });
  }

  async setStorageMode(mode: StorageMode): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.setStorageMode(mode);
    });
  }

  async syncNow(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.syncNow();
    });
  }

  clearError(): void {
    this.setState({ errorMessage: null });
  }

  override dispose(): void {
    this.unsubModel();
    this.model.dispose?.();
    super.dispose();
  }
}
