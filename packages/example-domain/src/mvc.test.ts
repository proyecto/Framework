import { describe, expect, it } from 'vitest';
import { ValidationError, type IView, type ViewEvent } from '@framework/core';
import {
  HybridSyncRepository,
  InMemoryEntityStoreDriver,
  MemoryKeyValueStore
} from '@framework/data';
import {
  EXAMPLE_APP_ID,
  PRESET_ENTITY_NAME,
  PRESET_LIMITS,
  PresetModel,
  createPresetStudioController,
  type PresetEntity,
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

  it('enforces PresetModel invariants: validation, slider clamping, unique active & tombstone seeding', async () => {
    const store = new InMemoryEntityStoreDriver();
    const kv = new MemoryKeyValueStore();
    const repo = new HybridSyncRepository<PresetEntity>({
      appId: EXAMPLE_APP_ID,
      userId: 'user-invariants',
      deviceId: 'dev-invariants',
      entityName: PRESET_ENTITY_NAME,
      store,
      kv
    });

    const model = new PresetModel(repo);
    const seeded = await model.loadPresets();
    expect(seeded).toHaveLength(2);
    expect(seeded.filter((item) => item.isActive)).toHaveLength(1);

    // Nombre vacío o solo espacios lanza ValidationError
    await expect(model.createPreset({ name: '   ' })).rejects.toThrow(ValidationError);

    // Valores fuera de rango se ajustan automáticamente a PRESET_LIMITS
    const clamped = await model.createPreset({
      name: 'Clamped',
      ambientLevel: 999,
      warmthLevel: -20,
      focusMinutes: 1
    });
    expect(clamped.ambientLevel).toBe(PRESET_LIMITS.ambientLevel.max);
    expect(clamped.warmthLevel).toBe(PRESET_LIMITS.warmthLevel.min);
    expect(clamped.focusMinutes).toBe(PRESET_LIMITS.focusMinutes.min);

    // Activar una escena desactiva las demás (regla de exclusividad)
    await model.updatePreset(clamped.id, { isActive: true });
    const activeItems = model.getPresetsSnapshot().filter((item) => item.isActive);
    expect(activeItems).toHaveLength(1);
    expect(activeItems[0]?.id).toBe(clamped.id);

    // Actualizar una escena inexistente lanza ValidationError
    await expect(model.updatePreset('missing-id', { name: 'X' })).rejects.toThrow(ValidationError);

    // Borrar todas las escenas deja tombstones: al crear un nuevo PresetModel no debe re-sembrar
    for (const item of model.getPresetsSnapshot()) {
      await model.deletePreset(item.id);
    }
    model.dispose();

    const freshModel = new PresetModel(repo);
    const reloaded = await freshModel.loadPresets();
    expect(reloaded).toHaveLength(0);
    freshModel.dispose();
  });

  it('handles validation errors gracefully in PresetController and resets busy state', async () => {
    const controller = createPresetStudioController({
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      deviceId: 'ctrl-device',
      userId: 'ctrl-user'
    });
    const view = new SpyView();
    controller.attachView(view);
    await controller.init();

    await controller.createPreset({ name: '   ' });
    expect(view.latest.busy).toBe(false);
    expect(view.latest.errorMessage).toMatch(/vacío/i);
    expect(view.events.some((event) => event.type === 'error')).toBe(true);

    controller.clearError();
    expect(view.latest.errorMessage).toBeNull();
    controller.dispose();
  });
});
