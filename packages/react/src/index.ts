import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { IController, IView, ViewEvent } from '@framework/core';

export interface UseMvcControllerOptions<TEvent = ViewEvent> {
  /** Ejecuta `controller.init()` automáticamente al montar el hook (por defecto `true`). */
  autoInit?: boolean;
  /** Callback para eventos efímeros (`toast`, `error`, `sync-complete`, `upgrade-required`). */
  onEvent?: (event: TEvent) => void;
}

/**
 * Patrón: **Adapter Hook (React UI <-> `IController` + `IView`)**.
 *
 * Conecta cualquier componente React (Expo Android o React Web) con cualquier Controlador MVC
 * implementando internamente la interfaz `IView<TState, TEvent>`:
 * - Mantiene sincronizado el último snapshot inmutable `TState` en el ciclo de render de React.
 * - Reenvía eventos efímeros hacia `options.onEvent` usando un `ref` estable para evitar
 *   re-suscripciones innecesarias en cada render.
 * - Garantiza limpieza automática (`detach()`) al desmontar o cambiar de controlador.
 */
export function useMvcController<TState, TEvent = ViewEvent>(
  controller: IController<TState, TEvent>,
  options: UseMvcControllerOptions<TEvent> = {}
): TState {
  const { autoInit = true, onEvent } = options;
  const [state, setState] = useState<TState>(() => controller.getState());
  const eventHandlerRef = useRef(onEvent);
  eventHandlerRef.current = onEvent;

  useEffect(() => {
    setState(controller.getState());

    const viewAdapter: IView<TState, TEvent> = {
      render(nextState) {
        setState(nextState);
      },
      onEvent(event) {
        eventHandlerRef.current?.(event);
      }
    };

    const detach = controller.attachView(viewAdapter);
    if (autoInit) {
      void controller.init();
    }

    return () => {
      detach();
    };
  }, [controller, autoInit]);

  return state;
}

/** Identidad de la aplicación y plataforma actual compartida hacia las vistas. */
export interface FrameworkEnvironment {
  appId: string;
  appName: string;
  platformName: string;
}

const FrameworkContext = createContext<FrameworkEnvironment | null>(null);

export interface FrameworkProviderProps {
  environment: FrameworkEnvironment;
  children: ReactNode;
}

/**
 * Proveedor de contexto con los metadatos de la app actual (`appId`, `appName`, `platformName`).
 */
export function FrameworkProvider({ environment, children }: FrameworkProviderProps) {
  return createElement(FrameworkContext.Provider, { value: environment }, children);
}

/**
 * Hook de lectura para que cualquier pantalla o componente muestre el nombre/plataforma
 * configurados en el punto de entrada sin duplicar literales.
 */
export function useFrameworkEnvironment(): FrameworkEnvironment {
  const ctx = useContext(FrameworkContext);
  if (!ctx) {
    throw new Error('useFrameworkEnvironment debe usarse dentro de <FrameworkProvider>.');
  }
  return ctx;
}
