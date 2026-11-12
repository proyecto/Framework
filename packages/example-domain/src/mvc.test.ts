import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import {
  HybridSyncRepository,
  InMemoryEntityStoreDriver,
  MemoryKeyValueStore
} from '@framework/data';
import {
  EXAMPLE_APP_ID,
  PRESET_ENTITY_NAME,
  PresetController,
  PresetModel,
  type PresetEntity,
  type PresetStudioViewState
} from './index.js';

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
    const repo = new HybridSyncRepository<PresetEntity>({
      appId: EXAMPLE_APP_ID,
      userId: 'user-1',
      deviceId: 'test-device',
      entityName: PRESET_ENTITY_NAME,
      store: new InMemoryEntityStoreDriver(),
      kv: new MemoryKeyValueStore(),
      defaultMode: 'local',
      defaultPlan: 'free'
    });

    const model = new PresetModel(repo);
    const controller = new PresetController(model);
    const view = new SpyView();

    const detach = controller.attachView(view);
    await controller.init();

    expect(view.latest.loading).toBe(false);
    expect(view.latest.presets.length).toBe(2);
    expect(view.latest.storage.mode).toBe('local');
    expect(view.latest.storage.cloudEnabled).toBe(false);

    // Free user tries enabling cloud mode -> blocked via ViewEvent & CloudEntitlementError
    await controller.setStorageMode('cloud');
    expect(view.latest.storage.mode).toBe('local');
    expect(view.events.some((e) => e.type === 'upgrade-required')).toBe(true);

    // Create + adjust sliders + favorite + delete via strict IController interface
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

