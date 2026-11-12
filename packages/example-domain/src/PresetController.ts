import {
  BaseController,
  CloudEntitlementError,
  getErrorMessage,
  type StorageMode,
  type ViewEvent
} from '@framework/core';
import type {
  CreatePresetInput,
  IPresetController,
  IPresetModel,
  PresetSliderField,
  PresetStudioViewState
} from './contracts.js';

const INITIAL_STATE: PresetStudioViewState = {
  presets: [],
  selectedPresetId: null,
  filterFavoritesOnly: false,
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

interface CommandExecutionOptions<TResult> {
  /** Si es `true`, activa `state.busy` mientras dura la operación. */
  trackBusy?: boolean;
  /** Emite `error` / `upgrade-required` a la vista si ocurre una excepción. */
  emitErrorEvent?: boolean;
  /** Fuerza resincronización del snapshot completo desde el modelo aun si hubo error. */
  syncAfterError?: boolean;
  /** Función opcional para producir un `ViewEvent` cuando la operación termina con éxito. */
  onSuccess?: (result: TResult) => ViewEvent | void;
}

/**
 * Implementación del **Controlador (C)** de FocusScenes (`IPresetController`).
 *
 * Patrones aplicados:
 * - **MVC Mediator**: Coordina `IPresetModel` y propaga snapshots inmutables a cualquier `IView`.
 * - **Observer**: Escucha cambios del Modelo (`model.subscribe`) y mantiene sincronizada la UI.
 * - **Template / Command Wrapper (`executeCommand`)**: Unifica gestión de `busy`, limpieza de
 *   errores, refresco del estado y mapeo uniforme de `CloudEntitlementError -> upgrade-required`.
 */
export class PresetController
  extends BaseController<PresetStudioViewState, ViewEvent>
  implements IPresetController
{
  private readonly unsubModel: () => void;

  constructor(private readonly model: IPresetModel) {
    super(INITIAL_STATE);
    this.unsubModel = this.model.subscribe(() => {
      void this.syncStateFromModel();
    });
  }

  /** Reconstruye el snapshot del controlador asegurando que el `selectedPresetId` siga siendo válido. */
  private async syncStateFromModel(): Promise<void> {
    if (this.isDisposed()) return;
    const presets = this.model.getPresetsSnapshot();
    const storage = await this.model.getStorageStatus();
    const prev = this.getState();
    const selectedStillExists = presets.some((p) => p.id === prev.selectedPresetId);

    this.setState({
      presets,
      storage,
      selectedPresetId: selectedStillExists
        ? prev.selectedPresetId
        : presets[0]?.id ?? null
    });
  }

  /**
   * Wrapper reutilizable (**Patrón Template Method**) para todas las acciones asíncronas
   * del controlador, evitando bloques `try/catch/busy` repetidos en cada método público.
   */
  private async executeCommand<TResult = void>(
    options: CommandExecutionOptions<TResult>,
    task: () => Promise<TResult>
  ): Promise<TResult | undefined> {
    const trackBusy = options.trackBusy ?? true;
    const emitErrorEvent = options.emitErrorEvent ?? true;

    this.setState(trackBusy ? { busy: true, errorMessage: null } : { errorMessage: null });

    try {
      const result = await task();
      await this.syncStateFromModel();
      if (trackBusy) {
        this.setState({ busy: false });
      }
      const successEvent = options.onSuccess?.(result);
      if (successEvent) {
        this.emitViewEvent(successEvent);
      }
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      if (options.syncAfterError) {
        await this.syncStateFromModel();
      }
      this.setState(
        trackBusy
          ? { busy: false, errorMessage: message }
          : { errorMessage: message }
      );
      if (emitErrorEvent) {
        if (error instanceof CloudEntitlementError) {
          this.emitViewEvent({ type: 'upgrade-required', message });
        } else {
          this.emitViewEvent({ type: 'error', message });
        }
      }
      return undefined;
    }
  }

  /** Inicialización idempotente al montar la primera vista. */
  async init(): Promise<void> {
    if (this.isInitialized()) {
      await this.syncStateFromModel();
      return;
    }

    this.setState({ loading: true, errorMessage: null });
    try {
      const [presets, storage] = await Promise.all([
        this.model.loadPresets(),
        this.model.getStorageStatus()
      ]);
      this.markInitialized();
      this.setState({
        presets,
        storage,
        selectedPresetId: presets[0]?.id ?? null,
        loading: false
      });
    } catch (error) {
      this.setState({
        loading: false,
        errorMessage: getErrorMessage(error)
      });
    }
  }

  async refresh(): Promise<void> {
    await this.executeCommand({ emitErrorEvent: false }, async () => {
      await this.model.loadPresets();
    });
  }

  selectPreset(id: string | null): void {
    this.setState({ selectedPresetId: id });
  }

  setFilterFavoritesOnly(onlyFavorites: boolean): void {
    this.setState({ filterFavoritesOnly: onlyFavorites });
  }

  async createPreset(input: CreatePresetInput): Promise<void> {
    const created = await this.executeCommand(
      {
        onSuccess: (item) => ({
          type: 'toast',
          message: `Escena "${item.name}" guardada.`
        })
      },
      () => this.model.createPreset(input)
    );
    if (created) {
      this.setState({ selectedPresetId: created.id });
    }
  }

  async updateSlider(
    id: string,
    field: PresetSliderField,
    value: number
  ): Promise<void> {
    // Los sliders se actualizan sin activar `busy` global para mantener fluidez táctil/ratón.
    await this.executeCommand({ trackBusy: false }, async () => {
      await this.model.updatePreset(id, { [field]: value });
    });
  }

  async updateDetails(
    id: string,
    patch: { name?: string; notes?: string }
  ): Promise<void> {
    await this.executeCommand(
      {
        onSuccess: () => ({ type: 'toast', message: 'Cambios guardados.' })
      },
      async () => {
        await this.model.updatePreset(id, patch);
      }
    );
  }

  async toggleFavorite(id: string): Promise<void> {
    const target = this.getState().presets.find((item) => item.id === id);
    if (!target) return;
    await this.executeCommand({ trackBusy: false, emitErrorEvent: false }, async () => {
      await this.model.updatePreset(id, { isFavorite: !target.isFavorite });
    });
  }

  async activatePreset(id: string): Promise<void> {
    await this.executeCommand(
      {
        trackBusy: false,
        emitErrorEvent: false,
        onSuccess: (updated) => ({
          type: 'toast',
          message: `Escena activa: ${updated.name}`
        })
      },
      () => this.model.updatePreset(id, { isActive: true })
    );
  }

  async deletePreset(id: string): Promise<void> {
    await this.executeCommand(
      {
        emitErrorEvent: false,
        onSuccess: () => ({ type: 'toast', message: 'Escena eliminada.' })
      },
      () => this.model.deletePreset(id)
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
          message: 'Plan gratuito activo: tus datos ahora solo se guardan en este dispositivo.'
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
              : 'Modo local activado: tus cambios permanecen solo en este dispositivo.'
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

  clearError(): void {
    this.setState({ errorMessage: null });
  }

  override dispose(): void {
    this.unsubModel();
    this.model.dispose?.();
    super.dispose();
  }
}
