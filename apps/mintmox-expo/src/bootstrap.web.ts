import {
  WebLocalStorageEntityStore,
  WebStorageKeyValueStore
} from '@framework/data';
import { createMintmoxController, type IMintmoxController } from './mvc';

export interface MintMoxBootstrapOptions {
  userId?: string;
}

export type MTGInvestBootstrapOptions = MintMoxBootstrapOptions;

/**
 * Composition Root Web para `expo start --web` (@framework/mintmox-expo).
 * Metro resuelve automáticamente este archivo `.web.ts` en el navegador,
 * delegando en localStorage tras IEntityStoreDriver para previsualización web inmediata.
 */
export function createMintMoxExpoController(
  options: MintMoxBootstrapOptions = {}
): IMintmoxController {
  return createMintmoxController({
    store: new WebLocalStorageEntityStore('mintmox_expo_web'),
    kv: new WebStorageKeyValueStore('mintmox_expo_web_kv'),
    deviceId: 'mintmox-expo-web-preview',
    userId: options.userId ?? 'mintmox-user'
  });
}

export const createMTGInvestExpoController = createMintMoxExpoController;

