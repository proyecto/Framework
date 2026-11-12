import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BaseController } from '@framework/core';
import {
  FrameworkProvider,
  useFrameworkEnvironment,
  useMvcController
} from './index.js';

interface TestState {
  title: string;
  count: number;
}

class TestController extends BaseController<TestState> {
  constructor() {
    super({ title: 'Estado Inicial', count: 7 });
  }

  async init(): Promise<void> {
    this.markInitialized();
  }
}

function EnvironmentProbe() {
  const env = useFrameworkEnvironment();
  return createElement('span', null, `${env.appId}|${env.appName}|${env.platformName}`);
}

function ControllerProbe({ controller }: { controller: TestController }) {
  const state = useMvcController(controller);
  return createElement('div', null, `${state.title}:${state.count}`);
}

describe('@framework/react bindings', () => {
  it('exposes FrameworkProvider environment and throws outside provider', () => {
    expect(() => renderToStaticMarkup(createElement(EnvironmentProbe))).toThrow(
      /FrameworkProvider/
    );

    const html = renderToStaticMarkup(
      createElement(
        FrameworkProvider,
        {
          environment: {
            appId: 'base-template',
            appName: 'Framework Base',
            platformName: 'Expo Android'
          },
          children: createElement(EnvironmentProbe)
        }
      )
    );
    expect(html).toContain('base-template|Framework Base|Expo Android');
  });

  it('reads initial controller state synchronously via useMvcController', () => {
    const controller = new TestController();
    const html = renderToStaticMarkup(createElement(ControllerProbe, { controller }));
    expect(html).toContain('Estado Inicial:7');
    controller.dispose();
  });
});
