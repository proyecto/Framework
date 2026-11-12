import type {
  IConflictResolutionStrategy,
  IKeyValueStore,
  IRemoteSyncTransport,
  StorageMode,
  UserPlan
} from '@framework/core';
import {
  HttpSyncTransport,
  HybridSyncRepository,
  type IEntityStoreDriver
} from '@framework/data';
import {
  EXAMPLE_APP_ID,
  PRESET_ENTITY_NAME,
  type IPresetController,
  type PresetEntity
} from './contracts.js';
import { PresetController } from './PresetController.js';
import { PresetModel } from './PresetModel.js';

export interface PresetStudioFactoryOptions {
  /** Adaptador local de almacenamiento de entidades (Expo SQLite, Web localStorage, InMemory). */
  store: IEntityStoreDriver;
  /** Adaptador local clave-valor para metadatos (`mode`, `plan`, cursor de sync). */
  kv: IKeyValueStore;
  /** Identificador de este dispositivo cliente. */
  deviceId: string;
  /** URL base del backend `@framework/server` para sincronización Pro si no se inyecta `transport`. */
  apiBaseUrl?: string;
  /** Transporte remoto personalizado (Patrón Inversión de Dependencias, útil en tests o auth custom). */
  transport?: IRemoteSyncTransport;
  /** Identificador del usuario actual; por defecto `'demo-user'`. */
  userId?: string;
  defaultMode?: StorageMode;
  defaultPlan?: UserPlan;
  conflictStrategy?: IConflictResolutionStrategy;
}

/**
 * Patrón: **Abstract Factory / Composition Root** compartida entre plataformas.
 *
 * Ensambla en orden estricto la cadena MVC + Datos sin que las vistas (`demo-expo` ni
 * `demo-web`) tengan que repetir la construcción manual del transporte, repositorio y modelo:
 *
 * `IRemoteSyncTransport (opcional) -> HybridSyncRepository -> PresetModel -> PresetController`
 */
export function createPresetStudioController(
  options: PresetStudioFactoryOptions
): IPresetController {
  const transport =
    options.transport ??
    (options.apiBaseUrl
      ? new HttpSyncTransport({ baseUrl: options.apiBaseUrl })
      : undefined);

  const repository = new HybridSyncRepository<PresetEntity>({
    appId: EXAMPLE_APP_ID,
    userId: options.userId ?? 'demo-user',
    deviceId: options.deviceId,
    entityName: PRESET_ENTITY_NAME,
    store: options.store,
    kv: options.kv,
    transport,
    conflictStrategy: options.conflictStrategy,
    defaultMode: options.defaultMode ?? 'local',
    defaultPlan: options.defaultPlan ?? 'free'
  });

  const model = new PresetModel(repository);
  return new PresetController(model);
}
