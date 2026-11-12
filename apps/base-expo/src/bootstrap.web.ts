import {
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import { createBaseAppController, type IBaseAppController } from './mvc';

export interface BaseExpoBootstrapOptions {
  apiBaseUrl?: string;
  userId?: string;
}

/**
 * **Composition Root Web** para `expo start --web` (`@framework/base-expo`).
 * Metro resuelve automáticamente este archivo `.web.ts` en el navegador, evitando cargar
 * WASM/COOP-COEP de `expo-sqlite` y delegando en `localStorage` tras `IEntityStoreDriver`.
 */
export function createBaseExpoController(
  options: BaseExpoBootstrapOptions = {}
): IBaseAppController {
  const apiBaseUrl =
    options.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    'http://127.0.0.1:4000';

  return createBaseAppController({
    store: new WebLocalStorageEntityStore('framework_base_expo_web'),
    kv: new WebStorageKeyValueStore('framework_base_expo_web_kv'),
    deviceId: 'base-expo-web-preview',
    userId: options.userId ?? 'base-user',
    apiBaseUrl
  });
}

