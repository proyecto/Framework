import type {
  IKeyValueStore,
  IRemoteSyncTransport
} from '@framework/core';
import {
  HybridSyncRepository,
  type IEntityStoreDriver
} from '@framework/data';
import { APP_ID, ENTITY_NAME, type CardEntity } from './contracts.js';
import type { IScryfallApiClient } from './scryfall.js';
import { MintmoxController } from './MintmoxController.js';
import { MintmoxModel } from './MintmoxModel.js';

export interface CreateMintmoxControllerOptions {
  store: IEntityStoreDriver;
  kv: IKeyValueStore;
  deviceId: string;
  userId?: string;
  transport?: IRemoteSyncTransport;
  scryfallClient?: IScryfallApiClient;
  autoSeed?: boolean;
}

export type CreateMtginvestControllerOptions = CreateMintmoxControllerOptions;

/** Factoría compartida multiplataforma (Android Expo + Web + Tests). */
export function createMintmoxController(
  options: CreateMintmoxControllerOptions
): MintmoxController {
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
  return new MintmoxController(
    new MintmoxModel(repository, options.autoSeed ?? false),
    options.scryfallClient
  );
}

export const createMtginvestController = createMintmoxController;
