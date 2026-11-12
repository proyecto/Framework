import {
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import { createBaseAppController, type IBaseAppController } from './mvc';

/**
 * **Composition Root** de la App Base en navegador Web (`@framework/base-web`).
 * Conecta `WebLocalStorageEntityStore` y `WebStorageKeyValueStore` con `HybridSyncRepository`.
 */
export function createBaseWebController(
  apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000'
): IBaseAppController {
  return createBaseAppController({
    store: new WebLocalStorageEntityStore('framework_base_web'),
    kv: new WebStorageKeyValueStore('framework_base_web_kv'),
    deviceId: 'base-web-desktop',
    userId: 'base-user',
    apiBaseUrl
  });
}

