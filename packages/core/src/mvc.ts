import { CloudEntitlementError, getErrorMessage } from './errors.js';

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
 * Implementación base reutilizable del patrón **Observer + Resource Registry** para Modelos (`IModel`).
 *
 * Elimina el boilerplate repetido de `Set<() => void>`, `subscribe`, `notify` y limpieza de
 * suscripciones secundarias (por ejemplo, `repository.subscribeStatus(...)`) en todos los
 * dominios del framework.
 */
export abstract class ObservableModel implements IModel {
  private readonly listeners = new Set<() => void>();
  private readonly cleanups: Array<() => void> = [];

  /** Registra una función de limpieza (como la desuscripción del repositorio) para `dispose()`. */
  protected registerCleanup(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  /** Suscribe un observador (normalmente un `IController`) a los cambios del Modelo. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Notifica de forma segura a todos los observadores suscritos. */
  protected notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /** Libera suscripciones internas y vacía los observadores al destruir el Modelo. */
  dispose(): void {
    while (this.cleanups.length > 0) {
      const cleanup = this.cleanups.pop();
      cleanup?.();
    }
    this.listeners.clear();
  }
}

/**
 * Estado mínimo requerido por `StatefulMvcController` para gestionar de forma uniforme
 * indicadores de carga y errores de comando sin duplicar lógica en cada controlador.
 */
export interface AsyncCommandState {
  busy: boolean;
  errorMessage: string | null;
}

/**
 * Opciones declarativas del patrón **Command Wrapper / Template Method** en `StatefulMvcController`.
 */
export interface CommandExecutionOptions<TResult, TEvent = ViewEvent> {
  /** Si es `true` (por defecto), activa `state.busy` mientras dura la operación. */
  trackBusy?: boolean;
  /** Emite un evento de error (`upgrade-required` / `error`) a la vista cuando la tarea falla. */
  emitErrorEvent?: boolean;
  /** Fuerza `syncStateFromModel()` también en la rama de error (p. ej. para mostrar `lastSyncError`). */
  syncAfterError?: boolean;
  /** Factoría opcional del evento emitido cuando el comando concluye satisfactoriamente. */
  onSuccess?: (result: TResult) => TEvent | void;
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

/**
 * Extensión especializada de `BaseController` (**Patrón Template Method + Command Executor**)
 * para controladores de aplicación conectados a un `IModel`.
 *
 * Centraliza:
 * - Vinculación reactiva al Modelo (`bindModel`) con liberación automática en `dispose()`.
 * - Ejecución segura de comandos asíncronos (`executeCommand`) con manejo automático de
 *   `busy`, `errorMessage`, re-sincronización y mapeo de `CloudEntitlementError -> upgrade-required`.
 */
export abstract class StatefulMvcController<
  TState extends AsyncCommandState,
  TEvent = ViewEvent
> extends BaseController<TState, TEvent> {
  private readonly modelCleanups: Array<() => void> = [];
  private boundModel: IModel | null = null;

  /**
   * Suscribe este controlador al `model` para ejecutar `syncStateFromModel()` ante cada cambio
   * y registra su limpieza automática en `dispose()`.
   */
  protected bindModel(model: IModel): void {
    this.boundModel = model;
    const unsub = model.subscribe(() => {
      void this.syncStateFromModel();
    });
    this.modelCleanups.push(unsub);
  }

  /** Proyecta el snapshot actualizado desde el Modelo hacia el estado visible del Controlador. */
  protected abstract syncStateFromModel(): Promise<void>;

  /** Traduce errores capturados al canal de eventos de vista; sobreescribible si `TEvent` difiere de `ViewEvent`. */
  protected mapErrorToViewEvent(error: unknown, message: string): TEvent {
    const type: ViewEventType =
      error instanceof CloudEntitlementError ? 'upgrade-required' : 'error';
    return { type, message } as unknown as TEvent;
  }

  /**
   * Ejecuta un comando asíncrono del controlador de forma uniforme, eliminando bloques
   * `try/catch/busy/sync` duplicados en cada dominio.
   */
  protected async executeCommand<TResult = void>(
    options: CommandExecutionOptions<TResult, TEvent>,
    task: () => Promise<TResult>
  ): Promise<TResult | undefined> {
    const trackBusy = options.trackBusy ?? true;
    const emitErrorEvent = options.emitErrorEvent ?? true;

    this.setState(
      (trackBusy ? { busy: true, errorMessage: null } : { errorMessage: null }) as Partial<TState>
    );

    try {
      const result = await task();
      await this.syncStateFromModel();
      if (trackBusy) {
        this.setState({ busy: false } as Partial<TState>);
      }
      const successEvent = options.onSuccess?.(result);
      if (successEvent) {
        this.emitViewEvent(successEvent);
      }
      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      if (options.syncAfterError) {
        await this.syncStateFromModel();
      }
      this.setState(
        (trackBusy
          ? { busy: false, errorMessage: message }
          : { errorMessage: message }) as Partial<TState>
      );
      if (emitErrorEvent) {
        this.emitViewEvent(this.mapErrorToViewEvent(error, message));
      }
      return undefined;
    }
  }

  /** Limpia el último mensaje de error visible en la UI. */
  clearError(): void {
    this.setState({ errorMessage: null } as Partial<TState>);
  }

  /** Desuscribe el Modelo enlazado, invoca `model.dispose()` si existe y limpia las vistas. */
  override dispose(): void {
    while (this.modelCleanups.length > 0) {
      this.modelCleanups.pop()?.();
    }
    this.boundModel?.dispose?.();
    this.boundModel = null;
    super.dispose();
  }
}
