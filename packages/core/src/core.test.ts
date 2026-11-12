import { describe, expect, it } from 'vitest';
import { BaseController, type IView } from './mvc.js';

interface CounterState {
  count: number;
}

class CounterController extends BaseController<CounterState> {
  constructor() {
    super({ count: 0 });
  }

  async init(): Promise<void> {
    this.markInitialized();
  }

  increment(): void {
    this.setState((prev) => ({ count: prev.count + 1 }));
    this.emitViewEvent({ type: 'toast', message: 'Incrementado' });
  }
}

describe('BaseController MVC view propagation', () => {
  it('pushes state snapshots and view events to multiple attached IView implementations', async () => {
    const controller = new CounterController();
    const viewAStates: number[] = [];
    const viewBStates: number[] = [];
    const events: string[] = [];

    const viewA: IView<CounterState> = {
      render: (state) => viewAStates.push(state.count),
      onEvent: (evt) => events.push(evt.message)
    };
    const viewB: IView<CounterState> = {
      render: (state) => viewBStates.push(state.count)
    };

    const detachA = controller.attachView(viewA);
    const detachB = controller.attachView(viewB);
    await controller.init();

    controller.increment();
    detachA();
    controller.increment();

    expect(viewAStates).toEqual([0, 1]);
    expect(viewBStates).toEqual([0, 1, 2]);
    expect(events).toEqual(['Incrementado']);

    detachB();
    controller.dispose();
  });
});

