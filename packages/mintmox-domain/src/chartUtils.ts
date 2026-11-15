import type { CardEntity, CardPricePoint } from './contracts.js';
import { calculateAdjustedCardPrice } from './conditionMultipliers.js';

export interface PortfolioPricingOptions {
  conditionMultipliers?: Partial<Record<string, number>>;
  conditionPricingEnabled?: boolean;
}

export interface CardChartSeriesData {
  labels: string[];
  values: number[];
  unit: string;
}

const SPANISH_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * Genera la serie de datos para graficar la evolución del precio de una carta en el último año (12 meses).
 * Si la carta no tiene datos para los primeros meses del año, comienza en 0 hasta la fecha en que
 * se registran sus primeras cotizaciones históricas (según requerimiento explícito del usuario).
 */
export function buildOneYearCardChart(
  card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z')
): CardChartSeriesData {
  const history = card.priceHistory ?? [];
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

  // Generamos los últimos 12 meses finalizando en el mes de referencia
  const months: Array<{ key: string; label: string }> = [];
  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();

  for (let i = 12; i >= 0; i--) {
    const d = new Date(Date.UTC(refYear, refMonth - i, 1));
    const year2 = String(d.getUTCFullYear()).slice(-2);
    const mName = SPANISH_MONTHS[d.getUTCMonth()] ?? '';
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = i === 12 || i === 0 ? `${mName} '${year2}` : mName;
    months.push({ key, label });
  }

  // Si no hay histórico registrado, comenzamos en 0 hasta el valor previo/actual
  if (sortedHistory.length === 0) {
    const values = months.map((_, index) => {
      if (index < months.length - 2) return 0;
      if (index === months.length - 2) return card.previousPrice ?? card.currentPrice;
      return card.currentPrice;
    });
    return {
      labels: months.map((m) => m.label),
      values,
      unit: '€'
    };
  }

  let lastKnownPrice: number | null = null;
  const values: number[] = [];

  for (let i = 0; i < months.length; i++) {
    const m = months[i]!;

    // Puntos registrados en este mes
    const pointsInMonth = sortedHistory.filter((p) => p.date.startsWith(m.key));
    if (pointsInMonth.length > 0) {
      lastKnownPrice = pointsInMonth[pointsInMonth.length - 1]!.price;
      values.push(lastKnownPrice);
    } else if (lastKnownPrice !== null) {
      // Si ya empezó a haber datos en meses anteriores, mantenemos la última cotización
      if (i === months.length - 1) {
        values.push(card.currentPrice);
      } else {
        values.push(lastKnownPrice);
      }
    } else {
      // Aún no hay datos: empieza de cero hasta que se empiecen a tener datos
      values.push(0);
    }
  }

  return {
    labels: months.map((m) => m.label),
    values,
    unit: '€'
  };
}

/**
 * Genera la serie de datos para los últimos 3 meses con resolución detallada (Cardmarket).
 */
export function buildThreeMonthCardChart(
  card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>
): CardChartSeriesData {
  const history = card.priceHistory ?? [];
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return {
      labels: ['Sep', 'Oct', 'Nov'],
      values: [0, card.previousPrice ?? card.currentPrice, card.currentPrice],
      unit: '€'
    };
  }

  // Muestreamos puntos distribuidos uniformemente (hasta 10 puntos)
  const maxPoints = 10;
  const step = Math.max(1, Math.floor(sorted.length / maxPoints));
  const sampled: CardPricePoint[] = [];

  for (let i = 0; i < sorted.length; i += step) {
    sampled.push(sorted[i]!);
  }
  // Aseguramos incluir el último punto
  const lastPoint = sorted[sorted.length - 1]!;
  if (sampled[sampled.length - 1] !== lastPoint) {
    sampled.push(lastPoint);
  }

  return {
    labels: sampled.map((p) => {
      const parts = p.date.split('-');
      const day = parseInt(parts[2] ?? '1', 10);
      const mIdx = parseInt(parts[1] ?? '1', 10) - 1;
      return `${day} ${SPANISH_MONTHS[mIdx] ?? ''}`;
    }),
    values: sampled.map((p) => p.price),
    unit: '€'
  };
}

export type ChartTimeframe = '1S' | '1M' | '3M' | '6M' | '1A';

export const TIMEFRAME_LABELS: Record<ChartTimeframe, string> = {
  '1S': '1 Semana',
  '1M': '1 Mes',
  '3M': '3 Meses',
  '6M': '6 Meses',
  '1A': '1 Año'
};

export const TIMEFRAME_DESCRIPTIONS: Record<ChartTimeframe, string> = {
  '1S': 'Última semana (cotización diaria)',
  '1M': 'Último mes (detalle de 30 días)',
  '3M': 'Últimos 3 meses (evolución Cardmarket)',
  '6M': 'Últimos 6 meses (tendencia semestral)',
  '1A': 'Último año (evolución anual consolidada)'
};

/**
 * Genera la serie de datos para los últimos 7 días (1S).
 */
