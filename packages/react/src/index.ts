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
  autoInit?: boolean;
  onEvent?: (event: TEvent) => void;
}

/**
 * Bridges a React UI component to an MVC Controller using the strict IView<TState> interface.
 * Both React Native (Expo) and React Web views use this exact same hook without the
 * Controller or Model knowing anything about React.
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

export function FrameworkProvider({ environment, children }: FrameworkProviderProps) {
  return createElement(FrameworkContext.Provider, { value: environment }, children);
}

export function useFrameworkEnvironment(): FrameworkEnvironment {
  const ctx = useContext(FrameworkContext);
  if (!ctx) {
    throw new Error('useFrameworkEnvironment debe usarse dentro de <FrameworkProvider>.');
  }
  return ctx;
}

