import { describe, expect, it } from 'vitest';
import { CloudEntitlementError, ValidationError } from './errors.js';
import { BaseController, type IView } from './mvc.js';
import { AsyncMutex, normalizeSqlParams } from './sqlUtils.js';
import {
  ExistingWinsConflictStrategy,
  IncomingWinsConflictStrategy,
  LastWriteWinsConflictStrategy
} from './syncStrategy.js';

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

describe('BaseController MVC view propagation & lifecycle', () => {
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

    // Al hacer dispose, las vistas ya no reciben actualizaciones posteriores.
    controller.dispose();
    controller.increment();
    expect(viewBStates).toEqual([0, 1, 2]);
    detachB();
  });

  it('exposes structured error codes and HTTP status codes', () => {
    const valErr = new ValidationError('Campo inválido');
    const entErr = new CloudEntitlementError();

    expect(valErr.code).toBe('VALIDATION_ERROR');
    expect(valErr.statusCode).toBe(400);
    expect(entErr.code).toBe('ENTITLEMENT_REQUIRED');
    expect(entErr.statusCode).toBe(402);
  });
});

describe('Conflict resolution strategies & sqlUtils', () => {
  it('resolves LWW, IncomingWins y ExistingWins según contrato IConflictResolutionStrategy', () => {
    const lww = new LastWriteWinsConflictStrategy();
    const incomingWins = new IncomingWinsConflictStrategy();
    const existingWins = new ExistingWinsConflictStrategy();

    expect(lww.shouldAcceptIncoming({ updatedAt: '2026-01-01T00:00:00Z', version: 1 }, null)).toBe(true);
    expect(
      lww.shouldAcceptIncoming(
        { updatedAt: '2026-01-02T00:00:00Z', version: 1 },
        { updatedAt: '2026-01-01T00:00:00Z', version: 9 }
      )
    ).toBe(true);
    expect(
      lww.shouldAcceptIncoming(
        { updatedAt: '2026-01-01T00:00:00Z', version: 2 },
        { updatedAt: '2026-01-01T00:00:00Z', version: 2 },
        { acceptEqualVersion: false }
      )
    ).toBe(false);
    expect(
      lww.shouldAcceptIncoming(
        { updatedAt: '2026-01-01T00:00:00Z', version: 2 },
        { updatedAt: '2026-01-01T00:00:00Z', version: 2 },
        { acceptEqualVersion: true }
      )
    ).toBe(true);

    expect(
      incomingWins.shouldAcceptIncoming(
        { updatedAt: '2025-01-01T00:00:00Z', version: 1 },
        { updatedAt: '2026-01-01T00:00:00Z', version: 5 }
      )
    ).toBe(true);
    expect(
      existingWins.shouldAcceptIncoming(
        { updatedAt: '2026-01-01T00:00:00Z', version: 9 },
        { updatedAt: '2025-01-01T00:00:00Z', version: 1 }
      )
    ).toBe(false);
    expect(existingWins.shouldAcceptIncoming({ updatedAt: '2026-01-01T00:00:00Z', version: 1 }, null)).toBe(
      true
    );
  });

  it('serializes async operations strictly in FIFO order via AsyncMutex and normalizes booleans', async () => {
    const mutex = new AsyncMutex();
    const order: string[] = [];

    const first = mutex.run(async () => {
      order.push('start-1');
      await Promise.resolve();
      order.push('end-1');
    });
    const second = mutex.run(async () => {
      order.push('start-2');
      order.push('end-2');
    });

    await Promise.all([first, second]);
    expect(order).toEqual(['start-1', 'end-1', 'start-2', 'end-2']);
    expect(normalizeSqlParams(['abc', true, false, 42, null])).toEqual(['abc', 1, 0, 42, null]);
  });
});
