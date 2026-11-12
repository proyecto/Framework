import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FrameworkProvider } from '@framework/react';
import { BaseWebApp } from './BaseWebApp';
import { createBaseWebController } from './bootstrap';
import { BASE_APP_ID } from './mvc';
import './styles.css';

const controller = createBaseWebController();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrameworkProvider
      environment={{
        appId: BASE_APP_ID,
        appName: 'Framework Base',
        platformName: 'Web Desktop'
      }}
    >
      <BaseWebApp controller={controller} />
    </FrameworkProvider>
  </StrictMode>
);

