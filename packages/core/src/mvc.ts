/**
 * Tipos de eventos efímeros que el Controlador envía hacia las Vistas sin ensuciar
 * el snapshot persistente de estado (`TState`).
 */
export type ViewEventType = 'toast' | 'error' | 'sync-complete' | 'upgrade-required';

/**
 * Evento unidireccional emitido desde `IController` hacia cualquier `IView` adjunta.
 */
export interface ViewEvent {
  type: ViewEventType;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Contrato estricto de **Vista (V)** en la arquitectura MVC clásica.
 *
 * Patrón: **Observer (Suscriptor pasivo de estado y eventos)**.
 * Cualquier interfaz gráfica (Android con Expo, Web React, CLI o un doble de test)
 * implementa esta interfaz para recibir snapshots inmutables de estado desde el
 * Controlador, garantizando que el Modelo y el Controlador desconozcan por completo
 * el framework o dispositivo donde se renderiza la app.
 */
export interface IView<TState, TEvent = ViewEvent> {
  /** Se invoca de inmediato al suscribirse y cada vez que cambia el snapshot de estado. */
  render(state: TState): void;
  /** Canal opcional para notificaciones puntuales (toasts, errores o navegación al plan Pro). */
  onEvent?(event: TEvent): void;
}

/**
 * Contrato estricto de **Controlador (C)** en la arquitectura MVC.
 *
 * Patrón: **Mediator / Presenter Boundary**.
 * Actúa de intermediario entre una o varias `IView` y el `IModel`:
 * - Expone comandos de dominio concretos en sus interfaces derivadas (ej. `IPresetController`).
 * - Gestiona suscripciones de vistas y ciclo de vida (`init`, `attachView`, `dispose`).
 */
export interface IController<TState, TEvent = ViewEvent> {
  init(): Promise<void>;
  getState(): TState;
  attachView(view: IView<TState, TEvent>): () => void;
  dispose(): void;
}

/**
 * Contrato base de **Modelo (M)** en la arquitectura MVC.
 *
 * Patrón: **Observable Domain Model**.
 * Encapsula reglas de negocio, invariantes de validación y persistencia a través de
 * interfaces de repositorio (`IRepository` / `ISyncableRepository`), sin conocer ni Vistas
 * ni HTTP ni SQLite/Turso.
 */
export interface IModel {
  subscribe(listener: () => void): () => void;
  dispose?(): void;
}

/**
 * Clase base reutilizable para todos los Controladores MVC del framework.
 *
 * Patrones aplicados:
 * - **Observer / Pub-Sub**: Mantiene un `Set<IView>` y difunde cada snapshot mediante `setState`.
 * - **Template Method**: Define `init()` como paso abstracto obligatorio junto con ayudas de
 *   ciclo de vida (`markInitialized`, `isInitialized`, `isDisposed`, `emitViewEvent`).
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

  /** Carga inicial del estado de dominio desde el Modelo; idempotente en subclases. */
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

  /** Devuelve el último snapshot inmutable de estado visible para la UI. */
  getState(): TState {
    return this.state;
  }

  /**
   * Registra una `IView` y le entrega síncronamente el estado actual para evitar
   * renders iniciales vacíos. Devuelve la función de desuscripción (`cleanup`).
   */
  attachView(view: IView<TState, TEvent>): () => void {
    this.views.add(view);
    view.render(this.state);
    return () => {
      this.views.delete(view);
    };
  }

  /**
   * Actualiza el snapshot de estado de manera inmutable (objeto parcial o función pura)
   * y notifica automáticamente a todas las vistas adjuntas.
   */
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

  /** Difunde un evento efímero hacia todas las vistas interesadas. */
  protected emitViewEvent(event: TEvent): void {
    if (this.disposed) return;
    for (const view of this.views) {
      view.onEvent?.(event);
    }
  }

  /** Libera referencias de vistas al desmontar el controlador. */
  dispose(): void {
    this.disposed = true;
    this.views.clear();
  }
}
