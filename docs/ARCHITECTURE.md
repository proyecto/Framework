# Arquitectura del Framework MVC (Node.js + React/Expo + libSQL/Turso)

## 1. Separación estricta de responsabilidades (MVC + Interfaces)

```text
+-------------------------------------------------------------------+
|  VISTAS (Intercambiables vía IView<TState> y IController<TState>) |
|  - apps/demo-expo (Android UI con @framework/ui)                  |
|  - apps/demo-web  (Desktop Web UI con HTML/CSS moderno)           |
+---------------------------------+---------------------------------+
                                  | IController<TState> / IView<TState>
                                  v
+-------------------------------------------------------------------+
|  CONTROLADOR + MODELO (@framework/example-domain + @framework/core)|
|  - PresetController: valida acciones, gestiona estados y eventos  |
|  - PresetModel: reglas de negocio, habla solo con ISyncableRepo   |
+---------------------------------+---------------------------------+
                                  | ISyncableRepository<T> / ISqlDriver
                                  v
+-------------------------------------------------------------------+
|  CAPA DE DATOS Y SINCRONIZACIÓN (@framework/data)                 |
|  - Modo Local (Gratis): SqlEntityStoreDriver -> ExpoSqliteDriver  |
|    (o WebLocalStorageEntityStore en navegador). Datos no salen.   |
|  - Modo Nube (Pro): HybridSyncRepository -> HttpSyncTransport ->  |
|    @framework/server (Node.js) -> LibSqlDriver (local o Turso)    |
+-------------------------------------------------------------------+
```

## 2. Almacenamiento Local (Gratis) vs Nube Turso (Pro)

- **Usuario sin suscripción (`plan: 'free'`, `mode: 'local'`)**:
  - Todos los datos permanecen exclusivamente en el dispositivo (`expo-sqlite` en Android, `localStorage` en Web).
  - Si el usuario borra la app, los datos locales se pierden. No se realiza ninguna petición de red ni se guardan registros en el backend.
- **Usuario de pago (`plan: 'pro'`, `mode: 'cloud'`)**:
  - Cuando el usuario activa "Sincronizar en la nube", `HybridSyncRepository` sube automáticamente los registros locales pendientes (`pending`) al backend Node.js (`POST /api/v1/apps/:appId/sync`), que valida el `entitlement` y persiste en **Turso** (o en un archivo libSQL local si el backend está en modo `local`).
  - Para el usuario final es transparente ("La Nube"); nunca gestiona URLs ni tokens de Turso.

## 3. Reutilización del Backend Node.js (`@framework/server`)

El paquete `@framework/server` es totalmente agnóstico de la app:
- Gestiona múltiples aplicaciones aisladas por `appId` y `userId`.
- Incluye motor de sincronización genérico con resolución de conflictos determinista (`Last-Write-Wins` por `updatedAt` + `version`), borrados lógicos (`deletedAt` tombstones) y control de permisos (`entitlements`).
- Permite inyectar módulos de app (`RegisteredAppModule`) con migraciones SQL propias y acciones de controlador personalizadas (`/api/v1/apps/:appId/actions/:actionName`).
- Cambia entre libSQL local (`STORAGE_DRIVER=local`) y Turso (`STORAGE_DRIVER=turso`) mediante configuración, sin modificar una sola línea de código.

## 4. Actualización sencilla de Expo SDK

1. Todas las versiones de `expo`, `expo-sqlite`, `react` y `react-native` viven centralizadas en la sección `catalog:` de `pnpm-workspace.yaml`.
2. `@framework/ui` utiliza **exclusivamente primitivas estándar de `react-native`** (incluyendo un `Slider` propio con `PanResponder`), evitando librerías nativas de terceros que suelen romperse al actualizar Expo.
3. `@framework/expo-adapter` es el único paquete que importa `expo-sqlite`, encapsulándolo tras `ISqlDriver`.

Para actualizar Expo en todas tus apps a la vez:
```bash
node scripts/upgrade-expo.mjs --expo=~59.0.0
corepack pnpm install
corepack pnpm --filter @framework/demo-expo exec npx expo install --fix
corepack pnpm typecheck && corepack pnpm test
```

