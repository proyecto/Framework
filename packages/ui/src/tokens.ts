import type { TextStyle } from 'react-native';

/** Preferencia de esquema visual del usuario o del sistema operativo. */
export type ThemeScheme = 'light' | 'dark' | 'system';

/** Pesos tipográficos semánticos soportados por el Design System. */
export type ThemeFontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/**
 * Familias tipográficas cargadas en tiempo de ejecución (por ejemplo, Google Fonts `Inter`).
 * En React Native Android cada archivo `.ttf` representa un peso concreto, por lo que si está
 * definido `fontFamily` se aplica directamente sin colisionar con `fontWeight`.
 */
export interface ThemeFontFamilies {
  regular?: string;
  medium?: string;
  semibold?: string;
  bold?: string;
  extrabold?: string;
}

const FALLBACK_WEIGHT_VALUES: Record<ThemeFontWeight, NonNullable<TextStyle['fontWeight']>> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800'
};

/**
 * Resuelve el estilo tipográfico (`fontFamily` de Google Fonts si fue inyectado por la app,
 * o `fontWeight` nativo de respaldo si se usa el tema por defecto).
 */
export function textTypographyStyle(
  theme: FrameworkTheme,
  weight: ThemeFontWeight = 'regular'
): TextStyle {
  const customFamily = theme.typography.fonts?.[weight] ?? theme.typography.fonts?.regular;
  if (customFamily) {
    return { fontFamily: customFamily };
  }
  return { fontWeight: FALLBACK_WEIGHT_VALUES[weight] };
}

/**
 * Contrato de **Design Tokens** compartido por todas las aplicaciones construidas
 * con `@framework/ui`, garantizando idéntica estética, espaciados y jerarquía tipográfica.
 */
export interface FrameworkTheme {
  scheme: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceMuted: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textInverse: string;
    accent: string;
    accentSoft: string;
    accentText: string;
    success: string;
    successSoft: string;
    warning: string;
    warningSoft: string;
    danger: string;
    dangerSoft: string;
    trackInactive: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  typography: {
    titleSize: number;
    headingSize: number;
    bodySize: number;
    captionSize: number;
    fonts?: ThemeFontFamilies;
  };
}

/** Métricas geométricas compartidas entre tema claro y oscuro. */
const SHARED_METRICS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
    full: 999
  },
  typography: {
    titleSize: 24,
    headingSize: 17,
    bodySize: 15,
    captionSize: 12
  }
};

export const LIGHT_THEME: FrameworkTheme = {
  scheme: 'light',
  colors: {
    background: '#F4F6FA',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceMuted: '#E9EEF6',
    border: '#D6DFEC',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textInverse: '#FFFFFF',
    accent: '#2563EB',
    accentSoft: '#DBEAFE',
    accentText: '#1D4ED8',
    success: '#059669',
    successSoft: '#D1FAE5',
    warning: '#D97706',
    warningSoft: '#FEF3C7',
    danger: '#DC2626',
    dangerSoft: '#FEE2E2',
    trackInactive: '#CBD5E1'
  },
  ...SHARED_METRICS
};

export const DARK_THEME: FrameworkTheme = {
  scheme: 'dark',
  colors: {
    background: '#0B1120',
    surface: '#111827',
    surfaceElevated: '#1E293B',
    surfaceMuted: '#1F2937',
    border: '#2B384E',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textInverse: '#0B1120',
    accent: '#38BDF8',
    accentSoft: '#0C4A6E',
    accentText: '#7DD3FC',
    success: '#10B981',
    successSoft: '#064E3B',
    warning: '#F59E0B',
    warningSoft: '#451A03',
    danger: '#F87171',
    dangerSoft: '#450A0A',
    trackInactive: '#334155'
  },
  ...SHARED_METRICS
};
