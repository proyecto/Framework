<!-- ARCHIVO GENERADO AUTOMÁTICAMENTE POR scripts/generate-api-docs.mjs -->
<!-- NO EDITAR A MANO: ejecuta `corepack pnpm docs:generate` tras cambiar la API pública -->

# Referencia de API Pública del Framework

Este documento se genera directamente desde el AST de TypeScript y los comentarios JSDoc de todos los paquetes en `packages/*`, garantizando que la documentación nunca quede desincronizada respecto al código fuente.

## Índice de paquetes

- [`@framework/base-domain`](#frameworkbase-domain) (12 símbolos exportados)
- [`@framework/core`](#frameworkcore) (47 símbolos exportados)
- [`@framework/data`](#frameworkdata) (17 símbolos exportados)
- [`@framework/data-libsql`](#frameworkdata-libsql) (4 símbolos exportados)
- [`@framework/example-domain`](#frameworkexample-domain) (15 símbolos exportados)
- [`@framework/expo-adapter`](#frameworkexpo-adapter) (1 símbolos exportados)
- [`@framework/mintmox-domain`](#frameworkmintmox-domain) (81 símbolos exportados)
- [`@framework/react`](#frameworkreact) (6 símbolos exportados)
- [`@framework/server`](#frameworkserver) (10 símbolos exportados)
- [`@framework/ui`](#frameworkui) (66 símbolos exportados)

## `@framework/base-domain`

Dominio MVC canónico compartido entre la App Base Expo (@framework/base-expo) y Web (@framework/base-web).

### `BASE_APP_ID`

- Origen: `packages/base-domain/src/contracts.ts`

```ts
const BASE_APP_ID
```

### `BASE_ENTITY_NAME`

- Origen: `packages/base-domain/src/contracts.ts`

```ts
const BASE_ENTITY_NAME
```

### `BaseWorkspaceItem`

- Origen: `packages/base-domain/src/contracts.ts`
- Descripción: Entidad genérica mínima de la App Base que hereda auditoría, versión y tombstone.

```ts
interface BaseWorkspaceItem extends EntityBase
```

Miembros públicos:
- `title: string`
- `description: string`
- `level: number`
- `enabled: boolean`
- `isPrimary: boolean`

### `CreateBaseItemInput`

- Origen: `packages/base-domain/src/contracts.ts`
- Descripción: Datos de entrada validados para crear un nuevo elemento en la App Base.

```ts
interface CreateBaseItemInput
```

Miembros públicos:
- `title: string`
- `description?: string`
- `level?: number`

### `BaseAppViewState`

- Origen: `packages/base-domain/src/contracts.ts`
- Descripción: Snapshot inmutable proyectado hacia cualquier `IView` (Expo Android / React Web).

```ts
interface BaseAppViewState extends AsyncCommandState
```

Miembros públicos:
- `items: BaseWorkspaceItem[]`
- `selectedItemId: string | null`
- `onlyEnabledFilter: boolean`
- `loading: boolean`
- `storage: StorageStatus`

### `IBaseAppModel`

- Origen: `packages/base-domain/src/contracts.ts`
- Descripción: Contrato del Modelo (M) de la App Base.

```ts
interface IBaseAppModel extends IModel
```

Miembros públicos:
- `getItemsSnapshot(): BaseWorkspaceItem[]`
- `loadItems(): Promise<BaseWorkspaceItem[]>`
- `createItem(input: CreateBaseItemInput): Promise<BaseWorkspaceItem>`
- `updateItem(id: string, patch: Partial< Pick<BaseWorkspaceItem, 'title' | 'description' | 'level' | 'enabled' | 'isPrimary'> >): Promise<BaseWorkspaceItem>`
- `deleteItem(id: string): Promise<void>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`

### `IBaseAppController`

- Origen: `packages/base-domain/src/contracts.ts`
- Descripción: Contrato del Controlador (C) consumido de forma idéntica por `@framework/base-expo` y `@framework/base-web`.

```ts
interface IBaseAppController extends IController<BaseAppViewState, ViewEvent>
```

Miembros públicos:
- `selectItem(id: string | null): void`
- `setOnlyEnabledFilter(enabledOnly: boolean): void`
- `createItem(input: CreateBaseItemInput): Promise<void>`
- `updateLevel(id: string, level: number): Promise<void>`
- `toggleEnabled(id: string): Promise<void>`
- `markAsPrimary(id: string): Promise<void>`
- `deleteItem(id: string): Promise<void>`
- `upgradeToProAndEnableCloud(): Promise<void>`
- `downgradeToFree(): Promise<void>`
- `setStorageMode(mode: StorageMode): Promise<void>`
- `syncNow(): Promise<void>`
- `clearError(): void`

### `BASE_SERVER_MODULE`

- Origen: `packages/base-domain/src/contracts.ts`
- Descripción: Descriptor opcional para registrar `base-template` en el servidor reutilizable `@framework/server`.

```ts
const BASE_SERVER_MODULE: RegisteredAppModule
```

### `BaseAppModel`

- Origen: `packages/base-domain/src/BaseAppModel.ts`
- Descripción: Implementación del **Modelo (M)** de la App Base (`IBaseAppModel`). Patrones aplicados: - **Observer (`ObservableModel`)**: Hereda suscripción y limpieza automática del repositorio. - **Repository (`ISyncableRepository`)**: Totalmente agnóstico de `expo-sqlite`, `localStorage` o Turso.

```ts
class BaseAppModel extends ObservableModel implements IBaseAppModel
```

Miembros públicos:
- `constructor(private readonly repository: ISyncableRepository<BaseWorkspaceItem>)`
- `getItemsSnapshot(): BaseWorkspaceItem[]`
- `loadItems(): Promise<BaseWorkspaceItem[]>`
- `createItem(input: CreateBaseItemInput): Promise<BaseWorkspaceItem>`
- `updateItem(id: string, patch: Partial< Pick<BaseWorkspaceItem, 'title' | 'description' | 'level' | 'enabled' | 'isPrimary'> >): Promise<BaseWorkspaceItem>`
- `deleteItem(id: string): Promise<void>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`

### `BaseAppController`

- Origen: `packages/base-domain/src/BaseAppController.ts`
- Descripción: Controlador MVC de referencia para la App Base (`IBaseAppController`). Hereda de `StatefulMvcController` (**Template Method + Command Executor + Observer**) para compartir exactamente la misma lógica entre `@framework/base-expo` y `@framework/base-web`.

```ts
class BaseAppController extends StatefulMvcController<BaseAppViewState, ViewEvent> implements IBaseAppController
```

Miembros públicos:
- `constructor(private readonly model: IBaseAppModel)`
- `init(): Promise<void>`
- `selectItem(id: string | null): void`
- `setOnlyEnabledFilter(enabledOnly: boolean): void`
- `createItem(input: CreateBaseItemInput): Promise<void>`
- `updateLevel(id: string, level: number): Promise<void>`
- `toggleEnabled(id: string): Promise<void>`
- `markAsPrimary(id: string): Promise<void>`
- `deleteItem(id: string): Promise<void>`
- `upgradeToProAndEnableCloud(): Promise<void>`
- `downgradeToFree(): Promise<void>`
- `setStorageMode(mode: StorageMode): Promise<void>`
- `syncNow(): Promise<void>`

### `CreateBaseAppControllerOptions`

- Origen: `packages/base-domain/src/factory.ts`

```ts
interface CreateBaseAppControllerOptions
```

Miembros públicos:
- `store: IEntityStoreDriver`
- `kv: IKeyValueStore`
- `deviceId: string`
- `userId?: string`
- `apiBaseUrl?: string`
- `transport?: IRemoteSyncTransport`
- `conflictStrategy?: IConflictResolutionStrategy`

### `createBaseAppController`

- Origen: `packages/base-domain/src/factory.ts`
- Descripción: Patrón: **Abstract Factory / Composition Root** compartida para la App Base en todas las plataformas (`@framework/base-expo`, `@framework/base-web` y tests automatizados).

```ts
function createBaseAppController(options: CreateBaseAppControllerOptions): IBaseAppController
```

## `@framework/core`

### `FrameworkErrorCode`

- Origen: `packages/core/src/errors.ts`
- Descripción: Códigos semánticos de error compartidos entre Modelo, Repositorio, Servidor HTTP y Vistas. Permiten reaccionar en capas superiores sin acoplarse a excepciones concretas de HTTP o SQLite.

```ts
type FrameworkErrorCode = | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'ENTITLEMENT_REQUIRED' | 'SYNC_FAILED' | 'STORAGE_ERROR' | 'NETWORK_ERROR' | 'CONFIGURATION_ERROR'
```

### `FrameworkError`

- Origen: `packages/core/src/errors.ts`
- Descripción: Error base estructurado del framework. Incluye `code` para lógica programática y `statusCode` para que la capa HTTP del servidor pueda traducirlo automáticamente a un código de respuesta REST coherente.

```ts
class FrameworkError extends Error
```

Miembros públicos:
- `code: FrameworkErrorCode`
- `statusCode: number`
- `constructor(code: FrameworkErrorCode, message: string, statusCode = 400)`

### `ValidationError`

- Origen: `packages/core/src/errors.ts`
- Descripción: Error de validación de reglas de negocio o entrada de usuario (HTTP 400). Lanzado principalmente desde el Modelo o al parsear payloads en el backend.

```ts
class ValidationError extends FrameworkError
```

Miembros públicos:
- `constructor(message: string)`

### `CloudEntitlementError`

- Origen: `packages/core/src/errors.ts`
- Descripción: Error emitido cuando un usuario sin suscripción Pro activa intenta usar funcionalidades de sincronización en la nube (HTTP 402 Payment Required). Las vistas capturan este evento vía `ViewEvent ('upgrade-required')` para abrir el flujo de mejora.

```ts
class CloudEntitlementError extends FrameworkError
```

Miembros públicos:
- `constructor(message = 'Se requiere suscripción Pro para sincronizar datos en la nube.')`

### `getErrorMessage`

- Origen: `packages/core/src/errors.ts`
- Descripción: Utilidad segura para extraer un mensaje legible desde valores `unknown` capturados en `catch`.

```ts
function getErrorMessage(error: unknown): string
```

### `ViewEventType`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Tipos de eventos efímeros que el Controlador envía hacia las Vistas sin ensuciar el snapshot persistente de estado (`TState`).

```ts
type ViewEventType = 'toast' | 'error' | 'sync-complete' | 'upgrade-required'
```

### `ViewEvent`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Evento unidireccional emitido desde `IController` hacia cualquier `IView` adjunta.

```ts
interface ViewEvent
```

Miembros públicos:
- `type: ViewEventType`
- `message: string`
- `metadata?: Record<string, unknown>`

### `IView`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Contrato estricto de **Vista (V)** en la arquitectura MVC clásica. Patrón: **Observer (Suscriptor pasivo de estado y eventos)**. Cualquier interfaz gráfica (Android con Expo, Web React, CLI o un doble de test) implementa esta interfaz para recibir snapshots inmutables de estado desde el Controlador, garantizando que el Modelo y el Controlador desconozcan por completo el framework o dispositivo donde se renderiza la app.

```ts
interface IView<TState, TEvent = ViewEvent>
```

Miembros públicos:
- `render(state: TState): void`
- `onEvent?(event: TEvent): void`

### `IController`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Contrato estricto de **Controlador (C)** en la arquitectura MVC. Patrón: **Mediator / Presenter Boundary**. Actúa de intermediario entre una o varias `IView` y el `IModel`: - Expone comandos de dominio concretos en sus interfaces derivadas (ej. `IPresetController`). - Gestiona suscripciones de vistas y ciclo de vida (`init`, `attachView`, `dispose`).

```ts
interface IController<TState, TEvent = ViewEvent>
```

Miembros públicos:
- `init(): Promise<void>`
- `getState(): TState`
- `attachView(view: IView<TState, TEvent>): () => void`
- `dispose(): void`

### `IModel`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Contrato base de **Modelo (M)** en la arquitectura MVC. Patrón: **Observable Domain Model**. Encapsula reglas de negocio, invariantes de validación y persistencia a través de interfaces de repositorio (`IRepository` / `ISyncableRepository`), sin conocer ni Vistas ni HTTP ni SQLite/Turso.

```ts
interface IModel
```

Miembros públicos:
- `subscribe(listener: () => void): () => void`
- `dispose?(): void`

### `ObservableModel`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Implementación base reutilizable del patrón **Observer + Resource Registry** para Modelos (`IModel`). Elimina el boilerplate repetido de `Set<() => void>`, `subscribe`, `notify` y limpieza de suscripciones secundarias (por ejemplo, `repository.subscribeStatus(...)`) en todos los dominios del framework.

```ts
abstract class ObservableModel implements IModel
```

Miembros públicos:
- `subscribe(listener: () => void): () => void`
- `dispose(): void`

### `AsyncCommandState`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Estado mínimo requerido por `StatefulMvcController` para gestionar de forma uniforme indicadores de carga y errores de comando sin duplicar lógica en cada controlador.

```ts
interface AsyncCommandState
```

Miembros públicos:
- `busy: boolean`
- `errorMessage: string | null`

### `CommandExecutionOptions`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Opciones declarativas del patrón **Command Wrapper / Template Method** en `StatefulMvcController`.

```ts
interface CommandExecutionOptions<TResult, TEvent = ViewEvent>
```

Miembros públicos:
- `trackBusy?: boolean`
- `emitErrorEvent?: boolean`
- `syncAfterError?: boolean`
- `onSuccess?: (result: TResult) => TEvent | void`

### `BaseController`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Clase base reutilizable para todos los Controladores MVC del framework. Patrones aplicados: - **Observer / Pub-Sub**: Mantiene un `Set<IView>` y difunde cada snapshot mediante `setState`. - **Template Method**: Define `init()` como paso abstracto obligatorio junto con ayudas de ciclo de vida (`markInitialized`, `isInitialized`, `isDisposed`, `emitViewEvent`).

```ts
abstract class BaseController<TState, TEvent = ViewEvent> implements IController<TState, TEvent>
```

Miembros públicos:
- `constructor(initialState: TState)`
- `init(): Promise<void>`
- `getState(): TState`
- `attachView(view: IView<TState, TEvent>): () => void`
- `dispose(): void`

### `StatefulMvcController`

- Origen: `packages/core/src/mvc.ts`
- Descripción: Extensión especializada de `BaseController` (**Patrón Template Method + Command Executor**) para controladores de aplicación conectados a un `IModel`. Centraliza: - Vinculación reactiva al Modelo (`bindModel`) con liberación automática en `dispose()`. - Ejecución segura de comandos asíncronos (`executeCommand`) con manejo automático de `busy`, `errorMessage`, re-sincronización y mapeo de `CloudEntitlementError -> upgrade-required`.

```ts
abstract class StatefulMvcController<TState extends AsyncCommandState, TEvent = ViewEvent> extends BaseController<TState, TEvent>
```

Miembros públicos:
- `clearError(): void`
- `dispose(): void`

### `StorageMode`

- Origen: `packages/core/src/storage.ts`
- Descripción: Modo de almacenamiento elegido por el usuario: solo local o sincronizado en nube.

```ts
type StorageMode = 'local' | 'cloud'
```

### `UserPlan`

- Origen: `packages/core/src/storage.ts`
- Descripción: Nivel de plan comercial: `free` (solo local) o `pro` (habilita respaldo multi-dispositivo).

```ts
type UserPlan = 'free' | 'pro'
```

### `SyncStatus`

- Origen: `packages/core/src/storage.ts`
- Descripción: Estado de sincronización de cada registro en la caché local del dispositivo.

```ts
type SyncStatus = 'pending' | 'synced'
```

### `SqlValue`

- Origen: `packages/core/src/storage.ts`
- Descripción: Tipos de valor soportados en parámetros SQL parametrizados de forma portable.

```ts
type SqlValue = string | number | boolean | null | Uint8Array
```

### `SqlExecuteResult`

- Origen: `packages/core/src/storage.ts`
- Descripción: Resultado devuelto por sentencias SQL de escritura (`INSERT`, `UPDATE`, `DELETE`, DDL).

```ts
interface SqlExecuteResult
```

Miembros públicos:
- `rowsAffected: number`
- `lastInsertRowId?: string | number`

### `ISqlTransaction`

- Origen: `packages/core/src/storage.ts`
- Descripción: Interfaz de ejecución dentro de una transacción atómica sobre `ISqlDriver`.

```ts
interface ISqlTransaction
```

Miembros públicos:
- `execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>`
- `query(sql: string, params?: SqlValue[]): Promise<TRow[]>`

### `ISqlDriver`

- Origen: `packages/core/src/storage.ts`
- Descripción: Contrato abstracto de driver SQL (**Patrón Adapter**). Permite intercambiar sin cambiar una línea de lógica de aplicación o backend: - `LibSqlDriver` (`mode: 'local'` con archivo SQLite/libSQL o `mode: 'turso'` remoto). - `ExpoSqliteDriver` (SQLite nativo dentro de apps Android con Expo). - Dobles de prueba en memoria para tests unitarios.

```ts
interface ISqlDriver
```

Miembros públicos:
- `driverName: string`
- `initialize(): Promise<void>`
- `execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>`
- `query(sql: string, params?: SqlValue[]): Promise<TRow[]>`
- `transaction(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T>`
- `close(): Promise<void>`

### `SqlMigration`

- Origen: `packages/core/src/storage.ts`
- Descripción: Migración SQL versionada e idempotente ejecutada por `MigrationRunner`.

```ts
interface SqlMigration
```

Miembros públicos:
- `version: number`
- `name: string`
- `up: string[]`

### `IKeyValueStore`

- Origen: `packages/core/src/storage.ts`
- Descripción: Abstracción clave-valor ligera (**Patrón Adapter**) para metadatos locales (`mode`, `plan`, cursores de sincronización, timestamps).

```ts
interface IKeyValueStore
```

Miembros públicos:
- `get(key: string): Promise<string | null>`
- `set(key: string, value: string): Promise<void>`
- `remove(key: string): Promise<void>`

### `EntityBase`

- Origen: `packages/core/src/storage.ts`
- Descripción: Campos mínimos de auditoría, concurrencia optimista y borrado lógico (tombstone) que debe poseer toda entidad gestionada por un `IRepository`.

```ts
interface EntityBase
```

Miembros públicos:
- `id: string`
- `createdAt: string`
- `updatedAt: string`
- `deletedAt: string | null`
- `version: number`

### `StorageStatus`

- Origen: `packages/core/src/storage.ts`
- Descripción: Snapshot de estado de almacenamiento y sincronización expuesto hacia Modelo y Vistas.

```ts
interface StorageStatus
```

Miembros públicos:
- `mode: StorageMode`
- `plan: UserPlan`
- `cloudEnabled: boolean`
- `pendingChanges: number`
- `lastSyncedAt: string | null`
- `isSyncing: boolean`
- `lastSyncError: string | null`

### `SyncReport`

- Origen: `packages/core/src/storage.ts`
- Descripción: Resumen devuelto al completar una ronda de sincronización bidireccional push/pull.

```ts
interface SyncReport
```

Miembros públicos:
- `pushed: number`
- `pulled: number`
- `syncedAt: string`
- `mode: StorageMode`

### `EntitlementStatus`

- Origen: `packages/core/src/storage.ts`
- Descripción: Estado de autorización de nube confirmado por el servidor según plan del usuario.

```ts
interface EntitlementStatus
```

Miembros públicos:
- `appId: string`
- `userId: string`
- `plan: UserPlan`
- `cloudSyncAllowed: boolean`
- `updatedAt: string`

### `SyncVersionComparable`

- Origen: `packages/core/src/storage.ts`
- Descripción: Metadatos mínimos comparables para resolver conflictos de replicación entre dispositivos.

```ts
interface SyncVersionComparable
```

Miembros públicos:
- `updatedAt: string`
- `version: number`

### `IConflictResolutionStrategy`

- Origen: `packages/core/src/storage.ts`
- Descripción: Patrón: **Strategy** para resolución de conflictos en sincronización offline-first. Desacopla el criterio de mezcla (`LastWriteWinsConflictStrategy`, etc.) tanto del cliente (`HybridSyncRepository`) como del servidor (`CloudSyncService`).

```ts
interface IConflictResolutionStrategy
```

Miembros públicos:
- `name: string`
- `shouldAcceptIncoming(incoming: SyncVersionComparable, existing: SyncVersionComparable | null | undefined, options?: { acceptEqualVersion?: boolean }): boolean`

### `IRepository`

- Origen: `packages/core/src/storage.ts`
- Descripción: Interfaz **Repository** fundamental entre el Modelo de dominio y los datos. Patrón: **Repository + Dependency Inversion**. Los Modelos y Controladores operan contra este contrato y jamás saben si el dato reside en el dispositivo Android (`expo-sqlite`), en navegador (`localStorage`), en un archivo libSQL local o en Turso remoto.

```ts
interface IRepository<T extends EntityBase>
```

Miembros públicos:
- `entityName: string`
- `list(options?: { includeDeleted?: boolean }): Promise<T[]>`
- `findById(id: string): Promise<T | null>`
- `save(entity: T): Promise<T>`
- `remove(id: string): Promise<void>`

### `ISyncableRepository`

- Origen: `packages/core/src/storage.ts`
- Descripción: Extensión del Repositorio base con control explícito del interruptor Local/Nube, plan de usuario y suscripción reactiva a cambios del estado de sincronización.

```ts
interface ISyncableRepository<T extends EntityBase> extends IRepository<T>
```

Miembros públicos:
- `getPendingCount(): Promise<number>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`
- `subscribeStatus(listener: (status: StorageStatus) => void): () => void`

### `SyncRecordEnvelope`

- Origen: `packages/core/src/storage.ts`
- Descripción: Sobre genérico agnóstico de entidad enviado y recibido durante la sincronización incremental.

```ts
interface SyncRecordEnvelope<TPayload = Record<string, unknown>>
```

Miembros públicos:
- `entity: string`
- `recordId: string`
- `payload: TPayload`
- `version: number`
- `updatedAt: string`
- `deletedAt: string | null`

### `SyncPushRequest`

- Origen: `packages/core/src/storage.ts`
- Descripción: Petición de push + pull incremental enviada al backend reutilizable.

```ts
interface SyncPushRequest
```

Miembros públicos:
- `appId: string`
- `userId: string`
- `deviceId: string`
- `sinceCursor: string | null`
- `changes: SyncRecordEnvelope[]`

### `SyncPullResponse`

- Origen: `packages/core/src/storage.ts`
- Descripción: Respuesta delta del servidor con el nuevo cursor monotónico y cambios de otros dispositivos.

```ts
interface SyncPullResponse
```

Miembros públicos:
- `serverCursor: string`
- `acceptedCount: number`
- `changes: SyncRecordEnvelope[]`

### `IRemoteSyncTransport`

- Origen: `packages/core/src/storage.ts`
- Descripción: Abstracción de transporte remoto (**Patrón Anti-Corruption / Adapter**). Separa el motor local-first (`HybridSyncRepository`) del protocolo concreto (HTTP, WebSocket o mock).

```ts
interface IRemoteSyncTransport
```

Miembros públicos:
- `checkEntitlement(appId: string, userId: string): Promise<EntitlementStatus>`
- `setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>`
- `sync(request: SyncPushRequest): Promise<SyncPullResponse>`

### `ServerActionContext`

- Origen: `packages/core/src/server.ts`
- Descripción: Contexto inyectado por el servidor reutilizable (`@framework/server`) a cada acción personalizada registrada por una aplicación cliente.

```ts
interface ServerActionContext
```

Miembros públicos:
- `appId: string`
- `userId: string`
- `driver: ISqlDriver`
- `body: unknown`
- `query: Record<string, string>`

### `ServerActionHandler`

- Origen: `packages/core/src/server.ts`
- Descripción: Manejador asíncrono (Patrón **Command**) para acciones específicas de una app en backend.

```ts
type ServerActionHandler = (ctx: ServerActionContext) => Promise<unknown>
```

### `RegisteredAppModule`

- Origen: `packages/core/src/server.ts`
- Descripción: Patrón: **Plugin / App Module Registration**. Permite que múltiples aplicaciones compartan la misma instancia de backend Node.js aportando sus propias migraciones SQL y endpoints de acción aislados por `appId`.

```ts
interface RegisteredAppModule
```

Miembros públicos:
- `appId: string`
- `migrations?: SqlMigration[]`
- `actions?: Record<string, ServerActionHandler>`

### `SqlBindPrimitive`

- Origen: `packages/core/src/sqlUtils.ts`
- Descripción: Representa un valor SQL primitivo listo para ser enlazado por los drivers subyacentes de SQLite / libSQL (`expo-sqlite` y `@libsql/client`).

```ts
type SqlBindPrimitive = string | number | null | Uint8Array
```

### `AsyncMutex`

- Origen: `packages/core/src/sqlUtils.ts`
- Descripción: Patrón: **Monitor / Mutex Asíncrono (Concurrency Guard)**. Centraliza la serialización de operaciones asíncronas sobre un mismo recurso (por ejemplo, escrituras o migraciones en SQLite local) para evitar condiciones de carrera y errores `SQLITE_BUSY` cuando múltiples llamadas del controlador o de la vista concurren al iniciar la aplicación. Se aloja en `@framework/core` para que tanto `@framework/data` (MigrationRunner), `@framework/data-libsql` (Node/Turso) como `@framework/expo-adapter` (Android) compartan exactamente la misma implementación sin duplicar colas de promesas.

```ts
class AsyncMutex
```

Miembros públicos:
- `run(task: () => Promise<T>): Promise<T>`

### `normalizeSqlParams`

- Origen: `packages/core/src/sqlUtils.ts`
- Descripción: Normaliza los parámetros SQL del framework al formato aceptado por SQLite y libSQL. SQLite no posee tipo booleano nativo, por lo que convierte `true -> 1` y `false -> 0` de forma uniforme tanto en Android (`expo-sqlite`) como en Node.js (`@libsql/client`).

```ts
function normalizeSqlParams(params?: SqlValue[]): SqlBindPrimitive[]
```

### `LastWriteWinsConflictStrategy`

- Origen: `packages/core/src/syncStrategy.ts`
- Descripción: Patrón: **Strategy (Resolución de conflictos LWW · Last-Write-Wins)**. Unifica en una única implementación la regla de desempate empleada tanto por: - El cliente (`HybridSyncRepository`) al aplicar cambios remotos descargados (pull). - El servidor (`CloudSyncService`) al recibir cambios locales subidos (push). Regla determinista: 1. Si no existe registro previo, se acepta siempre el entrante. 2. Gana el timestamp ISO-8601 `updatedAt` más reciente. 3. Ante empate exacto de timestamp en el mismo milisegundo, desempata `version` (en servidor suele usarse `acceptEqualVersion: true` para permitir idempotencia de reintentos con el mismo número de versión).

```ts
class LastWriteWinsConflictStrategy implements IConflictResolutionStrategy
```

Miembros públicos:
- `name: unknown`
- `shouldAcceptIncoming(incoming: SyncVersionComparable, existing: SyncVersionComparable | null | undefined, options?: { acceptEqualVersion?: boolean }): boolean`

### `IncomingWinsConflictStrategy`

- Origen: `packages/core/src/syncStrategy.ts`
- Descripción: Estrategia alternativa (**Open/Closed Principle**): ante conflicto o registro existente, prioriza siempre el cambio entrante (útil en clientes solo-lectura sincronizados desde nube).

```ts
class IncomingWinsConflictStrategy implements IConflictResolutionStrategy
```

Miembros públicos:
- `name: unknown`
- `shouldAcceptIncoming(_incoming: SyncVersionComparable, _existing: SyncVersionComparable | null | undefined, _options?: { acceptEqualVersion?: boolean }): boolean`

### `ExistingWinsConflictStrategy`

- Origen: `packages/core/src/syncStrategy.ts`
- Descripción: Estrategia alternativa (**Open/Closed Principle**): conserva el registro ya existente si existe y solo inserta registros nuevos (útil en caches locales inmutables o append-only).

```ts
class ExistingWinsConflictStrategy implements IConflictResolutionStrategy
```

Miembros públicos:
- `name: unknown`
- `shouldAcceptIncoming(_incoming: SyncVersionComparable, existing: SyncVersionComparable | null | undefined): boolean`

### `escapeCsvCell`

- Origen: `packages/core/src/csv.ts`
- Descripción: Escapa y formatea un valor para una celda de CSV según RFC 4180, protegiendo contra inyección de fórmulas (CWE-1236).

```ts
function escapeCsvCell(val: unknown): string
```

### `parseCsvRows`

- Origen: `packages/core/src/csv.ts`
- Descripción: Parsea un contenido de texto CSV según la especificación RFC 4180 soportando celdas multilínea, comillas y autodetección de delimitador (, ; \t) para compatibilidad con Excel europeo y Cardmarket.

```ts
function parseCsvRows(text: string, delimiter?: string): string[][]
```

## `@framework/data`

### `FRAMEWORK_LOCAL_MIGRATIONS`

- Origen: `packages/data/src/migrations.ts`
- Descripción: Migraciones locales estándar creadas automáticamente en cada dispositivo (Android Expo SQLite o libSQL local). - `_fw_kv`: metadatos de configuración y estado de sincronización (plan, modo, cursor). - `_fw_local_entities`: caché local-first serializada por entidad y `record_id`, con estado `sync_status` (`pending` o `synced`) y soporte de borrado lógico (`deleted_at`).

```ts
const FRAMEWORK_LOCAL_MIGRATIONS: SqlMigration[]
```

### `MigrationRunner`

- Origen: `packages/data/src/migrations.ts`
- Descripción: Ejecutor idempotente y transaccional de migraciones SQL versionadas. Patrón: **Command Sequence + Concurrency Monitor (`AsyncMutex`)**. Serializa cualquier corrida de migraciones sobre el mismo `ISqlDriver` para evitar bloqueos concurrentes cuando varios repositorios o stores arrancan en paralelo.

```ts
class MigrationRunner
```

Miembros públicos:
- `constructor(private readonly driver: ISqlDriver)`
- `run(migrations: SqlMigration[]): Promise<number[]>`

### `createMigrationInitializer`

- Origen: `packages/data/src/migrations.ts`
- Descripción: Patrón: **Lazy Memoized Initializer**. Reutilizado por `SqlKeyValueStore` y `SqlEntityStoreDriver` para ejecutar las migraciones una sola vez bajo demanda. Si la inicialización falla transitoriamente, limpia la promesa en caché para permitir reintentos posteriores sin dejar el store bloqueado.

```ts
function createMigrationInitializer(driver: ISqlDriver, migrations: SqlMigration[] = FRAMEWORK_LOCAL_MIGRATIONS): () => Promise<void>
```

### `SqlKeyValueStore`

- Origen: `packages/data/src/kv.ts`
- Descripción: Adaptador **IKeyValueStore -> ISqlDriver** (Expo SQLite en Android o libSQL en Node). Almacena configuraciones locales del repositorio (`mode`, `plan`, cursor de sync).

```ts
class SqlKeyValueStore implements IKeyValueStore
```

Miembros públicos:
- `constructor(private readonly driver: ISqlDriver)`
- `get(key: string): Promise<string | null>`
- `set(key: string, value: string): Promise<void>`
- `remove(key: string): Promise<void>`

### `MemoryKeyValueStore`

- Origen: `packages/data/src/kv.ts`
- Descripción: Adaptador **IKeyValueStore -> Memoria RAM**. Diseñado para tests unitarios rápidos y entornos efímeros sin disco.

```ts
class MemoryKeyValueStore implements IKeyValueStore
```

Miembros públicos:
- `get(key: string): Promise<string | null>`
- `set(key: string, value: string): Promise<void>`
- `remove(key: string): Promise<void>`

### `WebStorageKeyValueStore`

- Origen: `packages/data/src/kv.ts`
- Descripción: Adaptador **IKeyValueStore -> Browser `localStorage`**. Aísla prefijos por namespace para que varias aplicaciones web compartan dominio sin colisiones.

```ts
class WebStorageKeyValueStore implements IKeyValueStore
```

Miembros públicos:
- `constructor(private readonly namespace = 'fw_kv')`
- `get(key: string): Promise<string | null>`
- `set(key: string, value: string): Promise<void>`
- `remove(key: string): Promise<void>`

### `StoredEntityRecord`

- Origen: `packages/data/src/entityStore.ts`
- Descripción: Registro persistido localmente junto a su estado de cola de sincronización.

```ts
interface StoredEntityRecord<T extends EntityBase>
```

Miembros públicos:
- `entity: T`
- `syncStatus: SyncStatus`

### `IEntityStoreDriver`

- Origen: `packages/data/src/entityStore.ts`
- Descripción: Contrato de bajo nivel (**Patrón Adapter / Storage Driver**) para almacenar entidades en el dispositivo. Implementaciones intercambiables: - `SqlEntityStoreDriver`: SQLite en Android (`ExpoSqliteDriver`) o libSQL local (`LibSqlDriver`). - `WebLocalStorageEntityStore`: caché local del navegador (`localStorage`). - `InMemoryEntityStoreDriver`: doble de memoria para tests unitarios.

```ts
interface IEntityStoreDriver
```

Miembros públicos:
- `ensureInitialized(): Promise<void>`
- `list(entityName: string): Promise<StoredEntityRecord<T>[]>`
- `getById(entityName: string, id: string): Promise<StoredEntityRecord<T> | null>`
- `upsert(entityName: string, entity: T, syncStatus: SyncStatus): Promise<void>`
- `markSynced(entityName: string, idsAndVersions: Array<{ id: string; version: number }>): Promise<void>`
- `countPending(entityName: string): Promise<number>`

### `SqlEntityStoreDriver`

- Origen: `packages/data/src/entityStore.ts`
- Descripción: Adaptador SQL para entidades locales-first sobre cualquier `ISqlDriver`. Guarda cada entidad como JSON + columnas indexadas (`version`, `updated_at`, `deleted_at`, `sync_status`) evitando tener que migrar esquemas cada vez que se añade una nueva app simple.

```ts
class SqlEntityStoreDriver implements IEntityStoreDriver
```

Miembros públicos:
- `constructor(private readonly driver: ISqlDriver)`
- `ensureInitialized(): Promise<void>`
- `list(entityName: string): Promise<StoredEntityRecord<T>[]>`
- `getById(entityName: string, id: string): Promise<StoredEntityRecord<T> | null>`
- `upsert(entityName: string, entity: T, syncStatus: SyncStatus): Promise<void>`
- `markSynced(entityName: string, idsAndVersions: Array<{ id: string; version: number }>): Promise<void>`
- `countPending(entityName: string): Promise<number>`

### `InMemoryEntityStoreDriver`

- Origen: `packages/data/src/entityStore.ts`
- Descripción: Adaptador en memoria RAM (con clonado defensivo mediante `structuredClone`) para aislar pruebas unitarias sin tocar disco ni sistema de archivos.

```ts
class InMemoryEntityStoreDriver implements IEntityStoreDriver
```

Miembros públicos:
- `ensureInitialized(): Promise<void>`
- `list(entityName: string): Promise<StoredEntityRecord<T>[]>`
- `getById(entityName: string, id: string): Promise<StoredEntityRecord<T> | null>`
- `upsert(entityName: string, entity: T, syncStatus: SyncStatus): Promise<void>`
- `markSynced(entityName: string, idsAndVersions: Array<{ id: string; version: number }>): Promise<void>`
- `countPending(entityName: string): Promise<number>`

### `WebLocalStorageEntityStore`

- Origen: `packages/data/src/entityStore.ts`
- Descripción: Adaptador para aplicaciones Web en modo local-only usando `globalThis.localStorage`. Si el usuario no activa la nube Pro, sus datos jamás salen del navegador local.

```ts
class WebLocalStorageEntityStore implements IEntityStoreDriver
```

Miembros públicos:
- `constructor(private readonly namespace = 'fw_entities')`
- `ensureInitialized(): Promise<void>`
- `list(entityName: string): Promise<StoredEntityRecord<T>[]>`
- `getById(entityName: string, id: string): Promise<StoredEntityRecord<T> | null>`
- `upsert(entityName: string, entity: T, syncStatus: SyncStatus): Promise<void>`
- `markSynced(entityName: string, idsAndVersions: Array<{ id: string; version: number }>): Promise<void>`
- `countPending(entityName: string): Promise<number>`

### `HttpSyncTransportOptions`

- Origen: `packages/data/src/httpTransport.ts`

```ts
interface HttpSyncTransportOptions
```

Miembros públicos:
- `baseUrl: string`
- `fetchImpl?: typeof fetch`
- `timeoutMs?: number`

### `HttpSyncTransport`

- Origen: `packages/data/src/httpTransport.ts`
- Descripción: Patrón: **Adapter / Anti-Corruption Layer** sobre HTTP + `fetch`. Traduce el contrato abstracto `IRemoteSyncTransport` a llamadas REST JSON contra `@framework/server`, gestionando timeouts con `AbortController` y mapeando códigos HTTP (`402 -> ENTITLEMENT_REQUIRED`, red -> `NETWORK_ERROR`) a `FrameworkError`.

```ts
class HttpSyncTransport implements IRemoteSyncTransport
```

Miembros públicos:
- `constructor(options: HttpSyncTransportOptions)`
- `checkEntitlement(appId: string, userId: string): Promise<EntitlementStatus>`
- `setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>`
- `sync(request: SyncPushRequest): Promise<SyncPullResponse>`

### `SyncMetadataStoreOptions`

- Origen: `packages/data/src/syncMetadata.ts`

```ts
interface SyncMetadataStoreOptions
```

Miembros públicos:
- `kv: IKeyValueStore`
- `namespacePrefix: string`
- `defaultMode: StorageMode`
- `defaultPlan: UserPlan`

### `SyncMetadataStore`

- Origen: `packages/data/src/syncMetadata.ts`
- Descripción: Patrón: **Single Responsibility / State Store Helper**. Encapsula la serialización y el prefijado de claves en `IKeyValueStore` para los metadatos operativos de sincronización (`mode`, `plan`, `cursor`, `lastSyncedAt`), manteniendo a `HybridSyncRepository` enfocado únicamente en entidades y replicación.

```ts
class SyncMetadataStore
```

Miembros públicos:
- `constructor(options: SyncMetadataStoreOptions)`
- `getMode(): Promise<StorageMode>`
- `setMode(mode: StorageMode): Promise<void>`
- `getPlan(): Promise<UserPlan>`
- `setPlan(plan: UserPlan): Promise<void>`
- `getCursor(): Promise<string | null>`
- `setCursor(cursor: string): Promise<void>`
- `getLastSyncedAt(): Promise<string | null>`
- `setLastSyncedAt(isoTimestamp: string): Promise<void>`

### `HybridSyncRepositoryOptions`

- Origen: `packages/data/src/hybridRepository.ts`

```ts
interface HybridSyncRepositoryOptions
```

Miembros públicos:
- `appId: string`
- `userId: string`
- `deviceId: string`
- `entityName: string`
- `store: IEntityStoreDriver`
- `kv: IKeyValueStore`
- `transport?: IRemoteSyncTransport`
- `conflictStrategy?: IConflictResolutionStrategy`
- `defaultMode?: StorageMode`
- `defaultPlan?: UserPlan`
- `autoSyncInCloudMode?: boolean`

### `HybridSyncRepository`

- Origen: `packages/data/src/hybridRepository.ts`
- Descripción: Repositorio local-first con respaldo opcional en la nube (**Patrón Repository + Observer + Strategy**). Cumple **SRP** delegando: - Persistencia de entidades locales -> `IEntityStoreDriver` - Persistencia de metadatos (`mode`, `plan`, `cursor`) -> `SyncMetadataStore` - Resolución de conflictos -> `IConflictResolutionStrategy` - Comunicación remota -> `IRemoteSyncTransport`

```ts
class HybridSyncRepository<T extends EntityBase> implements ISyncableRepository<T>
```

Miembros públicos:
- `entityName: string`
- `constructor(options: HybridSyncRepositoryOptions)`
- `subscribeStatus(listener: (status: StorageStatus) => void): () => void`
- `getPendingCount(): Promise<number>`
- `getStorageStatus(): Promise<StorageStatus>`
- `list(options?: { includeDeleted?: boolean }): Promise<T[]>`
- `findById(id: string): Promise<T | null>`
- `save(entity: T): Promise<T>`
- `remove(id: string): Promise<void>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`

## `@framework/data-libsql`

### `LibSqlDriverConfig`

- Origen: `packages/data-libsql/src/index.ts`
- Descripción: Configuración discriminada para instanciar libSQL en modo local (archivo o memoria) o en modo remoto apuntando a un cluster **Turso**.

```ts
type LibSqlDriverConfig = | { mode: 'local'; /** Ej. `'file:./data/framework.db'` o `':memory:'` */ url: string; } | { mode: 'turso'; /** Ej. `'libsql://mi-org.turso.io'` */ url: string; authToken: string; }
```

### `LibSqlDriver`

- Origen: `packages/data-libsql/src/index.ts`
- Descripción: Patrón: **Adapter (`@libsql/client` -> `ISqlDriver`)**. Permite que el mismo código del servidor y de los repositorios funcione tanto con un archivo SQLite/libSQL local como contra Turso en producción sin modificar ni una consulta SQL. Emplea `AsyncMutex` para serializar escrituras locales y activar `WAL + busy_timeout`.

```ts
class LibSqlDriver implements ISqlDriver
```

Miembros públicos:
- `driverName: string`
- `constructor(private readonly config: LibSqlDriverConfig)`
- `initialize(): Promise<void>`
- `execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>`
- `query(sql: string, params?: SqlValue[]): Promise<TRow[]>`
- `transaction(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T>`
- `close(): Promise<void>`

### `createLibSqlDriver`

- Origen: `packages/data-libsql/src/index.ts`
- Descripción: Patrón: **Factory Method** para crear una instancia tipada de `LibSqlDriver`.

```ts
function createLibSqlDriver(config: LibSqlDriverConfig): LibSqlDriver
```

### `createLibSqlDriverFromEnv`

- Origen: `packages/data-libsql/src/index.ts`
- Descripción: Patrón: **Factory Method por Configuración (Environment-driven)**. Cambia entre libSQL local y Turso en la nube leyendo únicamente variables de entorno: - `STORAGE_DRIVER=local|turso` (por defecto `local`) - `LIBSQL_LOCAL_URL=file:./data/framework.db` - `TURSO_DATABASE_URL=libsql://...` - `TURSO_AUTH_TOKEN=...`

```ts
function createLibSqlDriverFromEnv(env: Record<string, string | undefined> = process.env): LibSqlDriver
```

## `@framework/example-domain`

### `EXAMPLE_APP_ID`

- Origen: `packages/example-domain/src/contracts.ts`

```ts
const EXAMPLE_APP_ID
```

### `PRESET_ENTITY_NAME`

- Origen: `packages/example-domain/src/contracts.ts`

```ts
const PRESET_ENTITY_NAME
```

### `PresetEntity`

- Origen: `packages/example-domain/src/contracts.ts`
- Descripción: Entidad principal de la app de ejemplo **FocusScenes**. Hereda de `EntityBase` los metadatos de versionado y tombstone necesarios para sincronizar.

```ts
interface PresetEntity extends EntityBase
```

Miembros públicos:
- `name: string`
- `notes: string`
- `ambientLevel: number`
- `warmthLevel: number`
- `focusMinutes: number`
- `isFavorite: boolean`
- `isActive: boolean`

### `CreatePresetInput`

- Origen: `packages/example-domain/src/contracts.ts`

```ts
interface CreatePresetInput
```

Miembros públicos:
- `name: string`
- `notes?: string`
- `ambientLevel?: number`
- `warmthLevel?: number`
- `focusMinutes?: number`

### `PresetSliderField`

- Origen: `packages/example-domain/src/contracts.ts`

```ts
type PresetSliderField = 'ambientLevel' | 'warmthLevel' | 'focusMinutes'
```

### `UpdatePresetInput`

- Origen: `packages/example-domain/src/contracts.ts`

```ts
interface UpdatePresetInput
```

Miembros públicos:
- `name?: string`
- `notes?: string`
- `ambientLevel?: number`
- `warmthLevel?: number`
- `focusMinutes?: number`
- `isFavorite?: boolean`
- `isActive?: boolean`

### `PresetStudioViewState`

- Origen: `packages/example-domain/src/contracts.ts`
- Descripción: Snapshot inmutable de estado que reciben TODAS las vistas (`IView<PresetStudioViewState>`), ya sea la pantalla Android Expo o la interfaz alternativa de Escritorio Web.

```ts
interface PresetStudioViewState
```

Miembros públicos:
- `presets: PresetEntity[]`
- `selectedPresetId: string | null`
- `filterFavoritesOnly: boolean`
- `loading: boolean`
- `busy: boolean`
- `errorMessage: string | null`
- `storage: StorageStatus`

### `IPresetModel`

- Origen: `packages/example-domain/src/contracts.ts`
- Descripción: Contrato estricto del **Modelo (M)** en MVC. Solo conoce reglas de negocio y el contrato `ISyncableRepository<PresetEntity>`, sin ninguna referencia a React, Expo, DOM o HTTP.

```ts
interface IPresetModel extends IModel
```

Miembros públicos:
- `loadPresets(): Promise<PresetEntity[]>`
- `getPresetsSnapshot(): PresetEntity[]`
- `createPreset(input: CreatePresetInput): Promise<PresetEntity>`
- `updatePreset(id: string, patch: UpdatePresetInput): Promise<PresetEntity>`
- `deletePreset(id: string): Promise<void>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`

### `IPresetController`

- Origen: `packages/example-domain/src/contracts.ts`
- Descripción: Contrato estricto del **Controlador (C)** en MVC. Expone comandos semánticos de dominio consumidos idénticamente desde Android (`demo-expo`), Web (`demo-web`) o tests unitarios (`mvc.test.ts`).

```ts
interface IPresetController extends IController<PresetStudioViewState, ViewEvent>
```

Miembros públicos:
- `refresh(): Promise<void>`
- `selectPreset(id: string | null): void`
- `setFilterFavoritesOnly(onlyFavorites: boolean): void`
- `createPreset(input: CreatePresetInput): Promise<void>`
- `updateSlider(id: string, field: PresetSliderField, value: number): Promise<void>`
- `updateDetails(id: string, patch: { name?: string; notes?: string }): Promise<void>`
- `toggleFavorite(id: string): Promise<void>`
- `activatePreset(id: string): Promise<void>`
- `deletePreset(id: string): Promise<void>`
- `upgradeToProAndEnableCloud(): Promise<void>`
- `downgradeToFree(): Promise<void>`
- `setStorageMode(mode: StorageMode): Promise<void>`
- `syncNow(): Promise<void>`
- `clearError(): void`

### `EXAMPLE_SERVER_MODULE`

- Origen: `packages/example-domain/src/contracts.ts`
- Descripción: Extensión opcional del backend compartida por esta aplicación (**Plugin Module Pattern**). Demuestra cómo `@framework/server` ejecuta endpoints propios de una app sobre la misma BD SQL.

```ts
const EXAMPLE_SERVER_MODULE: RegisteredAppModule
```

### `PRESET_LIMITS`

- Origen: `packages/example-domain/src/PresetModel.ts`
- Descripción: Límites canónicos de cada slider del dominio FocusScenes (evita números mágicos repetidos).

```ts
const PRESET_LIMITS
```

### `PresetModel`

- Origen: `packages/example-domain/src/PresetModel.ts`
- Descripción: Implementación del **Modelo (M)** de FocusScenes (`IPresetModel`). Responsabilidades exclusivas: - Validar invariantes del dominio (nombres no vacíos, rangos válidos en sliders, escena activa única). - Siembra inicial idempotente consultando incluso registros borrados (`includeDeleted: true`) para no resucitar escenas que el usuario eliminó voluntariamente. - Delegar persistencia y sincronización exclusivamente al contrato `ISyncableRepository<PresetEntity>`. - Reenviar eventos de cambio hacia los controladores mediante el patrón **Observer**.

```ts
class PresetModel extends ObservableModel implements IPresetModel
```

Miembros públicos:
- `constructor(private readonly repository: ISyncableRepository<PresetEntity>)`
- `getPresetsSnapshot(): PresetEntity[]`
- `loadPresets(): Promise<PresetEntity[]>`
- `createPreset(input: CreatePresetInput): Promise<PresetEntity>`
- `updatePreset(id: string, patch: UpdatePresetInput): Promise<PresetEntity>`
- `deletePreset(id: string): Promise<void>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`

### `PresetController`

- Origen: `packages/example-domain/src/PresetController.ts`
- Descripción: Implementación del **Controlador (C)** de FocusScenes (`IPresetController`). Patrones aplicados: - **MVC Mediator**: Coordina `IPresetModel` y propaga snapshots inmutables a cualquier `IView`. - **Observer + Template Method (`StatefulMvcController`)**: Hereda `bindModel`, `executeCommand` y `clearError` desde `@framework/core`, evitando duplicar lógica de `busy`, errores o limpieza.

```ts
class PresetController extends StatefulMvcController<PresetStudioViewState, ViewEvent> implements IPresetController
```

Miembros públicos:
- `constructor(private readonly model: IPresetModel)`
- `init(): Promise<void>`
- `refresh(): Promise<void>`
- `selectPreset(id: string | null): void`
- `setFilterFavoritesOnly(onlyFavorites: boolean): void`
- `createPreset(input: CreatePresetInput): Promise<void>`
- `updateSlider(id: string, field: PresetSliderField, value: number): Promise<void>`
- `updateDetails(id: string, patch: { name?: string; notes?: string }): Promise<void>`
- `toggleFavorite(id: string): Promise<void>`
- `activatePreset(id: string): Promise<void>`
- `deletePreset(id: string): Promise<void>`
- `upgradeToProAndEnableCloud(): Promise<void>`
- `downgradeToFree(): Promise<void>`
- `setStorageMode(mode: StorageMode): Promise<void>`
- `syncNow(): Promise<void>`

### `PresetStudioFactoryOptions`

- Origen: `packages/example-domain/src/factory.ts`

```ts
interface PresetStudioFactoryOptions
```

Miembros públicos:
- `store: IEntityStoreDriver`
- `kv: IKeyValueStore`
- `deviceId: string`
- `apiBaseUrl?: string`
- `transport?: IRemoteSyncTransport`
- `userId?: string`
- `defaultMode?: StorageMode`
- `defaultPlan?: UserPlan`
- `conflictStrategy?: IConflictResolutionStrategy`

### `createPresetStudioController`

- Origen: `packages/example-domain/src/factory.ts`
- Descripción: Patrón: **Abstract Factory / Composition Root** compartida entre plataformas. Ensambla en orden estricto la cadena MVC + Datos sin que las vistas (`demo-expo` ni `demo-web`) tengan que repetir la construcción manual del transporte, repositorio y modelo: `IRemoteSyncTransport (opcional) -> HybridSyncRepository -> PresetModel -> PresetController`

```ts
function createPresetStudioController(options: PresetStudioFactoryOptions): IPresetController
```

## `@framework/expo-adapter`

### `ExpoSqliteDriver`

- Origen: `packages/expo-adapter/src/index.ts`
- Descripción: Patrón: **Adapter + Anti-Corruption Boundary (`expo-sqlite` -> `ISqlDriver`)**. Aísla TODAS las importaciones de `expo-sqlite` dentro de este único archivo. Ventaja estratégica: cuando actualices de versión el SDK de Expo (por ejemplo SDK 58 -> 59), únicamente deberás verificar o ajustar este adaptador sin tocar el resto del framework ni las apps.

```ts
class ExpoSqliteDriver implements ISqlDriver
```

Miembros públicos:
- `driverName: unknown`
- `constructor(private readonly databaseName = 'framework_app.db')`
- `initialize(): Promise<void>`
- `execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>`
- `query(sql: string, params?: SqlValue[]): Promise<TRow[]>`
- `transaction(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T>`
- `close(): Promise<void>`

## `@framework/mintmox-domain`

Dominio MVC de la aplicación MintMox.

### `APP_ID`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
const APP_ID
```

### `ENTITY_NAME`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
const ENTITY_NAME
```

### `DEFAULT_COLLECTION`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
const DEFAULT_COLLECTION
```

### `CardTrend`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
type CardTrend = 'up' | 'down' | 'flat'
```

### `CardPricePoint`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Punto histórico de cotización de una carta.

```ts
interface CardPricePoint
```

Miembros públicos:
- `date: string`
- `price: number`

### `CardEntity`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Entidad de carta de MTG con seguimiento de inversión y cotización.

```ts
interface CardEntity extends EntityBase
```

Miembros públicos:
- `title: string`
- `nameEn?: string`
- `edition: string`
- `editionCode?: string`
- `language?: string`
- `quantity: number`
- `currentPrice: number`
- `previousPrice: number`
- `buyPrice?: number`
- `isFoil?: boolean`
- `isAltered?: boolean`
- `isSigned?: boolean`
- `condition?: string`
- `isFavorite: boolean`
- `imageUrl?: string`
- `scryfallId?: string`
- `collection?: string`
- `collections?: string[]`
- `priceHistory?: CardPricePoint[]`
- `lastPriceSyncDate?: string`

### `CreateCardInput`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
interface CreateCardInput
```

Miembros públicos:
- `title: string`
- `nameEn?: string`
- `edition?: string`
- `editionCode?: string`
- `language?: string`
- `quantity?: number`
- `currentPrice?: number`
- `previousPrice?: number`
- `buyPrice?: number`
- `isFoil?: boolean`
- `isAltered?: boolean`
- `isSigned?: boolean`
- `condition?: string`
- `imageUrl?: string`
- `scryfallId?: string`
- `collection?: string`
- `collections?: string[]`
- `priceHistory?: CardPricePoint[]`
- `lastPriceSyncDate?: string`

### `getCardCollections`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Obtiene la lista canónica y sin duplicados de colecciones a las que pertenece una carta. Soporta arrays `collections` o cadenas delimitadas en `collection`. Si no tiene ninguna asignada, devuelve `[DEFAULT_COLLECTION]`.

```ts
function getCardCollections(card: { collections?: string[] | null; collection?: string | null; }): string[]
```

### `ImportCardsOptions`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
interface ImportCardsOptions
```

Miembros públicos:
- `replace?: boolean`

### `ImportCardsResult`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
interface ImportCardsResult
```

Miembros públicos:
- `importedCount: number`
- `replaced: boolean`

### `calculateCardReturn`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Calcula la variación absoluta, porcentual y la tendencia de cotización por unidad.

```ts
function calculateCardReturn(card: { currentPrice: number; previousPrice: number; buyPrice?: number; }): { diff: number; percent: number; trend: CardTrend; }
```

### `CardmarketSyncResult`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Resultado de la sincronización de precios de Cardmarket.

```ts
interface CardmarketSyncResult
```

Miembros públicos:
- `alreadyUpToDate: boolean`
- `updatedCount: number`
- `totalCards: number`
- `syncDate: string`

### `MintmoxViewState`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Estado inmutable proyectado hacia la vista de MintMox.

```ts
interface MintmoxViewState
```

Miembros públicos:
- `items: CardEntity[]`
- `loading: boolean`
- `busy: boolean`
- `errorMessage: string | null`
- `storage: StorageStatus`
- `isSyncingPrices?: boolean`
- `lastPriceSyncDate?: string | null`

### `MtginvestViewState`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
type MtginvestViewState = MintmoxViewState
```

### `IMintmoxModel`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Contrato del Modelo (M).

```ts
interface IMintmoxModel extends IModel
```

Miembros públicos:
- `getSnapshot(): CardEntity[]`
- `loadItems(): Promise<CardEntity[]>`
- `createItem(input: CreateCardInput): Promise<CardEntity>`
- `updateCard(id: string, patch: Partial< Pick< CardEntity, | 'title' | 'nameEn' | 'edition' | 'editionCode' | 'language' | 'quantity' | 'currentPrice' | 'previousPrice' | 'buyPrice' | 'isFoil' | 'isAltered' | 'isSigned' | 'condition' | 'imageUrl' | 'scryfallId' | 'collection' | 'collections' | 'priceHistory' | 'lastPriceSyncDate' > >): Promise<CardEntity>`
- `updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<CardEntity>`
- `syncCardmarketPrices(scryfallClient: IScryfallApiClient, options?: { force?: boolean }): Promise<CardmarketSyncResult>`
- `deleteItem(id: string): Promise<void>`
- `resetToSeed(): Promise<CardEntity[]>`
- `clearInventory(): Promise<CardEntity[]>`
- `importCards(cards: CreateCardInput[], options?: ImportCardsOptions): Promise<ImportCardsResult>`
- `exportToJson(): string`
- `exportToCsv(): string`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`
- `dispose?(): void`

### `IMtginvestModel`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
type IMtginvestModel = IMintmoxModel
```

### `IMintmoxController`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Contrato del Controlador (C).

```ts
interface IMintmoxController extends IController<MintmoxViewState, ViewEvent>
```

Miembros públicos:
- `scryfallClient: IScryfallApiClient`
- `createItem(input: CreateCardInput): Promise<void>`
- `updateCard(id: string, patch: Partial< Pick< CardEntity, | 'title' | 'nameEn' | 'edition' | 'editionCode' | 'language' | 'quantity' | 'currentPrice' | 'previousPrice' | 'buyPrice' | 'isFoil' | 'isAltered' | 'isSigned' | 'condition' | 'imageUrl' | 'scryfallId' | 'collection' | 'collections' | 'priceHistory' | 'lastPriceSyncDate' > >): Promise<void>`
- `getCardImageUrl(card: CardEntity): Promise<string | null>`
- `updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<void>`
- `syncCardmarketPrices(options?: { force?: boolean }): Promise<CardmarketSyncResult>`
- `deleteItem(id: string): Promise<void>`
- `resetToSeed(): Promise<void>`
- `clearInventory(): Promise<void>`
- `importCards(cards: CreateCardInput[], options?: ImportCardsOptions): Promise<ImportCardsResult>`
- `exportToJson(): string`
- `exportToCsv(): string`
- `upgradeToProAndEnableCloud(): Promise<void>`
- `setStorageMode(mode: StorageMode): Promise<void>`
- `syncNow(): Promise<void>`
- `clearError(): void`

### `IMtginvestController`

- Origen: `packages/mintmox-domain/src/contracts.ts`

```ts
type IMtginvestController = IMintmoxController
```

### `SERVER_MODULE`

- Origen: `packages/mintmox-domain/src/contracts.ts`
- Descripción: Módulo enchufable al backend reutilizable `@framework/server`.

```ts
const SERVER_MODULE: RegisteredAppModule
```

### `ScryfallImageUris`

- Origen: `packages/mintmox-domain/src/scryfall.ts`
- Descripción: Tipos e interfaces oficiales para la integración con la API de Scryfall (https://scryfall.com/docs/api). Diseñado según los principios SOLID (ISP - Interface Segregation Principle y DIP - Dependency Inversion) para permitir desacoplamiento y extensibilidad futura (precios de mercado, autocompletado, legalidades y arte).

```ts
interface ScryfallImageUris
```

Miembros públicos:
- `small?: string`
- `normal?: string`
- `large?: string`
- `png?: string`
- `artCrop?: string`
- `borderCrop?: string`

### `ScryfallCardFace`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallCardFace
```

Miembros públicos:
- `name: string`
- `manaCost?: string`
- `typeLine?: string`
- `oracleText?: string`
- `imageUris?: ScryfallImageUris`

### `ScryfallPrices`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallPrices
```

Miembros públicos:
- `eur?: string | null`
- `eurFoil?: string | null`
- `usd?: string | null`
- `usdFoil?: string | null`
- `tix?: string | null`

### `ScryfallCardData`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallCardData
```

Miembros públicos:
- `id: string`
- `name: string`
- `printedName?: string`
- `lang: string`
- `set: string`
- `setName?: string`
- `collectorNumber: string`
- `scryfallUri?: string`
- `rarity?: string`
- `manaCost?: string`
- `typeLine?: string`
- `oracleText?: string`
- `imageUris?: ScryfallImageUris`
- `cardFaces?: ScryfallCardFace[]`
- `prices?: ScryfallPrices`
- `digital?: boolean`
- `games?: string[]`

### `ScryfallSearchResult`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallSearchResult
```

Miembros públicos:
- `totalCards: number`
- `hasMore: boolean`
- `nextPage?: string`
- `data: ScryfallCardData[]`

### `ScryfallNamedQuery`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallNamedQuery
```

Miembros públicos:
- `exact?: string`
- `fuzzy?: string`
- `set?: string`

### `ScryfallSearchOptions`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallSearchOptions
```

Miembros públicos:
- `page?: number`
- `unique?: 'cards' | 'art' | 'prints'`
- `order?: 'name' | 'set' | 'released' | 'rarity' | 'color' | 'usd' | 'eur'`
- `dir?: 'auto' | 'asc' | 'desc'`
- `paperOnly?: boolean`

### `ScryfallCardIdentifier`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallCardIdentifier
```

Miembros públicos:
- `id?: string`
- `name?: string`
- `set?: string`
- `collector_number?: string`

### `ScryfallCollectionResult`

- Origen: `packages/mintmox-domain/src/scryfall.ts`

```ts
interface ScryfallCollectionResult
```

Miembros públicos:
- `data: ScryfallCardData[]`
- `notFound: ScryfallCardIdentifier[]`

### `IScryfallApiClient`

- Origen: `packages/mintmox-domain/src/scryfall.ts`
- Descripción: Interfaz de cliente API para Scryfall. Permite desacoplar cualquier llamada externa y mockearla en pruebas sin red.

```ts
interface IScryfallApiClient
```

Miembros públicos:
- `getCardsCollection(identifiers: ScryfallCardIdentifier[]): Promise<ScryfallCollectionResult>`
- `getCardNamed(params: ScryfallNamedQuery): Promise<ScryfallCardData | null>`
- `getCardBySetAndNumber(setCode: string, collectorNumber: string, lang?: string): Promise<ScryfallCardData | null>`
- `searchCards(query: string, options?: ScryfallSearchOptions): Promise<ScryfallSearchResult>`
- `autocompleteCardNames(query: string): Promise<string[]>`
- `resolveCardImageUrl(card: { title: string; nameEn?: string; editionCode?: string; language?: string; }): Promise<string | null>`

### `HttpFetchFn`

- Origen: `packages/mintmox-domain/src/ScryfallApiClient.ts`

```ts
type HttpFetchFn = ( input: string, init?: { method?: string; body?: string; headers?: Record<string, string>; } ) => Promise<{ ok: boolean; status: number; json(): Promise<any>; }>
```

### `ScryfallClientConfig`

- Origen: `packages/mintmox-domain/src/ScryfallApiClient.ts`

```ts
interface ScryfallClientConfig
```

Miembros públicos:
- `baseUrl?: string`
- `userAgent?: string`
- `rateLimitMs?: number`
- `fetchFn?: HttpFetchFn`

### `ScryfallApiClient`

- Origen: `packages/mintmox-domain/src/ScryfallApiClient.ts`
- Descripción: Implementación canónica del cliente API de Scryfall (`IScryfallApiClient`). Cumple con las pautas de Scryfall (User-Agent amigable, 50-100ms de limitación de tasa y caché).

```ts
class ScryfallApiClient implements IScryfallApiClient
```

Miembros públicos:
- `constructor(config: ScryfallClientConfig = {})`
- `getCardsCollection(identifiers: ScryfallCardIdentifier[]): Promise<ScryfallCollectionResult>`
- `getCardNamed(params: ScryfallNamedQuery): Promise<ScryfallCardData | null>`
- `getCardBySetAndNumber(setCode: string, collectorNumber: string, lang?: string): Promise<ScryfallCardData | null>`
- `searchCards(query: string, options?: ScryfallSearchOptions): Promise<ScryfallSearchResult>`
- `autocompleteCardNames(query: string): Promise<string[]>`
- `resolveCardImageUrl(card: { title: string; nameEn?: string; editionCode?: string; language?: string; }): Promise<string | null>`

### `SEED_PRICE_HISTORIES`

- Origen: `packages/mintmox-domain/src/priceHistory.ts`
- Descripción: Histórico de cotizaciones de Cardmarket extraído del catálogo Excel. Registro de cotizaciones diarias para el seguimiento de inversión de cada carta.

```ts
const SEED_PRICE_HISTORIES: Record<string, CardPricePoint[]>
```

### `PortfolioPricingOptions`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`

```ts
interface PortfolioPricingOptions
```

Miembros públicos:
- `conditionMultipliers?: Partial<Record<string, number>>`
- `conditionPricingEnabled?: boolean`

### `CardChartSeriesData`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`

```ts
interface CardChartSeriesData
```

Miembros públicos:
- `labels: string[]`
- `values: number[]`
- `unit: string`

### `buildOneYearCardChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Genera la serie de datos para graficar la evolución del precio de una carta en el último año (12 meses). Si la carta no tiene datos para los primeros meses del año, comienza en 0 hasta la fecha en que se registran sus primeras cotizaciones históricas (según requerimiento explícito del usuario).

```ts
function buildOneYearCardChart(card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>, referenceDate: Date = new Date('2026-11-13T00:00:00Z')): CardChartSeriesData
```

### `buildThreeMonthCardChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Genera la serie de datos para los últimos 3 meses con resolución detallada (Cardmarket).

```ts
function buildThreeMonthCardChart(card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>): CardChartSeriesData
```

### `ChartTimeframe`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`

```ts
type ChartTimeframe = '1S' | '1M' | '3M' | '6M' | '1A'
```

### `TIMEFRAME_LABELS`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`

```ts
const TIMEFRAME_LABELS: Record<ChartTimeframe, string>
```

### `TIMEFRAME_DESCRIPTIONS`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`

```ts
const TIMEFRAME_DESCRIPTIONS: Record<ChartTimeframe, string>
```

### `buildOneWeekCardChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Genera la serie de datos para los últimos 7 días (1S).

```ts
function buildOneWeekCardChart(card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>, referenceDate: Date = new Date('2026-11-13T00:00:00Z')): CardChartSeriesData
```

### `buildOneMonthCardChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Genera la serie de datos para los últimos 30 días (1M).

```ts
function buildOneMonthCardChart(card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>, referenceDate: Date = new Date('2026-11-13T00:00:00Z')): CardChartSeriesData
```

### `buildSixMonthCardChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Genera la serie de datos para los últimos 6 meses (6M).

```ts
function buildSixMonthCardChart(card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>, referenceDate: Date = new Date('2026-11-13T00:00:00Z')): CardChartSeriesData
```

### `buildCardChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Función principal unificada para construir la gráfica según el rango temporal seleccionado.

```ts
function buildCardChart(card: Pick<CardEntity, 'currentPrice' | 'previousPrice' | 'priceHistory'>, timeframe: ChartTimeframe, referenceDate?: Date): CardChartSeriesData
```

### `PortfolioChartSeriesData`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Serie agregada global para la cartera de inversión completa.

```ts
interface PortfolioChartSeriesData
```

Miembros públicos:
- `labels: string[]`
- `investmentValues: number[]`
- `portfolioValues: number[]`
- `profitValues: number[]`
- `roiValues: number[]`

### `buildPortfolioChart`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Calcula la evolución temporal consolidada de toda la colección. Permite analizar la cartera a nivel macro (Valor total vs Coste, Beneficio neto y ROI %).

```ts
function buildPortfolioChart(items: CardEntity[], timeframe: ChartTimeframe, referenceDate: Date = new Date('2026-11-13T00:00:00Z'), pricingOptions?: PortfolioPricingOptions): PortfolioChartSeriesData
```

### `RoiDistributionBucket`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Tramo de distribución de rentabilidad para la cartera.

```ts
interface RoiDistributionBucket
```

Miembros públicos:
- `id: string`
- `label: string`
- `rangeLabel: string`
- `minPercent: number`
- `maxPercent: number`
- `count: number`
- `percentage: number`
- `color: string`

### `calculatePortfolioRoiDistribution`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Calcula la distribución porcentual de cartas en los distintos tramos de rentabilidad (ROI %).

```ts
function calculatePortfolioRoiDistribution(items: CardEntity[], pricingOptions?: PortfolioPricingOptions): RoiDistributionBucket[]
```

### `CardProfitLeader`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Registro de carta destacada por plusvalía o pérdida.

```ts
interface CardProfitLeader
```

Miembros públicos:
- `id: string`
- `title: string`
- `nameEn?: string`
- `edition: string`
- `editionCode?: string`
- `quantity: number`
- `unitBuyPrice: number`
- `unitCurrentPrice: number`
- `totalInvested: number`
- `totalCurrent: number`
- `totalProfit: number`
- `roiPercent: number`

### `getPortfolioProfitLeaders`

- Origen: `packages/mintmox-domain/src/chartUtils.ts`
- Descripción: Obtiene las cartas líderes en plusvalía (candidatas a venta) y las cartas con mayor pérdida.

```ts
function getPortfolioProfitLeaders(items: CardEntity[], limit = 5, pricingOptions?: PortfolioPricingOptions): { topGainers: CardProfitLeader[]; topLosers: CardProfitLeader[]; }
```

### `MintmoxModel`

- Origen: `packages/mintmox-domain/src/MintmoxModel.ts`
- Descripción: Modelo MVC de MintMox.

```ts
class MintmoxModel implements IMintmoxModel
```

Miembros públicos:
- `constructor(private readonly repository: ISyncableRepository<CardEntity>)`
- `dispose(): void`
- `subscribe(listener: () => void): () => void`
- `getSnapshot(): CardEntity[]`
- `loadItems(): Promise<CardEntity[]>`
- `resetToSeed(): Promise<CardEntity[]>`
- `clearInventory(): Promise<CardEntity[]>`
- `importCards(cards: CreateCardInput[], options: ImportCardsOptions = {}): Promise<ImportCardsResult>`
- `exportToJson(): string`
- `exportToCsv(): string`
- `createItem(input: CreateCardInput): Promise<CardEntity>`
- `updateCard(id: string, patch: Partial< Pick< CardEntity, | 'title' | 'nameEn' | 'edition' | 'editionCode' | 'language' | 'quantity' | 'currentPrice' | 'previousPrice' | 'buyPrice' | 'isFoil' | 'isAltered' | 'isSigned' | 'condition' | 'imageUrl' | 'scryfallId' | 'collection' | 'collections' | 'priceHistory' | 'lastPriceSyncDate' > >): Promise<CardEntity>`
- `updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<CardEntity>`
- `syncCardmarketPrices(scryfallClient: IScryfallApiClient, options?: { force?: boolean }): Promise<CardmarketSyncResult>`
- `deleteItem(id: string): Promise<void>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`

### `MintmoxController`

- Origen: `packages/mintmox-domain/src/MintmoxController.ts`
- Descripción: Controlador MVC de MintMox.

```ts
class MintmoxController extends BaseController<MintmoxViewState, ViewEvent> implements IMintmoxController
```

Miembros públicos:
- `scryfallClient: IScryfallApiClient`
- `constructor(private readonly model: IMintmoxModel, scryfallClient?: IScryfallApiClient)`
- `init(): Promise<void>`
- `createItem(input: CreateCardInput): Promise<void>`
- `updateCard(id: string, patch: Partial< Pick< CardEntity, | 'title' | 'nameEn' | 'edition' | 'editionCode' | 'language' | 'quantity' | 'currentPrice' | 'previousPrice' | 'buyPrice' | 'isFoil' | 'isAltered' | 'isSigned' | 'condition' | 'imageUrl' | 'scryfallId' | 'collection' | 'collections' | 'priceHistory' | 'lastPriceSyncDate' > >): Promise<void>`
- `getCardImageUrl(card: CardEntity): Promise<string | null>`
- `updatePrices(id: string, currentPrice: number, previousPrice?: number): Promise<void>`
- `syncCardmarketPrices(options?: { force?: boolean }): Promise<CardmarketSyncResult>`
- `deleteItem(id: string): Promise<void>`
- `resetToSeed(): Promise<void>`
- `clearInventory(): Promise<void>`
- `importCards(cards: CreateCardInput[], options?: ImportCardsOptions): Promise<ImportCardsResult>`
- `exportToJson(): string`
- `exportToCsv(): string`
- `upgradeToProAndEnableCloud(): Promise<void>`
- `setStorageMode(mode: StorageMode): Promise<void>`
- `syncNow(): Promise<void>`
- `clearError(): void`
- `dispose(): void`

### `CreateMintmoxControllerOptions`

- Origen: `packages/mintmox-domain/src/factory.ts`

```ts
interface CreateMintmoxControllerOptions
```

Miembros públicos:
- `store: IEntityStoreDriver`
- `kv: IKeyValueStore`
- `deviceId: string`
- `userId?: string`
- `transport?: IRemoteSyncTransport`
- `scryfallClient?: IScryfallApiClient`

### `CreateMtginvestControllerOptions`

- Origen: `packages/mintmox-domain/src/factory.ts`

```ts
type CreateMtginvestControllerOptions = CreateMintmoxControllerOptions
```

### `createMintmoxController`

- Origen: `packages/mintmox-domain/src/factory.ts`
- Descripción: Factoría compartida multiplataforma (Android Expo + Web + Tests).

```ts
function createMintmoxController(options: CreateMintmoxControllerOptions): MintmoxController
```

### `createMtginvestController`

- Origen: `packages/mintmox-domain/src/factory.ts`

```ts
const createMtginvestController
```

### `MtgSet`

- Origen: `packages/mintmox-domain/src/sets.ts`
- Descripción: Catálogo canónico de ediciones/sets de Magic: The Gathering extraído de la hoja "Sets".

```ts
interface MtgSet
```

Miembros públicos:
- `code: string`
- `name: string`
- `year?: string`

### `MTG_SETS`

- Origen: `packages/mintmox-domain/src/sets.ts`

```ts
const MTG_SETS: MtgSet[]
```

### `findMtgSetByCode`

- Origen: `packages/mintmox-domain/src/sets.ts`

```ts
function findMtgSetByCode(code: string): MtgSet | undefined
```

### `findMtgSetByName`

- Origen: `packages/mintmox-domain/src/sets.ts`

```ts
function findMtgSetByName(name: string): MtgSet | undefined
```

### `SEED_CARDS`

- Origen: `packages/mintmox-domain/src/seeds.ts`
- Descripción: Semillas de cartas iniciales basadas en el inventario real de Magic: The Gathering.

```ts
const SEED_CARDS: CreateCardInput[]
```

### `DetectedImportResult`

- Origen: `packages/mintmox-domain/src/importExport.ts`

```ts
interface DetectedImportResult
```

Miembros públicos:
- `format: 'json' | 'csv' | 'decklist'`
- `sourceApp: string`
- `cards: CreateCardInput[]`

### `normalizeLanguageCode`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Normaliza nombres o códigos de idioma a código de 2/3 letras estándar (EN, ES, FR, etc.).

```ts
function normalizeLanguageCode(lang?: string | null): string
```

### `parseFoilValue`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Detecta si una celda indica que la carta es foil (soporta ManaBox, Dragon Shield, Cardmarket, TCGplayer, etc.).

```ts
function parseFoilValue(v: string | undefined): boolean
```

### `detectSourceAppFromHeaders`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Detecta automáticamente la aplicación de origen a partir de los encabezados de un archivo CSV.

```ts
function detectSourceAppFromHeaders(headerMap: Map<string, number>): string
```

### `exportCardsToJson`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Exporta una lista de cartas a formato JSON estructurado y legible.

```ts
function exportCardsToJson(cards: CardEntity[]): string
```

### `exportCardsToCsv`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Exporta una lista de cartas a formato CSV estándar (RFC 4180).

```ts
function exportCardsToCsv(cards: CardEntity[]): string
```

### `parseCardsFromJson`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Parsea e interpreta un contenido JSON a una lista de cartas válidas para inserción. Soporta tanto arrays planos como objetos estructurados `{ cards: [...] }`.

```ts
function parseCardsFromJson(jsonStr: string): CreateCardInput[]
```

### `parseCardsFromCsvWithMetadata`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Parsea un CSV de cartas MTG asociando cabeceras flexibles en inglés y español con soporte para ManaBox, Moxfield, Delver Lens, Dragon Shield, Deckbox, Cardmarket, TCGplayer y Archidekt.

```ts
function parseCardsFromCsvWithMetadata(csvStr: string): { cards: CreateCardInput[]; sourceApp: string }
```

### `parseCardsFromCsv`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Parsea un CSV de cartas MTG asociando cabeceras flexibles en inglés y español.

```ts
function parseCardsFromCsv(csvStr: string): CreateCardInput[]
```

### `parseCardsFromDecklist`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Parsea listas de baraja en texto plano estándar (MTG Arena, MTGO, Moxfield, ManaBox texto). Soporta líneas como: 4 Lightning Bolt 1 Sol Ring (2ED) 2 Counterspell (2ED) 54 1x Serra Angel [2ED] y secciones con cabeceras de tipo // Sideboard, Sideboard:, Commander:, etc.

```ts
function parseCardsFromDecklist(text: string): CreateCardInput[]
```

### `detectAndParseCards`

- Origen: `packages/mintmox-domain/src/importExport.ts`
- Descripción: Detecta automáticamente si una cadena es JSON, CSV o lista de texto MTG/Arena y la parsea a cartas.

```ts
function detectAndParseCards(content: string): DetectedImportResult
```

### `CardCondition`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`
- Descripción: Gestión de factores de ponderación de precio según el estado de conservación de la carta (Card Condition). Dado que la API pública de Scryfall / Cardmarket proporciona una única cotización base en Euros (habitualmente referenciada a estado Near Mint o tendencia general), MintMox permite ajustar porcentualmente el valor estimado de cada copia según su estado físico real.

```ts
type CardCondition = 'NM' | 'EX' | 'GD' | 'LP' | 'PL' | 'PO'
```

### `ConditionMultipliers`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`

```ts
type ConditionMultipliers = Record<CardCondition, number>
```

### `DEFAULT_CONDITION_MULTIPLIERS`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`
- Descripción: Factores de ponderación estándar de la industria (ManaBox, Cardmarket, TCGplayer). - NM (Near Mint): 100% - EX (Excellent): 90% - GD (Good): 85% - LP (Lightly Played): 80% - PL (Played): 65% - PO (Poor / Damaged): 40%

```ts
const DEFAULT_CONDITION_MULTIPLIERS: ConditionMultipliers
```

### `ConditionDefinition`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`

```ts
interface ConditionDefinition
```

Miembros públicos:
- `code: CardCondition`
- `name: string`
- `nameEn: string`
- `description: string`
- `badgeTone: 'accent' | 'neutral' | 'success' | 'warning' | 'danger'`

### `CONDITION_DEFINITIONS`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`

```ts
const CONDITION_DEFINITIONS: Record<CardCondition, ConditionDefinition>
```

### `ORDERED_CARD_CONDITIONS`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`

```ts
const ORDERED_CARD_CONDITIONS: CardCondition[]
```

### `normalizeCardCondition`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`
- Descripción: Normaliza cualquier variante de texto de estado hacia uno de los códigos canónicos (NM, EX, GD, LP, PL, PO).

```ts
function normalizeCardCondition(condition?: string | null): CardCondition
```

### `getConditionMultiplier`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`
- Descripción: Obtiene el multiplicador decimal aplicable a una condición dada.

```ts
function getConditionMultiplier(condition?: string | null, customMultipliers?: Partial<Record<string, number>>): number
```

### `calculateAdjustedCardPrice`

- Origen: `packages/mintmox-domain/src/conditionMultipliers.ts`
- Descripción: Calcula el precio estimado ajustado por estado de conservación.

```ts
function calculateAdjustedCardPrice(basePrice: number, condition?: string | null, customMultipliers?: Partial<Record<string, number>>, enabled: boolean = true): number
```

## `@framework/react`

### `UseMvcControllerOptions`

- Origen: `packages/react/src/index.ts`

```ts
interface UseMvcControllerOptions<TEvent = ViewEvent>
```

Miembros públicos:
- `autoInit?: boolean`
- `onEvent?: (event: TEvent) => void`

### `useMvcController`

- Origen: `packages/react/src/index.ts`
- Descripción: Patrón: **Adapter Hook (React UI <-> `IController` + `IView`)**. Conecta cualquier componente React (Expo Android o React Web) con cualquier Controlador MVC implementando internamente la interfaz `IView<TState, TEvent>`: - Mantiene sincronizado el último snapshot inmutable `TState` en el ciclo de render de React. - Reenvía eventos efímeros hacia `options.onEvent` usando un `ref` estable para evitar re-suscripciones innecesarias en cada render. - Garantiza limpieza automática (`detach()`) al desmontar o cambiar de controlador.

```ts
function useMvcController<TState, TEvent = ViewEvent>(controller: IController<TState, TEvent>, options: UseMvcControllerOptions<TEvent> = {}): TState
```

### `FrameworkEnvironment`

- Origen: `packages/react/src/index.ts`
- Descripción: Identidad de la aplicación y plataforma actual compartida hacia las vistas.

```ts
interface FrameworkEnvironment
```

Miembros públicos:
- `appId: string`
- `appName: string`
- `platformName: string`

### `FrameworkProviderProps`

- Origen: `packages/react/src/index.ts`

```ts
interface FrameworkProviderProps
```

Miembros públicos:
- `environment: FrameworkEnvironment`
- `children: ReactNode`

### `FrameworkProvider`

- Origen: `packages/react/src/index.ts`
- Descripción: Proveedor de contexto con los metadatos de la app actual (`appId`, `appName`, `platformName`).

```ts
function FrameworkProvider({ environment, children }: FrameworkProviderProps)
```

### `useFrameworkEnvironment`

- Origen: `packages/react/src/index.ts`
- Descripción: Hook de lectura para que cualquier pantalla o componente muestre el nombre/plataforma configurados en el punto de entrada sin duplicar literales.

```ts
function useFrameworkEnvironment(): FrameworkEnvironment
```

## `@framework/server`

### `SERVER_MIGRATIONS`

- Origen: `packages/server/src/schema.ts`
- Descripción: Migraciones base del servidor reutilizable `@framework/server`. Independientes de la app concreta: aíslan los datos por `(app_id, user_id)`. - `_fw_server_entitlements`: almacena el plan (`free` / `pro`) de cada usuario por aplicación. - `_fw_server_records`: almacén universal multi-app y multi-entidad con cursor monotónico `server_seq` para sincronización incremental eficiente.

```ts
const SERVER_MIGRATIONS: SqlMigration[]
```

### `IServerEntitlementProvider`

- Origen: `packages/server/src/schema.ts`
- Descripción: Contrato de autorización comercial (**Patrón Provider / Strategy**). Permite sustituir la tabla SQL local de demostración por validación contra Stripe, RevenueCat o Google Play Billing en producción sin tocar el resto del servidor.

```ts
interface IServerEntitlementProvider
```

Miembros públicos:
- `getEntitlement(appId: string, userId: string): Promise<EntitlementStatus>`
- `setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>`

### `SqlEntitlementProvider`

- Origen: `packages/server/src/schema.ts`
- Descripción: Implementación por defecto de `IServerEntitlementProvider` sobre `ISqlDriver` (libSQL o Turso).

```ts
class SqlEntitlementProvider implements IServerEntitlementProvider
```

Miembros públicos:
- `constructor(private readonly driver: ISqlDriver)`
- `getEntitlement(appId: string, userId: string): Promise<EntitlementStatus>`
- `setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>`

### `CloudSyncService`

- Origen: `packages/server/src/syncService.ts`
- Descripción: Patrón: **Application Service + Strategy (`IConflictResolutionStrategy`)**. Concentra toda la lógica de sincronización multi-dispositivo en la nube, completamente desacoplada del protocolo HTTP: 1. Valida que el usuario tenga plan Pro autorizado para usar almacenamiento en la nube. 2. Ejecuta push + pull dentro de una transacción SQL atómica en `ISqlDriver` (libSQL local o Turso). 3. Aplica `IConflictResolutionStrategy` (por defecto Last-Write-Wins) evitando sobrescribir cambios más recientes provenientes de otro dispositivo. 4. Devuelve cambios posteriores a `sinceCursor`, omitiendo los que este cliente acaba de subir (`acceptedKeys`) para evitar eco innecesario.

```ts
class CloudSyncService
```

Miembros públicos:
- `constructor(private readonly driver: ISqlDriver, private readonly entitlements: IServerEntitlementProvider, private readonly conflictStrategy: IConflictResolutionStrategy = new LastWriteWinsConflictStrategy())`
- `sync(appId: string, request: Partial<SyncPushRequest>): Promise<SyncPullResponse>`
- `listEntities(appId: string, userId: string, entityName: string): Promise<Record<string, unknown>[]>`

### `DEFAULT_MAX_BODY_BYTES`

- Origen: `packages/server/src/router.ts`

```ts
const DEFAULT_MAX_BODY_BYTES
```

### `ServerRouterDependencies`

- Origen: `packages/server/src/router.ts`

```ts
interface ServerRouterDependencies
```

Miembros públicos:
- `driver: ISqlDriver`
- `entitlements: IServerEntitlementProvider`
- `syncService: CloudSyncService`
- `appModules: ReadonlyMap<string, RegisteredAppModule>`
- `corsOrigins: string[]`
- `allowDemoPlanSwitch: boolean`
- `maxBodyBytes?: number`

### `createServerRequestHandler`

- Origen: `packages/server/src/router.ts`
- Descripción: Patrón: **Front Controller + Declarative Route Table + Error Middleware**. Construye el manejador HTTP central del backend reutilizable a partir de una tabla declarativa de rutas, separando el enrutamiento HTTP de la lógica de sincronización (`CloudSyncService`) y de la persistencia (`ISqlDriver`).

```ts
function createServerRequestHandler(deps: ServerRouterDependencies): (req: IncomingMessage, res: ServerResponse) => Promise<void>
```

### `FrameworkServerOptions`

- Origen: `packages/server/src/createServer.ts`

```ts
interface FrameworkServerOptions
```

Miembros públicos:
- `port?: number`
- `host?: string`
- `driver?: ISqlDriver`
- `database?: LibSqlDriverConfig`
- `apps?: RegisteredAppModule[]`
- `entitlementProvider?: IServerEntitlementProvider`
- `conflictStrategy?: IConflictResolutionStrategy`
- `corsOrigins?: string[]`
- `allowDemoPlanSwitch?: boolean`
- `maxBodyBytes?: number`

### `FrameworkServerInstance`

- Origen: `packages/server/src/createServer.ts`
- Descripción: Controlador de ciclo de vida del servidor Node.js reutilizable.

```ts
interface FrameworkServerInstance
```

Miembros públicos:
- `port: number`
- `host: string`
- `url: string`
- `driver: ISqlDriver`
- `start(): Promise<string>`
- `stop(): Promise<void>`
- `handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void>`

### `createFrameworkServer`

- Origen: `packages/server/src/createServer.ts`
- Descripción: Patrón: **Facade + Composition Root** del backend multi-aplicación. Ensambla en un único punto legible: 1. Driver SQL (`ISqlDriver`, local libSQL o Turso mediante configuración). 2. Migraciones base del servidor + migraciones de cada módulo de aplicación registrado. 3. Proveedor de suscripciones (`IServerEntitlementProvider`). 4. Servicio de sincronización incremental (`CloudSyncService` + `IConflictResolutionStrategy`). 5. Enrutador HTTP declarativo (`createServerRequestHandler`).

```ts
async function createFrameworkServer(options: FrameworkServerOptions = {}): Promise<FrameworkServerInstance>
```

## `@framework/ui`

### `ThemeScheme`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Preferencia de esquema visual del usuario o del sistema operativo.

```ts
type ThemeScheme = 'light' | 'dark' | 'crimson' | 'obsidian' | 'system'
```

### `ThemeFontWeight`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Pesos tipográficos semánticos soportados por el Design System.

```ts
type ThemeFontWeight = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold'
```

### `ThemeFontFamilies`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Familias tipográficas cargadas en tiempo de ejecución (por ejemplo, Google Fonts `Inter`). En React Native Android cada archivo `.ttf` representa un peso concreto, por lo que si está definido `fontFamily` se aplica directamente sin colisionar con `fontWeight`.

```ts
interface ThemeFontFamilies
```

Miembros públicos:
- `regular?: string`
- `medium?: string`
- `semibold?: string`
- `bold?: string`
- `extrabold?: string`

### `textTypographyStyle`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Resuelve el estilo tipográfico (`fontFamily` de Google Fonts si fue inyectado por la app, o `fontWeight` nativo de respaldo si se usa el tema por defecto).

```ts
function textTypographyStyle(theme: FrameworkTheme, weight: ThemeFontWeight = 'regular'): TextStyle
```

### `FrameworkTheme`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Contrato de **Design Tokens** compartido por todas las aplicaciones construidas con `@framework/ui`, garantizando idéntica estética, espaciados y jerarquía tipográfica.

```ts
interface FrameworkTheme
```

Miembros públicos:
- `scheme: 'light' | 'dark'`
- `colors: { background: string; surface: string; surfaceElevated: string; surfaceMuted: string; border: string; textPrimary: string; textSecondary: string; textInverse: string; accent: string; accentSoft: string; accentText: string; success: string; successSoft: string; warning: string; warningSoft: string; danger: string; dangerSoft: string; trackInactive: string; }`
- `spacing: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number; }`
- `radius: { sm: number; md: number; lg: number; full: number; }`
- `typography: { titleSize: number; headingSize: number; bodySize: number; captionSize: number; fonts?: ThemeFontFamilies; }`

### `LIGHT_THEME`

- Origen: `packages/ui/src/tokens.ts`

```ts
const LIGHT_THEME: FrameworkTheme
```

### `DARK_THEME`

- Origen: `packages/ui/src/tokens.ts`

```ts
const DARK_THEME: FrameworkTheme
```

### `CRIMSON_THEME`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Tema Carmesí (estilo Todoist / productividad). Enfoque minimalista, limpio y cálido con fondo arena suave y enérgico acento rojo carmesí.

```ts
const CRIMSON_THEME: FrameworkTheme
```

### `OBSIDIAN_THEME`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Tema Obsidiana (estilo Obsidian / concentración profunda). Enfoque ultra oscuro con lienzo carbón profundo, bordes grafito y acentos púrpura/violeta.

```ts
const OBSIDIAN_THEME: FrameworkTheme
```

### `THEME_PRESETS`

- Origen: `packages/ui/src/tokens.ts`
- Descripción: Mapa canónico de temas preconfigurados del framework.

```ts
const THEME_PRESETS: Record<'light' | 'dark' | 'crimson' | 'obsidian', FrameworkTheme>
```

### `IconRenderParams`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Argumentos estandarizados recibidos por el adaptador de iconos inyectado en el tema.

```ts
interface IconRenderParams
```

Miembros públicos:
- `name: string`
- `size: number`
- `color: string`

### `IconRenderer`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Estrategia/Adaptador de renderizado de iconos (**Dependency Inversion Principle**). Permite que `@framework/ui` permanezca desacoplado de `@expo/vector-icons` mientras cada app Expo inyecta su implementación concreta de Google Material Icons.

```ts
type IconRenderer = (params: IconRenderParams) => ReactNode
```

### `FrameworkThemeProviderProps`

- Origen: `packages/ui/src/ThemeProvider.tsx`

```ts
interface FrameworkThemeProviderProps
```

Miembros públicos:
- `preference?: ThemeScheme`
- `onPreferenceChange?: (preference: ThemeScheme) => void`
- `initialPreference?: ThemeScheme`
- `customLightTheme?: FrameworkTheme`
- `customDarkTheme?: FrameworkTheme`
- `customCrimsonTheme?: FrameworkTheme`
- `customObsidianTheme?: FrameworkTheme`
- `fontFamilies?: ThemeFontFamilies`
- `iconRenderer?: IconRenderer`
- `children: ReactNode`

### `FrameworkThemeProvider`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Proveedor de tema del Design System (`LIGHT_THEME`, `DARK_THEME`, `CRIMSON_THEME`, `OBSIDIAN_THEME`). Soporta selección automática según sistema operativo (`preference = 'system'`), temas estilizados de productividad (Carmesí / Obsidiana), cambio dinámico de tema, inyección de fuentes Google (`fontFamilies`) e inyección de renderizador de iconos (`iconRenderer`).

```ts
function FrameworkThemeProvider({ preference: controlledPreference, onPreferenceChange, initialPreference = 'system', customLightTheme = LIGHT_THEME, customDarkTheme = DARK_THEME, customCrimsonTheme = CRIMSON_THEME, customObsidianTheme = OBSIDIAN_THEME, fontFamilies, iconRenderer, children }: FrameworkThemeProviderProps)
```

### `useFrameworkTheme`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Devuelve el tema activo; cae a `LIGHT_THEME` si el componente se usa fuera de un provider.

```ts
function useFrameworkTheme(): FrameworkTheme
```

### `useFrameworkThemeContext`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Devuelve el contexto completo de temas: tema activo, preferencia actual y función reactiva `setPreference` para alternar entre claro, oscuro, carmesí u obsidiana.

```ts
function useFrameworkThemeContext(): { theme: FrameworkTheme; preference: ThemeScheme; setPreference: (preference: ThemeScheme) => void; }
```

### `useFrameworkIconRenderer`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Devuelve el adaptador de iconos configurado en `FrameworkThemeProvider`, si existe.

```ts
function useFrameworkIconRenderer(): IconRenderer | undefined
```

### `GoogleIconSize`

- Origen: `packages/ui/src/components/Icon.tsx`

```ts
type GoogleIconSize = 'sm' | 'md' | 'lg'
```

### `GoogleIconTone`

- Origen: `packages/ui/src/components/Icon.tsx`

```ts
type GoogleIconTone = | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'inverse'
```

### `GoogleIconName`

- Origen: `packages/ui/src/components/Icon.tsx`
- Descripción: Sugerencias de nombres estándar de Google Material Icons usados con más frecuencia (acepta además cualquier nombre válido de https://fonts.google.com/icons).

```ts
type GoogleIconName = | 'dashboard' | 'tune' | 'cloud-queue' | 'cloud-upload' | 'cloud-off' | 'filter-list' | 'add-circle-outline' | 'delete-outline' | 'star' | 'star-outline' | 'palette' | 'link' | 'sync' | 'check-circle' | 'info-outline' | 'warning-amber' | 'settings' | (string & {})
```

### `GoogleIconProps`

- Origen: `packages/ui/src/components/Icon.tsx`

```ts
interface GoogleIconProps
```

Miembros públicos:
- `name: GoogleIconName`
- `size?: GoogleIconSize | number`
- `tone?: GoogleIconTone`
- `color?: string`
- `style?: ViewStyle`

### `GoogleIcon`

- Origen: `packages/ui/src/components/Icon.tsx`
- Descripción: Componente estandarizado de iconos Google (`MaterialIcons`) del Design System. Delega el dibujado real en el `iconRenderer` inyectado por `FrameworkThemeProvider` (patrón **Adapter / Strategy**), evitando que `@framework/ui` dependa directamente de `@expo/vector-icons`.

```ts
function GoogleIcon({ name, size = 'md', tone = 'primary', color, style }: GoogleIconProps)
```

### `Icon`

- Origen: `packages/ui/src/components/Icon.tsx`
- Descripción: Alias corto de `GoogleIcon` para mayor comodidad en vistas.

```ts
const Icon
```

### `IconProps`

- Origen: `packages/ui/src/components/Icon.tsx`

```ts
type IconProps = GoogleIconProps
```

### `ButtonVariant`

- Origen: `packages/ui/src/components/Button.tsx`

```ts
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
```

### `ButtonSize`

- Origen: `packages/ui/src/components/Button.tsx`

```ts
type ButtonSize = 'sm' | 'md' | 'lg'
```

### `ButtonProps`

- Origen: `packages/ui/src/components/Button.tsx`

```ts
interface ButtonProps
```

Miembros públicos:
- `label: string`
- `onPress: () => void`
- `variant?: ButtonVariant`
- `size?: ButtonSize`
- `disabled?: boolean`
- `loading?: boolean`
- `icon?: GoogleIconName`
- `leftSlot?: ReactNode`
- `fullWidth?: boolean`
- `style?: ViewStyle`

### `Button`

- Origen: `packages/ui/src/components/Button.tsx`
- Descripción: Botón estándar del framework sobre primitivas puras de React Native (`Pressable`).

```ts
function Button({ label, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, icon, leftSlot, fullWidth = false, style }: ButtonProps)
```

### `SliderProps`

- Origen: `packages/ui/src/components/Slider.tsx`

```ts
interface SliderProps
```

Miembros públicos:
- `label: string`
- `value: number`
- `min?: number`
- `max?: number`
- `step?: number`
- `unit?: string`
- `disabled?: boolean`
- `onValueChange?: (value: number) => void`
- `onSlidingComplete?: (value: number) => void`

### `Slider`

- Origen: `packages/ui/src/components/Slider.tsx`
- Descripción: Slider propio implementado con primitivas puras de React Native (`View` + `PanResponder`). Al evitar dependencias nativas externas (`@react-native-community/slider`), garantiza: - Estética 100% idéntica en todas las apps del framework. - Cero fricción o roturas de enlazado nativo al actualizar versiones de Expo SDK.

```ts
function Slider({ label, value, min = 0, max = 100, step = 1, unit = '', disabled = false, onValueChange, onSlidingComplete }: SliderProps)
```

### `SwitchToggleProps`

- Origen: `packages/ui/src/components/SwitchToggle.tsx`

```ts
interface SwitchToggleProps
```

Miembros públicos:
- `label: string`
- `description?: string`
- `value: boolean`
- `disabled?: boolean`
- `onValueChange: (next: boolean) => void`

### `SwitchToggle`

- Origen: `packages/ui/src/components/SwitchToggle.tsx`
- Descripción: Interruptor accesible reutilizable implementado sin componentes nativos dependientes de plataforma.

```ts
function SwitchToggle({ label, description, value, disabled = false, onValueChange }: SwitchToggleProps)
```

### `CardProps`

- Origen: `packages/ui/src/components/Card.tsx`

```ts
interface CardProps
```

Miembros públicos:
- `title?: string`
- `subtitle?: string`
- `icon?: GoogleIconName`
- `rightSlot?: ReactNode`
- `children: ReactNode`
- `highlighted?: boolean`
- `style?: ViewStyle`

### `Card`

- Origen: `packages/ui/src/components/Card.tsx`
- Descripción: Tarjeta contenedora estándar con soporte opcional de cabecera, icono, slot derecho y borde destacado.

```ts
function Card({ title, subtitle, icon, rightSlot, children, highlighted = false, style }: CardProps)
```

### `TextFieldProps`

- Origen: `packages/ui/src/components/TextField.tsx`

```ts
interface TextFieldProps
```

Miembros públicos:
- `label: string`
- `value: string`
- `onChangeText: (text: string) => void`
- `placeholder?: string`
- `error?: string`
- `multiline?: boolean`
- `keyboardType?: KeyboardTypeOptions`
- `autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'`

### `TextField`

- Origen: `packages/ui/src/components/TextField.tsx`
- Descripción: Campo de texto estándar del Design System con etiqueta superior y validación visual inline.

```ts
function TextField({ label, value, onChangeText, placeholder, error, multiline = false, keyboardType = 'default', autoCapitalize }: TextFieldProps)
```

### `BadgeTone`

- Origen: `packages/ui/src/components/Badge.tsx`

```ts
type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'
```

### `BadgeProps`

- Origen: `packages/ui/src/components/Badge.tsx`

```ts
interface BadgeProps
```

Miembros públicos:
- `label: string`
- `tone?: BadgeTone`

### `Badge`

- Origen: `packages/ui/src/components/Badge.tsx`
- Descripción: Etiqueta compacta para mostrar estado del plan (`PRO`/`GRATIS`), sincronización o escena activa.

```ts
function Badge({ label, tone = 'neutral' }: BadgeProps)
```

### `SegmentedOption`

- Origen: `packages/ui/src/components/Badge.tsx`

```ts
interface SegmentedOption<T extends string>
```

Miembros públicos:
- `value: T`
- `label: string`

### `SegmentedControlProps`

- Origen: `packages/ui/src/components/Badge.tsx`

```ts
interface SegmentedControlProps<T extends string>
```

Miembros públicos:
- `options: Array<SegmentedOption<T>>`
- `value: T`
- `onChange: (next: T) => void`

### `SegmentedControl`

- Origen: `packages/ui/src/components/Badge.tsx`
- Descripción: Control segmentado reutilizable (p. ej. interruptor Local vs Nube o selector de tema).

```ts
function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>)
```

### `StorageStatusBarProps`

- Origen: `packages/ui/src/components/StorageStatusBar.tsx`

```ts
interface StorageStatusBarProps
```

Miembros públicos:
- `status: StorageStatus`
- `onSyncPress?: () => void`
- `onManagePress?: () => void`

### `StorageStatusBar`

- Origen: `packages/ui/src/components/StorageStatusBar.tsx`
- Descripción: Barra estandarizada de estado Local / Nube compartida por todas las apps del framework. Muestra lenguaje comprensible para el usuario final ("Solo local (Gratis)" vs "Nube Pro activa") ocultando por completo detalles internos de Turso o SQLite.

```ts
function StorageStatusBar({ status, onSyncPress, onManagePress }: StorageStatusBarProps)
```

### `ModalDialogAction`

- Origen: `packages/ui/src/components/AppShell.tsx`

```ts
interface ModalDialogAction
```

Miembros públicos:
- `label: string`
- `variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
- `icon?: GoogleIconName`
- `onPress: () => void`

### `ModalDialogProps`

- Origen: `packages/ui/src/components/AppShell.tsx`

```ts
interface ModalDialogProps
```

Miembros públicos:
- `visible: boolean`
- `title: string`
- `description?: string`
- `confirmLabel?: string`
- `cancelLabel?: string`
- `destructive?: boolean`
- `leftAction?: ModalDialogAction`
- `onConfirm?: () => void`
- `onCancel: () => void`
- `children?: ReactNode`
- `contentMaxHeight?: number`

### `ModalDialog`

- Origen: `packages/ui/src/components/AppShell.tsx`
- Descripción: Diálogo modal reutilizable implementado sobre el `<Modal>` estándar de React Native.

```ts
function ModalDialog({ visible, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, leftAction, onConfirm, onCancel, children, contentMaxHeight = 480 }: ModalDialogProps)
```

### `AppShellTab`

- Origen: `packages/ui/src/components/AppShell.tsx`

```ts
interface AppShellTab<T extends string>
```

Miembros públicos:
- `id: T`
- `label: string`
- `icon?: GoogleIconName`

### `AppShellProps`

- Origen: `packages/ui/src/components/AppShell.tsx`

```ts
interface AppShellProps<T extends string>
```

Miembros públicos:
- `appName: string`
- `subtitle?: string`
- `headerRight?: ReactNode`
- `topBanner?: ReactNode`
- `toastMessage?: string | null`
- `tabs?: Array<AppShellTab<T>>`
- `activeTab?: T`
- `onTabChange?: (tab: T) => void`
- `children: ReactNode`

### `AppShell`

- Origen: `packages/ui/src/components/AppShell.tsx`
- Descripción: Contenedor maestro (**Template / Layout Shell**) que unifica el aspecto visual de todas las aplicaciones creadas con el framework: cabecera fija, banda de notificaciones, cuerpo desplazable y barra inferior de pestañas.

```ts
function AppShell<T extends string>({ appName, subtitle, headerRight, topBanner, toastMessage, tabs, activeTab, onTabChange, children }: AppShellProps<T>)
```

### `ChartSeries`

- Origen: `packages/ui/src/components/SimpleLineChart.tsx`

```ts
interface ChartSeries
```

Miembros públicos:
- `id: string`
- `name: string`
- `color?: string`
- `values: number[]`

### `SimpleLineChartProps`

- Origen: `packages/ui/src/components/SimpleLineChart.tsx`

```ts
interface SimpleLineChartProps
```

Miembros públicos:
- `series: ChartSeries[]`
- `labels: string[]`
- `height?: number`
- `unit?: string`
- `autoScale?: boolean`
- `zeroBaseline?: boolean`
- `showDots?: boolean`
- `showGrid?: boolean`
- `showLegend?: boolean`
- `strokeWidth?: number`
- `timeframeOptions?: Array<{ value: string; label: string }>`
- `activeTimeframe?: string`
- `onTimeframeChange?: (next: string) => void`
- `emptyMessage?: string`

### `SimpleLineChart`

- Origen: `packages/ui/src/components/SimpleLineChart.tsx`
- Descripción: Gráfica de líneas simple y multiserie implementada con primitivas estándar de React Native. Características: - Soporta 1, 2 o más series simultáneas (ej. comparar varias acciones o métricas). - Selector integrado de período temporal (1D, 1S, 1M, 1A). - Leyenda interactiva para mostrar u ocultar series pulsando sobre ellas. - Cursor táctil interactivo (scrubbing) con línea guía y tooltip flotante con fecha y valores. - Cero dependencias nativas externas: funciona de forma idéntica en Expo Android, iOS y Web.

```ts
function SimpleLineChart({ series, labels, height = 190, unit = '', autoScale = true, zeroBaseline = false, showDots = true, showGrid = true, showLegend = true, strokeWidth = 2.5, timeframeOptions, activeTimeframe, onTimeframeChange, emptyMessage = 'Sin datos para graficar' }: SimpleLineChartProps)
```

### `MarkedDateConfig`

- Origen: `packages/ui/src/components/Calendar.tsx`

```ts
interface MarkedDateConfig
```

Miembros públicos:
- `marked?: boolean`
- `dotColor?: string`
- `badge?: string`
- `disabled?: boolean`

### `CalendarProps`

- Origen: `packages/ui/src/components/Calendar.tsx`

```ts
interface CalendarProps
```

Miembros públicos:
- `selectedDate?: string | null`
- `onSelectDate?: (dateString: string) => void`
- `minDate?: string`
- `maxDate?: string`
- `markedDates?: Record<string, MarkedDateConfig>`
- `initialYear?: number`
- `initialMonth?: number`
- `firstDayOfWeek?: 0 | 1`
- `showTodayButton?: boolean`
- `style?: ViewStyle`

### `formatDateIso`

- Origen: `packages/ui/src/components/Calendar.tsx`

```ts
function formatDateIso(year: number, month: number, day: number): string
```

### `parseDateIso`

- Origen: `packages/ui/src/components/Calendar.tsx`

```ts
function parseDateIso(iso: string): { year: number; month: number; day: number } | null
```

### `Calendar`

- Origen: `packages/ui/src/components/Calendar.tsx`
- Descripción: Componente canónico de calendario del framework (`<Calendar />`). Características: - Construido exclusivamente con primitivas estándar de React Native (`View`, `Text`, `Pressable`). - Navegación entre meses con botones accesibles y botón de retorno rápido a "Hoy". - Selección de fecha individual (`YYYY-MM-DD`) con soporte de límites `minDate` y `maxDate`. - Marcadores visuales de eventos (`markedDates`) con puntos de color o badges configurables. - Soporte de semana europea (Lunes a Domingo por defecto) o americana (Domingo a Sábado). - Totalmente adaptado a temas claro y oscuro (`useFrameworkTheme()`).

```ts
function Calendar({ selectedDate, onSelectDate, minDate, maxDate, markedDates = {}, initialYear, initialMonth, firstDayOfWeek = 1, showTodayButton = true, style }: CalendarProps)
```

### `SelectOption`

- Origen: `packages/ui/src/components/Select.tsx`

```ts
interface SelectOption<T = string>
```

Miembros públicos:
- `label: string`
- `value: T`
- `description?: string`
- `badge?: string`

### `SelectProps`

- Origen: `packages/ui/src/components/Select.tsx`

```ts
interface SelectProps<T = string>
```

Miembros públicos:
- `label?: string`
- `placeholder?: string`
- `value?: T | null`
- `options: SelectOption<T>[]`
- `onChange: (value: T) => void`
- `disabled?: boolean`
- `error?: string`
- `searchable?: boolean`
- `searchPlaceholder?: string`
- `modalTitle?: string`
- `style?: ViewStyle`

### `Select`

- Origen: `packages/ui/src/components/Select.tsx`
- Descripción: Componente canónico de selección desplegable (`<Select />`) del Design System. Características: - Construido exclusivamente sobre primitivas puras de React Native (`View`, `Pressable`, `Modal`, `ScrollView`). - Soporta listas grandes con buscador integrado en tiempo real. - Soporta etiquetas descriptivas y badges en cada opción (ideal para colecciones, ediciones, estados). - Totalmente adaptado a temas claro y oscuro (`useFrameworkTheme()`).

```ts
function Select<T = string>({ label, placeholder = 'Selecciona una opción...', value, options, onChange, disabled = false, error, searchable = true, searchPlaceholder = 'Buscar...', modalTitle, style }: SelectProps<T>)
```

### `SearchInputProps`

- Origen: `packages/ui/src/components/SearchInput.tsx`

```ts
interface SearchInputProps
```

Miembros públicos:
- `value: string`
- `onChangeText: (text: string) => void`
- `placeholder?: string`
- `onClear?: () => void`
- `autoFocus?: boolean`
- `style?: ViewStyle`
- `testID?: string`

### `SearchInput`

- Origen: `packages/ui/src/components/SearchInput.tsx`
- Descripción: Campo de búsqueda reutilizable con icono de lupa integrado y botón de limpieza automática. Construido exclusivamente con primitivas estándar de React Native.

```ts
function SearchInput({ value, onChangeText, placeholder = 'Buscar...', onClear, autoFocus = false, style, testID }: SearchInputProps)
```

### `ToggleChipTone`

- Origen: `packages/ui/src/components/ToggleChip.tsx`

```ts
type ToggleChipTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger'
```

### `ToggleChipProps`

- Origen: `packages/ui/src/components/ToggleChip.tsx`

```ts
interface ToggleChipProps
```

Miembros públicos:
- `label: string`
- `selected: boolean`
- `onPress: () => void`
- `icon?: GoogleIconName`
- `tone?: ToggleChipTone`
- `disabled?: boolean`
- `accessibilityLabel?: string`
- `testID?: string`
- `style?: StyleProp<ViewStyle>`

### `ToggleChip`

- Origen: `packages/ui/src/components/ToggleChip.tsx`
- Descripción: Chip interactivo conmutador para filtros, atributos y selecciones múltiples.

```ts
function ToggleChip({ label, selected, onPress, icon, tone = 'accent', disabled = false, accessibilityLabel, testID, style }: ToggleChipProps)
```
