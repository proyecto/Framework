import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent
} from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';

export interface SliderProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
}

/** Recorta el valor al rango `[min, max]` y lo ajusta al múltiplo exacto de `step`. */
function clampAndStep(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, raw));
  const stepped = Math.round((clamped - min) / step) * step + min;
  const decimals = String(step).includes('.') ? String(step).split('.')[1]?.length ?? 0 : 0;
  return Number(Math.min(max, Math.max(min, stepped)).toFixed(decimals));
}

/**
 * Slider propio implementado con primitivas puras de React Native (`View` + `PanResponder`).
 *
 * Al evitar dependencias nativas externas (`@react-native-community/slider`), garantiza:
 * - Estética 100% idéntica en todas las apps del framework.
 * - Cero fricción o roturas de enlazado nativo al actualizar versiones de Expo SDK.
 */
export function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  disabled = false,
  onValueChange,
  onSlidingComplete
}: SliderProps) {
  const theme = useFrameworkTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  // Refs mutables para leer ancho y último valor dentro del closure memorizado de PanResponder.
  const trackWidthRef = useRef(0);
  const latestDraftRef = useRef(value);
  const startLocationXRef = useRef(0);

  useEffect(() => {
    if (!dragging) {
      setDraftValue(value);
      latestDraftRef.current = value;
    }
  }, [value, dragging]);

  const activeValue = dragging ? draftValue : value;
  const range = Math.max(0.0001, max - min);
  const ratio = Math.min(1, Math.max(0, (activeValue - min) / range));

  const valueFromX = (x: number): number => {
    const width = trackWidthRef.current;
    if (width <= 0) return activeValue;
    const localRatio = Math.min(1, Math.max(0, x / width));
    return clampAndStep(min + localRatio * (max - min), min, max, step);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          if (disabled) return;
          startLocationXRef.current = evt.nativeEvent.locationX;
          setDragging(true);
          const next = valueFromX(evt.nativeEvent.locationX);
          latestDraftRef.current = next;
          setDraftValue(next);
          onValueChange?.(next);
        },
        onPanResponderMove: (_evt, gestureState) => {
          if (disabled) return;
          const next = valueFromX(startLocationXRef.current + gestureState.dx);
          if (next !== latestDraftRef.current) {
            latestDraftRef.current = next;
            setDraftValue(next);
            onValueChange?.(next);
          }
        },
        onPanResponderRelease: () => {
          if (disabled) return;
          setDragging(false);
          onSlidingComplete?.(latestDraftRef.current);
        },
        onPanResponderTerminate: () => {
          setDragging(false);
          onSlidingComplete?.(latestDraftRef.current);
        }
      }),
    [disabled, min, max, step, onValueChange, onSlidingComplete]
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  };

  const thumbSize = dragging ? 24 : 20;
  const thumbLeft = Math.max(
    0,
    Math.min(Math.max(0, trackWidth - thumbSize), ratio * trackWidth - thumbSize / 2)
  );

  return (
    <View style={{ opacity: disabled ? 0.5 : 1, gap: theme.spacing.xs }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: theme.typography.bodySize,
            fontWeight: '500'
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: theme.colors.accentText,
            fontSize: theme.typography.bodySize,
            fontWeight: '700',
            fontVariant: ['tabular-nums']
          }}
        >
          {activeValue}
          {unit}
        </Text>
      </View>

      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: activeValue }}
        onLayout={handleLayout}
        style={{
          height: 36,
          justifyContent: 'center',
          position: 'relative'
        }}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            height: 6,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.trackInactive,
            overflow: 'hidden'
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${Math.round(ratio * 100)}%`,
              backgroundColor: theme.colors.accent
            }}
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: thumbLeft,
            width: thumbSize,
            height: thumbSize,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.accent,
            borderWidth: 3,
            borderColor: theme.colors.surface
          }}
        />
      </View>
    </View>
  );
}
