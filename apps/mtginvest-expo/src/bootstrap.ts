import { SqlEntityStoreDriver, SqlKeyValueStore } from '@framework/data';
import { ExpoSqliteDriver } from '@framework/expo-adapter';
import { createMtginvestController, type IMtginvestController } from './mvc';

export interface MTGInvestBootstrapOptions {
  userId?: string;
}

/**
 * Composition Root de MTGInvest en Android Expo.
 * Encapsula la base local SQLite del dispositivo tras ISqlDriver (ExpoSqliteDriver).
 */
export function createMTGInvestExpoController(
  options: MTGInvestBootstrapOptions = {}
): IMtginvestController {
  const sqlDriver = new ExpoSqliteDriver('mtginvest_app.db');

  return createMtginvestController({
    store: new SqlEntityStoreDriver(sqlDriver),
    kv: new SqlKeyValueStore(sqlDriver),
    deviceId: 'mtginvest-expo-device',
    userId: options.userId ?? 'mtginvest-user'
  });
}

