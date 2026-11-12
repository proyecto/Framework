import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FrameworkProvider } from '@framework/react';
import { createWebAppController } from './bootstrap';
import { WebStudioApp } from './WebStudioApp';
import './styles.css';

const controller = createWebAppController();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrameworkProvider
      environment={{
        appId: 'focus-scenes',
        appName: 'FocusScenes',
        platformName: 'react-web'
      }}
    >
      <WebStudioApp controller={controller} />
    </FrameworkProvider>
  </StrictMode>
);

