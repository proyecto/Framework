/**
 * Límites visuales, estructurales y de arquitectura de la **App Base Expo**.
 *
 * Toda nueva aplicación Android creada sobre este framework debe respetar estos límites
 * para conservar exactamente la misma apariencia, ergonomía táctil y facilidad de migración
 * ante futuras actualizaciones del SDK de Expo.
 */
export const APP_LAYOUT_BOUNDS = {
  /** Rango permitido de botones en la barra inferior de `AppShell` (mínimo 2, máximo 4). */
  minBottomTabs: 2,
  maxBottomTabs: 4,
  /** Pestaña canónica obligatoria de configuración presente en todas las apps. */
  settingsTab: {
    id: 'settings',
    label: 'Ajustes',
    icon: 'settings'
  },
  /** Número máximo de acciones simultáneas en el pie de una `Card`. */
  maxCardFooterActions: 2,
  /** Duración estándar del banner `toast` en `AppShell` (ms). */
  toastDurationMs: 3500,
  /** Paso por defecto recomendado en los `Slider` táctiles. */
  defaultSliderStep: 5,
  /** Reglas inmutables del sistema de diseño mostradas en la guía interna de la app base. */
  designRules: [
    'La barra inferior contiene entre 2 y 4 botones y SIEMPRE incluye como último botón de configuración "Ajustes" (`settings`).',
    'La pestaña "Ajustes" centraliza obligatoriamente: Tema visual, Almacenamiento Local/Nube, URL del backend e Información de Release.',
    'Colores, bordes, tipografía Google Fonts (`Inter`) y espaciados proceden únicamente de `useFrameworkTheme()` (`@framework/ui`).',
    'Todos los iconos usan Google Material Icons a través de `<GoogleIcon />` o la prop `icon` de `Button`/`Card`/`AppShell`.',
    'Todos los controles interactivos usan componentes estándar de `@framework/ui` (prohibidas librerías UI nativas externas).',
    'Toda acción destructiva exige confirmación explícita mediante `ModalDialog`.',
    'Las vistas consumen exclusivamente `IController<TState>` vía `useMvcController` (MVC estricto).'
  ]
} as const;
