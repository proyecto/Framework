import {
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import { createMtginvestController, type IMtginvestController } from './mvc';

export interface MTGInvestBootstrapOptions {
  userId?: string;
}

/**
 * Composition Root Web para `expo start --web` (@framework/mtginvest-expo).
 * Metro resuelve automáticamente este archivo `.web.ts` en el navegador,
 * delegando en localStorage tras IEntityStoreDriver para previsualización web inmediata.
 */
export function createMTGInvestExpoController(
  options: MTGInvestBootstrapOptions = {}
): IMtginvestController {
  return createMtginvestController({
    store: new WebLocalStorageEntityStore('mtginvest_expo_web'),
    kv: new WebStorageKeyValueStore('mtginvest_expo_web_kv'),
    deviceId: 'mtginvest-expo-web-preview',
    userId: options.userId ?? 'mtginvest-user'
  });
}

