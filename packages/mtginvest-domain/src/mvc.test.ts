import { describe, expect, it } from 'vitest';
import type { IView, ViewEvent } from '@framework/core';
import { InMemoryEntityStoreDriver, MemoryKeyValueStore } from '@framework/data';
import { createMtginvestController, type MtginvestViewState } from './index.js';

class SpyView implements IView<MtginvestViewState, ViewEvent> {
  readonly renders: MtginvestViewState[] = [];
  readonly events: ViewEvent[] = [];
  render(state: MtginvestViewState): void {
    this.renders.push(state);
  }
  onEvent(event: ViewEvent): void {
    this.events.push(event);
  }
  get latest(): MtginvestViewState {
    const item = this.renders[this.renders.length - 1];
    if (!item) throw new Error('No renders captured yet');
    return item;
  }
}

describe('Mtginvest MVC isolation', () => {
  it('supports offline local storage and blocks cloud mode on free plan', async () => {
    const controller = createMtginvestController({
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
