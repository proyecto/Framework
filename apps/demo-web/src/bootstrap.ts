import {
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import {
  createPresetStudioController,
  type IPresetController
} from '@framework/example-domain';

/**
 * **Composition Root** específica para navegador Web (`apps/demo-web`).
 *
 * Conecta el almacenamiento local del navegador (`WebLocalStorageEntityStore` y
 * `WebStorageKeyValueStore`) con la MISMA factoría compartida `createPresetStudioController`
 * que utiliza Android Expo (`apps/demo-expo`).
 */
export function createWebAppController(
  apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000'
): IPresetController {
  return createPresetStudioController({
    store: new WebLocalStorageEntityStore('focus_scenes_web'),
    kv: new WebStorageKeyValueStore('focus_scenes_web_kv'),
    deviceId: 'web-desktop-browser',
    userId: 'demo-user',
    apiBaseUrl
  });
}
