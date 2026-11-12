export type StorageMode = 'local' | 'cloud';
export type UserPlan = 'free' | 'pro';
export type SyncStatus = 'pending' | 'synced';

export type SqlValue = string | number | boolean | null | Uint8Array;

export interface SqlExecuteResult {
  rowsAffected: number;
  lastInsertRowId?: string | number;
}

export interface ISqlTransaction {
  execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>;
  query<TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<TRow[]>;
}

/**
 * Abstract SQL driver contract.
 * Implemented identically by:
 * - NodeLibSqlDriver (local file OR remote Turso)
 * - ExpoSqliteDriver (on-device SQLite in Android Expo)
 * - WebLocalSqlDriver (browser local persistence)
 * - InMemorySqlDriver (testing)
 */
export interface ISqlDriver {
  readonly driverName: string;
  initialize(): Promise<void>;
  execute(sql: string, params?: SqlValue[]): Promise<SqlExecuteResult>;
  query<TRow = Record<string, unknown>>(sql: string, params?: SqlValue[]): Promise<TRow[]>;
  transaction<T>(fn: (tx: ISqlTransaction) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface SqlMigration {
  version: number;
  name: string;
  up: string[];
}

export interface IKeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface EntityBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
}

export interface StorageStatus {
  mode: StorageMode;
  plan: UserPlan;
  cloudEnabled: boolean;
  pendingChanges: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  lastSyncError: string | null;
}

export interface SyncReport {
  pushed: number;
  pulled: number;
  syncedAt: string;
  mode: StorageMode;
}

export interface EntitlementStatus {
  appId: string;
  userId: string;
  plan: UserPlan;
  cloudSyncAllowed: boolean;
  updatedAt: string;
}

export interface IEntitlementService {
  getStatus(): Promise<EntitlementStatus>;
  setPlan(plan: UserPlan): Promise<EntitlementStatus>;
}

/**
 * Core Model-to-Data interface.
 * Models and Controllers never know whether data resides locally on-device,
 * in a local libSQL file, or remotely in Turso.
 */
export interface IRepository<T extends EntityBase> {
  readonly entityName: string;
  list(options?: { includeDeleted?: boolean }): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  remove(id: string): Promise<void>;
}

export interface ISyncableRepository<T extends EntityBase> extends IRepository<T> {
  getPendingCount(): Promise<number>;
  getStorageStatus(): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
  subscribeStatus(listener: (status: StorageStatus) => void): () => void;
}

export interface SyncRecordEnvelope<TPayload = Record<string, unknown>> {
  entity: string;
  recordId: string;
  payload: TPayload;
  version: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SyncPushRequest {
  appId: string;
  userId: string;
  deviceId: string;
  sinceCursor: string | null;
  changes: SyncRecordEnvelope[];
}

export interface SyncPullResponse {
  serverCursor: string;
  acceptedCount: number;
  changes: SyncRecordEnvelope[];
}

export interface IRemoteSyncTransport {
  checkEntitlement(appId: string, userId: string): Promise<EntitlementStatus>;
  setEntitlement(appId: string, userId: string, plan: UserPlan): Promise<EntitlementStatus>;
  sync(request: SyncPushRequest): Promise<SyncPullResponse>;
}