export function buildOneWeekCardChart(
  card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z')
): CardChartSeriesData {
  const history = card.priceHistory ?? [];
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  const days: Array<{ dateKey: string; label: string }> = [];
  const refTime = referenceDate.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(refTime - i * ONE_DAY_MS);
    const dateKey = d.toISOString().slice(0, 10);
    const dayNum = d.getUTCDate();
    const mName = SPANISH_MONTHS[d.getUTCMonth()] ?? '';
    days.push({ dateKey, label: `${dayNum} ${mName}` });
  }

  const values = days.map((day, idx) => {
    const exact = sorted.find((p) => p.date === day.dateKey);
    if (exact) return exact.price;

    if (idx === days.length - 1) return card.currentPrice;

    const prior = sorted.filter((p) => p.date <= day.dateKey);
    if (prior.length > 0) return prior[prior.length - 1]!.price;

    return card.previousPrice ?? card.currentPrice;
  });

  return {
    labels: days.map((d) => d.label),
    values,
    unit: '€'
  };
}

/**
 * Genera la serie de datos para los últimos 30 días (1M).
 */
export function buildOneMonthCardChart(
  card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z')
): CardChartSeriesData {
  const history = card.priceHistory ?? [];
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));

  const days: Array<{ dateKey: string; label: string }> = [];
  const refTime = referenceDate.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const offsets = [28, 24, 20, 16, 12, 8, 4, 0];
  for (const offset of offsets) {
    const d = new Date(refTime - offset * ONE_DAY_MS);
    const dateKey = d.toISOString().slice(0, 10);
    const dayNum = d.getUTCDate();
    const mName = SPANISH_MONTHS[d.getUTCMonth()] ?? '';
    days.push({ dateKey, label: `${dayNum} ${mName}` });
  }

  const values = days.map((day, idx) => {
    const exact = sorted.find((p) => p.date === day.dateKey);
    if (exact) return exact.price;

    if (idx === days.length - 1) return card.currentPrice;

    const prior = sorted.filter((p) => p.date <= day.dateKey);
    if (prior.length > 0) return prior[prior.length - 1]!.price;

    return card.previousPrice ?? card.currentPrice;
  });

  return {
    labels: days.map((d) => d.label),
    values,
    unit: '€'
  };
}

/**
 * Genera la serie de datos para los últimos 6 meses (6M).
 */
export function buildSixMonthCardChart(
  card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z')
): CardChartSeriesData {
  const history = card.priceHistory ?? [];
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));

  const months: Array<{ key: string; label: string }> = [];
  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(refYear, refMonth - i, 1));
    const year2 = String(d.getUTCFullYear()).slice(-2);
    const mName = SPANISH_MONTHS[d.getUTCMonth()] ?? '';
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const label = i === 6 || i === 0 ? `${mName} '${year2}` : mName;
    months.push({ key, label });
  }

  if (sortedHistory.length === 0) {
    const values = months.map((_, index) => {
      if (index < months.length - 2) return 0;
      if (index === months.length - 2) return card.previousPrice ?? card.currentPrice;
      return card.currentPrice;
    });
    return {
      labels: months.map((m) => m.label),
      values,
      unit: '€'
    };
  }

  let lastKnownPrice: number | null = null;
  const values: number[] = [];

  for (let i = 0; i < months.length; i++) {
    const m = months[i]!;
    const pointsInMonth = sortedHistory.filter((p) => p.date.startsWith(m.key));
    if (pointsInMonth.length > 0) {
      lastKnownPrice = pointsInMonth[pointsInMonth.length - 1]!.price;
      values.push(lastKnownPrice);
    } else if (lastKnownPrice !== null) {
      if (i === months.length - 1) {
        values.push(card.currentPrice);
      } else {
        values.push(lastKnownPrice);
      }
    } else {
      values.push(0);
    }
  }

  return {
    labels: months.map((m) => m.label),
    values,
    unit: '€'
  };
}

/**
 * Función principal unificada para construir la gráfica según el rango temporal seleccionado.
 */
export function buildCardChart(
  card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>,
  timeframe: ChartTimeframe,
  referenceDate?: Date
): CardChartSeriesData {
  switch (timeframe) {
    case '1S':
      return buildOneWeekCardChart(card, referenceDate);
    case '1M':
      return buildOneMonthCardChart(card, referenceDate);
    case '3M':
      return buildThreeMonthCardChart(card);
    case '6M':
      return buildSixMonthCardChart(card, referenceDate);
    case '1A':
    default:
      return buildOneYearCardChart(card, referenceDate);
  }
}

export interface MultiMarketSeries {
  id: string;
  name: string;
  color: string;
  values: number[];
}

export interface MultiMarketChartData {
  labels: string[];
  series: MultiMarketSeries[];
  availableMarkets: Array<{ id: string; name: string; color: string; currency: string; currentPrice?: number }>;
}

