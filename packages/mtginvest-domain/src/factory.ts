import type {
  IKeyValueStore,
  IRemoteSyncTransport
} from '@framework/core';
import {
  HybridSyncRepository,
  type IEntityStoreDriver
} from '@framework/data';
import { APP_ID, ENTITY_NAME, type CardEntity } from './contracts.js';
import { MtginvestController } from './MtginvestController.js';
import { MtginvestModel } from './MtginvestModel.js';

export interface CreateMtginvestControllerOptions {
  store: IEntityStoreDriver;
  kv: IKeyValueStore;
  deviceId: string;
  userId?: string;
  transport?: IRemoteSyncTransport;
}

/** Factoría compartida multiplataforma (Android Expo + Web + Tests). */
export function createMtginvestController(
  options: CreateMtginvestControllerOptions
): MtginvestController {
  const repository = new HybridSyncRepository<CardEntity>({
    appId: APP_ID,
    userId: options.userId ?? 'default-user',
    deviceId: options.deviceId,
    entityName: ENTITY_NAME,
    store: options.store,
    kv: options.kv,
    transport: options.transport,
    defaultMode: 'local',
    defaultPlan: 'free'
  });
  return new MtginvestController(new MtginvestModel(repository));
}
