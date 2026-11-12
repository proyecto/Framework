<!-- ARCHIVO GENERADO AUTOMÁTICAMENTE POR scripts/generate-api-docs.mjs -->
<!-- NO EDITAR A MANO: ejecuta `corepack pnpm docs:generate` tras cambiar la API pública -->

# Referencia de API Pública del Framework

Este documento se genera directamente desde el AST de TypeScript y los comentarios JSDoc de todos los paquetes en `packages/*`, garantizando que la documentación nunca quede desincronizada respecto al código fuente.

## Índice de paquetes

- [`@framework/core`](#frameworkcore) (41 símbolos exportados)
- [`@framework/data`](#frameworkdata) (17 símbolos exportados)
- [`@framework/data-libsql`](#frameworkdata-libsql) (4 símbolos exportados)
- [`@framework/example-domain`](#frameworkexample-domain) (15 símbolos exportados)
- [`@framework/expo-adapter`](#frameworkexpo-adapter) (1 símbolos exportados)
- [`@framework/react`](#frameworkreact) (6 símbolos exportados)
- [`@framework/server`](#frameworkserver) (10 símbolos exportados)
- [`@framework/ui`](#frameworkui) (32 símbolos exportados)

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
class PresetModel implements IPresetModel
```

Miembros públicos:
- `constructor(private readonly repository: ISyncableRepository<PresetEntity>)`
- `subscribe(listener: () => void): () => void`
- `getPresetsSnapshot(): PresetEntity[]`
- `loadPresets(): Promise<PresetEntity[]>`
- `createPreset(input: CreatePresetInput): Promise<PresetEntity>`
- `updatePreset(id: string, patch: UpdatePresetInput): Promise<PresetEntity>`
- `deletePreset(id: string): Promise<void>`
- `getStorageStatus(): Promise<StorageStatus>`
- `setPlan(plan: UserPlan): Promise<StorageStatus>`
- `setStorageMode(mode: StorageMode): Promise<StorageStatus>`
- `syncNow(): Promise<SyncReport>`
- `dispose(): void`

### `PresetController`

- Origen: `packages/example-domain/src/PresetController.ts`
- Descripción: Implementación del **Controlador (C)** de FocusScenes (`IPresetController`). Patrones aplicados: - **MVC Mediator**: Coordina `IPresetModel` y propaga snapshots inmutables a cualquier `IView`. - **Observer**: Escucha cambios del Modelo (`model.subscribe`) y mantiene sincronizada la UI. - **Template / Command Wrapper (`executeCommand`)**: Unifica gestión de `busy`, limpieza de errores, refresco del estado y mapeo uniforme de `CloudEntitlementError -> upgrade-required`.

```ts
class PresetController extends BaseController<PresetStudioViewState, ViewEvent> implements IPresetController
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
- `clearError(): void`
- `dispose(): void`

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
type ThemeScheme = 'light' | 'dark' | 'system'
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
- `typography: { titleSize: number; headingSize: number; bodySize: number; captionSize: number; }`

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

### `FrameworkThemeProviderProps`

- Origen: `packages/ui/src/ThemeProvider.tsx`

```ts
interface FrameworkThemeProviderProps
```

Miembros públicos:
- `preference?: ThemeScheme`
- `customLightTheme?: FrameworkTheme`
- `customDarkTheme?: FrameworkTheme`
- `children: ReactNode`

### `FrameworkThemeProvider`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Proveedor de tema del Design System (`LIGHT_THEME` / `DARK_THEME`). Soporta selección automática según sistema operativo (`preference = 'system'`) o forzado explícito.

```ts
function FrameworkThemeProvider({ preference = 'system', customLightTheme = LIGHT_THEME, customDarkTheme = DARK_THEME, children }: FrameworkThemeProviderProps)
```

### `useFrameworkTheme`

- Origen: `packages/ui/src/ThemeProvider.tsx`
- Descripción: Devuelve el tema activo; cae a `LIGHT_THEME` si el componente se usa fuera de un provider.

```ts
function useFrameworkTheme(): FrameworkTheme
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
- `leftSlot?: ReactNode`
- `fullWidth?: boolean`
- `style?: ViewStyle`

### `Button`

- Origen: `packages/ui/src/components/Button.tsx`
- Descripción: Botón estándar del framework sobre primitivas puras de React Native (`Pressable`).

```ts
function Button({ label, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, leftSlot, fullWidth = false, style }: ButtonProps)
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
- `rightSlot?: ReactNode`
- `children: ReactNode`
- `highlighted?: boolean`
- `style?: ViewStyle`

### `Card`

- Origen: `packages/ui/src/components/Card.tsx`
- Descripción: Tarjeta contenedora estándar con soporte opcional de cabecera, slot derecho y borde destacado.

```ts
function Card({ title, subtitle, rightSlot, children, highlighted = false, style }: CardProps)
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

### `TextField`

- Origen: `packages/ui/src/components/TextField.tsx`
- Descripción: Campo de texto estándar del Design System con etiqueta superior y validación visual inline.

```ts
function TextField({ label, value, onChangeText, placeholder, error, multiline = false }: TextFieldProps)
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
- `onConfirm?: () => void`
- `onCancel: () => void`
- `children?: ReactNode`

### `ModalDialog`

- Origen: `packages/ui/src/components/AppShell.tsx`
- Descripción: Diálogo modal reutilizable implementado sobre el `<Modal>` estándar de React Native.

```ts
function ModalDialog({ visible, title, description, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive = false, onConfirm, onCancel, children }: ModalDialogProps)
```

### `AppShellTab`

- Origen: `packages/ui/src/components/AppShell.tsx`

```ts
interface AppShellTab<T extends string>
```

Miembros públicos:
- `id: T`
- `label: string`

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
