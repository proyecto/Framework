import {
  BaseController,
  CloudEntitlementError,
  getErrorMessage,
  type StorageMode,
  type ViewEvent
} from '@framework/core';
import type {
  CardEntity,
  CreateCardInput,
  IMtginvestController,
  IMtginvestModel,
  MtginvestViewState
} from './contracts.js';

const INITIAL_STATE: MtginvestViewState = {
  items: [],
  loading: true,
  busy: false,
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
  private readonly unsubModel: () => void;

  constructor(private readonly model: IMtginvestModel) {
    super(INITIAL_STATE);
    this.unsubModel = this.model.subscribe(() => {
      void this.syncStateFromModel();
    });
  }

  private async syncStateFromModel(): Promise<void> {
    if (this.isDisposed()) return;
    const [items, storage] = [this.model.getSnapshot(), await this.model.getStorageStatus()];
    this.setState({ items, storage });
  }

  private async executeCommand(
    trackBusy: boolean,
    task: () => Promise<void>
  ): Promise<void> {
    this.setState(trackBusy ? { busy: true, errorMessage: null } : { errorMessage: null });
    try {
      await task();
      await this.syncStateFromModel();
      if (trackBusy) this.setState({ busy: false });
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState(trackBusy ? { busy: false, errorMessage: message } : { errorMessage: message });
      if (error instanceof CloudEntitlementError) {
        this.emitViewEvent({ type: 'upgrade-required', message });
      } else {
        this.emitViewEvent({ type: 'error', message });
      }
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
        'title' | 'nameEn' | 'edition' | 'editionCode' | 'language' | 'quantity' | 'currentPrice' | 'previousPrice' | 'condition'
      >
    >
  ): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.updateCard(id, patch);
    });
  }

  async updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<void> {
    await this.executeCommand(false, async () => {
      await this.model.updatePrices(id, currentPrice, previousPrice);
    });
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

  async importMissingSeeds(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.importMissingSeeds();
    });
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
    super.dispose();
  }
}
