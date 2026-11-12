# Framework Propio MVC Multi-App (Node.js + React/Expo + libSQL / Turso)

Monorepo base diseñado para crear múltiples aplicaciones Android (Expo) y Web con **exactamente el mismo estilo visual**, arquitectura **MVC estricta mediante interfaces**, **backend Node.js 100% reutilizable**, y cambio en caliente entre **almacenamiento local en el dispositivo (Gratis)** y **sincronización en la nube con Turso (Pro)**.

## Estructura del Monorepo

- `packages/core`: Contratos puros en TypeScript (`IModel`, `IController`, `IView`, `IRepository`, `ISyncableRepository`, `ISqlDriver`, `IRemoteSyncTransport`).
- `packages/data`: `MigrationRunner`, `HybridSyncRepository` (local-first + sync bajo suscripción), `SqlEntityStoreDriver`, `WebLocalStorageEntityStore`, `HttpSyncTransport`.
- `packages/data-libsql`: Adaptador `@libsql/client` para Node.js (`mode: 'local'` con archivo SQLite/libSQL o `mode: 'turso'` remoto).
- `packages/server`: Backend Node.js reutilizable multi-app (sync, entitlements, migraciones y acciones MVC).
- `packages/react`: Hook `useMvcController` que conecta cualquier Vista React/Expo con cualquier `IController` mediante `IView`.
- `packages/ui`: Kit de diseño propio sobre primitivas puras de React Native (`AppShell`, `Card`, `Button`, `Slider`, `SwitchToggle`, `TextField`, `StorageStatusBar`, `ModalDialog`, `SegmentedControl`, tokens claro/oscuro).
- `packages/expo-adapter`: Único paquete acoplado a `expo-sqlite` (implementando `ISqlDriver`) para facilitar futuras actualizaciones de Expo.
- `packages/example-domain`: App de ejemplo **FocusScenes** (Model + Controller compartidos por Android y Web).
- `apps/demo-backend`: Instancia de `@framework/server` configurable por variables de entorno (`local` vs `turso`).
- `apps/demo-expo`: App Android con Expo usando `@framework/ui` + `@framework/expo-adapter`.
- `apps/demo-web`: Segunda interfaz gráfica completamente distinta (Escritorio Web con React + HTML/CSS moderno) conectada al **mismo** Modelo y Controlador.

## Comandos rápidos

```bash
# Instalar dependencias
corepack pnpm install

# Compilar paquetes core
corepack pnpm build

# Verificar tipos en todo el monorepo
corepack pnpm typecheck

# Ejecutar tests (MVC + integración servidor/sync libSQL)
corepack pnpm test

# Arrancar backend reutilizable (por defecto libSQL local; usa STORAGE_DRIVER=turso para Turso)
corepack pnpm dev:backend

# Arrancar interfaz Web alternativa
corepack pnpm dev:web

# Arrancar app Android Expo
corepack pnpm dev:expo
```

Consulta [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para ver cómo añadir una nueva aplicación o actualizar Expo SDK.

