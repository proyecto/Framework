import { SqlEntityStoreDriver, SqlKeyValueStore } from '@framework/data';
import { ExpoSqliteDriver } from '@framework/expo-adapter';
import { createMintmoxController, type IMintmoxController } from './mvc';

export interface MintMoxBootstrapOptions {
  userId?: string;
}

export type MTGInvestBootstrapOptions = MintMoxBootstrapOptions;

/**
 * Composition Root de MintMox en Android Expo.
 * Encapsula la base local SQLite del dispositivo tras ISqlDriver (ExpoSqliteDriver).
 */
export function createMintMoxExpoController(
  options: MintMoxBootstrapOptions = {}
): IMintmoxController {
  const sqlDriver = new ExpoSqliteDriver('mintmox_app.db');

  return createMintmoxController({
    store: new SqlEntityStoreDriver(sqlDriver),
    kv: new SqlKeyValueStore(sqlDriver),
    deviceId: 'mintmox-expo-device',
    userId: options.userId ?? 'mintmox-user'
  });
}

export const createMTGInvestExpoController = createMintMoxExpoController;

