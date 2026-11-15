import { escapeCsvCell, parseCsvRows, ValidationError } from '@framework/core';
import { type CardEntity, type CardMarketPrices, type CreateCardInput, getCardCollections } from './contracts.js';
import { normalizeCardCondition } from './conditionMultipliers.js';
import { findMtgSetByCode, findMtgSetByName } from './sets.js';

export interface DetectedImportResult {
  format: 'json' | 'csv' | 'decklist';
  sourceApp: string;
  cards: CreateCardInput[];
}

/**
 * Normaliza nombres o códigos de idioma a código de 2/3 letras estándar (EN, ES, FR, etc.).
 */
export function normalizeLanguageCode(lang?: string | null): string {
  if (!lang) return 'EN';
  const clean = lang.trim().toLowerCase();
  if (clean === 'en' || clean === 'english' || clean === 'inglés' || clean === 'ingles') return 'EN';
  if (clean === 'es' || clean === 'spanish' || clean === 'español' || clean === 'espanol') return 'ES';
  if (clean === 'fr' || clean === 'french' || clean === 'francés' || clean === 'frances') return 'FR';
  if (clean === 'de' || clean === 'german' || clean === 'alemán' || clean === 'aleman') return 'DE';
  if (clean === 'it' || clean === 'italian' || clean === 'italiano') return 'IT';
  if (clean === 'pt' || clean === 'portuguese' || clean === 'portugués' || clean === 'portugues') return 'PT';
  if (clean === 'ja' || clean === 'jp' || clean === 'japanese' || clean === 'japonés' || clean === 'japones') return 'JA';
  if (clean === 'ko' || clean === 'kr' || clean === 'korean' || clean === 'coreano') return 'KO';
  if (clean === 'ru' || clean === 'russian' || clean === 'ruso') return 'RU';
  if (clean === 'zhs' || clean === 'cs' || clean === 'chinese' || clean === 'chino' || clean === 'simplified chinese') return 'ZHS';
  if (clean === 'zht' || clean === 'ct' || clean === 'traditional chinese') return 'ZHT';
  return lang.trim().toUpperCase().slice(0, 3);
}

/**
 * Detecta si una celda indica que la carta es foil (soporta ManaBox, Dragon Shield, Cardmarket, TCGplayer, etc.).
 */
export function parseFoilValue(v: string | undefined): boolean {
  if (!v) return false;
  const clean = v.trim().toLowerCase();
  return (
    clean === 'true' ||
    clean === '1' ||
    clean === 'yes' ||
    clean === 'si' ||
    clean === 'sí' ||
    clean === 'foil' ||
    clean === 'etched' ||
    clean === 'x'
  );
}

/**
 * Detecta automáticamente la aplicación de origen a partir de los encabezados de un archivo CSV.
 */
export function detectSourceAppFromHeaders(headerMap: Map<string, number>): string {
  const has = (...keys: string[]) =>
    keys.some((k) => headerMap.has(k.toLowerCase().replace(/[^a-z0-9]/g, '')));

  if (has('manaboxid') || (has('scryfallid') && (has('bindername') || has('purchaseprice')))) {
    return 'ManaBox';
  }
  if (has('proxy') || has('lastmodified') || (has('alter') && !has('artistproof'))) {
    return 'Moxfield';
  }
  if (has('delver') || (has('scryfallid') && (has('collectorsnumber') || has('editioncode')))) {
    return 'Delver Lens';
  }
  if (has('cardname') && has('foldername') && (has('printing') || has('boughtprice'))) {
    return 'Dragon Shield MTG';
  }
  if (has('tradelistcount') || has('artistproof') || has('alteredart')) {
    return 'Deckbox';
  }
  if (has('productname') || (has('expansion') && (has('foil') || has('signed')))) {
    return 'Cardmarket';
  }
  if (has('simplename') || (has('marketprice') && has('printing'))) {
    return 'TCGplayer';
  }
  if (has('category') && has('tags')) {
    return 'Archidekt';
  }
  if (has('title') && has('nameen')) {
    return 'MintMox';
  }
  return 'CSV estándar';
}

/**
 * Exporta una lista de cartas a formato JSON estructurado y legible.
 */
