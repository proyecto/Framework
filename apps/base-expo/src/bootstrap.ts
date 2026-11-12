import { SqlEntityStoreDriver, SqlKeyValueStore } from '@framework/data';
import { ExpoSqliteDriver } from '@framework/expo-adapter';
import { createBaseAppController, type IBaseAppController } from './mvc';

export interface BaseExpoBootstrapOptions {
  apiBaseUrl?: string;
  userId?: string;
}

/**
 * **Composition Root** de la App Base en Android Expo.
 * Encapsula la base local SQLite del dispositivo tras `ISqlDriver` (`ExpoSqliteDriver`).
 */
export function createBaseExpoController(
  options: BaseExpoBootstrapOptions = {}
): IBaseAppController {
  const apiBaseUrl =
    options.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://10.0.2.2:4000';

  const sqlDriver = new ExpoSqliteDriver('framework_base_app.db');

  return createBaseAppController({
    store: new SqlEntityStoreDriver(sqlDriver),
    kv: new SqlKeyValueStore(sqlDriver),
    deviceId: 'base-android-expo',
    userId: options.userId ?? 'base-user',
    apiBaseUrl
  });
}

