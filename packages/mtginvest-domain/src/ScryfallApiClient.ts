import type {
  IScryfallApiClient,
  ScryfallCardData,
  ScryfallCardIdentifier,
  ScryfallCollectionResult,
  ScryfallImageUris,
  ScryfallNamedQuery,
  ScryfallSearchOptions,
  ScryfallSearchResult
} from './scryfall.js';

export type HttpFetchFn = (
  input: string,
  init?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<any>;
}>;

export interface ScryfallClientConfig {
  baseUrl?: string;
  userAgent?: string;
  rateLimitMs?: number;
  fetchFn?: HttpFetchFn;
}

function getGlobalFetch(): HttpFetchFn {
  const g = globalThis as { fetch?: HttpFetchFn };
  if (typeof g.fetch === 'function') {
    return g.fetch.bind(globalThis);
  }
  return async () => ({
    ok: false,
    status: 500,
    json: async () => ({ error: 'fetch not available' })
  });
}

function delay(ms: number): Promise<void> {
  const g = globalThis as { setTimeout?: (fn: () => void, ms: number) => any };
  if (typeof g.setTimeout === 'function') {
    return new Promise((resolve) => g.setTimeout!(resolve, ms));
  }
  return Promise.resolve();
}

function mapImageUris(raw?: Record<string, string | undefined>): ScryfallImageUris | undefined {
  if (!raw) return undefined;
  return {
    small: raw.small,
    normal: raw.normal,
    large: raw.large,
    png: raw.png,
    artCrop: raw.art_crop,
    borderCrop: raw.border_crop
  };
}

function mapScryfallCard(raw: any): ScryfallCardData {
  const cardFaces = Array.isArray(raw.card_faces)
    ? raw.card_faces.map((f: any) => ({
        name: f.name,
        manaCost: f.mana_cost,
        typeLine: f.type_line,
        oracleText: f.oracle_text,
        imageUris: mapImageUris(f.image_uris)
      }))
    : undefined;

  const prices = raw.prices
    ? {
        eur: raw.prices.eur ?? null,
        eurFoil: raw.prices.eur_foil ?? null,
        usd: raw.prices.usd ?? null,
        usdFoil: raw.prices.usd_foil ?? null,
        tix: raw.prices.tix ?? null
      }
    : undefined;

  return {
    id: raw.id,
    name: raw.name,
    printedName: raw.printed_name,
    lang: raw.lang,
    set: raw.set,
    setName: raw.set_name,
    collectorNumber: raw.collector_number,
    scryfallUri: raw.scryfall_uri,
    rarity: raw.rarity,
    manaCost: raw.mana_cost,
    typeLine: raw.type_line,
    oracleText: raw.oracle_text,
    imageUris: mapImageUris(raw.image_uris),
    cardFaces,
    prices
  };
}

/**
 * Implementación canónica del cliente API de Scryfall (`IScryfallApiClient`).
 * Cumple con las pautas de Scryfall (User-Agent amigable, 50-100ms de limitación de tasa y caché).
 */
export class ScryfallApiClient implements IScryfallApiClient {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly rateLimitMs: number;
  private readonly fetchFn: HttpFetchFn;
  private lastRequestTime = 0;
  private readonly cache = new Map<string, Promise<any>>();

