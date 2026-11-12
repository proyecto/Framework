# `@framework/base-expo` (App Base Móvil Expo)

Plantilla canónica que fija los **límites visuales, estructurales y de diseño** para todas las aplicaciones Android creadas sobre el framework.

## Límites que impone al resto de apps

1. **Contenedor único (`AppShell`)**: cabecera fija con título + subtítulo + un único `Badge` a la derecha, banda de notificaciones (`toastMessage`), barra de estado Local/Nube (`StorageStatusBar`) y hasta 4 pestañas inferiores (`APP_LAYOUT_BOUNDS.maxBottomTabs`).
2. **Tokens estrictos (`@framework/ui`)**: ningún componente de vista define colores ni tamaños arbitrarios; todo proviene de `useFrameworkTheme()` (`LIGHT_THEME` / `DARK_THEME`).
3. **Componentes estándar exclusivos**: `Card`, `Button`, `Slider`, `SwitchToggle`, `TextField`, `SegmentedControl`, `Badge` y `ModalDialog` implementados sobre primitivas puras de React Native para facilitar la actualización de Expo SDK.
4. **MVC estricto**: la vista solo interactúa con `IBaseAppController` vía `useMvcController` y jamás importa modelos concretos, `expo-sqlite` ni clientes HTTP.

