import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { EXAMPLE_APP_ID } from '@framework/example-domain';
import { FrameworkProvider } from '@framework/react';
import { createWebAppController } from './bootstrap';
import { WebStudioApp } from './WebStudioApp';
import './styles.css';

/**
 * Punto de entrada Web alternativo.
 * Demuestra que la app Web comparte exactamente los mismos `IPresetModel` y `IPresetController`
 * que la app Expo Android usando una interfaz HTML/CSS de escritorio completamente distinta.
 */
const controller = createWebAppController();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrameworkProvider
      environment={{
        appId: EXAMPLE_APP_ID,
        appName: 'FocusScenes',
        platformName: 'Escritorio Web'
      }}
    >
      <WebStudioApp controller={controller} />
    </FrameworkProvider>
  </StrictMode>
);
