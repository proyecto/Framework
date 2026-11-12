export type ThemeScheme = 'light' | 'dark' | 'system';

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
  };
}

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

