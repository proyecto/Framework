# `@framework/base-web` (App Base Web)

Plantilla canónica que fija los **límites visuales, estructurales y de tokens CSS** para todas las aplicaciones Web creadas sobre el framework.

## Límites que impone al resto de apps Web

1. **Shell de 3 regiones (`grid-template-areas`)**: barra superior fija (`header`), columna lateral maestra (`sidebar` de `260px..320px`) e inspector principal (`main`) dentro de un ancho máximo centrado de `1200px` (`WEB_LAYOUT_BOUNDS`).
2. **Design Tokens equivalentes a `@framework/ui`**: definidos en `@layer theme` con `light-dark()` y fallback `@media (prefers-color-scheme: dark)` para mantener la identidad visual exacta entre móvil Expo y navegador.
3. **Arquitectura CSS en capas + Container Queries**: cascada determinista (`@layer reset, base, theme, components, utilities`), propiedades lógicas (`inline-size`, `padding-block`) y `@container workspace-main` para métricas adaptativas.
4. **MVC estricto**: la vista consume únicamente `IBaseAppController` vía `useMvcController`, manteniendo el interruptor Local/Nube y las confirmaciones modales nativas (`<dialog>`).

