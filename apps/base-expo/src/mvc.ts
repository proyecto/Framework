import {
  BaseController,
  CloudEntitlementError,
  ValidationError,
  getErrorMessage,
  type EntityBase,
  type IConflictResolutionStrategy,
  type IController,
  type IKeyValueStore,
  type IModel,
  type IRemoteSyncTransport,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncReport,
  type UserPlan,
  type ViewEvent
} from '@framework/core';
import {
  HttpSyncTransport,
  HybridSyncRepository,
  type IEntityStoreDriver
} from '@framework/data';

export const BASE_APP_ID = 'base-template';
export const BASE_ENTITY_NAME = 'workspace_items';

/** Entidad genérica mínima de la App Base que hereda auditoría, versión y tombstone. */
export interface BaseWorkspaceItem extends EntityBase {
  title: string;
  description: string;
  level: number;
  enabled: boolean;
  isPrimary: boolean;
}

export interface CreateBaseItemInput {
  title: string;
  description?: string;
  level?: number;
}

/** Snapshot inmutable proyectado hacia cualquier `IView` (Expo Android / Web). */
export interface BaseAppViewState {
  items: BaseWorkspaceItem[];
  selectedItemId: string | null;
  onlyEnabledFilter: boolean;
  loading: boolean;
  busy: boolean;
  errorMessage: string | null;
  storage: StorageStatus;
}

/** Contrato del Modelo (M) de la App Base. */
export interface IBaseAppModel extends IModel {
  getItemsSnapshot(): BaseWorkspaceItem[];
  loadItems(): Promise<BaseWorkspaceItem[]>;
  createItem(input: CreateBaseItemInput): Promise<BaseWorkspaceItem>;
  updateItem(
    id: string,
    patch: Partial<Pick<BaseWorkspaceItem, 'title' | 'description' | 'level' | 'enabled' | 'isPrimary'>>
  ): Promise<BaseWorkspaceItem>;
  deleteItem(id: string): Promise<void>;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
}

