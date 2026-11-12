import {
  HttpSyncTransport,
  HybridSyncRepository,
  SqlEntityStoreDriver,
  SqlKeyValueStore
} from '@framework/data';
import {
  EXAMPLE_APP_ID,
  PRESET_ENTITY_NAME,
  PresetController,
  PresetModel,
  type IPresetController,
  type PresetEntity
} from '@framework/example-domain';
import { ExpoSqliteDriver } from '@framework/expo-adapter';

export interface ExpoContainerConfig {
  apiBaseUrl?: string;
  userId?: string;
}

export function createExpoAppController(
  config: ExpoContainerConfig = {}
): IPresetController {
  const apiBaseUrl =
    config.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://10.0.2.2:4000';
  const userId = config.userId ?? 'demo-user';

  const sqlDriver = new ExpoSqliteDriver('focus_scenes.db');
  const entityStore = new SqlEntityStoreDriver(sqlDriver);
  const kvStore = new SqlKeyValueStore(sqlDriver);
  const transport = new HttpSyncTransport({ baseUrl: apiBaseUrl });

  const repository = new HybridSyncRepository<PresetEntity>({
    appId: EXAMPLE_APP_ID,
    userId,
    deviceId: 'android-expo-device',
    entityName: PRESET_ENTITY_NAME,
    store: entityStore,
    kv: kvStore,
    transport,
    defaultMode: 'local',
    defaultPlan: 'free'
  });

  const model = new PresetModel(repository);
  return new PresetController(model);
}

