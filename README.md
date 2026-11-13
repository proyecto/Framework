# Framework Propio MVC Multi-App (Node.js + React/Expo + libSQL / Turso)

Monorepo base diseñado para crear múltiples aplicaciones Android (Expo) y Web con **exactamente el mismo estilo visual**, arquitectura **MVC estricta mediante interfaces**, **backend Node.js 100% reutilizable**, y cambio en caliente entre **almacenamiento local en el dispositivo (Gratis)** y **sincronización en la nube con Turso (Pro)**.

## Estructura del Monorepo

- `packages/core`: Contratos puros MVC (`IModel`, `IController`, `IView`, `BaseController`), contratos de datos (`IRepository`, `ISyncableRepository`, `ISqlDriver`, `IRemoteSyncTransport`), estrategia LWW (`LastWriteWinsConflictStrategy`) y concurrencia (`AsyncMutex`, `normalizeSqlParams`).
- `packages/data`: `MigrationRunner`, `HybridSyncRepository` (local-first + sync bajo suscripción), `SqlEntityStoreDriver`, `WebLocalStorageEntityStore`, `HttpSyncTransport`.
- `packages/data-libsql`: Adaptador `@libsql/client` para Node.js (`mode: 'local'` con archivo SQLite/libSQL o `mode: 'turso'` remoto).
- `packages/server`: Backend Node.js reutilizable multi-app compuesto por `createFrameworkServer` (Facade), `CloudSyncService` (Application Service), `SqlEntitlementProvider` y `router.ts` (Front Controller declarativo).
- `packages/react`: Hook `useMvcController` (Adapter React <-> `IView`) y contexto `FrameworkProvider` / `useFrameworkEnvironment`.
- `packages/ui`: Kit de diseño propio sobre primitivas puras de React Native (`AppShell`, `Card`, `Button`, `Slider`, `SwitchToggle`, `TextField`, `StorageStatusBar`, `ModalDialog`, `SegmentedControl`, tokens claro/oscuro).
- `packages/expo-adapter`: Único paquete acoplado a `expo-sqlite` (implementando `ISqlDriver`) para facilitar futuras actualizaciones de Expo.
- `packages/example-domain`: App de ejemplo **FocusScenes** (`IPresetModel`, `IPresetController`, `PresetModel`, `PresetController` y factoría compartida `createPresetStudioController`).
- `apps/base-expo`: **App Base canónica Android (Expo)** que fija los límites visuales, tokens (`@framework/ui`) y estructura MVC de referencia para todas las apps móviles nuevas.
- `apps/base-web`: **App Base canónica Web (React + CSS moderno)** que fija los límites de layout, tokens `@layer theme` equivalentes a `@framework/ui` y estructura MVC de escritorio.

## Comandos rápidos

```bash
# Instalar dependencias
corepack pnpm install

# Compilar paquetes core
corepack pnpm build

# Verificar tipos, tests, reglas SOLID y documentación (Quality Gate completo)
corepack pnpm check

# Generar referencia automática de API (docs/API_REFERENCE.md)
corepack pnpm docs:generate

# Validar fronteras arquitectónicas SOLID / MVC / Catalog
corepack pnpm verify:arch

# Crear el esqueleto MVC de una nueva app en packages/<nombre>-domain
corepack pnpm create:app -- --name=mi-app --title="Mi App" --entity=nota

# Compilar / Typecheck / Test por separado
corepack pnpm build
corepack pnpm typecheck
corepack pnpm test

# Arrancar las aplicaciones base
corepack pnpm dev:web          # Arrancar base-web (Vite + React)
corepack pnpm dev:expo         # Arrancar base-expo (Expo móvil)
corepack pnpm dev:expo:web     # Probar base-expo en navegador web
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para ver todos los patrones de diseño, cómo añadir una nueva aplicación o actualizar Expo SDK, y [docs/API_REFERENCE.md](docs/API_REFERENCE.md) para ver toda la API pública autogenerada.
