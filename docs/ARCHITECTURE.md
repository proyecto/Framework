# Arquitectura del Framework MVC (Node.js + React/Expo + libSQL / Turso)

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
|  - PresetController: comandos encapsulados, estado y ViewEvents   |
|  - PresetModel: reglas de negocio, habla solo con ISyncableRepo   |
+---------------------------------+---------------------------------+
                                  | ISyncableRepository<T> / ISqlDriver
                                  v
+-------------------------------------------------------------------+
|  CAPA DE DATOS Y SINCRONIZACIÓN (@framework/data)                 |
|  - Modo Local (Gratis): SqlEntityStoreDriver -> ExpoSqliteDriver  |
|    (o WebLocalStorageEntityStore en navegador). Datos no salen.   |
|  - Modo Nube (Pro): HybridSyncRepository -> HttpSyncTransport ->  |
|    @framework/server (CloudSyncService) -> LibSqlDriver (Turso)   |
+-------------------------------------------------------------------+
```

## 2. Patrones de diseño aplicados y trazabilidad

Para maximizar la legibilidad, mantenibilidad y reutilización sin acoplar capas:

- **MVC estricto por interfaces** (`packages/core/src/mvc.ts`): `IView<TState, TEvent>`, `IController<TState, TEvent>` y `IModel` desacoplan por completo la UI de la lógica de negocio.
- **Observer** (`BaseController.attachView`, `IModel.subscribe`, `HybridSyncRepository.subscribeStatus`): cualquier cambio de datos o estado de red se propaga mediante snapshots inmutables y eventos efímeros (`ViewEvent`).
- **Template Method / Command Executor** (`BaseController` en `@framework/core` y `PresetController.executeCommand` en `@framework/example-domain`): centraliza `busy`, limpieza de errores y mapeo `CloudEntitlementError -> upgrade-required` evitando `try/catch` repetitivos.
- **Repository** (`IRepository`, `ISyncableRepository`, `HybridSyncRepository` en `@framework/data`): el Modelo jamás sabe si los datos están en `expo-sqlite`, `localStorage`, un archivo libSQL o Turso.
- **Adapter + Anti-Corruption Boundary**:
  - `ISqlDriver` adaptado a `@libsql/client` (`LibSqlDriver` en `@framework/data-libsql`) y a `expo-sqlite` (`ExpoSqliteDriver` en `@framework/expo-adapter`).
  - `IEntityStoreDriver` e `IKeyValueStore` adaptados a SQL, navegador (`localStorage`) o RAM para pruebas.
  - `HttpSyncTransport` (`IRemoteSyncTransport`) y `useMvcController` (`@framework/react`).
- **Strategy** (`IConflictResolutionStrategy` / `LastWriteWinsConflictStrategy` en `@framework/core`): unifica el criterio de resolución de conflictos cliente (`HybridSyncRepository`) y servidor (`CloudSyncService`).
- **Factory / Composition Root** (`createPresetStudioController` en `packages/example-domain/src/factory.ts`, `createLibSqlDriverFromEnv` en `@framework/data-libsql`): ensambla la cadena completa evitando duplicar wiring entre Android Expo y Web.
- **Facade + Application Service + Declarative Router** (`packages/server/src/`):
  - `createFrameworkServer` (Facade) compone `MigrationRunner`, `SqlEntitlementProvider`, `CloudSyncService` (Application Service) y `createServerRequestHandler` (Front Controller con tabla declarativa de rutas).
- **Concurrency Monitor (`AsyncMutex`)** (`packages/core/src/sqlUtils.ts`): serializa migraciones y escrituras SQLite compartiendo una única implementación en `core`, `data`, `data-libsql` y `expo-adapter`.

## 3. Almacenamiento Local (Gratis) vs Nube Turso (Pro)

- **Usuario sin suscripción (`plan: 'free'`, `mode: 'local'`)**:
  - Todos los datos permanecen exclusivamente en el dispositivo (`expo-sqlite` en Android, `localStorage` en Web).
  - Si el usuario borra la app, los datos locales se pierden. No se realiza ninguna petición de red ni se guardan registros en el backend.
- **Usuario de pago (`plan: 'pro'`, `mode: 'cloud'`)**:
  - Cuando el usuario activa "Sincronizar en la nube", `HybridSyncRepository` sube automáticamente los registros locales pendientes (`pending`) al backend Node.js (`POST /api/v1/apps/:appId/sync`), que valida el `entitlement` y persiste en **Turso** (o en un archivo libSQL local si el backend está en modo `local`).
  - Para el usuario final es transparente ("La Nube"); nunca gestiona URLs ni tokens de Turso.

## 4. Reutilización del Backend Node.js (`@framework/server`)

El paquete `@framework/server` es totalmente agnóstico de la app:
- Gestiona múltiples aplicaciones aisladas por `appId` y `userId`.
- Incluye motor de sincronización genérico (`CloudSyncService`) con resolución de conflictos determinista (`LastWriteWinsConflictStrategy`), borrados lógicos (`deletedAt` tombstones) y control de permisos (`entitlements`).
- Permite inyectar módulos de app (`RegisteredAppModule`) con migraciones SQL propias y acciones de controlador personalizadas (`/api/v1/apps/:appId/actions/:actionName`).
- Cambia entre libSQL local (`STORAGE_DRIVER=local`) y Turso (`STORAGE_DRIVER=turso`) mediante configuración, sin modificar una sola línea de código.

## 5. Actualización sencilla de Expo SDK

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
