import type {
  AsyncCommandState,
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

export const BASE_APP_ID = 'base-template';
export const BASE_ENTITY_NAME = 'workspace_items';

/** Entidad genérica mínima de la App Base que hereda auditoría, versión y tombstone. */
export interface BaseWorkspaceItem extends EntityBase {
  title: string;
  description: string;
  level: number;
  enabled: boolean;
  isPrimary: boolean;
}

/** Datos de entrada validados para crear un nuevo elemento en la App Base. */
export interface CreateBaseItemInput {
  title: string;
  description?: string;
  level?: number;
}

/** Snapshot inmutable proyectado hacia cualquier `IView` (Expo Android / React Web). */
export interface BaseAppViewState extends AsyncCommandState {
  items: BaseWorkspaceItem[];
  selectedItemId: string | null;
  onlyEnabledFilter: boolean;
  loading: boolean;
  storage: StorageStatus;
}

/** Contrato del Modelo (M) de la App Base. */
export interface IBaseAppModel extends IModel {
  getItemsSnapshot(): BaseWorkspaceItem[];
  loadItems(): Promise<BaseWorkspaceItem[]>;
  createItem(input: CreateBaseItemInput): Promise<BaseWorkspaceItem>;
  updateItem(
    id: string,
    patch: Partial<
      Pick<BaseWorkspaceItem, 'title' | 'description' | 'level' | 'enabled' | 'isPrimary'>
    >
  ): Promise<BaseWorkspaceItem>;
  deleteItem(id: string): Promise<void>;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
}

/** Contrato del Controlador (C) consumido de forma idéntica por `@framework/base-expo` y `@framework/base-web`. */
export interface IBaseAppController extends IController<BaseAppViewState, ViewEvent> {
  selectItem(id: string | null): void;
  setOnlyEnabledFilter(enabledOnly: boolean): void;
  createItem(input: CreateBaseItemInput): Promise<void>;
  updateLevel(id: string, level: number): Promise<void>;
  toggleEnabled(id: string): Promise<void>;
  markAsPrimary(id: string): Promise<void>;
  deleteItem(id: string): Promise<void>;
  upgradeToProAndEnableCloud(): Promise<void>;
  downgradeToFree(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

/** Descriptor opcional para registrar `base-template` en el servidor reutilizable `@framework/server`. */
export const BASE_SERVER_MODULE: RegisteredAppModule = {
  appId: BASE_APP_ID
};
