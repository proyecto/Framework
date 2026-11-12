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
- `apps/demo-backend`: Instancia de `@framework/server` configurable por variables de entorno (`local` vs `turso`).
- `apps/demo-expo`: App Android con Expo usando `@framework/ui`, `@framework/expo-adapter` y `createPresetStudioController`.
- `apps/demo-web`: Segunda interfaz gráfica completamente distinta (Escritorio Web con React + HTML/CSS moderno) conectada al **mismo** Modelo y Controlador.

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

# Arrancar backend reutilizable (por defecto libSQL local; usa STORAGE_DRIVER=turso para Turso)
corepack pnpm dev:backend

# Arrancar interfaz Web alternativa
corepack pnpm dev:web

# Arrancar app Android Expo
corepack pnpm dev:expo
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para ver todos los patrones de diseño, cómo añadir una nueva aplicación o actualizar Expo SDK, y [docs/API_REFERENCE.md](docs/API_REFERENCE.md) para ver toda la API pública autogenerada.
