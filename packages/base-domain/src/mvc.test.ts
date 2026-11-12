import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import { InMemoryEntityStoreDriver, MemoryKeyValueStore } from '@framework/data';
import {
  createBaseAppController,
  type BaseAppViewState,
  type IBaseAppController
} from './index.js';

class SpyBaseView implements IView<BaseAppViewState, ViewEvent> {
  readonly states: BaseAppViewState[] = [];
  readonly events: ViewEvent[] = [];

  render(state: BaseAppViewState): void {
    this.states.push(state);
  }

  onEvent(event: ViewEvent): void {
    this.events.push(event);
  }

  get latest(): BaseAppViewState {
    const s = this.states[this.states.length - 1];
    if (!s) throw new Error('No states rendered yet');
    return s;
  }
}

describe('BaseApp MVC domain isolation & contracts', () => {
  it('seeds default items on pristine start and allows creating, updating and selecting items', async () => {
    const controller: IBaseAppController = createBaseAppController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device'
    });
    const view = new SpyBaseView();
    const detach = controller.attachView(view);

    await controller.init();
    expect(view.latest.loading).toBe(false);
    expect(view.latest.items).toHaveLength(2);
    expect(view.latest.selectedItemId).toBe(view.latest.items[0]?.id);

    await controller.createItem({
      title: 'Módulo Nuevo',
      description: 'Prueba de creación',
      level: 80
    });
    expect(view.latest.items).toHaveLength(3);
    const created = view.latest.items.find((i) => i.title === 'Módulo Nuevo');
    expect(created).toBeDefined();
    expect(created?.level).toBe(80);
    expect(view.latest.selectedItemId).toBe(created?.id);
    expect(view.events.some((e) => e.type === 'toast')).toBe(true);

    // Actualiza nivel de slider y estado habilitado
    await controller.updateLevel(created!.id, 45);
    expect(view.latest.items.find((i) => i.id === created!.id)?.level).toBe(45);

    await controller.toggleEnabled(created!.id);
    expect(view.latest.items.find((i) => i.id === created!.id)?.enabled).toBe(false);

    // Filtro de solo activos
    controller.setOnlyEnabledFilter(true);
    expect(view.latest.onlyEnabledFilter).toBe(true);

    // Marcar como principal asegura que solo uno sea principal
    await controller.markAsPrimary(created!.id);
    const primaries = view.latest.items.filter((i) => i.isPrimary);
    expect(primaries).toHaveLength(1);
    expect(primaries[0]?.id).toBe(created!.id);

    // Eliminación
    await controller.deleteItem(created!.id);
    expect(view.latest.items.some((i) => i.id === created!.id)).toBe(false);

    detach();
    controller.dispose();
  });

  it('enforces offline-first storage and triggers upgrade-required when attempting cloud mode on free plan', async () => {
    const controller = createBaseAppController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device'
    });
    const view = new SpyBaseView();
    controller.attachView(view);
    await controller.init();

    expect(view.latest.storage).toMatchObject({
      plan: 'free',
      mode: 'local',
      cloudEnabled: false
    });

    // Intentar activar nube sin plan Pro lanza evento de mejora
    await controller.setStorageMode('cloud');
    expect(view.events.some((e) => e.type === 'upgrade-required')).toBe(true);
    expect(view.latest.storage.cloudEnabled).toBe(false);

    // Activar Pro
    await controller.upgradeToProAndEnableCloud();
    expect(view.latest.storage.plan).toBe('pro');
    expect(view.latest.storage.mode).toBe('cloud');
    expect(view.latest.storage.cloudEnabled).toBe(true);

    // Vuelta a Free
    await controller.downgradeToFree();
    expect(view.latest.storage.plan).toBe('free');
    expect(view.latest.storage.mode).toBe('local');
    expect(view.latest.storage.cloudEnabled).toBe(false);

    controller.dispose();
  });

  it('rejects invalid inputs with validation errors', async () => {
    const controller = createBaseAppController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device'
    });
    const view = new SpyBaseView();
    controller.attachView(view);
    await controller.init();

    await controller.createItem({ title: '   ' });
    expect(view.latest.errorMessage).toContain('vacío');
    expect(view.events.some((e) => e.type === 'error')).toBe(true);

    controller.clearError();
    expect(view.latest.errorMessage).toBeNull();

    controller.dispose();
  });
});
