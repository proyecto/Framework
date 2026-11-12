export type ViewEventType = 'toast' | 'error' | 'sync-complete' | 'upgrade-required';

export interface ViewEvent {
  type: ViewEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Strict View interface in MVC.
 * Any UI implementation (Expo Android, React Web, CLI, test double) implements this
 * to receive immutable state snapshots and events from a Controller without coupling
 * the Controller or Model to any UI framework.
 */
export interface IView<TState, TEvent = ViewEvent> {
  render(state: TState): void;
  onEvent?(event: TEvent): void;
}

/**
 * Strict Controller interface in MVC.
 * Mediates between IModel (domain + data interfaces) and IView (UI).
 */
export interface IController<TState, TEvent = ViewEvent> {
  init(): Promise<void>;
  getState(): TState;
  attachView(view: IView<TState, TEvent>): () => void;
  dispose(): void;
}

/**
 * Base Model contract.
 * Models encapsulate business state, invariants, and persistence through repository
 * interfaces, with zero awareness of views or transport frameworks.
 */
export interface IModel {
  subscribe(listener: () => void): () => void;
  dispose?(): void;
}

/**
 * Reusable MVC Controller base class implementing view registration, immutable state
 * propagation, and view event dispatch.
 */
export abstract class BaseController<TState, TEvent = ViewEvent>
  implements IController<TState, TEvent>
{
  private state: TState;
  private readonly views = new Set<IView<TState, TEvent>>();
  private initialized = false;
  private disposed = false;

  protected constructor(initialState: TState) {
    this.state = initialState;
  }

  abstract init(): Promise<void>;

  protected markInitialized(): void {
    this.initialized = true;
  }

  protected isInitialized(): boolean {
    return this.initialized;
  }

  protected isDisposed(): boolean {
    return this.disposed;
  }

  getState(): TState {
    return this.state;
  }

  attachView(view: IView<TState, TEvent>): () => void {
    this.views.add(view);
    view.render(this.state);
    return () => {
      this.views.delete(view);
    };
  }

  protected setState(updater: Partial<TState> | ((prev: TState) => TState)): void {
    if (this.disposed) return;
    const nextState =
      typeof updater === 'function'
        ? updater(this.state)
        : { ...this.state, ...updater };
    this.state = nextState;
    for (const view of this.views) {
      view.render(this.state);
    }
  }

  protected emitViewEvent(event: TEvent): void {
    if (this.disposed) return;
    for (const view of this.views) {
      view.onEvent?.(event);
    }
  }

  dispose(): void {
    this.disposed = true;
    this.views.clear();
  }
}

