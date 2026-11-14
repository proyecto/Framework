/**
 * Tipos e interfaces oficiales para la integración con la API de Scryfall (https://scryfall.com/docs/api).
 * Diseñado según los principios SOLID (ISP - Interface Segregation Principle y DIP - Dependency Inversion)
 * para permitir desacoplamiento y extensibilidad futura (precios de mercado, autocompletado, legalidades y arte).
 */

export interface ScryfallImageUris {
  small?: string;
  normal?: string;
  large?: string;
  png?: string;
  artCrop?: string;
  borderCrop?: string;
}

export interface ScryfallCardFace {
  name: string;
  manaCost?: string;
  typeLine?: string;
  oracleText?: string;
  imageUris?: ScryfallImageUris;
}

export interface ScryfallPrices {
  eur?: string | null;
  eurFoil?: string | null;
  usd?: string | null;
  usdFoil?: string | null;
  tix?: string | null;
}

export interface ScryfallCardData {
  id: string;
  name: string;
  printedName?: string;
  lang: string;
  set: string;
  setName?: string;
  collectorNumber: string;
  scryfallUri?: string;
  rarity?: string;
  manaCost?: string;
  typeLine?: string;
  oracleText?: string;
  imageUris?: ScryfallImageUris;
  cardFaces?: ScryfallCardFace[];
  prices?: ScryfallPrices;
  digital?: boolean;
  games?: string[];
}

export interface ScryfallSearchResult {
  totalCards: number;
  hasMore: boolean;
  nextPage?: string;
  data: ScryfallCardData[];
}

export interface ScryfallNamedQuery {
  exact?: string;
  fuzzy?: string;
  set?: string;
}

export interface ScryfallSearchOptions {
  page?: number;
  unique?: 'cards' | 'art' | 'prints';
  order?: 'name' | 'set' | 'released' | 'rarity' | 'color' | 'usd' | 'eur';
  dir?: 'auto' | 'asc' | 'desc';
  paperOnly?: boolean;
}

export interface ScryfallCardIdentifier {
  id?: string;
  name?: string;
  set?: string;
  collector_number?: string;
}

export interface ScryfallCollectionResult {
  data: ScryfallCardData[];
  notFound: ScryfallCardIdentifier[];
}

/**
 * Interfaz de cliente API para Scryfall.
 * Permite desacoplar cualquier llamada externa y mockearla en pruebas sin red.
 */
export interface IScryfallApiClient {
  /**
   * Obtiene un lote masivo de cartas (hasta 75 por petición) mediante el endpoint oficial POST /cards/collection.
   * Documentación: https://scryfall.com/docs/api/cards/collection
   */
  getCardsCollection(identifiers: ScryfallCardIdentifier[]): Promise<ScryfallCollectionResult>;

  /**
   * Obtiene una carta por nombre exacto o aproximado (fuzzy), opcionalmente acotado por código de set.
   * Documentación: https://scryfall.com/docs/api/cards/named
   */
  getCardNamed(params: ScryfallNamedQuery): Promise<ScryfallCardData | null>;

  /**
   * Obtiene una carta por código de edición y número de coleccionista.
   * Documentación: https://scryfall.com/docs/api/cards
   */
  getCardBySetAndNumber(
    setCode: string,
    collectorNumber: string,
    lang?: string
  ): Promise<ScryfallCardData | null>;

  /**
   * Realiza una búsqueda avanzada con la sintaxis de Scryfall (ej: !"Relámpago" o "t:creature c:r").
   * Documentación: https://scryfall.com/docs/api/cards/search
   */
  searchCards(query: string, options?: ScryfallSearchOptions): Promise<ScryfallSearchResult>;

  /**
   * Sugerencias de autocompletado en tiempo real para nombres de cartas.
   * Documentación: https://scryfall.com/docs/api/cards/autocomplete
   */
  autocompleteCardNames(query: string): Promise<string[]>;

  /**
   * Resuelve de forma inteligente la mejor URL de imagen / arte para una carta de nuestro inventario.
   * Aplica fallback en cascada (nombre en inglés + set, título + set, nombre global, búsqueda Scryfall).
   */
  resolveCardImageUrl(card: {
    title: string;
    nameEn?: string;
    editionCode?: string;
    language?: string;
  }): Promise<string | null>;
}

