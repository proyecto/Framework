/**
 * Límites visuales, estructurales y de arquitectura de la **App Base Expo**.
 *
 * Toda nueva aplicación Android creada sobre este framework debe respetar estos límites
 * para conservar exactamente la misma apariencia, ergonomía táctil y facilidad de migración
 * ante futuras actualizaciones del SDK de Expo.
 */
export const APP_LAYOUT_BOUNDS = {
  /** Máximo número de pestañas en la barra inferior de `AppShell`. */
  maxBottomTabs: 4,
  /** Número máximo de acciones simultáneas en el pie de una `Card`. */
  maxCardFooterActions: 2,
  /** Duración estándar del banner `toast` en `AppShell` (ms). */
  toastDurationMs: 3500,
  /** Paso por defecto recomendado en los `Slider` táctiles. */
  defaultSliderStep: 5,
  /** Reglas inmutables del sistema de diseño mostradas en la guía interna de la app base. */
  designRules: [
    'Colores, bordes, tipografía Google Fonts (`Inter`) y espaciados proceden únicamente de `useFrameworkTheme()` (`@framework/ui`).',
    'Todos los iconos usan Google Material Icons a través de `<GoogleIcon />` o la prop `icon` de `Button`/`Card`/`AppShell`.',
    'Todos los controles interactivos usan componentes estándar de `@framework/ui` (prohibidas librerías UI nativas externas).',
    'Toda acción destructiva exige confirmación explícita mediante `ModalDialog`.',
    'Las vistas consumen exclusivamente `IController<TState>` vía `useMvcController` (MVC estricto).'
  ]
} as const;

