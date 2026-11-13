import type { CardEntity, CardPricePoint } from './contracts.js';

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

