import type {
  IConflictResolutionStrategy,
  IKeyValueStore,
  IRemoteSyncTransport
} from '@framework/core';
import {
  HttpSyncTransport,
  HybridSyncRepository,
  type IEntityStoreDriver
} from '@framework/data';
import { BaseAppController } from './BaseAppController.js';
import { BaseAppModel } from './BaseAppModel.js';
import {
  BASE_APP_ID,
  BASE_ENTITY_NAME,
  type BaseWorkspaceItem,
  type IBaseAppController
} from './contracts.js';

export interface CreateBaseAppControllerOptions {
  store: IEntityStoreDriver;
  kv: IKeyValueStore;
  deviceId: string;
  userId?: string;
  apiBaseUrl?: string;
  transport?: IRemoteSyncTransport;
  conflictStrategy?: IConflictResolutionStrategy;
}

/**
 * Patrón: **Abstract Factory / Composition Root** compartida para la App Base en todas
 * las plataformas (`@framework/base-expo`, `@framework/base-web` y tests automatizados).
 */
export function createBaseAppController(
  options: CreateBaseAppControllerOptions
): IBaseAppController {
  const transport =
    options.transport ??
    (options.apiBaseUrl ? new HttpSyncTransport({ baseUrl: options.apiBaseUrl }) : undefined);

  const repository = new HybridSyncRepository<BaseWorkspaceItem>({
    appId: BASE_APP_ID,
    userId: options.userId ?? 'base-user',
    deviceId: options.deviceId,
    entityName: BASE_ENTITY_NAME,
    store: options.store,
    kv: options.kv,
    transport,
    conflictStrategy: options.conflictStrategy,
    defaultMode: 'local',
    defaultPlan: 'free'
  });

  return new BaseAppController(new BaseAppModel(repository));
}
