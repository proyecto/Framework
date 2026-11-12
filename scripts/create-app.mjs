#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const result = {};
  for (const arg of argv) {
    if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg.startsWith('--')) {
      const [rawKey, ...rest] = arg.slice(2).split('=');
      result[rawKey] = rest.join('=');
    }
  }
  return result;
}

function toPascalCase(slug) {
  return slug
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const opts = parseArgs(process.argv.slice(2));
const rawName = (opts.name ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

if (!rawName) {
  console.error(
    'Uso: node scripts/create-app.mjs --name=<slug> [--title="Mi App"] [--entity=item] [--dry-run]'
  );
  process.exit(1);
}

const pascal = toPascalCase(rawName);
const entityPascal = toPascalCase(opts.entity ?? 'Item');
const entityName = (opts.entity ?? 'item').toLowerCase().replace(/[^a-z0-9_]/g, '_');
const appTitle = opts.title ?? pascal;
const pkgDirName = `${rawName}-domain`;
const pkgName = `@framework/${pkgDirName}`;
const targetDir = path.resolve(process.cwd(), 'packages', pkgDirName);

if (!opts.dryRun && fs.existsSync(targetDir)) {
  console.error(`❌ El paquete ya existe en packages/${pkgDirName}.`);
  process.exit(1);
}

const files = {
  'package.json': JSON.stringify(
    {
      name: pkgName,
      version: '0.1.0',
      private: true,
      description: `Dominio MVC de la aplicación ${appTitle}.`,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          default: './dist/index.js'
        }
      },
      scripts: {
        build: 'tsc -p tsconfig.build.json',
        typecheck: 'tsc --noEmit',
        test: 'vitest run'
      },
      dependencies: {
        '@framework/core': 'workspace:*',
        '@framework/data': 'workspace:*'
      },
      devDependencies: {
        typescript: 'catalog:',
        vitest: 'catalog:'
      }
    },
    null,
    2
  ) + '\n',

  'tsconfig.json': JSON.stringify(
    {
      extends: '../../tsconfig.base.json',
      compilerOptions: {
        rootDir: 'src',
        outDir: 'dist',
        lib: ['ES2022']
      },
      include: ['src/**/*']
    },
    null,
    2
  ) + '\n',

  'tsconfig.build.json': JSON.stringify(
    {
      extends: './tsconfig.json',
      exclude: ['src/**/*.test.ts']
    },
    null,
    2
  ) + '\n',

  'vitest.config.ts': `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node'
  }
});
`,

  'src/contracts.ts': `import type {
  EntityBase,
  IController,
  IModel,
  RegisteredAppModule,
  StorageMode,
  StorageStatus,
  SyncReport,
  UserPlan,
  ViewEvent
} from '@framework/core';

export const APP_ID = '${rawName}';
export const ENTITY_NAME = '${entityName}';

/** Entidad persistente de ${appTitle}. */
export interface ${entityPascal}Entity extends EntityBase {
  title: string;
  intensity: number;
  isFavorite: boolean;
}

export interface Create${entityPascal}Input {
  title: string;
  intensity?: number;
}

/** Estado inmutable proyectado hacia cualquier IView (Expo Android, Web, CLI, Tests). */
export interface ${pascal}ViewState {
  items: ${entityPascal}Entity[];
  loading: boolean;
  busy: boolean;
  errorMessage: string | null;
  storage: StorageStatus;
}

/** Contrato del Modelo (M). */
export interface I${pascal}Model extends IModel {
  getSnapshot(): ${entityPascal}Entity[];
  loadItems(): Promise<${entityPascal}Entity[]>;
  createItem(input: Create${entityPascal}Input): Promise<${entityPascal}Entity>;
  updateIntensity(id: string, intensity: number): Promise<${entityPascal}Entity>;
  deleteItem(id: string): Promise<void>;
  getStorageStatus(): Promise<StorageStatus>;
  setPlan(plan: UserPlan): Promise<StorageStatus>;
  setStorageMode(mode: StorageMode): Promise<StorageStatus>;
  syncNow(): Promise<SyncReport>;
}

/** Contrato del Controlador (C). */
export interface I${pascal}Controller extends IController<${pascal}ViewState, ViewEvent> {
  createItem(input: Create${entityPascal}Input): Promise<void>;
  updateIntensity(id: string, intensity: number): Promise<void>;
  deleteItem(id: string): Promise<void>;
  upgradeToProAndEnableCloud(): Promise<void>;
  setStorageMode(mode: StorageMode): Promise<void>;
  syncNow(): Promise<void>;
  clearError(): void;
}

/** Módulo enchufable al backend reutilizable \`@framework/server\`. */
export const SERVER_MODULE: RegisteredAppModule = {
  appId: APP_ID
};
`,

  [`src/${pascal}Model.ts`]: `import {
  ValidationError,
  type ISyncableRepository,
  type StorageMode,
  type StorageStatus,
  type SyncReport,
  type UserPlan
} from '@framework/core';
import type {
  Create${entityPascal}Input,
  ${entityPascal}Entity,
  I${pascal}Model
} from './contracts.js';

function clampIntensity(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function generateId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return \`${entityName}_\${Date.now()}_\${Math.random().toString(36).slice(2, 10)}\`;
}

/** Modelo MVC de ${appTitle}. */
export class ${pascal}Model implements I${pascal}Model {
  private items: ${entityPascal}Entity[] = [];
  private readonly listeners = new Set<() => void>();
  private readonly unsubRepo: () => void;

  constructor(private readonly repository: ISyncableRepository<${entityPascal}Entity>) {
    this.unsubRepo = this.repository.subscribeStatus(() => {
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

  getSnapshot(): ${entityPascal}Entity[] {
    return [...this.items];
  }

  async loadItems(): Promise<${entityPascal}Entity[]> {
    this.items = await this.repository.list();
    this.notify();
    return this.getSnapshot();
  }

  async createItem(input: Create${entityPascal}Input): Promise<${entityPascal}Entity> {
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError('El título no puede estar vacío.');
    }
    const now = new Date().toISOString();
    const created = await this.repository.save({
      id: generateId(),
      title,
      intensity: clampIntensity(input.intensity ?? 50),
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1
    });
    await this.loadItems();
    return created;
  }

  async updateIntensity(id: string, intensity: number): Promise<${entityPascal}Entity> {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new ValidationError('El elemento seleccionado ya no existe.');
    }
    const saved = await this.repository.save({
      ...current,
      intensity: clampIntensity(intensity)
    });
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
    this.unsubRepo();
    this.listeners.clear();
  }
}
`,

  [`src/${pascal}Controller.ts`]: `import {
  BaseController,
  CloudEntitlementError,
  getErrorMessage,
  type StorageMode,
  type ViewEvent
} from '@framework/core';
import type {
  Create${entityPascal}Input,
  I${pascal}Controller,
  I${pascal}Model,
  ${pascal}ViewState
} from './contracts.js';

const INITIAL_STATE: ${pascal}ViewState = {
  items: [],
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

/** Controlador MVC de ${appTitle}. */
export class ${pascal}Controller
  extends BaseController<${pascal}ViewState, ViewEvent>
  implements I${pascal}Controller
{
  private readonly unsubModel: () => void;

  constructor(private readonly model: I${pascal}Model) {
    super(INITIAL_STATE);
    this.unsubModel = this.model.subscribe(() => {
      void this.syncStateFromModel();
    });
  }

  private async syncStateFromModel(): Promise<void> {
    if (this.isDisposed()) return;
    const [items, storage] = [this.model.getSnapshot(), await this.model.getStorageStatus()];
    this.setState({ items, storage });
  }

  private async executeCommand(
    trackBusy: boolean,
    task: () => Promise<void>
  ): Promise<void> {
    this.setState(trackBusy ? { busy: true, errorMessage: null } : { errorMessage: null });
    try {
      await task();
      await this.syncStateFromModel();
      if (trackBusy) this.setState({ busy: false });
    } catch (error) {
      const message = getErrorMessage(error);
      this.setState(trackBusy ? { busy: false, errorMessage: message } : { errorMessage: message });
      if (error instanceof CloudEntitlementError) {
        this.emitViewEvent({ type: 'upgrade-required', message });
      } else {
        this.emitViewEvent({ type: 'error', message });
      }
    }
  }

  async init(): Promise<void> {
    if (this.isInitialized()) {
      await this.syncStateFromModel();
      return;
    }
    this.setState({ loading: true, errorMessage: null });
    try {
      const [items, storage] = await Promise.all([
        this.model.loadItems(),
        this.model.getStorageStatus()
      ]);
      this.markInitialized();
      this.setState({ items, storage, loading: false });
    } catch (error) {
      this.setState({ loading: false, errorMessage: getErrorMessage(error) });
    }
  }

  async createItem(input: Create${entityPascal}Input): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.createItem(input);
    });
  }

  async updateIntensity(id: string, intensity: number): Promise<void> {
    await this.executeCommand(false, async () => {
      await this.model.updateIntensity(id, intensity);
    });
  }

  async deleteItem(id: string): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.deleteItem(id);
    });
  }

  async upgradeToProAndEnableCloud(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.setPlan('pro');
      await this.model.setStorageMode('cloud');
    });
  }

  async setStorageMode(mode: StorageMode): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.setStorageMode(mode);
    });
  }

  async syncNow(): Promise<void> {
    await this.executeCommand(true, async () => {
      await this.model.syncNow();
    });
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
`,

  'src/factory.ts': `import type {
  IKeyValueStore,
  IRemoteSyncTransport
} from '@framework/core';
import {
  HybridSyncRepository,
  type IEntityStoreDriver
} from '@framework/data';
import { APP_ID, ENTITY_NAME, type ${entityPascal}Entity } from './contracts.js';
import { ${pascal}Controller } from './${pascal}Controller.js';
import { ${pascal}Model } from './${pascal}Model.js';

export interface Create${pascal}ControllerOptions {
  store: IEntityStoreDriver;
  kv: IKeyValueStore;
  deviceId: string;
  userId?: string;
  transport?: IRemoteSyncTransport;
}

/** Factoría compartida multiplataforma (Android Expo + Web + Tests). */
export function create${pascal}Controller(
  options: Create${pascal}ControllerOptions
): ${pascal}Controller {
  const repository = new HybridSyncRepository<${entityPascal}Entity>({
    appId: APP_ID,
    userId: options.userId ?? 'default-user',
    deviceId: options.deviceId,
    entityName: ENTITY_NAME,
    store: options.store,
    kv: options.kv,
    transport: options.transport,
    defaultMode: 'local',
    defaultPlan: 'free'
  });
  return new ${pascal}Controller(new ${pascal}Model(repository));
}
`,

  'src/index.ts': `export * from './contracts.js';
export * from './${pascal}Model.js';
export * from './${pascal}Controller.js';
export * from './factory.js';
`,

  'src/mvc.test.ts': `import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import { InMemoryEntityStoreDriver, MemoryKeyValueStore } from '@framework/data';
import { create${pascal}Controller, type ${pascal}ViewState } from './index.js';

class SpyView implements IView<${pascal}ViewState, ViewEvent> {
  readonly renders: ${pascal}ViewState[] = [];
  readonly events: ViewEvent[] = [];
  render(state: ${pascal}ViewState): void {
    this.renders.push(state);
  }
  onEvent(event: ViewEvent): void {
    this.events.push(event);
  }
  get latest(): ${pascal}ViewState {
    const item = this.renders[this.renders.length - 1];
    if (!item) throw new Error('No renders captured yet');
    return item;
  }
}

describe('${pascal} MVC isolation', () => {
  it('supports offline local storage and blocks cloud mode on free plan', async () => {
    const controller = create${pascal}Controller({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    await controller.createItem({ title: 'Prueba inicial', intensity: 75 });
    expect(view.latest.items).toHaveLength(1);
    expect(view.latest.items[0]?.intensity).toBe(75);

    await controller.setStorageMode('cloud');
    expect(view.events.some((e) => e.type === 'upgrade-required')).toBe(true);

    controller.dispose();
  });
});
`
};

if (opts.dryRun) {
  console.log(`[dry-run] Se crearía el paquete ${pkgName} en packages/${pkgDirName}:`);
  for (const rel of Object.keys(files)) {
    console.log(`  - packages/${pkgDirName}/${rel}`);
  }
  process.exit(0);
}

for (const [relPath, content] of Object.entries(files)) {
  const dest = path.join(targetDir, relPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

console.log(`✅ Nueva aplicación "${appTitle}" creada en packages/${pkgDirName} (${pkgName}).`);
console.log('Siguientes pasos:');
console.log('  1. corepack pnpm install');
console.log(`  2. corepack pnpm --filter ${pkgName} build && corepack pnpm --filter ${pkgName} test`);
console.log('  3. Registra SERVER_MODULE en apps/demo-backend si necesita endpoints cloud.');
