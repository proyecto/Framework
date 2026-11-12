import {
  HttpSyncTransport,
  HybridSyncRepository,
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import {
  EXAMPLE_APP_ID,
  PRESET_ENTITY_NAME,
  PresetController,
  PresetModel,
  type IPresetController,
  type PresetEntity
} from '@framework/example-domain';

export function createWebAppController(
  apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000'
): IPresetController {
  const store = new WebLocalStorageEntityStore('focus_scenes_web');
  const kv = new WebStorageKeyValueStore('focus_scenes_web_kv');
  const transport = new HttpSyncTransport({ baseUrl: apiBaseUrl });

  const repository = new HybridSyncRepository<PresetEntity>({
    appId: EXAMPLE_APP_ID,
    userId: 'demo-user',
    deviceId: 'web-desktop-browser',
    entityName: PRESET_ENTITY_NAME,
    store,
    kv,
    transport,
    defaultMode: 'local',
    defaultPlan: 'free'
  });

  const model = new PresetModel(repository);
  return new PresetController(model);
}