export function exportCardsToJson(cards: CardEntity[]): string {
  const payload = {
    app: 'MintMox',
    version: '2026.11',
    exportedAt: new Date().toISOString(),
    totalCards: cards.length,
    cards: cards.map((c) => ({
      title: c.title,
      nameEn: c.nameEn ?? null,
      edition: c.edition,
      editionCode: c.editionCode ?? null,
      language: c.language ?? 'EN',
      quantity: c.quantity ?? 1,
      currentPrice: c.currentPrice,
      previousPrice: c.previousPrice,
      buyPrice: c.buyPrice ?? c.previousPrice,
      isFoil: Boolean(c.isFoil),
      isAltered: Boolean(c.isAltered),
      isSigned: Boolean(c.isSigned),
      condition: c.condition ?? 'NM',
      imageUrl: c.imageUrl ?? null,
      scryfallId: c.scryfallId ?? null,
      collection: getCardCollections(c).join(', '),
      collections: getCardCollections(c),
      priceHistory: c.priceHistory ?? [],
      lastPriceSyncDate: c.lastPriceSyncDate ?? null
    }))
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Exporta una lista de cartas a formato CSV estándar (RFC 4180).
 */
export function exportCardsToCsv(cards: CardEntity[]): string {
  const headers = [
    'title',
    'nameEn',
    'edition',
    'editionCode',
    'language',
    'quantity',
    'currentPrice',
    'previousPrice',
    'buyPrice',
    'cardmarketPrice',
    'tcgplayerPrice',
    'cardKingdomPrice',
    'manaPoolPrice',
    'isFoil',
    'isAltered',
    'isSigned',
    'condition',
    'imageUrl',
    'scryfallId',
    'collection',
    'lastPriceSyncDate'
  ];

  const rows = cards.map((c) => [
    escapeCsvCell(c.title),
    escapeCsvCell(c.nameEn ?? ''),
    escapeCsvCell(c.edition),
    escapeCsvCell(c.editionCode ?? ''),
    escapeCsvCell(c.language ?? 'EN'),
    escapeCsvCell(c.quantity ?? 1),
    escapeCsvCell(c.currentPrice),
    escapeCsvCell(c.previousPrice),
    escapeCsvCell(c.buyPrice ?? c.previousPrice),
    escapeCsvCell(c.marketPrices?.cardmarket ?? c.currentPrice),
    escapeCsvCell(c.marketPrices?.tcgplayer ?? ''),
    escapeCsvCell(c.marketPrices?.cardKingdom ?? ''),
    escapeCsvCell(c.marketPrices?.manapool ?? ''),
    escapeCsvCell(c.isFoil ? 'true' : 'false'),
    escapeCsvCell(c.isAltered ? 'true' : 'false'),
    escapeCsvCell(c.isSigned ? 'true' : 'false'),
    escapeCsvCell(c.condition ?? 'NM'),
    escapeCsvCell(c.imageUrl ?? ''),
    escapeCsvCell(c.scryfallId ?? ''),
    escapeCsvCell(getCardCollections(c).join('; ')),
    escapeCsvCell(c.lastPriceSyncDate ?? '')
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Parsea e interpreta un contenido JSON a una lista de cartas válidas para inserción.
 * Soporta tanto arrays planos como objetos estructurados `{ cards: [...] }`.
 */
export function parseCardsFromJson(jsonStr: string): CreateCardInput[] {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr.trim());
  } catch {
    throw new ValidationError('El contenido no es un JSON válido.');
  }

  const rawList = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.cards)
    ? parsed.cards
    : Array.isArray(parsed?.items)
    ? parsed.items
    : null;

  if (!rawList || rawList.length === 0) {
    throw new ValidationError('El JSON no contiene un array o lista de cartas reconocido.');
  }

  const result: CreateCardInput[] = [];

  for (const item of rawList) {
    if (!item || typeof item !== 'object') continue;

    const title = String(item.title ?? item.name ?? item.nombre ?? '').trim();
    if (!title) continue;

    const nameEn = item.nameEn ?? item.name_en ?? item.englishName ?? item.nombre_en;
    let edition = item.edition ?? item.set ?? item.setName ?? item.edicion ?? 'General';
    let editionCode = item.editionCode ?? item.setCode ?? item.set_code ?? item.code ?? item.codigo;
    const language = normalizeLanguageCode(item.language ?? item.lang ?? item.idioma ?? 'EN');
    const quantity = Math.max(1, parseInt(String(item.quantity ?? item.qty ?? item.cantidad ?? item.count ?? 1), 10) || 1);

    const parseNum = (v: any) => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') return parseFloat(v.replace(',', '.')) || 0;
      return 0;
    };

    const currentPrice = parseNum(item.currentPrice ?? item.current_price ?? item.price ?? item.precio);
    const previousPrice = parseNum(
      item.previousPrice ?? item.previous_price ?? item.buyPrice ?? item.precioCompra ?? currentPrice
    );
    const buyPrice =
      item.buyPrice !== undefined || item.precioCompra !== undefined
        ? parseNum(item.buyPrice ?? item.precioCompra)
        : previousPrice;
    const isFoil = parseFoilValue(String(item.isFoil ?? item.foil ?? item.brillante ?? item.printing ?? ''));
    const isAltered = Boolean(item.isAltered ?? item.altered ?? item.alterada ?? item.alter);
    const isSigned = Boolean(item.isSigned ?? item.signed ?? item.firmada);
    const condition = normalizeCardCondition(item.condition ?? item.estado ?? 'NM');

    // Resolución automática de edición/código si falta alguno
    if (editionCode && (!edition || edition === 'General')) {
      const found = findMtgSetByCode(String(editionCode));
      if (found) edition = found.name;
    } else if (edition && !editionCode) {
      const found = findMtgSetByName(String(edition));
      if (found) editionCode = found.code;
    }

    const scryfallId = item.scryfallId ?? item.scryfall_id ?? undefined;
    let imageUrl = item.imageUrl ?? item.image_url ?? undefined;
    if (!imageUrl && scryfallId && typeof scryfallId === 'string' && scryfallId.length > 8) {
      imageUrl = `https://cards.scryfall.io/normal/front/${scryfallId.charAt(0)}/${scryfallId.charAt(1)}/${scryfallId}.jpg`;
    }

    result.push({
      title,
      nameEn: nameEn ? String(nameEn).trim() : (language === 'EN' ? title : undefined),
      edition: edition ? String(edition).trim() : 'General',
      editionCode: editionCode ? String(editionCode).trim().toUpperCase() : undefined,
      language,
      quantity,
      currentPrice,
      previousPrice,
      buyPrice,
      isFoil,
      isAltered,
      isSigned,
      condition,
      imageUrl,
      scryfallId,
      collection: getCardCollections(item).join(', '),
      collections: getCardCollections(item),
      priceHistory: Array.isArray(item.priceHistory) ? item.priceHistory : [],
      lastPriceSyncDate: item.lastPriceSyncDate ?? undefined
    });
  }

  if (result.length === 0) {
    throw new ValidationError('No se encontraron cartas con nombre válido en el JSON.');
  }

  return result;
}

/**
 * Parsea un CSV de cartas MTG asociando cabeceras flexibles en inglés y español con soporte
 * para ManaBox, Moxfield, Delver Lens, Dragon Shield, Deckbox, Cardmarket, TCGplayer y Archidekt.
 */
export function parseCardsFromCsvWithMetadata(csvStr: string): { cards: CreateCardInput[]; sourceApp: string } {
  const rows = parseCsvRows(csvStr);
  if (rows.length < 2) {
    throw new ValidationError('El CSV debe contener al menos una fila de cabeceras y una fila de datos.');
  }

  const rawHeaders = rows[0]!;
  const headerMap = new Map<string, number>();

  for (let idx = 0; idx < rawHeaders.length; idx++) {
    const h = rawHeaders[idx]!.toLowerCase().replace(/[^a-z0-9]/g, '');
    headerMap.set(h, idx);
  }

  const findIdx = (...candidates: string[]): number => {
    for (const c of candidates) {
      const norm = c.toLowerCase().replace(/[^a-z0-9]/g, '');
      const found = headerMap.get(norm);
      if (found !== undefined) return found;
    }
    return -1;
  };

  const titleIdx = findIdx('title', 'name', 'nombre', 'carta', 'card', 'cardname', 'productname', 'simplename');
  if (titleIdx === -1) {
    throw new ValidationError('El CSV debe incluir una columna con el nombre de la carta (name, title, card name o nombre).');
  }

  const sourceApp = detectSourceAppFromHeaders(headerMap);

  const nameEnIdx = findIdx('nameen', 'name_en', 'englishname', 'nombreen', 'original_name', 'english_name');
  const editionIdx = findIdx('edition', 'set', 'edicion', 'setname', 'expansion', 'expansionname');
  const editionCodeIdx = findIdx('editioncode', 'edition_code', 'setcode', 'code', 'codigo', 'set_code');
  const langIdx = findIdx('language', 'lang', 'idioma');
  const qtyIdx = findIdx('quantity', 'qty', 'cantidad', 'copias', 'count', 'amount');
  const currentPriceIdx = findIdx(
    'currentprice',
    'current_price',
    'price',
    'precio',
    'valor',
    'precioactual',
    'marketprice',
    'market_price',
    'avgprice'
  );
  const prevPriceIdx = findIdx('previousprice', 'previous_price');
  const buyPriceIdx = findIdx(
    'buyprice',
    'buy_price',
    'preciocompra',
    'compra',
    'coste',
    'purchaseprice',
    'purchase_price',
    'boughtprice',
    'cost',
    'myprice'
  );
  const foilIdx = findIdx('isfoil', 'foil', 'brillante', 'printing', 'foil?');
  const alteredIdx = findIdx('isaltered', 'altered', 'alterada', 'alter', 'alteredart');
  const signedIdx = findIdx('issigned', 'signed', 'firmada', 'signed?');
  const conditionIdx = findIdx('condition', 'estado', 'cond');
  const imageUrlIdx = findIdx('imageurl', 'image_url', 'imagen', 'portada');
  const scryfallIdIdx = findIdx('scryfallid', 'scryfall_id', 'id_scryfall');
  const collectionIdx = findIdx('collection', 'coleccion', 'carpeta', 'binder', 'folder', 'bindername', 'foldername', 'tags', 'category');
  const lastSyncIdx = findIdx('lastpricesyncdate', 'last_sync', 'fechasincro');

  // Detección de columnas específicas de cotizaciones multi-mercado / tiendas
  const cardmarketIdx = findIdx(
    'cardmarket',
    'cardmarketprice',
    'cardmarket_price',
    'cardmarket_trend',
    'cardmarketeur',
    'mkm',
    'mkmprice',
    'mkm_price',
    'cm_price'
  );
  const tcgplayerIdx = findIdx(
    'tcgplayer',
    'tcg_market',
    'tcgplayer_price',
    'tcgplayerprice',
    'tcg_market_price',
    'tcg',
    'tcgmarket',
    'tcg_mid',
    'tcgmarketprice',
    'tcgmarketusd'
  );
  const cardKingdomIdx = findIdx(
    'cardkingdom',
    'card_kingdom',
    'ck',
    'ck_price',
    'cardkingdomprice',
    'card_kingdom_price',
    'ck_retail',
    'ckprice'
  );
  const manaPoolIdx = findIdx(
    'manapool',
    'mana_pool',
    'mp',
    'mpprice',
    'manapoolprice',
    'mana_pool_price',
    'mp_price'
  );

  const parseNum = (v: string | undefined): number => {
    if (!v) return 0;
    const clean = v.replace(/[€$]/g, '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const result: CreateCardInput[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const title = (row[titleIdx] ?? '').trim();
    if (!title) continue;

    let edition = editionIdx !== -1 && row[editionIdx]?.trim() ? row[editionIdx]!.trim() : 'General';
    let editionCode = editionCodeIdx !== -1 && row[editionCodeIdx]?.trim() ? row[editionCodeIdx]!.trim().toUpperCase() : undefined;
    const language = normalizeLanguageCode(langIdx !== -1 ? row[langIdx] : 'EN');
    const quantity = qtyIdx !== -1 ? Math.max(1, parseInt(row[qtyIdx] ?? '1', 10) || 1) : 1;

    // Extracción de cotizaciones por tienda
    const cmPrice = cardmarketIdx !== -1 ? parseNum(row[cardmarketIdx]) : undefined;
    const tcgPrice = tcgplayerIdx !== -1 ? parseNum(row[tcgplayerIdx]) : undefined;
    const ckPrice = cardKingdomIdx !== -1 ? parseNum(row[cardKingdomIdx]) : undefined;
    const mpPrice = manaPoolIdx !== -1 ? parseNum(row[manaPoolIdx]) : undefined;

    const rawCurrentPrice = currentPriceIdx !== -1 ? parseNum(row[currentPriceIdx]) : 0;
    // Cardmarket en EUR rige como valor principal de valoración e inversión
    const currentPrice = cmPrice !== undefined && cmPrice > 0 ? cmPrice : rawCurrentPrice;
    const previousPrice = prevPriceIdx !== -1 ? parseNum(row[prevPriceIdx]) : currentPrice;
    const buyPrice = buyPriceIdx !== -1 ? parseNum(row[buyPriceIdx]) : previousPrice;

    const marketPrices: CardMarketPrices = {};
    if (cmPrice !== undefined && cmPrice > 0) marketPrices.cardmarket = cmPrice;
    else if (currentPrice > 0) marketPrices.cardmarket = currentPrice;
    if (tcgPrice !== undefined && tcgPrice > 0) marketPrices.tcgplayer = tcgPrice;
    if (ckPrice !== undefined && ckPrice > 0) marketPrices.cardKingdom = ckPrice;
    if (mpPrice !== undefined && mpPrice > 0) marketPrices.manapool = mpPrice;

    const isFoil = foilIdx !== -1 ? parseFoilValue(row[foilIdx]) : false;
    const isAltered = alteredIdx !== -1 ? Boolean(row[alteredIdx]?.trim().toLowerCase() === 'true' || row[alteredIdx]?.trim().toLowerCase() === 'yes') : false;
    const isSigned = signedIdx !== -1 ? Boolean(row[signedIdx]?.trim().toLowerCase() === 'true' || row[signedIdx]?.trim().toLowerCase() === 'yes') : false;
    const condition = normalizeCardCondition(conditionIdx !== -1 ? row[conditionIdx] : 'NM');
    let imageUrl = imageUrlIdx !== -1 && row[imageUrlIdx]?.trim() ? row[imageUrlIdx]!.trim() : undefined;
    const scryfallId = scryfallIdIdx !== -1 && row[scryfallIdIdx]?.trim() ? row[scryfallIdIdx]!.trim() : undefined;
    const rawCol = collectionIdx !== -1 && row[collectionIdx]?.trim() ? row[collectionIdx]!.trim() : undefined;
    const collections = getCardCollections({ collection: rawCol });
    const lastPriceSyncDate = lastSyncIdx !== -1 && row[lastSyncIdx]?.trim() ? row[lastSyncIdx]!.trim() : undefined;

    // Resolución cruzada de códigos y nombres de sets MTG
    if (editionCode && (!edition || edition === 'General' || edition === editionCode)) {
      const found = findMtgSetByCode(editionCode);
      if (found) edition = found.name;
    } else if (edition && !editionCode) {
      // Si la columna de edición contiene directamente un código corto (ej. "2ED")
      if (edition.length >= 3 && edition.length <= 4 && edition === edition.toUpperCase()) {
        const found = findMtgSetByCode(edition);
        if (found) {
          editionCode = found.code;
          edition = found.name;
        } else {
          editionCode = edition;
        }
      } else {
        const found = findMtgSetByName(edition);
        if (found) editionCode = found.code;
      }
    }

    // Resolución de arte oficial Scryfall directo si se dispone de UUID canónico
    if (!imageUrl && scryfallId && scryfallId.length > 8) {
      imageUrl = `https://cards.scryfall.io/normal/front/${scryfallId.charAt(0)}/${scryfallId.charAt(1)}/${scryfallId}.jpg`;
    }

    const nameEn = nameEnIdx !== -1 && row[nameEnIdx]?.trim()
      ? row[nameEnIdx]!.trim()
      : (language === 'EN' ? title : undefined);

    result.push({
      title,
      nameEn: nameEn || undefined,
      edition,
      editionCode,
      language,
      quantity,
      currentPrice,
      previousPrice,
      buyPrice,
      marketPrices: Object.keys(marketPrices).length > 0 ? marketPrices : undefined,
      isFoil,
      isAltered,
      isSigned,
      condition,
      imageUrl,
      scryfallId,
      collection: collections.join(', '),
      collections,
      priceHistory: (currentPrice > 0 || Object.keys(marketPrices).length > 0)
        ? [{
            date: lastPriceSyncDate || new Date().toISOString().slice(0, 10),
            price: currentPrice,
            cardmarket: marketPrices.cardmarket,
            tcgplayer: marketPrices.tcgplayer,
            cardKingdom: marketPrices.cardKingdom,
            manapool: marketPrices.manapool
          }]
        : [],
      lastPriceSyncDate
    });
  }

  if (result.length === 0) {
    throw new ValidationError('No se encontraron filas con cartas válidas en el archivo CSV.');
  }

  return { cards: result, sourceApp };
}

/**
 * Parsea un CSV de cartas MTG asociando cabeceras flexibles en inglés y español.
 */
export function parseCardsFromCsv(csvStr: string): CreateCardInput[] {
  return parseCardsFromCsvWithMetadata(csvStr).cards;
}

/**
 * Parsea listas de baraja en texto plano estándar (MTG Arena, MTGO, Moxfield, ManaBox texto).
 * Soporta líneas como:
 *   4 Lightning Bolt
 *   1 Sol Ring (2ED)
 *   2 Counterspell (2ED) 54
 *   1x Serra Angel [2ED]
 * y secciones con cabeceras de tipo // Sideboard, Sideboard:, Commander:, etc.
 */
export function parseCardsFromDecklist(text: string): CreateCardInput[] {
  const lines = text.split('\n');
  const result: CreateCardInput[] = [];
  let currentCollection = 'Principal';

  // Expresión regular para capturar cantidad, nombre, código de set opcional y número de coleccionista
  const lineRegex = /^\s*(?:(\d+)\s*x?\s+)?([^(/\n\[]+?)(?:\s+[\(\[]([A-Za-z0-9_]{3,5})[\)\]])?(?:\s+(\d+))?\s*$/;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Comentarios o cabeceras de sección
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      const sectionName = trimmed.replace(/^[/#\s]+/, '').trim();
      if (sectionName) {
        currentCollection = sectionName;
      }
      continue;
    }

    // Cabeceras tipo "Sideboard:" o "Commander:"
    const sectionMatch = trimmed.match(/^(Sideboard|Commander|Deck|Mainboard|Maybeboard|Tokens|Compañero|Companion):?$/i);
    if (sectionMatch) {
      const name = sectionMatch[1] ?? 'Principal';
      currentCollection = name.charAt(0).toUpperCase() + name.slice(1);
      continue;
    }

    const match = trimmed.match(lineRegex);
    if (!match) continue;

    const rawQty = match[1];
    const rawName = match[2]?.trim();
    const rawSet = match[3]?.trim();

    if (!rawName) continue;

    // Si el nombre parece una cabecera aislada sin cantidad ni set
    if (!rawQty && !rawSet && (rawName.toLowerCase() === 'deck' || rawName.toLowerCase() === 'sideboard' || rawName.toLowerCase() === 'commander')) {
      currentCollection = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      continue;
    }

    const quantity = rawQty ? Math.max(1, parseInt(rawQty, 10) || 1) : 1;
    let edition = 'General';
    let editionCode: string | undefined = undefined;

    if (rawSet) {
      editionCode = rawSet.toUpperCase();
      const foundSet = findMtgSetByCode(editionCode);
      if (foundSet) {
        edition = foundSet.name;
      } else {
        edition = editionCode;
      }
    }

    result.push({
      title: rawName,
      nameEn: rawName,
      edition,
      editionCode,
      language: 'EN',
      quantity,
      currentPrice: 0,
      previousPrice: 0,
      buyPrice: 0,
      condition: 'NM',
      collection: currentCollection,
      collections: [currentCollection],
      priceHistory: []
    });
  }

  if (result.length === 0) {
    throw new ValidationError('No se encontraron cartas válidas en la lista de texto.');
  }

  return result;
}

/**
 * Detecta automáticamente si una cadena es JSON, CSV o lista de texto MTG/Arena y la parsea a cartas.
 */
export function detectAndParseCards(content: string): DetectedImportResult {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ValidationError('El contenido a importar está vacío.');
  }

  // 1. JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const cards = parseCardsFromJson(trimmed);
    let sourceApp = 'JSON estructurado';
    try {
      const obj = JSON.parse(trimmed);
      if (obj?.app === 'MintMox') {
        sourceApp = 'MintMox JSON';
      }
    } catch {}
    return {
      format: 'json',
      sourceApp,
      cards
    };
  }

  // 2. CSV
  const firstLine = trimmed.split('\n')[0] ?? '';
  const isCsvLike = firstLine.includes(',') || firstLine.includes(';') || firstLine.includes('\t');

  if (isCsvLike) {
    try {
      const { cards, sourceApp } = parseCardsFromCsvWithMetadata(trimmed);
      if (cards.length > 0) {
        return {
          format: 'csv',
          sourceApp,
          cards
        };
      }
    } catch (csvErr) {
      // Si falla como CSV con encabezados, intenta como lista de texto antes de propagar
      try {
        const deckCards = parseCardsFromDecklist(trimmed);
        if (deckCards.length > 0) {
          return {
            format: 'decklist',
            sourceApp: 'Lista de texto MTG / Arena',
            cards: deckCards
          };
        }
      } catch {}
      throw csvErr;
    }
  }

  // 3. Lista de texto MTG / Arena
  const deckCards = parseCardsFromDecklist(trimmed);
  return {
    format: 'decklist',
    sourceApp: 'Lista de texto MTG / Arena',
    cards: deckCards
  };
}