export const MARKET_METADATA = {
  cardmarket: { id: 'cardmarket', name: 'Cardmarket', color: '#38BDF8', currency: '€' },
  tcgplayer: { id: 'tcgplayer', name: 'TCGplayer', color: '#10B981', currency: '$' },
  cardKingdom: { id: 'cardKingdom', name: 'Card Kingdom', color: '#F59E0B', currency: '$' },
  manapool: { id: 'manapool', name: 'ManaPool', color: '#8B5CF6', currency: '$' }
} as const;

export type MarketStoreKey = keyof typeof MARKET_METADATA;

/**
 * Genera la gráfica de cotizaciones multi-mercado (Cardmarket, TCGplayer, Card Kingdom, ManaPool)
 * para comparar la cotización y arbitraje entre tiendas en el modal de detalle/edición.
 */
export function buildMultiMarketCardChart(
  card: CardEntity,
  timeframe: ChartTimeframe,
  referenceDate?: Date
): MultiMarketChartData {
  const baseChart = buildCardChart(card, timeframe, referenceDate);
  const history = card.priceHistory ?? [];

  // Las 4 tiendas de referencia del mercado
  const marketsPresent: Array<keyof typeof MARKET_METADATA> = ['cardmarket', 'tcgplayer', 'cardKingdom', 'manapool'];

  const getStoreCurrentPrice = (mKey: keyof typeof MARKET_METADATA): number => {
    if (mKey === 'cardmarket') return card.currentPrice;
    if (card.marketPrices?.[mKey] !== undefined && card.marketPrices[mKey]! > 0) {
      return card.marketPrices[mKey]!;
    }
    const baseUsd = card.marketPrices?.tcgplayer ?? Number((card.currentPrice * 1.08).toFixed(2));
    if (mKey === 'tcgplayer') return baseUsd;
    if (mKey === 'cardKingdom') return Number((baseUsd * 1.10).toFixed(2));
    if (mKey === 'manapool') return Number((baseUsd * 0.99).toFixed(2));
    return card.currentPrice;
  };

  const series: MultiMarketSeries[] = marketsPresent.map((mKey) => {
    const meta = MARKET_METADATA[mKey];
    if (mKey === 'cardmarket') {
      return {
        id: meta.id,
        name: `${meta.name} (${meta.currency})`,
        color: meta.color,
        values: baseChart.values
      };
    }

    const currentVal = getStoreCurrentPrice(mKey);
    const baseCurrent = card.currentPrice > 0 ? card.currentPrice : 1;
    const ratio = currentVal > 0 ? currentVal / baseCurrent : 1;

    const values = baseChart.values.map((v, idx) => {
      if (v === 0) return 0;
      const p = history[idx];
      const exact = p ? p[mKey] : undefined;
      if (exact !== undefined && exact > 0) return exact;
      return Number((v * ratio).toFixed(2));
    });

    if (currentVal > 0 && values.length > 0) {
      values[values.length - 1] = currentVal;
    }

    return {
      id: meta.id,
      name: `${meta.name} (${meta.currency})`,
      color: meta.color,
      values
    };
  });

  const availableMarkets = marketsPresent.map((mKey) => ({
    id: MARKET_METADATA[mKey].id,
    name: MARKET_METADATA[mKey].name,
    color: MARKET_METADATA[mKey].color,
    currency: MARKET_METADATA[mKey].currency,
    currentPrice: getStoreCurrentPrice(mKey)
  }));

  return {
    labels: baseChart.labels,
    series,
    availableMarkets
  };
}

export interface PortfolioMarketSeries {
  id: MarketStoreKey;
  name: string;
  color: string;
  currency: string;
  values: number[];
  currentTotal: number;
}

/** Serie agregada global para la cartera de inversión completa. */
export interface PortfolioChartSeriesData {
  labels: string[];
  investmentValues: number[];
  portfolioValues: number[];
  profitValues: number[];
  roiValues: number[];
  marketSeries?: PortfolioMarketSeries[];
  availableMarkets?: Array<{
    id: MarketStoreKey;
    name: string;
    color: string;
    currency: string;
    currentTotal: number;
  }>;
  marketProfits?: Record<MarketStoreKey, number[]>;
  marketRois?: Record<MarketStoreKey, number[]>;
}

/**
 * Genera las etiquetas y claves de fecha para un rango temporal determinado.
 */
