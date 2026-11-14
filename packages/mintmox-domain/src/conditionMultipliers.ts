/**
 * Gestión de factores de ponderación de precio según el estado de conservación de la carta (Card Condition).
 *
 * Dado que la API pública de Scryfall / Cardmarket proporciona una única cotización base en Euros
 * (habitualmente referenciada a estado Near Mint o tendencia general), MintMox permite ajustar
 * porcentualmente el valor estimado de cada copia según su estado físico real.
 */

export type CardCondition = 'NM' | 'EX' | 'GD' | 'LP' | 'PL' | 'PO';

export type ConditionMultipliers = Record<CardCondition, number>;

/**
 * Factores de ponderación estándar de la industria (ManaBox, Cardmarket, TCGplayer).
 * - NM (Near Mint): 100%
 * - EX (Excellent): 90%
 * - GD (Good): 85%
 * - LP (Lightly Played): 80%
 * - PL (Played): 65%
 * - PO (Poor / Damaged): 40%
 */
export const DEFAULT_CONDITION_MULTIPLIERS: ConditionMultipliers = {
  NM: 1.0,
  EX: 0.9,
  GD: 0.85,
  LP: 0.8,
  PL: 0.65,
  PO: 0.4
};

export interface ConditionDefinition {
  code: CardCondition;
  name: string;
  nameEn: string;
  description: string;
  badgeTone: 'accent' | 'neutral' | 'success' | 'warning' | 'danger';
}

export const CONDITION_DEFINITIONS: Record<CardCondition, ConditionDefinition> = {
  NM: {
    code: 'NM',
    name: 'Near Mint (Como nueva)',
    nameEn: 'Near Mint',
    description: 'Impecable o con marcas mínimas invisibles a simple vista.',
    badgeTone: 'success'
  },
  EX: {
    code: 'EX',
    name: 'Excellent (Excelente)',
    nameEn: 'Excellent',
    description: 'Muy leves marcas de uso en bordes o esquinas.',
    badgeTone: 'accent'
  },
  GD: {
    code: 'GD',
    name: 'Good (Buen estado)',
    nameEn: 'Good',
    description: 'Desgaste moderado pero uniforme, sin pliegues ni suciedad.',
    badgeTone: 'neutral'
  },
  LP: {
    code: 'LP',
    name: 'Lightly Played (Ligeramente jugada)',
    nameEn: 'Lightly Played',
    description: 'Desgaste visible en bordes, esquinas o superficie por juego.',
    badgeTone: 'warning'
  },
  PL: {
    code: 'PL',
    name: 'Played (Jugada)',
    nameEn: 'Played',
    description: 'Desgaste evidente, marcas, bordes rozados o esquinas redondeadas.',
    badgeTone: 'warning'
  },
  PO: {
    code: 'PO',
    name: 'Poor (Dañada / Poor)',
    nameEn: 'Poor / Damaged',
    description: 'Dañada, pliegues marcados, tinta corrida o roturas.',
    badgeTone: 'danger'
  }
};

export const ORDERED_CARD_CONDITIONS: CardCondition[] = ['NM', 'EX', 'GD', 'LP', 'PL', 'PO'];

/**
 * Normaliza cualquier variante de texto de estado hacia uno de los códigos canónicos (NM, EX, GD, LP, PL, PO).
 */
export function normalizeCardCondition(condition?: string | null): CardCondition {
  if (!condition) return 'NM';
  const clean = condition.trim().toUpperCase().replace(/[-_]/g, ' ');

  if (
    clean === 'NM' ||
    clean === 'M' ||
    clean === 'MINT' ||
    clean === 'NEAR MINT' ||
    clean === 'NEARMINT' ||
    clean === 'N'
  ) return 'NM';
  if (clean === 'EX' || clean === 'EXCELLENT' || clean === 'EXC') return 'EX';
  if (
    clean === 'GD' ||
    clean === 'GOOD' ||
    clean === 'GOOD (LIGHTLY PLAYED)' ||
    clean === 'VG' ||
    clean === 'VERY GOOD'
  ) return 'GD';
  if (
    clean === 'LP' ||
    clean === 'LIGHTLY PLAYED' ||
    clean === 'LIGHTLYPLAYED' ||
    clean === 'SP' ||
    clean === 'SLIGHTLY PLAYED' ||
    clean === 'SLIGHTLYPLAYED'
  ) return 'LP';
  if (
    clean === 'PL' ||
    clean === 'PLAYED' ||
    clean === 'MP' ||
    clean === 'MODERATELY PLAYED' ||
    clean === 'MODERATELYPLAYED'
  ) return 'PL';
  if (
    clean === 'PO' ||
    clean === 'POOR' ||
    clean === 'DMG' ||
    clean === 'DAMAGED' ||
    clean === 'D' ||
    clean === 'HP' ||
    clean === 'HEAVILY PLAYED' ||
    clean === 'HEAVILYPLAYED'
  ) return 'PO';

  return 'NM';
}

/**
 * Obtiene el multiplicador decimal aplicable a una condición dada.
 */
export function getConditionMultiplier(
  condition?: string | null,
  customMultipliers?: Partial<Record<string, number>>
): number {
  const norm = normalizeCardCondition(condition);
  const factor = customMultipliers?.[norm] ?? DEFAULT_CONDITION_MULTIPLIERS[norm];
  if (typeof factor === 'number' && !isNaN(factor) && factor >= 0) {
    return factor;
  }
  return DEFAULT_CONDITION_MULTIPLIERS[norm];
}

/**
 * Calcula el precio estimado ajustado por estado de conservación.
 */
export function calculateAdjustedCardPrice(
  basePrice: number,
  condition?: string | null,
  customMultipliers?: Partial<Record<string, number>>,
  enabled: boolean = true
): number {
  if (typeof basePrice !== 'number' || isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }
  if (!enabled) {
    return Number(basePrice.toFixed(2));
  }
  const factor = getConditionMultiplier(condition, customMultipliers);
  return Number((basePrice * factor).toFixed(2));
}
