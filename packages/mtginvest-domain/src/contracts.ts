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
export const ENTITY_NAME = 'card';

/** Entidad persistente de MTGInvest. */
export interface CardEntity extends EntityBase {
  title: string;
  intensity: number;
  isFavorite: boolean;
}

export interface CreateCardInput {
  title: string;
  intensity?: number;
}

/** Estado inmutable proyectado hacia cualquier IView (Expo Android, Web, CLI, Tests). */
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
  updateIntensity(id: string, intensity: number): Promise<CardEntity>;
  deleteItem(id: string): Promise<void>;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
}

/** Contrato del Controlador (C). */
export interface IMtginvestController extends IController<MtginvestViewState, ViewEvent> {
  createItem(input: CreateCardInput): Promise<void>;
  updateIntensity(id: string, intensity: number): Promise<void>;
  deleteItem(id: string): Promise<void>;
  upgradeToProAndEnableCloud(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

/** Módulo enchufable al backend reutilizable `@framework/server`. */
export const SERVER_MODULE: RegisteredAppModule = {
  appId: APP_ID
};
