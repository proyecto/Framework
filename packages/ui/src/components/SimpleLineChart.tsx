import { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent
} from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { SegmentedControl } from './Badge.js';
import { GoogleIcon } from './Icon.js';

export interface ChartSeries {
  id: string;
  name: string;
  color?: string;
  values: number[];
}

export interface SimpleLineChartProps {
  series: ChartSeries[];
  labels: string[];
  height?: number;
  unit?: string;
  autoScale?: boolean;
  zeroBaseline?: boolean;
  showDots?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  strokeWidth?: number;
  timeframeOptions?: Array<{ value: string; label: string }>;
  activeTimeframe?: string;
  onTimeframeChange?: (next: string) => void;
  emptyMessage?: string;
}

const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

/**
 * Gráfica de líneas simple y multiserie implementada con primitivas estándar de React Native.
 *
 * Características:
 * - Soporta 1, 2 o más series simultáneas (ej. comparar varias acciones o métricas).
 * - Selector integrado de período temporal (1D, 1S, 1M, 1A).
 * - Leyenda interactiva para mostrar u ocultar series pulsando sobre ellas.
 * - Cursor táctil interactivo (scrubbing) con línea guía y tooltip flotante con fecha y valores.
 * - Cero dependencias nativas externas: funciona de forma idéntica en Expo Android, iOS y Web.
 */