  constructor(config: ScryfallClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'https://api.scryfall.com';
    this.userAgent = config.userAgent ?? 'MTGInvest/2026.11 (Framework-App)';
    this.rateLimitMs = config.rateLimitMs ?? 75;
    this.fetchFn = config.fetchFn ?? getGlobalFetch();
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLast = now - this.lastRequestTime;
    if (timeSinceLast < this.rateLimitMs) {
      await delay(this.rateLimitMs - timeSinceLast);
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Detecta si el entorno es un navegador o React Native (Hermes / JSC / Web),
   * donde el estándar Fetch y XHR prohíben explícitamente definir la cabecera 'User-Agent'
   * lanzando un TypeError: Refused to set unsafe header "User-Agent".
   */
  private isBrowserOrReactNative(): boolean {
    const g = globalThis as any;
    if (typeof g.window !== 'undefined') return true;
    if (typeof g.navigator !== 'undefined' && typeof g.navigator.product === 'string') return true;
    if (typeof g.__fbBatchedBridge !== 'undefined' || typeof g.HermesInternal !== 'undefined') return true;
    return false;
  }

  /**
   * Ejecuta una petición HTTP con manejo inteligente de cabeceras seguras para móvil y web.
   */
  private async executeFetch(
    url: string,
    init: { method?: string; body?: string; headers?: Record<string, string> } = {}
  ): Promise<{ ok: boolean; status: number; json(): Promise<any> }> {
    const isRestricted = this.isBrowserOrReactNative();
    const headers: Record<string, string> = {
      Accept: 'application/json;q=0.9,*/*;q=0.8',
      ...(init.headers ?? {})
    };

    // Solo inyectamos User-Agent manual en Node.js, CLI o entornos de servidor donde está permitido
    if (!isRestricted && this.userAgent && !headers['User-Agent']) {
      headers['User-Agent'] = this.userAgent;
    }

    try {
      return await this.fetchFn(url, { ...init, headers });
    } catch (error) {
      // Si el fetch falló por cabecera no permitida (Refused to set unsafe header "User-Agent"), reintentamos sin ella
      if (headers['User-Agent']) {
        const cleanHeaders = { ...headers };
        delete cleanHeaders['User-Agent'];
        return await this.fetchFn(url, { ...init, headers: cleanHeaders });
      }
      throw error;
    }
  }

  private async fetchJson<T>(url: string): Promise<T | null> {
    if (this.cache.has(url)) {
      return this.cache.get(url) as Promise<T | null>;
    }

    const requestPromise = (async () => {
      await this.throttle();
      try {
        const response = await this.executeFetch(url);
        if (response.status === 404 || !response.ok) {
          return null;
        }
        const json = await response.json();
        return json as T;
      } catch {
        // En caso de fallo de red o timeout, retorna null sin lanzar excepción
        return null;
      }
    })();

    this.cache.set(url, requestPromise);
    return requestPromise;
  }

  async getCardsCollection(identifiers: ScryfallCardIdentifier[]): Promise<ScryfallCollectionResult> {
    if (!identifiers || identifiers.length === 0) {
      return { data: [], notFound: [] };
    }

    const BATCH_SIZE = 75; // Límite de Scryfall en POST /cards/collection
    const allData: ScryfallCardData[] = [];
    const allNotFound: ScryfallCardIdentifier[] = [];

    for (let i = 0; i < identifiers.length; i += BATCH_SIZE) {
      const chunk = identifiers.slice(i, i + BATCH_SIZE);
      await this.throttle();

      try {
        const response = await this.executeFetch(`${this.baseUrl}/cards/collection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ identifiers: chunk })
        });

        if (response.ok) {
          const json = await response.json();
          if (json && Array.isArray(json.data)) {
            for (const item of json.data) {
              allData.push(mapScryfallCard(item));
            }
          }
          if (json && Array.isArray(json.not_found)) {
            for (const nf of json.not_found) {
              allNotFound.push(nf);
            }
          }
        }
      } catch {
        // En caso de fallo de red en un lote, devolvemos lo acumulado
      }
    }

    return {
      data: allData,
      notFound: allNotFound
    };
  }

  async getCardNamed(params: ScryfallNamedQuery): Promise<ScryfallCardData | null> {
    const queryParts: string[] = [];
    if (params.exact) {
      queryParts.push(`exact=${encodeURIComponent(params.exact)}`);
    } else if (params.fuzzy) {
      queryParts.push(`fuzzy=${encodeURIComponent(params.fuzzy)}`);
    } else {
      return null;
    }

    if (params.set) {
      queryParts.push(`set=${encodeURIComponent(params.set.toLowerCase())}`);
    }

    const url = `${this.baseUrl}/cards/named?${queryParts.join('&')}`;
    const raw = await this.fetchJson<any>(url);
    if (!raw || raw.object === 'error') {
      return null;
    }
    return mapScryfallCard(raw);
  }

  async getCardBySetAndNumber(
    setCode: string,
    collectorNumber: string,
    lang?: string
  ): Promise<ScryfallCardData | null> {
    const cleanSet = encodeURIComponent(setCode.toLowerCase());
    const cleanNum = encodeURIComponent(collectorNumber);
    const url = lang
      ? `${this.baseUrl}/cards/${cleanSet}/${cleanNum}/${encodeURIComponent(lang.toLowerCase())}`
      : `${this.baseUrl}/cards/${cleanSet}/${cleanNum}`;

    const raw = await this.fetchJson<any>(url);
    if (!raw || raw.object === 'error') {
      return null;
    }
    return mapScryfallCard(raw);
  }

  async searchCards(query: string, options?: ScryfallSearchOptions): Promise<ScryfallSearchResult> {
    const queryParts: string[] = [`q=${encodeURIComponent(query)}`];
    if (options?.page) {
      queryParts.push(`page=${options.page}`);
    }
    if (options?.order) {
      queryParts.push(`order=${options.order}`);
    }
    if (options?.dir) {
      queryParts.push(`dir=${options.dir}`);
    }
    if (options?.unique) {
      queryParts.push(`unique=${options.unique}`);
    }

    const url = `${this.baseUrl}/cards/search?${queryParts.join('&')}`;
    const raw = await this.fetchJson<any>(url);
    if (!raw || raw.object === 'error' || !Array.isArray(raw.data)) {
      return { totalCards: 0, hasMore: false, data: [] };
    }

    return {
      totalCards: raw.total_cards ?? raw.data.length,
      hasMore: Boolean(raw.has_more),
      nextPage: raw.next_page,
      data: raw.data.map(mapScryfallCard)
    };
  }

  async autocompleteCardNames(query: string): Promise<string[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];
    const url = `${this.baseUrl}/cards/autocomplete?q=${encodeURIComponent(cleanQuery)}`;
    const raw = await this.fetchJson<any>(url);
    if (!raw || !Array.isArray(raw.data)) {
      return [];
    }
    return raw.data as string[];
  }

  /**
   * Resuelve la mejor URL de imagen para una carta de nuestro catálogo.
   * Aplica un algoritmo de resolución multinivel con tolerancia a idiomas y sets.
   */
  async resolveCardImageUrl(card: {
    title: string;
    nameEn?: string;
    editionCode?: string;
    language?: string;
  }): Promise<string | null> {
    const englishName = card.nameEn?.trim();
    const primaryName = card.title.trim();
    const setCode = card.editionCode?.trim().toLowerCase();

    // 1. Prioridad: Nombre original en inglés + Código de edición exacto
    if (englishName && setCode) {
      const match = await this.getCardNamed({ fuzzy: englishName, set: setCode });
      const img = this.extractImage(match);
      if (img) return img;
    }

    // 2. Segunda opción: Título de la carta + Código de edición
    if (setCode) {
      const match = await this.getCardNamed({ fuzzy: primaryName, set: setCode });
      const img = this.extractImage(match);
      if (img) return img;
    }

    // 3. Fallback: Nombre original en inglés sin restricción de edición
    if (englishName) {
      const match = await this.getCardNamed({ fuzzy: englishName });
      const img = this.extractImage(match);
      if (img) return img;
    }

    // 4. Fallback: Título sin restricción de edición
    {
      const match = await this.getCardNamed({ fuzzy: primaryName });
      const img = this.extractImage(match);
      if (img) return img;
    }

    // 5. Fallback avanzado: Búsqueda libre en Scryfall (soporta cartas impresas en otros idiomas)
    const searchQuery = englishName
      ? `!"${englishName}"`
      : `!"${primaryName}" lang:any`;
    const searchRes = await this.searchCards(searchQuery);
    if (searchRes.data.length > 0) {
      const img = this.extractImage(searchRes.data[0]);
      if (img) return img;
    }

    return null;
  }

  private extractImage(card: ScryfallCardData | null | undefined): string | null {
    if (!card) return null;
    return (
      card.imageUris?.normal ??
      card.imageUris?.large ??
      card.imageUris?.artCrop ??
      card.imageUris?.small ??
      card.imageUris?.png ??
      card.cardFaces?.[0]?.imageUris?.normal ??
      card.cardFaces?.[0]?.imageUris?.large ??
      card.cardFaces?.[0]?.imageUris?.artCrop ??
      null
    );
  }
}
