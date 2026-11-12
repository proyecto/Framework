/** Modo de almacenamiento elegido por el usuario: solo local o sincronizado en nube. */
export type StorageMode = 'local' | 'cloud';

/** Nivel de plan comercial: `free` (solo local) o `pro` (habilita respaldo multi-dispositivo). */
export type UserPlan = 'free' | 'pro';

/** Estado de sincronización de cada registro en la caché local del dispositivo. */
export type SyncStatus = 'pending' | 'synced';

/** Tipos de valor soportados en parámetros SQL parametrizados de forma portable. */
export type SqlValue = string | number | boolean | null | Uint8Array;

export interface SqlExecuteResult {
  rowsAffected: number;
  lastInsertRowId?: string | number;
}

/**
 * Interfaz de ejecución dentro de una transacción atómica sobre `ISqlDriver`.
 */
export interface ISqlTransaction {
  execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>;
  query<TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<TRow[]>;
}

/**
 * Contrato abstracto de driver SQL (**Patrón Adapter**).
 *
 * Permite intercambiar sin cambiar una línea de lógica de aplicación o backend:
 * - `LibSqlDriver` (`mode: 'local'` con archivo SQLite/libSQL o `mode: 'turso'` remoto).
 * - `ExpoSqliteDriver` (SQLite nativo dentro de apps Android con Expo).
 * - Dobles de prueba en memoria para tests unitarios.
 */
export interface ISqlDriver {
  readonly driverName: string;
  initialize(): Promise<void>;
  execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>;
  query<TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<TRow[]>;
  transaction<T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Migración SQL versionada e idempotente ejecutada por `MigrationRunner`. */
export interface SqlMigration {
  version: number;
  name: string;
  up: string[];
}

/**
 * Abstracción clave-valor ligera (**Patrón Adapter**) para metadatos locales
 * (`mode`, `plan`, cursores de sincronización, timestamps).
 */
export interface IKeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

/**
 * Campos mínimos de auditoría, concurrencia optimista y borrado lógico (tombstone)
 * que debe poseer toda entidad gestionada por un `IRepository`.
 */
export interface EntityBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

/** Snapshot de estado de almacenamiento y sincronización expuesto hacia Modelo y Vistas. */
export interface StorageStatus {
  mode: StorageMode;
  plan: UserPlan;
  cloudEnabled: boolean;
  pendingChanges: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  lastSyncError: string | null;
}

/** Resumen devuelto al completar una ronda de sincronización bidireccional push/pull. */
export interface SyncReport {
  pushed: number;
  pulled: number;
  syncedAt: string;
  mode: StorageMode;
}

/** Estado de autorización de nube confirmado por el servidor según plan del usuario. */
export interface EntitlementStatus {
  appId: string;
  userId: string;
  plan: UserPlan;
  cloudSyncAllowed: boolean;
  updatedAt: string;
}

/** Metadatos mínimos comparables para resolver conflictos de replicación entre dispositivos. */
export interface SyncVersionComparable {
  updatedAt: string;
  version: number;
}

/**
 * Patrón: **Strategy** para resolución de conflictos en sincronización offline-first.
 * Desacopla el criterio de mezcla (`LastWriteWinsConflictStrategy`, etc.) tanto del
 * cliente (`HybridSyncRepository`) como del servidor (`CloudSyncService`).
 */
export interface IConflictResolutionStrategy {
  readonly name: string;
  shouldAcceptIncoming(
    incoming: SyncVersionComparable,
    existing: SyncVersionComparable | null | undefined,
    options?: { acceptEqualVersion?: boolean }
  ): boolean;
}

/**
 * Interfaz **Repository** fundamental entre el Modelo de dominio y los datos.
 *
 * Patrón: **Repository + Dependency Inversion**.
 * Los Modelos y Controladores operan contra este contrato y jamás saben si el dato
 * reside en el dispositivo Android (`expo-sqlite`), en navegador (`localStorage`),
 * en un archivo libSQL local o en Turso remoto.
 */
export interface IRepository<T extends EntityBase> {
  readonly entityName: string;
  list(options?: { includeDeleted?: boolean }): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  remove(id: string): Promise<void>;
}

/**
 * Extensión del Repositorio base con control explícito del interruptor Local/Nube,
 * plan de usuario y suscripción reactiva a cambios del estado de sincronización.
 */
export interface ISyncableRepository<T extends EntityBase> extends IRepository<T> {
  getPendingCount(): Promise<number>;
  getStorageStatus(): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
  subscribeStatus(listener: (status: StorageStatus) => void): () => void;
}

/** Sobre genérico agnóstico de entidad enviado y recibido durante la sincronización incremental. */
export interface SyncRecordEnvelope<TPayload = Record<string, unknown>> {
  entity: string;
  recordId: string;
  payload: TPayload;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
}

/** Petición de push + pull incremental enviada al backend reutilizable. */
export interface SyncPushRequest {
  appId: string;
  userId: string;
  deviceId: string;
  sinceCursor: string | null;
  changes: SyncRecordEnvelope[];
}

/** Respuesta delta del servidor con el nuevo cursor monotónico y cambios de otros dispositivos. */
export interface SyncPullResponse {
  serverCursor: string;
  acceptedCount: number;
  changes: SyncRecordEnvelope[];
}

/**
 * Abstracción de transporte remoto (**Patrón Anti-Corruption / Adapter**).
 * Separa el motor local-first (`HybridSyncRepository`) del protocolo concreto (HTTP, WebSocket o mock).
 */
export interface IRemoteSyncTransport {
  checkEntitlement(appId: string, userId: string): Promise<EntitlementStatus>;
  setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>;
  sync(request: SyncPushRequest): Promise<SyncPullResponse>;
}
