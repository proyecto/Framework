import {
  StatefulMvcController,
  getErrorMessage,
  type StorageMode,
  type ViewEvent
} from '@framework/core';
import type {
  BaseAppViewState,
  CreateBaseItemInput,
  IBaseAppController,
  IBaseAppModel
} from './contracts.js';

const INITIAL_VIEW_STATE: BaseAppViewState = {
  items: [],
  selectedItemId: null,
  onlyEnabledFilter: false,
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

/**
 * Controlador MVC de referencia para la App Base (`IBaseAppController`).
 *
 * Hereda de `StatefulMvcController` (**Template Method + Command Executor + Observer**) para
 * compartir exactamente la misma lógica entre `@framework/base-expo` y `@framework/base-web`.
 */
export class BaseAppController
  extends StatefulMvcController<BaseAppViewState, ViewEvent>
  implements IBaseAppController
{
  constructor(private readonly model: IBaseAppModel) {
    super(INITIAL_VIEW_STATE);
    this.bindModel(model);
  }

  protected async syncStateFromModel(): Promise<void> {
    if (this.isDisposed()) return;
    const items = this.model.getItemsSnapshot();
    const storage = await this.model.getStorageStatus();
    const prev = this.getState();
    const stillSelected = items.some((item) => item.id === prev.selectedItemId);
    this.setState({
      items,
      storage,
      selectedItemId: stillSelected ? prev.selectedItemId : items[0]?.id ?? null
    });
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
      this.setState({
        items,
        storage,
        selectedItemId: items[0]?.id ?? null,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false, errorMessage: getErrorMessage(error) });
    }
  }

  selectItem(id: string | null): void {
    this.setState({ selectedItemId: id });
  }

  setOnlyEnabledFilter(enabledOnly: boolean): void {
    this.setState({ onlyEnabledFilter: enabledOnly });
  }

  async createItem(input: CreateBaseItemInput): Promise<void> {
    const created = await this.executeCommand(
      { onSuccess: (item) => ({ type: 'toast', message: `"${item.title}" guardado.` }) },
      () => this.model.createItem(input)
    );
    if (created) {
      this.setState({ selectedItemId: created.id });
    }
  }

  async updateLevel(id: string, level: number): Promise<void> {
    await this.executeCommand({ trackBusy: false }, async () => {
      await this.model.updateItem(id, { level });
    });
  }

  async toggleEnabled(id: string): Promise<void> {
    const target = this.getState().items.find((item) => item.id === id);
    if (!target) return;
    await this.executeCommand({ trackBusy: false, emitErrorEvent: false }, async () => {
      await this.model.updateItem(id, { enabled: !target.enabled });
    });
  }

  async markAsPrimary(id: string): Promise<void> {
    await this.executeCommand(
      {
        trackBusy: false,
        emitErrorEvent: false,
        onSuccess: (updated) => ({ type: 'toast', message: `Elemento principal: ${updated.title}` })
      },
      () => this.model.updateItem(id, { isPrimary: true })
    );
  }

  async deleteItem(id: string): Promise<void> {
    await this.executeCommand(
      {
        emitErrorEvent: false,
        onSuccess: () => ({ type: 'toast', message: 'Elemento eliminado.' })
      },
      () => this.model.deleteItem(id)
    );
  }

  async upgradeToProAndEnableCloud(): Promise<void> {
    await this.executeCommand(
      {
        onSuccess: () => ({
          type: 'sync-complete',
          message: 'Plan Pro activado y copia en la nube sincronizada.'
        })
      },
      async () => {
        await this.model.setPlan('pro');
        await this.model.setStorageMode('cloud');
      }
    );
  }

  async downgradeToFree(): Promise<void> {
    await this.executeCommand(
      {
        emitErrorEvent: false,
        onSuccess: () => ({
          type: 'toast',
          message: 'Plan gratuito activo: datos guardados únicamente en este dispositivo.'
        })
      },
      async () => {
        await this.model.setPlan('free');
      }
    );
  }

  async setStorageMode(mode: StorageMode): Promise<void> {
    await this.executeCommand(
      {
        onSuccess: () => ({
          type: mode === 'cloud' ? 'sync-complete' : 'toast',
          message:
            mode === 'cloud'
              ? 'Sincronización en la nube activada.'
              : 'Modo local activado: tus datos permanecen solo en el dispositivo.'
        })
      },
      async () => {
        await this.model.setStorageMode(mode);
      }
    );
  }

  async syncNow(): Promise<void> {
    await this.executeCommand(
      {
        syncAfterError: true,
        onSuccess: (report) => ({
          type: 'sync-complete',
          message: `Nube actualizada (subidos: ${report.pushed}, descargados: ${report.pulled}).`
        })
      },
      () => this.model.syncNow()
    );
  }
}
