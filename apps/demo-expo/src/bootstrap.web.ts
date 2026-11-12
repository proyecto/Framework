import {
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import {
  createPresetStudioController,
  type IPresetController
} from '@framework/example-domain';

export interface ExpoContainerConfig {
  apiBaseUrl?: string;
  userId?: string;
}

/**
 * **Composition Root Web** para `expo start --web` (`@framework/demo-expo`).
 * Permite probar la app Expo completa directamente en el navegador sin Android ni WASM.
 */
export function createExpoAppController(
  config: ExpoContainerConfig = {}
): IPresetController {
  const apiBaseUrl =
    config.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://127.0.0.1:4000';

  return createPresetStudioController({
    store: new WebLocalStorageEntityStore('focus_scenes_expo_web'),
    kv: new WebStorageKeyValueStore('focus_scenes_expo_web_kv'),
    deviceId: 'demo-expo-web-preview',
    userId: config.userId ?? 'demo-user',
    apiBaseUrl
  });
}
