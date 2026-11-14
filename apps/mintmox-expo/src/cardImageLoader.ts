import { Platform } from 'react-native';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Cabeceras HTTP autorizadas para el CDN y API de Scryfall.
 * Esenciales en dispositivos móviles para que las peticiones nativas (OkHttp / Fresco en Android,
 * y NSURLSession en iOS) incluyan el User-Agent identificado y eviten el bloqueo 403 Forbidden de Cloudflare.
 */
export const SCRYFALL_IMAGE_HEADERS: Record<string, string> = {
  'User-Agent': 'MintMox/2026.11 (Mobile-App; Framework-Client)',
  Accept: 'image/webp,image/png,image/jpeg,image/*;q=0.8'
};

/**
 * Convierte un Uint8Array en string Base64 en JavaScript puro sin dependencias nativas.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = i + 1 < len ? (bytes[i + 1] ?? 0) : 0;
    const b2 = i + 2 < len ? (bytes[i + 2] ?? 0) : 0;
    result += BASE64_CHARS[b0 >> 2];
    result += BASE64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? BASE64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? BASE64_CHARS[b2 & 63] : '=';
  }
  return result;
}

const cardImageDataCache = new Map<string, string>();

/**
 * Devuelve la URL de menor resolución ('small') a partir de cualquier URL de Scryfall ('normal', 'large', 'png').
 * Esto reduce el peso de cada imagen de ~150-300KB a solo ~15-25KB, acelerando drásticamente la carga en redes móviles.
 */
export function getSmallImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.includes('/normal/')) {
    return trimmed.replace('/normal/', '/small/');
  }
  if (trimmed.includes('/large/')) {
    return trimmed.replace('/large/', '/small/');
  }
  if (trimmed.includes('/png/')) {
    return trimmed.replace('/png/', '/small/').replace(/\.png(\?.*)?$/i, '.jpg$1');
  }
  return trimmed;
}

// Control de concurrencia para peticiones JS de rescate (evita saturación y bloqueo por rate-limiting)
let activeDownloads = 0;
const MAX_CONCURRENT_DOWNLOADS = 3;
const downloadQueue: Array<() => void> = [];

function acquireDownloadSlot(): Promise<void> {
  if (activeDownloads < MAX_CONCURRENT_DOWNLOADS) {
    activeDownloads++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    downloadQueue.push(() => {
      activeDownloads++;
      resolve();
    });
  });
}

function releaseDownloadSlot(): void {
  activeDownloads--;
  if (downloadQueue.length > 0) {
    const next = downloadQueue.shift();
    if (next) next();
  }
}

/**
 * Resuelve una URL remota de Scryfall a un Data URI base64 en memoria como mecanismo de rescate (fallback).
 * Utiliza fetch con signal de timeout y decodificación directa por ArrayBuffer (sin el problemático FileReader de React Native).
 */
export async function loadCardImageAsDataUri(remoteUrl: string): Promise<string> {
  const trimmed = remoteUrl.trim();
  if (!trimmed) {
    throw new Error('URL de imagen vacía');
  }

  // En caché en memoria para visualización inmediata en subsecuentes visitas
  if (cardImageDataCache.has(trimmed)) {
    return cardImageDataCache.get(trimmed)!;
  }

  // En navegador web tradicional, la URL directa es gestionada limpiamente por el navegador
  if (Platform.OS === 'web') {
    return trimmed;
  }

  // Intentamos primero la versión optimizada /small/ para ahorrar ancho de banda
  const smallUrl = getSmallImageUrl(trimmed) ?? trimmed;
  const candidates = smallUrl !== trimmed ? [smallUrl, trimmed] : [trimmed];

  await acquireDownloadSlot();
  try {
    let lastError: unknown = null;

    for (const url of candidates) {
      const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = setTimeout(() => {
        try {
          abortController?.abort();
        } catch {}
      }, 7000);

      try {
        const response = await fetch(url, {
          signal: abortController?.signal,
          headers: SCRYFALL_IMAGE_HEADERS
        });

        if (!response.ok) {
          throw new Error(`Scryfall CDN HTTP ${response.status}`);
        }

        if (typeof response.arrayBuffer === 'function') {
          const buffer = await response.arrayBuffer();
          const base64 = uint8ArrayToBase64(new Uint8Array(buffer));
          const mime = response.headers.get('content-type') || 'image/jpeg';
          const dataUri = `data:${mime};base64,${base64}`;
          cardImageDataCache.set(trimmed, dataUri);
          return dataUri;
        }
      } catch (err) {
        lastError = err;
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw lastError ?? new Error('No se pudo descargar la imagen de Scryfall');
  } finally {
    releaseDownloadSlot();
  }
}

/**
 * Limpia la caché en memoria si se requiere reintentar desde cero.
 */
export function clearCardImageCache(url?: string): void {
  if (url) {
    cardImageDataCache.delete(url.trim());
  } else {
    cardImageDataCache.clear();
  }
}
