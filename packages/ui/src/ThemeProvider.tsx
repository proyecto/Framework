import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import {
  DARK_THEME,
  LIGHT_THEME,
  type FrameworkTheme,
  type ThemeFontFamilies,
  type ThemeScheme
} from './tokens.js';

/** Argumentos estandarizados recibidos por el adaptador de iconos inyectado en el tema. */
export interface IconRenderParams {
  name: string;
  size: number;
  color: string;
}

/**
 * Estrategia/Adaptador de renderizado de iconos (**Dependency Inversion Principle**).
 * Permite que `@framework/ui` permanezca desacoplado de `@expo/vector-icons` mientras cada app
 * Expo inyecta su implementación concreta de Google Material Icons.
 */
export type IconRenderer = (params: IconRenderParams) => ReactNode;

interface ThemeContextValue {
  theme: FrameworkTheme;
  preference: ThemeScheme;
  iconRenderer?: IconRenderer;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface FrameworkThemeProviderProps {
  preference?: ThemeScheme;
  customLightTheme?: FrameworkTheme;
  customDarkTheme?: FrameworkTheme;
  /** Familias de Google Fonts registradas en la app (p. ej. `Inter`) aplicadas globalmente al tema. */
  fontFamilies?: ThemeFontFamilies;
  /** Adaptador encargado de dibujar iconos Google (`MaterialIcons`) sin acoplar `@framework/ui` a Expo. */
  iconRenderer?: IconRenderer;
  children: ReactNode;
}

/**
 * Proveedor de tema del Design System (`LIGHT_THEME` / `DARK_THEME`).
 * Soporta selección automática según sistema operativo (`preference = 'system'`),
 * inyección de fuentes Google (`fontFamilies`) e inyección de renderizador de iconos (`iconRenderer`).
 */
export function FrameworkThemeProvider({
  preference = 'system',
  customLightTheme = LIGHT_THEME,
  customDarkTheme = DARK_THEME,
  fontFamilies,
  iconRenderer,
  children
}: FrameworkThemeProviderProps) {
  const systemScheme = useColorScheme();
  const resolvedScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(() => {
    const baseTheme = resolvedScheme === 'dark' ? customDarkTheme : customLightTheme;
    const mergedTheme: FrameworkTheme = fontFamilies
      ? {
          ...baseTheme,
          typography: {
            ...baseTheme.typography,
            fonts: {
              ...baseTheme.typography.fonts,
              ...fontFamilies
            }
          }
        }
      : baseTheme;

    return {
      theme: mergedTheme,
      preference,
      iconRenderer
    };
  }, [resolvedScheme, customDarkTheme, customLightTheme, fontFamilies, iconRenderer, preference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Devuelve el tema activo; cae a `LIGHT_THEME` si el componente se usa fuera de un provider. */
export function useFrameworkTheme(): FrameworkTheme {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.theme;
  return LIGHT_THEME;
}

/** Devuelve el adaptador de iconos configurado en `FrameworkThemeProvider`, si existe. */
export function useFrameworkIconRenderer(): IconRenderer | undefined {
  return useContext(ThemeContext)?.iconRenderer;
}
