import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useColorScheme } from 'react-native';
import {
  CRIMSON_THEME,
  DARK_THEME,
  LIGHT_THEME,
  OBSIDIAN_THEME,
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
  setPreference?: (preference: ThemeScheme) => void;
  iconRenderer?: IconRenderer;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface FrameworkThemeProviderProps {
  preference?: ThemeScheme;
  onPreferenceChange?: (preference: ThemeScheme) => void;
  initialPreference?: ThemeScheme;
  customLightTheme?: FrameworkTheme;
  customDarkTheme?: FrameworkTheme;
  customCrimsonTheme?: FrameworkTheme;
  customObsidianTheme?: FrameworkTheme;
  /** Familias de Google Fonts registradas en la app (p. ej. `Inter`) aplicadas globalmente al tema. */
  fontFamilies?: ThemeFontFamilies;
  /** Adaptador encargado de dibujar iconos Google (`MaterialIcons`) sin acoplar `@framework/ui` a Expo. */
  iconRenderer?: IconRenderer;
  children: ReactNode;
}

/**
 * Proveedor de tema del Design System (`LIGHT_THEME`, `DARK_THEME`, `CRIMSON_THEME`, `OBSIDIAN_THEME`).
 * Soporta selección automática según sistema operativo (`preference = 'system'`),
 * temas estilizados de productividad (Carmesí / Obsidiana), cambio dinámico de tema,
 * inyección de fuentes Google (`fontFamilies`) e inyección de renderizador de iconos (`iconRenderer`).
 */
export function FrameworkThemeProvider({
  preference: controlledPreference,
  onPreferenceChange,
  initialPreference = 'system',
  customLightTheme = LIGHT_THEME,
  customDarkTheme = DARK_THEME,
  customCrimsonTheme = CRIMSON_THEME,
  customObsidianTheme = OBSIDIAN_THEME,
  fontFamilies,
  iconRenderer,
  children
}: FrameworkThemeProviderProps) {
  const [internalPreference, setInternalPreference] = useState<ThemeScheme>(
    controlledPreference ?? initialPreference
  );

  useEffect(() => {
    if (controlledPreference !== undefined) {
      setInternalPreference(controlledPreference);
    }
  }, [controlledPreference]);

  const preference = controlledPreference ?? internalPreference;

  const setPreference = useCallback(
    (next: ThemeScheme) => {
      setInternalPreference(next);
      onPreferenceChange?.(next);
    },
    [onPreferenceChange]
  );

  const systemScheme = useColorScheme();
  const resolvedScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<ThemeContextValue>(() => {
    let baseTheme: FrameworkTheme;
    switch (resolvedScheme) {
      case 'crimson':
        baseTheme = customCrimsonTheme;
        break;
      case 'obsidian':
        baseTheme = customObsidianTheme;
        break;
      case 'dark':
        baseTheme = customDarkTheme;
        break;
      case 'light':
      default:
        baseTheme = customLightTheme;
        break;
    }

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
      setPreference,
      iconRenderer
    };
  }, [
    resolvedScheme,
    customCrimsonTheme,
    customDarkTheme,
    customLightTheme,
    customObsidianTheme,
    fontFamilies,
    iconRenderer,
    preference,
    setPreference
  ]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Devuelve el tema activo; cae a `LIGHT_THEME` si el componente se usa fuera de un provider. */
export function useFrameworkTheme(): FrameworkTheme {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.theme;
  return LIGHT_THEME;
}

/**
 * Devuelve el contexto completo de temas: tema activo, preferencia actual
 * y función reactiva `setPreference` para alternar entre claro, oscuro, carmesí u obsidiana.
 */
export function useFrameworkThemeContext(): {
  theme: FrameworkTheme;
  preference: ThemeScheme;
  setPreference: (preference: ThemeScheme) => void;
} {
  const ctx = useContext(ThemeContext);
  if (ctx) {
    return {
      theme: ctx.theme,
      preference: ctx.preference,
      setPreference: ctx.setPreference ?? (() => {})
    };
  }
  return {
    theme: LIGHT_THEME,
    preference: 'system',
    setPreference: () => {}
  };
}

/** Devuelve el adaptador de iconos configurado en `FrameworkThemeProvider`, si existe. */
export function useFrameworkIconRenderer(): IconRenderer | undefined {
  return useContext(ThemeContext)?.iconRenderer;
}
