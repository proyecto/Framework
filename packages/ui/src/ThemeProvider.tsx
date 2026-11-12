import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { DARK_THEME, LIGHT_THEME, type FrameworkTheme, type ThemeScheme } from './tokens.js';

interface ThemeContextValue {
  theme: FrameworkTheme;
  preference: ThemeScheme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface FrameworkThemeProviderProps {
  preference?: ThemeScheme;
  customLightTheme?: FrameworkTheme;
  customDarkTheme?: FrameworkTheme;
  children: ReactNode;
}

/**
 * Proveedor de tema del Design System (`LIGHT_THEME` / `DARK_THEME`).
 * Soporta selección automática según sistema operativo (`preference = 'system'`) o forzado explícito.
 */
export function FrameworkThemeProvider({
  preference = 'system',
  customLightTheme = LIGHT_THEME,
  customDarkTheme = DARK_THEME,
  children
}: FrameworkThemeProviderProps) {
  const systemScheme = useColorScheme();
  const resolvedScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolvedScheme === 'dark' ? customDarkTheme : customLightTheme,
      preference
    }),
    [resolvedScheme, customDarkTheme, customLightTheme, preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Devuelve el tema activo; cae a `LIGHT_THEME` si el componente se usa fuera de un provider. */
export function useFrameworkTheme(): FrameworkTheme {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.theme;
  return LIGHT_THEME;
}