/** Contrato del Controlador (C) consumido por la Vista base. */
export interface IBaseAppController extends IController<BaseAppViewState, ViewEvent> {
  selectItem(id: string | null): void;
  setOnlyEnabledFilter(enabledOnly: boolean): void;
  createItem(input: CreateBaseItemInput): Promise<void>;
  updateLevel(id: string, level: number): Promise<void>;
  toggleEnabled(id: string): Promise<void>;
  markAsPrimary(id: string): Promise<void>;
  deleteItem(id: string): Promise<void>;
  upgradeToProAndEnableCloud(): Promise<void>;
  downgradeToFree(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

const DEFAULT_SEED_ITEMS: CreateBaseItemInput[] = [
  {
    title: 'Elemento Base 01',
    description: 'Plantilla estándar dentro de los límites visuales del framework.',
    level: 65
  },
  {
    title: 'Elemento Base 02',
    description: 'Ejemplo secundario para comprobar filtros, selección y estado activo.',
    level: 35
  }
];

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function createPortableId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return `base_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Modelo MVC de la App Base conectado exclusivamente a `ISyncableRepository`. */
export class BaseAppModel implements IBaseAppModel {
  private items: BaseWorkspaceItem[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly unsubStatus: () => void;
  private seededOnce = false;

  constructor(private readonly repository: ISyncableRepository<BaseWorkspaceItem>) {
    this.unsubStatus = this.repository.subscribeStatus(() => {
      this.notify();
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  getItemsSnapshot(): BaseWorkspaceItem[] {
    return [...this.items];
  }

  async loadItems(): Promise<BaseWorkspaceItem[]> {
    let items = await this.repository.list();

    if (!this.seededOnce) {
      const history = await this.repository.list({ includeDeleted: true });
      this.seededOnce = true;
      if (history.length === 0) {
        for (let i = 0; i < DEFAULT_SEED_ITEMS.length; i += 1) {
          const seed = DEFAULT_SEED_ITEMS[i]!;
          const now = new Date().toISOString();
          await this.repository.save({
            id: createPortableId(),
            title: seed.title,
            description: seed.description ?? '',
            level: clampPercent(seed.level ?? 50),
            enabled: i === 0,
            isPrimary: i === 0,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            version: 1
          });
        }
        items = await this.repository.list();
      }
    }

    this.items = items;
    this.notify();
    return this.getItemsSnapshot();
  }

  async createItem(input: CreateBaseItemInput): Promise<BaseWorkspaceItem> {
    const cleanTitle = input.title.trim();
    if (!cleanTitle) {
      throw new ValidationError('El título no puede estar vacío.');
    }

    const now = new Date().toISOString();
    const created = await this.repository.save({
      id: createPortableId(),
      title: cleanTitle,
      description: (input.description ?? '').trim(),
      level: clampPercent(input.level ?? 50),
      enabled: true,
      isPrimary: this.items.length === 0,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });

    await this.loadItems();
    return created;
  }

  async updateItem(
    id: string,
    patch: Partial<Pick<BaseWorkspaceItem, 'title' | 'description' | 'level' | 'enabled' | 'isPrimary'>>
  ): Promise<BaseWorkspaceItem> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('El elemento seleccionado ya no existe.');
    }

    const nextTitle = patch.title !== undefined ? patch.title.trim() : current.title;
    if (!nextTitle) {
      throw new ValidationError('El título no puede quedar vacío.');
    }

    const saved = await this.repository.save({
      ...current,
      title: nextTitle,
      description: patch.description !== undefined ? patch.description.trim() : current.description,
      level: patch.level !== undefined ? clampPercent(patch.level) : current.level,
      enabled: patch.enabled ?? current.enabled,
      isPrimary: patch.isPrimary ?? current.isPrimary
    });

    if (patch.isPrimary === true) {
      const others = (await this.repository.list()).filter((item) => item.id !== id && item.isPrimary);
      for (const other of others) {
        await this.repository.save({ ...other, isPrimary: false });
      }
    }

    await this.loadItems();
    return saved;
  }

  async deleteItem(id: string): Promise<void> {
    await this.repository.remove(id);
    await this.loadItems();
  }

  async getStorageStatus(): Promise<StorageStatus> {
    return this.repository.getStorageStatus();
  }

  async setPlan(plan: UserPlan): Promise<StorageStatus> {
    const status = await this.repository.setPlan(plan);
    this.notify();
    return status;
  }

  async setStorageMode(mode: StorageMode): Promise<StorageStatus> {
    const status = await this.repository.setStorageMode(mode);
    await this.loadItems();
    return status;
  }

  async syncNow(): Promise<SyncReport> {
    const report = await this.repository.syncNow();
    await this.loadItems();
    return report;
  }

  dispose(): void {
    this.unsubStatus();
    this.listeners.clear();
  }
}

const INITIAL_VIEW_STATE: BaseAppViewState = {
  items: [],
  selectedItemId: null,
  onlyEnabledFilter: false,
  loading: true,
  busy: false,
  errorMessage: null,
  storage: {
    mode: 'local',
    plan: 'free',
    cloudEnabled: false,
    pendingChanges: 0,
    lastSyncedAt: null,
    isSyncing: false,
    lastSyncError: null
  }
};

/** Controlador MVC de referencia para la App Base. */
export class BaseAppController
  extends BaseController<BaseAppViewState, ViewEvent>
  implements IBaseAppController
{
  private readonly unsubModel: () => void;

  constructor(private readonly model: IBaseAppModel) {
    super(INITIAL_VIEW_STATE);
    this.unsubModel = this.model.subscribe(() => {
      void this.syncFromModel();
    });
  }

  private async syncFromModel(): Promise<void> {
    if (this.isDisposed()) return;
    const items = this.model.getItemsSnapshot();
    const storage = await this.model.getStorageStatus();
    const prev = this.getState();
    const stillSelected = items.some((item) => item.id === prev.selectedItemId);
    this.setState({
      items,
      storage,
      selectedItemId: stillSelected ? prev.selectedItemId : items[0]?.id ?? null
    });
  }

  private async executeCommand<T>(
    options: {
      trackBusy?: boolean;
      emitErrorEvent?: boolean;
      onSuccess?: (result: T) => ViewEvent | void;
    },
    task: () => Promise<T>
  ): Promise<T | undefined> {
    const trackBusy = options.trackBusy ?? true;
    const emitErrorEvent = options.emitErrorEvent ?? true;
    this.setState(trackBusy ? { busy: true, errorMessage: null } : { errorMessage: null });

    try {
      const result = await task();
      await this.syncFromModel();
      if (trackBusy) this.setState({ busy: false });
      const event = options.onSuccess?.(result);
      if (event) this.emitViewEvent(event);
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState(trackBusy ? { busy: false, errorMessage: message } : { errorMessage: message });
      if (emitErrorEvent) {
        if (error instanceof CloudEntitlementError) {
          this.emitViewEvent({ type: 'upgrade-required', message });
        } else {
          this.emitViewEvent({ type: 'error', message });
        }
      }
      return undefined;
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized()) {
      await this.syncFromModel();
      return;
    }
    this.setState({ loading: true, errorMessage: null });
    try {
      const [items, storage] = await Promise.all([
        this.model.loadItems(),
        this.model.getStorageStatus()
      ]);
      this.markInitialized();
      this.setState({
        items,
        storage,
        selectedItemId: items[0]?.id ?? null,
        loading: false
      });
    } catch (error) {
      this.setState({ loading: false, errorMessage: getErrorMessage(error) });
    }
  }

  selectItem(id: string | null): void {
    this.setState({ selectedItemId: id });
  }

  setOnlyEnabledFilter(enabledOnly: boolean): void {
    this.setState({ onlyEnabledFilter: enabledOnly });
  }

  async createItem(input: CreateBaseItemInput): Promise<void> {
    const created = await this.executeCommand(
      { onSuccess: (item) => ({ type: 'toast', message: `"${item.title}" guardado.` }) },
      () => this.model.createItem(input)
    );
    if (created) {
      this.setState({ selectedItemId: created.id });
    }
  }

  async updateLevel(id: string, level: number): Promise<void> {
    await this.executeCommand({ trackBusy: false }, async () => {
      await this.model.updateItem(id, { level });
    });
  }

  async toggleEnabled(id: string): Promise<void> {
    const target = this.getState().items.find((item) => item.id === id);
    if (!target) return;
    await this.executeCommand({ trackBusy: false, emitErrorEvent: false }, async () => {
      await this.model.updateItem(id, { enabled: !target.enabled });
    });
  }

  async markAsPrimary(id: string): Promise<void> {
    await this.executeCommand(
      {
        trackBusy: false,
        emitErrorEvent: false,
        onSuccess: (updated) => ({ type: 'toast', message: `Elemento principal: ${updated.title}` })
      },
      () => this.model.updateItem(id, { isPrimary: true })
    );
  }

  async deleteItem(id: string): Promise<void> {
    await this.executeCommand(
      {
        emitErrorEvent: false,
        onSuccess: () => ({ type: 'toast', message: 'Elemento eliminado.' })
      },
      () => this.model.deleteItem(id)
    );
  }

  async upgradeToProAndEnableCloud(): Promise<void> {
    await this.executeCommand(
      {
        onSuccess: () => ({
          type: 'sync-complete',
          message: 'Plan Pro activado y copia en la nube sincronizada.'
        })
      },
      async () => {
        await this.model.setPlan('pro');
        await this.model.setStorageMode('cloud');
      }
    );
  }

  async downgradeToFree(): Promise<void> {
    await this.executeCommand(
      {
        emitErrorEvent: false,
        onSuccess: () => ({
          type: 'toast',
          message: 'Plan gratuito activo: datos guardados únicamente en este dispositivo.'
        })
      },
      async () => {
        await this.model.setPlan('free');
      }
    );
  }

  async setStorageMode(mode: StorageMode): Promise<void> {
    await this.executeCommand(
      {
        onSuccess: () => ({
          type: mode === 'cloud' ? 'sync-complete' : 'toast',
          message:
            mode === 'cloud'
              ? 'Sincronización en la nube activada.'
              : 'Modo local activado: tus datos permanecen solo en el dispositivo.'
        })
      },
      async () => {
        await this.model.setStorageMode(mode);
      }
    );
  }

  async syncNow(): Promise<void> {
    await this.executeCommand(
      {
        onSuccess: (report) => ({
          type: 'sync-complete',
          message: `Nube actualizada (subidos: ${report.pushed}, descargados: ${report.pulled}).`
        })
      },
      () => this.model.syncNow()
    );
  }

  clearError(): void {
    this.setState({ errorMessage: null });
  }

  override dispose(): void {
    this.unsubModel();
    this.model.dispose?.();
    super.dispose();
  }
}

export interface CreateBaseAppControllerOptions {
  store: IEntityStoreDriver;
  kv: IKeyValueStore;
  deviceId: string;
  userId?: string;
  apiBaseUrl?: string;
  transport?: IRemoteSyncTransport;
  conflictStrategy?: IConflictResolutionStrategy;
}

/** Factoría compartida de la App Base para cualquier plataforma cliente. */
export function createBaseAppController(
  options: CreateBaseAppControllerOptions
): IBaseAppController {
  const transport =
    options.transport ??
    (options.apiBaseUrl ? new HttpSyncTransport({ baseUrl: options.apiBaseUrl }) : undefined);

  const repository = new HybridSyncRepository<BaseWorkspaceItem>({
    appId: BASE_APP_ID,
    userId: options.userId ?? 'base-user',
    deviceId: options.deviceId,
    entityName: BASE_ENTITY_NAME,
    store: options.store,
    kv: options.kv,
    transport,
    conflictStrategy: options.conflictStrategy,
    defaultMode: 'local',
    defaultPlan: 'free'
  });

  return new BaseAppController(new BaseAppModel(repository));
}

