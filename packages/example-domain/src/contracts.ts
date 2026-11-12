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

export const EXAMPLE_APP_ID = 'focus-scenes';
export const PRESET_ENTITY_NAME = 'presets';

export interface PresetEntity extends EntityBase {
  name: string;
  notes: string;
  ambientLevel: number;
  warmthLevel: number;
  focusMinutes: number;
  isFavorite: boolean;
  isActive: boolean;
}

export interface CreatePresetInput {
  name: string;
  notes?: string;
  ambientLevel?: number;
  warmthLevel?: number;
  focusMinutes?: number;
}

export type PresetSliderField = 'ambientLevel' | 'warmthLevel' | 'focusMinutes';

export interface UpdatePresetInput {
  name?: string;
  notes?: string;
  ambientLevel?: number;
  warmthLevel?: number;
  focusMinutes?: number;
  isFavorite?: boolean;
  isActive?: boolean;
}

export interface PresetStudioViewState {
  presets: PresetEntity[];
  selectedPresetId: string | null;
  filterFavoritesOnly: boolean;
  loading: boolean;
  busy: boolean;
  errorMessage: string | null;
  storage: StorageStatus;
}

/**
 * Strict Model interface.
 * Knows domain validation + ISyncableRepository<PresetEntity>, zero UI/HTTP/SQLite knowledge.
 */
export interface IPresetModel extends IModel {
  loadPresets(): Promise<PresetEntity[]>;
  getPresetsSnapshot(): PresetEntity[];
  createPreset(input: CreatePresetInput): Promise<PresetEntity>;
  updatePreset(id: string, patch: UpdatePresetInput): Promise<PresetEntity>;
  deletePreset(id: string): Promise<void>;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
}

/**
 * Strict Controller interface.
 * Consumed identically by Expo Android View, React Web View, or any future device UI.
 */
export interface IPresetController extends IController<PresetStudioViewState, ViewEvent> {
  refresh(): Promise<void>;
  selectPreset(id: string | null): void;
  setFilterFavoritesOnly(onlyFavorites: boolean): void;
  createPreset(input: CreatePresetInput): Promise<void>;
  updateSlider(id: string, field: PresetSliderField, value: number): Promise<void>;
  updateDetails(id: string, patch: { name?: string; notes?: string }): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  activatePreset(id: string): Promise<void>;
  deletePreset(id: string): Promise<void>;
  upgradeToProAndEnableCloud(): Promise<void>;
  downgradeToFree(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

export const EXAMPLE_SERVER_MODULE: RegisteredAppModule = {
  appId: EXAMPLE_APP_ID,
  actions: {
    stats: async ({ appId, userId, driver }) => {
      const rows = await driver.query<{ total: number }>(
        `SELECT COUNT(*) AS total
         FROM _fw_server_records
         WHERE app_id = ? AND user_id = ? AND entity = ? AND deleted_at IS NULL`,
        [appId, userId, PRESET_ENTITY_NAME]
      );
      return {
        appId,
        userId,
        cloudPresetsCount: Number(rows[0]?.total ?? 0)
      };
    }
  }
};

