import { ValidationError } from '@framework/core';
import type { CardEntity, CreateCardInput } from './contracts.js';

/**
 * Escapa un valor para formato CSV estándar (RFC 4180).
 */
function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Exporta una lista de cartas a formato JSON estructurado y legible.
 */
export function exportCardsToJson(cards: CardEntity[]): string {
  const payload = {
    app: 'MTGInvest',
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
    'isFoil',
    'isAltered',
    'isSigned',
    'condition',
    'imageUrl',
    'scryfallId',
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
    escapeCsvCell(c.isFoil ? 'true' : 'false'),
    escapeCsvCell(c.isAltered ? 'true' : 'false'),
    escapeCsvCell(c.isSigned ? 'true' : 'false'),
    escapeCsvCell(c.condition ?? 'NM'),
    escapeCsvCell(c.imageUrl ?? ''),
    escapeCsvCell(c.scryfallId ?? ''),
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
    const edition = item.edition ?? item.set ?? item.setName ?? item.edicion ?? 'General';
    const editionCode = item.editionCode ?? item.setCode ?? item.set_code ?? item.code ?? item.codigo;
    const language = item.language ?? item.lang ?? item.idioma ?? 'EN';
    const quantity = Math.max(1, parseInt(String(item.quantity ?? item.qty ?? item.cantidad ?? 1), 10) || 1);

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
    const isFoil = Boolean(item.isFoil ?? item.foil ?? item.brillante);
    const isAltered = Boolean(item.isAltered ?? item.altered ?? item.alterada);
    const isSigned = Boolean(item.isSigned ?? item.signed ?? item.firmada);

    result.push({
      title,
      nameEn: nameEn ? String(nameEn).trim() : undefined,
      edition: edition ? String(edition).trim() : 'General',
      editionCode: editionCode ? String(editionCode).trim().toUpperCase() : undefined,
      language: language ? String(language).trim().toUpperCase() : 'EN',
      quantity,
      currentPrice,
      previousPrice,
      buyPrice,
      isFoil,
      isAltered,
      isSigned,
      condition: item.condition ?? item.estado ?? 'NM',
      imageUrl: item.imageUrl ?? item.image_url ?? undefined,
      scryfallId: item.scryfallId ?? item.scryfall_id ?? undefined,
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
 * Parsea un archivo o cadena CSV según RFC 4180 soportando celdas con comillas y saltos de línea.
 */
function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < len && text[i + 1] === '"') {
          currentCell += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
          i++;
          continue;
        }
      } else {
        currentCell += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (i + 1 < len && text[i + 1] === '\n') {
          i += 2;
        } else {
          i++;
        }
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        continue;
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      } else {
        currentCell += char;
        i++;
        continue;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    rows.push(currentRow);
  }

  return rows.filter((r) => r.some((cell) => cell.length > 0));
}

/**
 * Parsea un CSV de cartas MTG asociando cabeceras flexibles en inglés y español.
 */
export function parseCardsFromCsv(csvStr: string): CreateCardInput[] {
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

  const titleIdx = findIdx('title', 'name', 'nombre', 'carta', 'card');
  if (titleIdx === -1) {
    throw new ValidationError('El CSV debe incluir una columna con el nombre de la carta (title, name o nombre).');
  }

  const nameEnIdx = findIdx('nameen', 'name_en', 'englishname', 'nombreen', 'original_name');
  const editionIdx = findIdx('edition', 'set', 'edicion', 'setname');
  const editionCodeIdx = findIdx('editioncode', 'edition_code', 'setcode', 'code', 'codigo');
  const langIdx = findIdx('language', 'lang', 'idioma');
  const qtyIdx = findIdx('quantity', 'qty', 'cantidad', 'copias');
  const currentPriceIdx = findIdx('currentprice', 'current_price', 'price', 'precio', 'valor', 'precioactual');
  const prevPriceIdx = findIdx('previousprice', 'previous_price', 'coste');
  const buyPriceIdx = findIdx('buyprice', 'buy_price', 'preciocompra', 'compra', 'coste');
  const foilIdx = findIdx('isfoil', 'foil', 'brillante');
  const alteredIdx = findIdx('isaltered', 'altered', 'alterada');
  const signedIdx = findIdx('issigned', 'signed', 'firmada');
  const conditionIdx = findIdx('condition', 'estado', 'cond');
  const imageUrlIdx = findIdx('imageurl', 'image_url', 'imagen', 'portada');
  const scryfallIdIdx = findIdx('scryfallid', 'scryfall_id', 'id_scryfall');
  const lastSyncIdx = findIdx('lastpricesyncdate', 'last_sync', 'fechasincro');

  const parseNum = (v: string | undefined): number => {
    if (!v) return 0;
    const clean = v.replace(/[€$]/g, '').trim().replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const parseBool = (v: string | undefined): boolean => {
    if (!v) return false;
    const clean = v.trim().toLowerCase();
    return clean === 'true' || clean === '1' || clean === 'yes' || clean === 'si' || clean === 'sí';
  };

  const result: CreateCardInput[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const title = (row[titleIdx] ?? '').trim();
    if (!title) continue;

    const nameEn = nameEnIdx !== -1 ? row[nameEnIdx]?.trim() : undefined;
    const edition = editionIdx !== -1 && row[editionIdx]?.trim() ? row[editionIdx]!.trim() : 'General';
    const editionCode = editionCodeIdx !== -1 && row[editionCodeIdx]?.trim() ? row[editionCodeIdx]!.trim().toUpperCase() : undefined;
    const language = langIdx !== -1 && row[langIdx]?.trim() ? row[langIdx]!.trim().toUpperCase() : 'EN';
    const quantity = qtyIdx !== -1 ? Math.max(1, parseInt(row[qtyIdx] ?? '1', 10) || 1) : 1;
    const currentPrice = currentPriceIdx !== -1 ? parseNum(row[currentPriceIdx]) : 0;
    const previousPrice = prevPriceIdx !== -1 ? parseNum(row[prevPriceIdx]) : currentPrice;
    const buyPrice = buyPriceIdx !== -1 ? parseNum(row[buyPriceIdx]) : previousPrice;
    const isFoil = foilIdx !== -1 ? parseBool(row[foilIdx]) : false;
    const isAltered = alteredIdx !== -1 ? parseBool(row[alteredIdx]) : false;
    const isSigned = signedIdx !== -1 ? parseBool(row[signedIdx]) : false;
    const condition = conditionIdx !== -1 && row[conditionIdx]?.trim() ? row[conditionIdx]!.trim() : 'NM';
    const imageUrl = imageUrlIdx !== -1 && row[imageUrlIdx]?.trim() ? row[imageUrlIdx]!.trim() : undefined;
    const scryfallId = scryfallIdIdx !== -1 && row[scryfallIdIdx]?.trim() ? row[scryfallIdIdx]!.trim() : undefined;
    const lastPriceSyncDate = lastSyncIdx !== -1 && row[lastSyncIdx]?.trim() ? row[lastSyncIdx]!.trim() : undefined;

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
      isFoil,
      isAltered,
      isSigned,
      condition,
      imageUrl,
      scryfallId,
      priceHistory: [],
      lastPriceSyncDate
    });
  }

  if (result.length === 0) {
    throw new ValidationError('No se encontraron filas con cartas válidas en el archivo CSV.');
  }

  return result;
}

/**
 * Detecta automáticamente si una cadena es JSON o CSV y la parsea a cartas.
 */
export function detectAndParseCards(content: string): { format: 'json' | 'csv'; cards: CreateCardInput[] } {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ValidationError('El contenido a importar está vacío.');
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return {
      format: 'json',
      cards: parseCardsFromJson(trimmed)
    };
  }

  return {
    format: 'csv',
    cards: parseCardsFromCsv(trimmed)
  };
}

