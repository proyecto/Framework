import { SqlEntityStoreDriver, SqlKeyValueStore } from '@framework/data';
import {
  createPresetStudioController,
  type IPresetController
} from '@framework/example-domain';
import { ExpoSqliteDriver } from '@framework/expo-adapter';

export interface ExpoContainerConfig {
  apiBaseUrl?: string;
  userId?: string;
}

/**
 * **Composition Root** específica para Android (Expo).
 *
 * Únicamente ensambla los adaptadores concretos del dispositivo (`ExpoSqliteDriver` ->
 * `SqlEntityStoreDriver` + `SqlKeyValueStore`) y delega la creación del Repositorio,
 * Modelo y Controlador a la factoría compartida `createPresetStudioController`.
 */
export function createExpoAppController(
  config: ExpoContainerConfig = {}
): IPresetController {
  const apiBaseUrl =
    config.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://10.0.2.2:4000';

  const sqlDriver = new ExpoSqliteDriver('focus_scenes.db');

  return createPresetStudioController({
    store: new SqlEntityStoreDriver(sqlDriver),
    kv: new SqlKeyValueStore(sqlDriver),
    deviceId: 'android-expo-device',
    userId: config.userId ?? 'demo-user',
    apiBaseUrl
  });
}
