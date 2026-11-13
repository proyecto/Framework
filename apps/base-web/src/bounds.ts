/**
 * Límites visuales y estructurales de la **App Base Web**.
 *
 * Sincronizados con `apps/base-expo/src/bounds.ts` y los Design Tokens de `@framework/ui`
 * (`tokens.ts`), estableciendo la anatomía fija que comparten todas las interfaces Web.
 */
export const WEB_LAYOUT_BOUNDS = {
  /** Ancho máximo del área de trabajo centrada en escritorio (px). */
  maxWorkspaceWidthPx: 1200,
  /** Rango permitido para el panel lateral maestro (`minmax(260px, 320px)`). */
  sidebarWidthRangePx: [260, 320] as const,
  /** Máximo de acciones al pie del inspector antes de pasar a menú secundario. */
  maxInspectorFooterActions: 2,
  /** Duración estándar del banner `toast` en Web (ms). */
  toastDurationMs: 3500,
  /** Paso por defecto en `<input type="range">`. */
  defaultSliderStep: 5,
  designRules: [
    'Design Tokens Tier 1/2 en `@layer theme` equivalentes 1:1 a `LIGHT_THEME` y `DARK_THEME` de `@framework/ui`.',
    'Estructura fija de 3 regiones mediante `grid-template-areas`: topbar con botón permanente "Ajustes", sidebar maestro e inspector principal.',
    'Adaptación guiada por contenedor (`@container`) en bloques de métricas y propiedades lógicas (`inline-size`, `padding-block`).',
    'Modal centralizado de "Ajustes" (`<dialog closedby="any">`) para gestión de tema, sincronización y release, con confirmación explícita para acciones destructivas.'
  ]
} as const;