export function generateChartTimeframeLabels(
  timeframe: ChartTimeframe,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z')
): { labels: string[]; dateKeys: string[] } {
  const dateKeys: string[] = [];
  const labels: string[] = [];
  const refTime = referenceDate.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  if (timeframe === '1S') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(refTime - i * ONE_DAY_MS);
      dateKeys.push(d.toISOString().slice(0, 10));
      labels.push(`${d.getUTCDate()} ${SPANISH_MONTHS[d.getUTCMonth()] ?? ''}`);
    }
  } else if (timeframe === '1M') {
    const offsets = [28, 24, 20, 16, 12, 8, 4, 0];
    for (const offset of offsets) {
      const d = new Date(refTime - offset * ONE_DAY_MS);
      dateKeys.push(d.toISOString().slice(0, 10));
      labels.push(`${d.getUTCDate()} ${SPANISH_MONTHS[d.getUTCMonth()] ?? ''}`);
    }
  } else if (timeframe === '3M') {
    const offsets = [80, 70, 60, 50, 40, 30, 20, 10, 0];
    for (const offset of offsets) {
      const d = new Date(refTime - offset * ONE_DAY_MS);
      dateKeys.push(d.toISOString().slice(0, 10));
      labels.push(`${d.getUTCDate()} ${SPANISH_MONTHS[d.getUTCMonth()] ?? ''}`);
    }
  } else if (timeframe === '6M') {
    const refYear = referenceDate.getUTCFullYear();
    const refMonth = referenceDate.getUTCMonth();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.UTC(refYear, refMonth - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      dateKeys.push(key);
      const year2 = String(d.getUTCFullYear()).slice(-2);
      const mName = SPANISH_MONTHS[d.getUTCMonth()] ?? '';
      labels.push(i === 6 || i === 0 ? `${mName} '${year2}` : mName);
    }
  } else {
    // '1A' (12 meses / 13 puntos)
    const refYear = referenceDate.getUTCFullYear();
    const refMonth = referenceDate.getUTCMonth();
    for (let i = 12; i >= 0; i--) {
      const d = new Date(Date.UTC(refYear, refMonth - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      dateKeys.push(key);
      const year2 = String(d.getUTCFullYear()).slice(-2);
      const mName = SPANISH_MONTHS[d.getUTCMonth()] ?? '';
      labels.push(i === 12 || i === 0 ? `${mName} '${year2}` : mName);
    }
  }

  return { labels, dateKeys };
}

/**
 * Calcula la evolución temporal consolidada de toda la colección.
 * Permite analizar la cartera a nivel macro (Valor total vs Coste, Beneficio neto y ROI %).
 * Soporta todas las tiendas disponibles (Cardmarket, TCGplayer, Card Kingdom, ManaPool).
 */
export function buildPortfolioChart(
  items: CardEntity[],
  timeframe: ChartTimeframe,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z'),
  pricingOptions?: PortfolioPricingOptions
): PortfolioChartSeriesData {
  if (items.length === 0) {
    return {
      labels: ['Hoy'],
      investmentValues: [0],
      portfolioValues: [0],
      profitValues: [0],
      roiValues: [0],
      marketSeries: [],
      availableMarkets: []
    };
  }

  // Coste total acumulado de adquisición de la cartera
  let totalCost = 0;
  for (const c of items) {
    const qty = Math.max(1, c.quantity ?? 1);
    totalCost += (c.buyPrice ?? c.previousPrice ?? c.currentPrice) * qty;
  }
  const totalCostFixed = Number(totalCost.toFixed(2));

  // Generamos los hitos temporales según el timeframe
  const { labels, dateKeys } = generateChartTimeframeLabels(timeframe, referenceDate);

  // Las 4 tiendas de referencia del mercado para la cartera completa
  const marketsPresent: MarketStoreKey[] = ['cardmarket', 'tcgplayer', 'cardKingdom', 'manapool'];

  const investmentValues: number[] = [];
  const portfolioValues: number[] = [];
  const profitValues: number[] = [];
  const roiValues: number[] = [];

  const marketValues: Record<MarketStoreKey, number[]> = {
    cardmarket: [],
    tcgplayer: [],
    cardKingdom: [],
    manapool: []
  };

  const marketProfits: Record<MarketStoreKey, number[]> = {
    cardmarket: [],
    tcgplayer: [],
    cardKingdom: [],
    manapool: []
  };

  const marketRois: Record<MarketStoreKey, number[]> = {
    cardmarket: [],
    tcgplayer: [],
    cardKingdom: [],
    manapool: []
  };

  for (let idx = 0; idx < dateKeys.length; idx++) {
    const key = dateKeys[idx]!;
    const isLast = idx === dateKeys.length - 1;

    for (const mKey of marketsPresent) {
      let storeTotal = 0;

      for (const card of items) {
        const qty = Math.max(1, card.quantity ?? 1);
        const baseUsd = card.marketPrices?.tcgplayer ?? Number((card.currentPrice * 1.08).toFixed(2));
        const defaultStorePrice =
          mKey === 'cardmarket'
            ? card.currentPrice
            : mKey === 'tcgplayer'
            ? baseUsd
            : mKey === 'cardKingdom'
            ? Number((baseUsd * 1.10).toFixed(2))
            : Number((baseUsd * 0.99).toFixed(2));

        let rawPrice = 0;

        if (isLast) {
          if (mKey === 'cardmarket') {
            rawPrice = card.currentPrice;
          } else {
            rawPrice = card.marketPrices?.[mKey] ?? defaultStorePrice;
          }
        } else {
          const history = card.priceHistory ?? [];
          if (history.length === 0) {
            if (mKey === 'cardmarket') {
              rawPrice = card.previousPrice ?? card.buyPrice ?? card.currentPrice;
            } else {
              rawPrice = card.marketPrices?.[mKey] ?? defaultStorePrice;
            }
          } else {
            const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
            const validPoints = sorted.filter((p) =>
              key.length === 7 ? p.date <= `${key}-31` : p.date <= key
            );

            if (validPoints.length > 0) {
              const lastPt = validPoints[validPoints.length - 1]!;
              if (mKey === 'cardmarket') {
                rawPrice = lastPt.cardmarket ?? lastPt.price;
              } else {
                rawPrice =
                  (lastPt as Record<MarketStoreKey, number | undefined>)[mKey] ??
                  card.marketPrices?.[mKey] ??
                  defaultStorePrice;
              }
            } else {
              // Antes del primer registro histórico: mantenemos el precio de compra o inicial (evitando caídas artificiales a 0)
              const firstPt = sorted[0]!;
              if (mKey === 'cardmarket') {
                rawPrice =
                  firstPt.cardmarket ??
                  firstPt.price ??
                  card.previousPrice ??
                  card.buyPrice ??
                  card.currentPrice;
              } else {
                rawPrice =
                  (firstPt as Record<MarketStoreKey, number | undefined>)[mKey] ??
                  card.marketPrices?.[mKey] ??
                  defaultStorePrice;
              }
            }
          }
        }

        const effectivePrice = calculateAdjustedCardPrice(
          rawPrice,
          card.condition,
          pricingOptions?.conditionMultipliers,
          pricingOptions?.conditionPricingEnabled ?? false
        );
        storeTotal += effectivePrice * qty;
      }

      const storeTotalFixed = Number(storeTotal.toFixed(2));
      marketValues[mKey]!.push(storeTotalFixed);

      const storeProfit = Number((storeTotalFixed - totalCostFixed).toFixed(2));
      const storeRoi = totalCostFixed > 0 ? Number(((storeProfit / totalCostFixed) * 100).toFixed(1)) : 0;
      marketProfits[mKey]!.push(storeProfit);
      marketRois[mKey]!.push(storeRoi);
    }

    // La serie principal del portfolio corresponde a Cardmarket (€)
    const cmVal = marketValues.cardmarket[marketValues.cardmarket.length - 1]!;
    const cmProfit = marketProfits.cardmarket[marketProfits.cardmarket.length - 1]!;
    const cmRoi = marketRois.cardmarket[marketRois.cardmarket.length - 1]!;

    investmentValues.push(totalCostFixed);
    portfolioValues.push(cmVal);
    profitValues.push(cmProfit);
    roiValues.push(cmRoi);
  }

  const marketSeries: PortfolioMarketSeries[] = marketsPresent.map((mKey) => ({
    id: mKey,
    name: `${MARKET_METADATA[mKey].name} (${MARKET_METADATA[mKey].currency})`,
    color: MARKET_METADATA[mKey].color,
    currency: MARKET_METADATA[mKey].currency,
    values: marketValues[mKey]!,
    currentTotal: marketValues[mKey]![marketValues[mKey]!.length - 1] ?? 0
  }));

  const availableMarkets = marketsPresent.map((mKey) => ({
    id: mKey,
    name: MARKET_METADATA[mKey].name,
    color: MARKET_METADATA[mKey].color,
    currency: MARKET_METADATA[mKey].currency,
    currentTotal: marketValues[mKey]![marketValues[mKey]!.length - 1] ?? 0
  }));

  return {
    labels,
    investmentValues,
    portfolioValues,
    profitValues,
    roiValues,
    marketSeries,
    availableMarkets,
    marketProfits,
    marketRois
  };
}

/** Tramo de distribución de rentabilidad para la cartera. */
export interface RoiDistributionBucket {
  id: string;
  label: string;
  rangeLabel: string;
  minPercent: number;
  maxPercent: number;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Calcula la distribución porcentual de cartas en los distintos tramos de rentabilidad (ROI %).
 */
export function calculatePortfolioRoiDistribution(
  items: CardEntity[],
  pricingOptions?: PortfolioPricingOptions
): RoiDistributionBucket[] {
  const totalCards = items.length;
  const buckets: Array<Omit<RoiDistributionBucket, 'count' | 'percentage'> & { count: number }> = [
    { id: 'loss', label: 'En pérdida', rangeLabel: '< 0%', minPercent: -Infinity, maxPercent: 0, count: 0, color: '#EF4444' },
    { id: 'low', label: 'Bajo', rangeLabel: '0% a 25%', minPercent: 0, maxPercent: 25, count: 0, color: '#3B82F6' },
    { id: 'mid', label: 'Moderado', rangeLabel: '25% a 50%', minPercent: 25, maxPercent: 50, count: 0, color: '#10B981' },
    { id: 'high', label: 'Alto', rangeLabel: '50% a 100%', minPercent: 50, maxPercent: 100, count: 0, color: '#F59E0B' },
    { id: 'multi', label: 'x2 o más', rangeLabel: '> 100%', minPercent: 100, maxPercent: Infinity, count: 0, color: '#8B5CF6' }
  ];

  for (const card of items) {
    const prev = card.previousPrice || card.currentPrice;
    const cur = calculateAdjustedCardPrice(
      card.currentPrice,
      card.condition,
      pricingOptions?.conditionMultipliers,
      pricingOptions?.conditionPricingEnabled ?? false
    );
    const roi = prev > 0 ? ((cur - prev) / prev) * 100 : 0;

    for (const b of buckets) {
      if (b.id === 'loss' && roi < 0) {
        b.count++;
        break;
      } else if (b.id === 'multi' && roi >= 100) {
        b.count++;
        break;
      } else if (roi >= b.minPercent && roi < b.maxPercent) {
        b.count++;
        break;
      }
    }
  }

  return buckets.map((b) => ({
    ...b,
    percentage: totalCards > 0 ? Number(((b.count / totalCards) * 100).toFixed(1)) : 0
  }));
}

/** Registro de carta destacada por plusvalía o pérdida. */
export interface CardProfitLeader {
  id: string;
  title: string;
  nameEn?: string;
  edition: string;
  editionCode?: string;
  quantity: number;
  unitBuyPrice: number;
  unitCurrentPrice: number;
  totalInvested: number;
  totalCurrent: number;
  totalProfit: number;
  roiPercent: number;
}

/**
 * Obtiene las cartas líderes en plusvalía (candidatas a venta) y las cartas con mayor pérdida.
 */
export function getPortfolioProfitLeaders(
  items: CardEntity[],
  limit = 5,
  pricingOptions?: PortfolioPricingOptions
): {
  topGainers: CardProfitLeader[];
  topLosers: CardProfitLeader[];
} {
  const mapped: CardProfitLeader[] = items.map((card) => {
    const qty = Math.max(1, card.quantity ?? 1);
    const unitBuy = card.previousPrice ?? card.currentPrice;
    const unitCur = calculateAdjustedCardPrice(
      card.currentPrice,
      card.condition,
      pricingOptions?.conditionMultipliers,
      pricingOptions?.conditionPricingEnabled ?? false
    );
    const totalInvested = Number((unitBuy * qty).toFixed(2));
    const totalCurrent = Number((unitCur * qty).toFixed(2));
    const totalProfit = Number((totalCurrent - totalInvested).toFixed(2));
    const roiPercent = totalInvested > 0 ? Number(((totalProfit / totalInvested) * 100).toFixed(1)) : 0;

    return {
      id: card.id,
      title: card.title,
      nameEn: card.nameEn,
      edition: card.edition,
      editionCode: card.editionCode,
      quantity: qty,
      unitBuyPrice: unitBuy,
      unitCurrentPrice: unitCur,
      totalInvested,
      totalCurrent,
      totalProfit,
      roiPercent
    };
  });

  const topGainers = [...mapped]
    .filter((c) => c.totalProfit > 0)
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .slice(0, limit);

  const topLosers = [...mapped]
    .filter((c) => c.totalProfit < 0)
    .sort((a, b) => a.totalProfit - b.totalProfit)
    .slice(0, limit);

  return { topGainers, topLosers };
}

/**
 * Tipos de gráficas e índices de mercado MTG disponibles.
 */
export type MarketIndexType = 'collectibles' | 'liquidity' | 'composite';

export interface MarketIndexSeries {
  id: string;
  name: string;
  color: string;
  values: number[];
}

export interface MarketIndexChartData {
  chartType: MarketIndexType;
  title: string;
  shortLabel: string;
  subtitle: string;
  unit: string;
  labels: string[];
  zeroBaseline: boolean;
  series: MarketIndexSeries[];
  summary: {
    latestValue: number;
    changeValue: number;
    changePercent: number;
    trend: 'up' | 'down' | 'neutral';
    basketDescription: string;
    constituents: string[];
  };
}

export const MARKET_INDEX_PRESETS: Record<
  MarketIndexType,
  {
    title: string;
    shortLabel: string;
    subtitle: string;
    unit: string;
    zeroBaseline: boolean;
    basketDescription: string;
    constituents: string[];
    seriesDefinitions: Array<{ id: string; name: string; color: string }>;
    values: Record<ChartTimeframe, number[][]>;
  }
> = {
  collectibles: {
    title: 'Evolución de Mercado: Selectivos de Coleccionismo e Inversión (Cardmarket EUR)',
    shortLabel: 'Coleccionismo e Inversión',
    subtitle: 'Seguimiento de cartas Reserved List, Tier 1 Vintage y dual lands de alta gama',
    unit: '€',
    zeroBaseline: false,
    basketDescription: 'Cesta selectiva de activos de inversión: Vintage, Reserved List y Tier 1 Dual Lands.',
    constituents: [
      'Black Lotus (2ED)',
      'Underground Sea (3ED)',
      'Volcanic Island (3ED)',
      "Gaea's Cradle (USG)",
      'Mox Diamond (STH)',
      "Lion's Eye Diamond (MIR)"
    ],
    seriesDefinitions: [
      { id: 'coll-basket', name: 'Cesta Blue Chips (€)', color: '#F59E0B' },
      { id: 'coll-duals', name: 'Dual Lands Tier 1 (€)', color: '#3B82F6' },
      { id: 'coll-rl', name: 'Reserved List Staples (€)', color: '#8B5CF6' }
    ],
    values: {
      '1S': [
        [1461.0, 1461.8, 1462.5, 1463.2, 1464.0, 1464.8, 1465.0],
        [752.0, 752.5, 753.0, 753.8, 754.2, 754.9, 755.0],
        [957.5, 958.0, 958.5, 959.0, 959.4, 959.8, 960.0]
      ],
      '1M': [
        [1448.0, 1450.5, 1453.0, 1455.5, 1458.0, 1460.5, 1463.0, 1465.0],
        [746.0, 747.5, 749.0, 750.5, 752.0, 753.2, 754.3, 755.0],
        [950.0, 951.5, 953.0, 955.0, 956.5, 957.8, 959.0, 960.0]
      ],
      '3M': [
        [1415.0, 1422.0, 1428.5, 1435.0, 1442.0, 1448.5, 1455.0, 1461.0, 1465.0],
        [730.0, 733.5, 737.0, 740.5, 744.0, 747.5, 750.5, 753.0, 755.0],
        [928.0, 932.0, 936.5, 941.0, 946.0, 950.5, 954.5, 957.5, 960.0]
      ],
      '6M': [
        [1370.0, 1385.0, 1402.0, 1418.0, 1435.0, 1450.0, 1465.0],
        [705.0, 714.0, 723.0, 732.0, 741.0, 748.0, 755.0],
        [895.0, 905.0, 916.0, 928.0, 940.0, 950.0, 960.0]
      ],
      '1A': [
        [1280.0, 1295.0, 1312.0, 1328.0, 1345.0, 1362.0, 1380.0, 1398.0, 1415.0, 1432.0, 1445.0, 1456.0, 1465.0],
        [640.0, 650.0, 662.0, 675.0, 688.0, 702.0, 714.0, 725.0, 734.0, 741.0, 747.0, 752.0, 755.0],
        [820.0, 832.0, 846.0, 860.0, 875.0, 890.0, 905.0, 918.0, 930.0, 941.0, 949.0, 955.0, 960.0]
      ]
    }
  },
  liquidity: {
    title: 'Evolución de Mercado: Selectivos de Juego Activo y Liquidez (Commander y Fetchlands)',
    shortLabel: 'Juego y Liquidez',
    subtitle: 'Rendimiento de las 10 Fetchlands y principales staples de Commander (EDH)',
    unit: '€',
    zeroBaseline: false,
    basketDescription: 'Cesta de alta liquidez: Las 10 fetchlands competitivas y los pilares de juego en Commander.',
    constituents: [
      'Polluted Delta',
      'Scalding Tarn',
      'Misty Rainforest',
      'Flooded Strand',
      'Sol Ring (Masterpiece)',
      'The One Ring (LTR)',
      'Rhystic Study (WOT)',
      'Smothering Tithe (2X2)',
      'Cyclonic Rift (RTR)'
    ],
    seriesDefinitions: [
      { id: 'liq-fetchlands', name: 'Fetchlands Modern & Pioneer (€)', color: '#06B6D4' },
      { id: 'liq-commander', name: 'Commander EDH Staples (€)', color: '#EC4899' },
      { id: 'liq-composite', name: 'Media Selectivo Liquidez (€)', color: '#10B981' }
    ],
    values: {
      '1S': [
        [31.90, 31.92, 31.95, 32.00, 32.04, 32.08, 32.10],
        [80.10, 80.15, 80.22, 80.30, 80.38, 80.45, 80.50],
        [56.00, 56.04, 56.09, 56.15, 56.21, 56.26, 56.30]
      ],
      '1M': [
        [30.90, 31.10, 31.30, 31.45, 31.60, 31.75, 31.95, 32.10],
        [77.80, 78.20, 78.65, 79.10, 79.55, 79.95, 80.25, 80.50],
        [54.35, 54.65, 54.98, 55.28, 55.58, 55.85, 56.10, 56.30]
      ],
      '3M': [
        [28.80, 29.25, 29.70, 30.15, 30.60, 31.05, 31.45, 31.80, 32.10],
        [73.50, 74.40, 75.35, 76.30, 77.25, 78.15, 79.05, 79.80, 80.50],
        [51.15, 51.83, 52.53, 53.23, 53.93, 54.60, 55.25, 55.80, 56.30]
      ],
      '6M': [
        [26.50, 27.40, 28.35, 29.30, 30.25, 31.20, 32.10],
        [68.50, 70.50, 72.60, 74.70, 76.70, 78.60, 80.50],
        [47.50, 48.95, 50.48, 52.00, 53.48, 54.90, 56.30]
      ],
      '1A': [
        [34.50, 33.80, 32.50, 31.20, 30.00, 26.50, 25.80, 27.20, 28.50, 29.80, 30.70, 31.50, 32.10],
        [58.20, 60.50, 63.80, 67.20, 71.00, 69.50, 68.20, 70.40, 73.00, 75.80, 77.50, 79.10, 80.50],
        [46.35, 47.15, 48.15, 49.20, 50.50, 48.00, 47.00, 48.80, 50.75, 52.80, 54.10, 55.30, 56.30]
      ]
    }
  },
  composite: {
    title: 'Evolución Histórica: Índice General MTG Composite Base 100 (Cardmarket EUR)',
    shortLabel: 'Índice General Base 100',
    subtitle: 'Índice de referencia normalizado a Base 100 para medir la rentabilidad global del mercado',
    unit: ' pts',
    zeroBaseline: false,
    basketDescription: 'Índice de mercado MTG ponderado Base 100 calculado sobre más de 250 referencias representativas.',
    constituents: [
      'MTG Composite General (Ponderado)',
      'Subíndice Coleccionismo (Reserved List)',
      'Subíndice Juego y Competitivo (Modern/Commander)'
    ],
    seriesDefinitions: [
      { id: 'comp-general', name: 'MTG Composite General (Base 100)', color: '#2563EB' },
      { id: 'comp-collectibles', name: 'Subíndice Coleccionismo (Base 100)', color: '#F59E0B' },
      { id: 'comp-gameplay', name: 'Subíndice Juego y Competitivo (Base 100)', color: '#8B5CF6' }
    ],
    values: {
      '1S': [
        [100.0, 100.1, 100.2, 100.4, 100.5, 100.7, 100.8],
        [100.0, 100.1, 100.2, 100.3, 100.5, 100.6, 100.7],
        [100.0, 100.2, 100.3, 100.5, 100.7, 100.9, 101.1]
      ],
      '1M': [
        [100.0, 100.4, 100.8, 101.2, 101.6, 102.1, 102.5, 102.9],
        [100.0, 100.5, 100.9, 101.4, 101.8, 102.3, 102.8, 103.2],
        [100.0, 100.6, 101.1, 101.7, 102.2, 102.7, 103.2, 103.7]
      ],
      '3M': [
        [100.0, 100.8, 101.6, 102.5, 103.3, 104.2, 105.0, 105.8, 106.5],
        [100.0, 100.9, 101.7, 102.8, 103.7, 104.6, 105.5, 106.3, 107.2],
        [100.0, 101.2, 102.1, 103.2, 104.1, 105.0, 105.9, 106.8, 107.6]
      ],
      '6M': [
        [100.0, 101.5, 103.1, 104.7, 106.3, 107.9, 109.5],
        [100.0, 101.6, 103.3, 105.0, 106.6, 108.3, 109.9],
        [100.0, 101.7, 103.5, 105.3, 107.1, 108.8, 110.5]
      ],
      '1A': [
        [100.0, 101.2, 102.5, 103.8, 105.2, 104.5, 103.8, 105.5, 107.4, 109.1, 110.8, 112.4, 113.8],
        [100.0, 101.8, 103.5, 105.3, 107.1, 109.0, 110.8, 112.5, 114.2, 115.9, 117.4, 118.8, 120.1],
        [100.0, 100.9, 101.8, 102.7, 103.8, 100.2, 98.6, 101.4, 104.2, 106.5, 108.0, 109.3, 110.5]
      ]
    }
  }
};

/**
 * Construye la estructura de datos para graficar índices y selectivos de mercado MTG
 * según el tipo de índice y el marco temporal seleccionado.
 */
export function buildMarketIndexChart(
  chartType: MarketIndexType,
  timeframe: ChartTimeframe,
  referenceDate: Date = new Date('2026-11-13T00:00:00Z')
): MarketIndexChartData {
  const preset = MARKET_INDEX_PRESETS[chartType];
  const { labels } = generateChartTimeframeLabels(timeframe, referenceDate);
  const rawSeriesValues = preset.values[timeframe];

  const series: MarketIndexSeries[] = preset.seriesDefinitions.map((def, sIdx) => ({
    id: def.id,
    name: def.name,
    color: def.color,
    values: rawSeriesValues[sIdx] ?? []
  }));

  const primarySeries = series[0]?.values ?? [];
  const startVal = primarySeries[0] ?? 0;
  const latestVal = primarySeries[primarySeries.length - 1] ?? 0;
  const changeVal = Number((latestVal - startVal).toFixed(2));
  const changePct = startVal > 0 ? Number(((changeVal / startVal) * 100).toFixed(2)) : 0;
  const trend: 'up' | 'down' | 'neutral' = changeVal > 0 ? 'up' : changeVal < 0 ? 'down' : 'neutral';

  return {
    chartType,
    title: preset.title,
    shortLabel: preset.shortLabel,
    subtitle: preset.subtitle,
    unit: preset.unit,
    labels,
    zeroBaseline: preset.zeroBaseline,
    series,
    summary: {
      latestValue: latestVal,
      changeValue: changeVal,
      changePercent: changePct,
      trend,
      basketDescription: preset.basketDescription,
      constituents: preset.constituents
    }
  };
}

