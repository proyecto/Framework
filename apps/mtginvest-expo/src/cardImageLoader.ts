import { Platform } from 'react-native';

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

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
 * Devuelve la URL de menor resolución ('small') a partir de una URL de Scryfall ('normal').
 * Esto optimiza el consumo de datos y la velocidad de carga de miniaturas en la lista y cuadrícula.
 */
export function getSmallImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed.includes('/normal/')) {
    return trimmed.replace('/normal/', '/small/');
  }
  return trimmed;
}

/**
 * Resuelve una URL remota de Scryfall a una URI segura y mostrable.
 * En navegadores web, devuelve la URL remota directamente (el navegador envía su User-Agent estándar).
 * En dispositivos móviles (React Native Android e iOS), descarga la imagen usando JavaScript `fetch`
 * con cabecera `User-Agent` de MTGInvest y la convierte a un Data URI base64 local, evitando que el
 * motor nativo (Fresco/OkHttp) sufra un bloqueo 403 Forbidden por parte de Cloudflare / Scryfall.
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

  // En navegador web tradicional, no hay problemas de cabeceras en tags de imagen
  if (Platform.OS === 'web') {
    return trimmed;
  }

  // Intentamos primero la URL solicitada, y si falla y es /normal/, intentamos /small/
  const candidates = [trimmed];
  if (trimmed.includes('/normal/')) {
    candidates.push(trimmed.replace('/normal/', '/small/'));
  }

  const userAgent = 'MTGInvest/2026.11 (Mobile-App; Framework-Client)';
  const accept = 'image/webp,image/png,image/jpeg,image/*;q=0.8';

  let lastError: unknown = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          Accept: accept
        }
      });

      if (!response.ok) {
        throw new Error(`Scryfall CDN HTTP ${response.status}`);
      }

      // Método 1: FileReader con Blob (estándar en React Native BlobModule)
      if (typeof (globalThis as any).FileReader !== 'undefined') {
        try {
          const blob = await response.blob();
          const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new (globalThis as any).FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader devolvió resultado vacío'));
              }
            };
            reader.onerror = () => reject(reader.error ?? new Error('Error en FileReader'));
            reader.readAsDataURL(blob);
          });

          cardImageDataCache.set(trimmed, dataUri);
          return dataUri;
        } catch {
          // Continuar al método 2 si FileReader falla
        }
      }

      // Método 2: ArrayBuffer -> Base64 con encoder JS puro
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
    }
  }

  // Método 3: Fallback usando XMLHttpRequest nativo
  if (typeof (globalThis as any).XMLHttpRequest !== 'undefined') {
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const xhr = new (globalThis as any).XMLHttpRequest();
        xhr.open('GET', candidates[0], true);
        xhr.responseType = 'blob';
        try {
          xhr.setRequestHeader('User-Agent', userAgent);
          xhr.setRequestHeader('Accept', accept);
        } catch {
          // Ignorar si el runtime restringe cabeceras en XHR
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
            const reader = new (globalThis as any).FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('XHR FileReader devolvió resultado vacío'));
              }
            };
            reader.onerror = () => reject(xhr.statusText || new Error('XHR reader error'));
            reader.readAsDataURL(xhr.response);
          } else {
            reject(new Error(`XHR HTTP ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('XHR falló en la petición'));
        xhr.send();
      });

      cardImageDataCache.set(trimmed, dataUri);
      return dataUri;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('No se pudo convertir la imagen de Scryfall a Data URI');
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
