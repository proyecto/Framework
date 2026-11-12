import { Text, View, type ViewStyle } from 'react-native';
import { useFrameworkIconRenderer, useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle, type FrameworkTheme } from '../tokens.js';

export type GoogleIconSize = 'sm' | 'md' | 'lg';
export type GoogleIconTone =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverse';

/**
 * Sugerencias de nombres estándar de Google Material Icons usados con más frecuencia
 * (acepta además cualquier nombre válido de https://fonts.google.com/icons).
 */
export type GoogleIconName =
  | 'dashboard'
  | 'tune'
  | 'cloud-queue'
  | 'cloud-upload'
  | 'cloud-off'
  | 'filter-list'
  | 'add-circle-outline'
  | 'delete-outline'
  | 'star'
  | 'star-outline'
  | 'palette'
  | 'link'
  | 'sync'
  | 'check-circle'
  | 'info-outline'
  | 'warning-amber'
  | 'settings'
  | (string & {});

const ICON_SIZE_MAP: Record<GoogleIconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24
};

const ICON_TONE_COLOR_MAP: Record<GoogleIconTone, (colors: FrameworkTheme['colors']) => string> = {
  primary: (c) => c.textPrimary,
  secondary: (c) => c.textSecondary,
  accent: (c) => c.accentText,
  success: (c) => c.success,
  warning: (c) => c.warning,
  danger: (c) => c.danger,
  inverse: (c) => c.textInverse
};

export interface GoogleIconProps {
  /** Nombre exacto del glifo en Google Material Icons (ej. `'dashboard'`, `'tune'`, `'sync'`). */
  name: GoogleIconName;
  size?: GoogleIconSize | number;
  tone?: GoogleIconTone;
  /** Color explícito; si se omite, se resuelve automáticamente mediante `tone`. */
  color?: string;
  style?: ViewStyle;
}

/**
 * Componente estandarizado de iconos Google (`MaterialIcons`) del Design System.
 *
 * Delega el dibujado real en el `iconRenderer` inyectado por `FrameworkThemeProvider`
 * (patrón **Adapter / Strategy**), evitando que `@framework/ui` dependa directamente de `@expo/vector-icons`.
 */
export function GoogleIcon({
  name,
  size = 'md',
  tone = 'primary',
  color,
  style
}: GoogleIconProps) {
  const theme = useFrameworkTheme();
  const iconRenderer = useFrameworkIconRenderer();
  const resolvedSize = typeof size === 'number' ? size : ICON_SIZE_MAP[size];
  const resolvedColor = color ?? ICON_TONE_COLOR_MAP[tone](theme.colors);

  return (
    <View
      accessible={false}
      style={[
        {
          width: resolvedSize,
          height: resolvedSize,
          alignItems: 'center',
          justifyContent: 'center'
        },
        style
      ]}
    >
      {iconRenderer ? (
        iconRenderer({ name, size: resolvedSize, color: resolvedColor })
      ) : (
        <Text
          style={{
            color: resolvedColor,
            fontSize: Math.max(10, Math.round(resolvedSize * 0.72)),
            lineHeight: resolvedSize,
            ...textTypographyStyle(theme, 'bold')
          }}
        >
          •
        </Text>
      )}
    </View>
  );
}

/** Alias corto de `GoogleIcon` para mayor comodidad en vistas. */
export const Icon = GoogleIcon;
export type IconProps = GoogleIconProps;

