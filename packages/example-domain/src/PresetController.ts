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
    this.setState({ busy: true, errorMessage: null });
    try {
      const [presets, storage] = await Promise.all([
        this.model.loadPresets(),
        this.model.getStorageStatus()
      ]);
      this.setState((prev) => ({
        ...prev,
        presets,
        storage,
        selectedPresetId: presets.some((p) => p.id === prev.selectedPresetId)
          ? prev.selectedPresetId
          : presets[0]?.id ?? null,
        busy: false
      }));
    } catch (error) {
      this.setState({ busy: false, errorMessage: getErrorMessage(error) });
    }
  }

  selectPreset(id: string | null): void {
    this.setState({ selectedPresetId: id });
  }

  setFilterFavoritesOnly(onlyFavorites: boolean): void {
    this.setState({ filterFavoritesOnly: onlyFavorites });
  }

  async createPreset(input: CreatePresetInput): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      const created = await this.model.createPreset(input);
      const storage = await this.model.getStorageStatus();
      this.setState({
        presets: this.model.getPresetsSnapshot(),
        selectedPresetId: created.id,
        storage,
        busy: false
      });
      this.emitViewEvent({
        type: 'toast',
        message: `Escena "${created.name}" guardada.`
      });
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState({ busy: false, errorMessage: message });
      this.emitViewEvent({ type: 'error', message });
    }
  }

  async updateSlider(
    id: string,
    field: PresetSliderField,
    value: number
  ): Promise<void> {
    this.setState({ errorMessage: null });
    try {
      await this.model.updatePreset(id, { [field]: value });
      await this.syncStateFromModel();
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState({ errorMessage: message });
      this.emitViewEvent({ type: 'error', message });
    }
  }

  async updateDetails(
    id: string,
    patch: { name?: string; notes?: string }
  ): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      await this.model.updatePreset(id, patch);
      await this.syncStateFromModel();
      this.setState({ busy: false });
      this.emitViewEvent({ type: 'toast', message: 'Cambios guardados.' });
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState({ busy: false, errorMessage: message });
      this.emitViewEvent({ type: 'error', message });
    }
  }

  async toggleFavorite(id: string): Promise<void> {
    const target = this.getState().presets.find((item) => item.id === id);
    if (!target) return;
    try {
      await this.model.updatePreset(id, { isFavorite: !target.isFavorite });
      await this.syncStateFromModel();
    } catch (error) {
      this.setState({ errorMessage: getErrorMessage(error) });
    }
  }

  async activatePreset(id: string): Promise<void> {
    try {
      await this.model.updatePreset(id, { isActive: true });
      await this.syncStateFromModel();
      const target = this.getState().presets.find((item) => item.id === id);
      if (target) {
        this.emitViewEvent({
          type: 'toast',
          message: `Escena activa: ${target.name}`
        });
      }
    } catch (error) {
      this.setState({ errorMessage: getErrorMessage(error) });
    }
  }

  async deletePreset(id: string): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      await this.model.deletePreset(id);
      await this.syncStateFromModel();
      this.setState({ busy: false });
      this.emitViewEvent({ type: 'toast', message: 'Escena eliminada.' });
    } catch (error) {
      this.setState({ busy: false, errorMessage: getErrorMessage(error) });
    }
  }

  async upgradeToProAndEnableCloud(): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      await this.model.setPlan('pro');
      const storage = await this.model.setStorageMode('cloud');
      this.setState({
        presets: this.model.getPresetsSnapshot(),
        storage,
        busy: false
      });
      this.emitViewEvent({
        type: 'sync-complete',
        message: 'Plan Pro activado y copia en la nube sincronizada.'
      });
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState({ busy: false, errorMessage: message });
      this.emitViewEvent({ type: 'error', message });
    }
  }

  async downgradeToFree(): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      const storage = await this.model.setPlan('free');
      this.setState({ storage, busy: false });
      this.emitViewEvent({
        type: 'toast',
        message: 'Plan gratuito activo: tus datos ahora solo se guardan en este dispositivo.'
      });
    } catch (error) {
      this.setState({ busy: false, errorMessage: getErrorMessage(error) });
    }
  }

  async setStorageMode(mode: StorageMode): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      const storage = await this.model.setStorageMode(mode);
      this.setState({
        presets: this.model.getPresetsSnapshot(),
        storage,
        busy: false
      });
      this.emitViewEvent({
        type: mode === 'cloud' ? 'sync-complete' : 'toast',
        message:
          mode === 'cloud'
            ? 'Sincronización en la nube activada.'
            : 'Modo local activado: tus cambios permanecen solo en este dispositivo.'
      });
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState({ busy: false, errorMessage: message });
      if (error instanceof CloudEntitlementError) {
        this.emitViewEvent({ type: 'upgrade-required', message });
      } else {
        this.emitViewEvent({ type: 'error', message });
      }
    }
  }

  async syncNow(): Promise<void> {
    this.setState({ busy: true, errorMessage: null });
    try {
      const report = await this.model.syncNow();
      await this.syncStateFromModel();
      this.setState({ busy: false });
      this.emitViewEvent({
        type: 'sync-complete',
        message: `Nube actualizada (subidos: ${report.pushed}, descargados: ${report.pulled}).`
      });
    } catch (error) {
      const message = getErrorMessage(error);
      await this.syncStateFromModel();
      this.setState({ busy: false, errorMessage: message });
      if (error instanceof CloudEntitlementError) {
        this.emitViewEvent({ type: 'upgrade-required', message });
      } else {
        this.emitViewEvent({ type: 'error', message });
      }
    }
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

