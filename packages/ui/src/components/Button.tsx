import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle, type FrameworkTheme } from '../tokens.js';
import { GoogleIcon, type GoogleIconName } from './Icon.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Nombre opcional de icono Google Material Icons mostrado a la izquierda del texto. */
  icon?: GoogleIconName;
  leftSlot?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

interface ButtonPalette {
  bg: string;
  border: string;
  text: string;
}

/** Tabla declarativa de estrategias de color por variante de botón. */
const BUTTON_VARIANT_PALETTES: Record<
  ButtonVariant,
  (colors: FrameworkTheme['colors']) => ButtonPalette
> = {
  primary: (c) => ({ bg: c.accent, border: c.accent, text: c.textInverse }),
  secondary: (c) => ({ bg: c.surfaceMuted, border: c.border, text: c.textPrimary }),
  outline: (c) => ({ bg: 'transparent', border: c.border, text: c.textPrimary }),
  danger: (c) => ({ bg: c.danger, border: c.danger, text: '#FFFFFF' }),
  ghost: (c) => ({ bg: 'transparent', border: 'transparent', text: c.accent })
};

/** Métricas estáticas por tamaño para evitar lógica condicional dispersa en JSX. */
const BUTTON_SIZE_METRICS: Record<
  ButtonSize,
  { paddingV: number; paddingH: number; fontSize: number }
> = {
  sm: { paddingV: 8, paddingH: 12, fontSize: 13 },
  md: { paddingV: 11, paddingH: 16, fontSize: 15 },
  lg: { paddingV: 14, paddingH: 20, fontSize: 16 }
};

/**
 * Botón estándar del framework sobre primitivas puras de React Native (`Pressable`).
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  leftSlot,
  fullWidth = false,
  style
}: ButtonProps) {
  const theme = useFrameworkTheme();
  const isDisabled = disabled || loading;
  const palette = BUTTON_VARIANT_PALETTES[variant](theme.colors);
  const metrics = BUTTON_SIZE_METRICS[size];
  const iconSize = size === 'lg' ? 18 : 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderRadius: theme.radius.md,
          paddingVertical: metrics.paddingV,
          paddingHorizontal: metrics.paddingH,
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto'
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        <>
          {icon ? <GoogleIcon name={icon} size={iconSize} color={palette.text} /> : null}
          {leftSlot ? <View>{leftSlot}</View> : null}
        </>
      )}
      <Text
        style={{
          color: palette.text,
          fontSize: metrics.fontSize,
          ...textTypographyStyle(theme, 'semibold')
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
