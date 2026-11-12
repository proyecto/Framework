import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import {
  InMemoryEntityStoreDriver,
  MemoryKeyValueStore
} from '@framework/data';
import {
  createPresetStudioController,
  type PresetStudioViewState
} from './index.js';

/**
 * Vista espía de prueba que implementa `IView<PresetStudioViewState>` sin UI gráfica,
 * demostrando que el Modelo y el Controlador funcionan en total aislamiento.
 */
class SpyView implements IView<PresetStudioViewState, ViewEvent> {
  readonly renders: PresetStudioViewState[] = [];
  readonly events: ViewEvent[] = [];

  render(state: PresetStudioViewState): void {
    this.renders.push(state);
  }

  onEvent(event: ViewEvent): void {
    this.events.push(event);
  }

  get latest(): PresetStudioViewState {
    const item = this.renders[this.renders.length - 1];
    if (!item) throw new Error('No renders captured yet');
    return item;
  }
}

describe('Strict MVC separation (Model <-> Controller <-> IView)', () => {
  it('runs completely offline in free local mode and enforces cloud entitlement', async () => {
    const controller = createPresetStudioController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'test-device',
      userId: 'user-1'
    });
    const view = new SpyView();

    const detach = controller.attachView(view);
    await controller.init();

    expect(view.latest.loading).toBe(false);
    expect(view.latest.presets.length).toBe(2);
    expect(view.latest.storage.mode).toBe('local');
    expect(view.latest.storage.cloudEnabled).toBe(false);

    // Usuario gratuito intenta activar la nube -> bloqueado vía ViewEvent & CloudEntitlementError
    await controller.setStorageMode('cloud');
    expect(view.latest.storage.mode).toBe('local');
    expect(view.events.some((e) => e.type === 'upgrade-required')).toBe(true);

    // Crear + ajustar sliders + marcar favorito + borrar mediante interfaz IController
    await controller.createPreset({ name: 'Estudio Tarde', ambientLevel: 40 });
    const created = view.latest.presets.find((p) => p.name === 'Estudio Tarde');
    expect(created).toBeDefined();

    await controller.updateSlider(created!.id, 'ambientLevel', 85);
    await controller.updateSlider(created!.id, 'focusMinutes', 90);
    await controller.toggleFavorite(created!.id);

    const updated = view.latest.presets.find((p) => p.id === created!.id);
    expect(updated?.ambientLevel).toBe(85);
    expect(updated?.focusMinutes).toBe(90);
    expect(updated?.isFavorite).toBe(true);

    await controller.deletePreset(created!.id);
    expect(view.latest.presets.some((p) => p.id === created!.id)).toBe(false);

    detach();
    controller.dispose();
  });
});