export function SimpleLineChart({
  series,
  labels,
  height = 190,
  unit = '',
  autoScale = true,
  zeroBaseline = false,
  showDots = true,
  showGrid = true,
  showLegend = true,
  strokeWidth = 2.5,
  timeframeOptions,
  activeTimeframe,
  onTimeframeChange,
  emptyMessage = 'Sin datos para graficar'
}: SimpleLineChartProps) {
  const theme = useFrameworkTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [hiddenSeriesIds, setHiddenSeriesIds] = useState<Set<string>>(() => new Set());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const containerWidthRef = useRef(0);
  const selectedIndexRef = useRef<number | null>(null);

  const activeSeries = useMemo(
    () =>
      series
        .filter((s) => !hiddenSeriesIds.has(s.id))
        .map((s, index) => ({
          ...s,
          resolvedColor: s.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]
        })),
    [series, hiddenSeriesIds]
  );

  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const s of activeSeries) {
      for (const val of s.values) {
        if (Number.isFinite(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return { minVal: 0, maxVal: 100 };
    }

    if (min === max) {
      min -= 1;
      max += 1;
    }

    if (zeroBaseline) {
      const topPadding = (max - Math.min(0, min)) * 0.08;
      return {
        minVal: Math.min(0, min),
        maxVal: max + topPadding
      };
    }

    if (autoScale) {
      const padding = (max - min) * 0.12;
      const computedMin = min >= 0 ? Math.max(0, min - padding) : min - padding;
      return { minVal: computedMin, maxVal: max + padding };
    }

    return { minVal: Math.min(0, min), maxVal: max * 1.05 };
  }, [activeSeries, autoScale, zeroBaseline]);

  const yPaddingTop = 18;
  const yPaddingBottom = 26;
  const xPaddingLeft = 46;
  const xPaddingRight = 16;

  const plotWidth = Math.max(10, containerWidth - xPaddingLeft - xPaddingRight);
  const plotHeight = Math.max(10, height - yPaddingTop - yPaddingBottom);

  const pointCount = labels.length;

  const getCoordinates = (values: number[]) => {
    if (pointCount <= 1) return [];
    const valRange = Math.max(0.0001, maxVal - minVal);

    return values.map((val, idx) => {
      const x = xPaddingLeft + (idx / (pointCount - 1)) * plotWidth;
      const normalizedY = (val - minVal) / valRange;
      const y = yPaddingTop + (1 - Math.max(0, Math.min(1, normalizedY))) * plotHeight;
      return { x, y, val };
    });
  };

  const updateScrubbingIndex = (locationX: number) => {
    if (pointCount <= 1 || plotWidth <= 0) return;
    const clampedX = Math.max(xPaddingLeft, Math.min(xPaddingLeft + plotWidth, locationX));
    const ratio = (clampedX - xPaddingLeft) / plotWidth;
    const nextIdx = Math.round(ratio * (pointCount - 1));
    if (nextIdx !== selectedIndexRef.current) {
      selectedIndexRef.current = nextIdx;
      setSelectedIndex(nextIdx);
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          updateScrubbingIndex(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          updateScrubbingIndex(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => {
          // Mantiene el tooltip visible o se desvanece suavemente
        },
        onPanResponderTerminate: () => {}
      }),
    [pointCount, plotWidth]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    containerWidthRef.current = w;
    setContainerWidth(w);
  };

  const toggleSeries = (id: string) => {
    setHiddenSeriesIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (activeSeries.length > 1) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const gridTicks = useMemo(() => {
    const ticksCount = 4;
    const ticks: Array<{ value: number; y: number }> = [];
    for (let i = 0; i < ticksCount; i++) {
      const ratio = i / (ticksCount - 1);
      const val = maxVal - ratio * (maxVal - minVal);
      const y = yPaddingTop + ratio * plotHeight;
      ticks.push({ value: val, y });
    }
    return ticks;
  }, [minVal, maxVal, plotHeight]);

  const activeIndex = selectedIndex !== null ? selectedIndex : pointCount - 1;
  const activeLabel = labels[activeIndex] ?? '';

  return (
    <View style={{ gap: theme.spacing.sm }}>
      {/* 1. Selector de períodos opcional (1D / 1S / 1M / 1A) */}
      {timeframeOptions && timeframeOptions.length > 0 && activeTimeframe && onTimeframeChange ? (
        <SegmentedControl
          value={activeTimeframe}
          options={timeframeOptions}
          onChange={onTimeframeChange}
        />
      ) : null}

      {/* 2. Cabecera dinámica con valor actual inspeccionado */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          paddingHorizontal: 2
        }}
      >
        <View style={{ gap: 4, flex: 1 }}>
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.captionSize,
              ...textTypographyStyle(theme, 'medium')
            }}
          >
            {selectedIndex !== null ? `Selección: ${activeLabel}` : `Último registro (${activeLabel})`}
          </Text>
          <View style={{ gap: 4 }}>
            {activeSeries.map((s) => {
              const currentVal = s.values[activeIndex];
              return (
                <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: theme.radius.full,
                      backgroundColor: s.resolvedColor
                    }}
                  />
                  <Text
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: theme.typography.bodySize,
                      fontVariant: ['tabular-nums'],
                      ...textTypographyStyle(theme, 'bold')
                    }}
                  >
                    {s.name}: {typeof currentVal === 'number' ? currentVal.toFixed(1) : '-'}{unit}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {selectedIndex !== null ? (
          <Pressable onPress={() => setSelectedIndex(null)} hitSlop={8} style={{ paddingTop: 2 }}>
            <Text
              style={{
                color: theme.colors.accentText,
                fontSize: theme.typography.captionSize,
                ...textTypographyStyle(theme, 'semibold')
              }}
            >
              Restablecer
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* 3. Área de trazado de la gráfica */}
      <View
        onLayout={handleLayout}
        style={{
          height,
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
          position: 'relative'
        }}
        {...panResponder.panHandlers}
      >
        {activeSeries.length === 0 || pointCount < 2 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {emptyMessage}
            </Text>
          </View>
        ) : (
          <>
            {/* Líneas de rejilla y etiquetas Y */}
            {showGrid
              ? gridTicks.map((tick, i) => (
                  <View
                    key={i}
                    style={{
                      position: 'absolute',
                      top: tick.y,
                      left: 0,
                      right: 0,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Text
                      style={{
                        width: xPaddingLeft - 8,
                        textAlign: 'right',
                        color: theme.colors.textSecondary,
                        fontSize: 10,
                        fontVariant: ['tabular-nums'],
                        ...textTypographyStyle(theme, 'regular')
                      }}
                    >
                      {Math.abs(tick.value) < 0.001 ? '0' : tick.value.toFixed(0)}
                    </Text>
                    <View
                      style={{
                        flex: 1,
                        height: 1,
                        backgroundColor: theme.colors.border,
                        opacity: 0.6
                      }}
                    />
                  </View>
                ))
              : null}

            {/* Segmentos de línea para cada serie */}
            {activeSeries.map((s) => {
              const coords = getCoordinates(s.values);
              return (
                <View key={s.id} pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
                  {coords.map((curr, idx) => {
                    if (idx === coords.length - 1) return null;
                    const next = coords[idx + 1]!;
                    const dx = next.x - curr.x;
                    const dy = next.y - curr.y;
                    const length = Math.hypot(dx, dy);
                    const angle = Math.atan2(dy, dx);
                    const midX = (curr.x + next.x) / 2;
                    const midY = (curr.y + next.y) / 2;

                    return (
                      <View
                        key={`seg-${idx}`}
                        style={{
                          position: 'absolute',
                          left: midX - length / 2,
                          top: midY - strokeWidth / 2,
                          width: length,
                          height: strokeWidth,
                          backgroundColor: s.resolvedColor,
                          borderRadius: strokeWidth / 2,
                          transform: [{ rotate: `${angle}rad` }]
                        }}
                      />
                    );
                  })}

                  {/* Puntos destacados en cada coordenada */}
                  {showDots
                    ? coords.map((c, idx) => {
                        const isCurrent = idx === activeIndex;
                        const dotSize = isCurrent ? 8 : 5;
                        return (
                          <View
                            key={`dot-${idx}`}
                            style={{
                              position: 'absolute',
                              left: c.x - dotSize / 2,
                              top: c.y - dotSize / 2,
                              width: dotSize,
                              height: dotSize,
                              borderRadius: theme.radius.full,
                              backgroundColor: s.resolvedColor,
                              borderWidth: isCurrent ? 2 : 0,
                              borderColor: theme.colors.surface
                            }}
                          />
                        );
                      })
                    : null}
                </View>
              );
            })}

            {/* Cursor vertical de inspección (scrubbing) */}
            {selectedIndex !== null && pointCount > 1 ? (
              <View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: yPaddingTop,
                  bottom: yPaddingBottom,
                  left: xPaddingLeft + (selectedIndex / (pointCount - 1)) * plotWidth - 1,
                  width: 2,
                  backgroundColor: theme.colors.accent,
                  opacity: 0.85
                }}
              />
            ) : null}

            {/* Etiquetas del eje X inferior */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                bottom: 6,
                left: xPaddingLeft,
                width: plotWidth,
                flexDirection: 'row',
                justifyContent: 'space-between'
              }}
            >
              {labels.map((lbl, idx) => {
                // Solo muestra etiquetas representativas para evitar solapamientos
                const total = labels.length;
                const shouldShow =
                  total <= 6 ||
                  idx === 0 ||
                  idx === total - 1 ||
                  idx === Math.round(total / 2) ||
                  idx === Math.round(total / 4) ||
                  idx === Math.round((3 * total) / 4);

                return (
                  <Text
                    key={idx}
                    style={{
                      opacity: shouldShow ? 1 : 0,
                      color:
                        idx === activeIndex
                          ? theme.colors.accentText
                          : theme.colors.textSecondary,
                      fontSize: 10,
                      ...textTypographyStyle(theme, idx === activeIndex ? 'bold' : 'regular')
                    }}
                  >
                    {lbl}
                  </Text>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* 4. Leyenda interactiva inferior con badges de filtro */}
      {showLegend && series.length > 1 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.sm,
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          {series.map((s, index) => {
            const isHidden = hiddenSeriesIds.has(s.id);
            const color = s.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]!;

            return (
              <Pressable
                key={s.id}
                onPress={() => toggleSeries(s.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: theme.radius.full,
                  backgroundColor: isHidden ? theme.colors.surfaceMuted : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: isHidden ? theme.colors.border : color,
                  opacity: isHidden ? 0.5 : 1
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: theme.radius.full,
                    backgroundColor: color
                  }}
                />
                <Text
                  style={{
                    color: isHidden ? theme.colors.textSecondary : theme.colors.textPrimary,
                    fontSize: theme.typography.captionSize,
                    ...textTypographyStyle(theme, 'medium')
                  }}
                >
                  {s.name}
                </Text>
                <GoogleIcon
                  name={isHidden ? 'add-circle-outline' : 'check-circle'}
                  size={12}
                  color={isHidden ? theme.colors.textSecondary : color}
                />
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

