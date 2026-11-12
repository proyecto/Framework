import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics
} from 'react-native-safe-area-context';
import { EXAMPLE_APP_ID } from '@framework/example-domain';
import { FrameworkProvider } from '@framework/react';
import { FrameworkThemeProvider, type ThemeScheme } from '@framework/ui';
import { createExpoAppController } from './src/bootstrap';
import { PresetStudioScreen } from './src/PresetStudioScreen';

const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://127.0.0.1:4000' : 'http://10.0.2.2:4000');

const WEB_FALLBACK_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 }
};

/**
 * Raíz de la aplicación Android Expo.
 * Instancia el Controlador MVC una sola vez (o cuando cambia la URL del backend),
 * lo libera en `dispose()` al desmontarse y envuelve la UI en los proveedores de tema y entorno.
 */
export default function App() {
  const [themePreference, setThemePreference] = useState<ThemeScheme>('system');
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);

  const controller = useMemo(
    () => createExpoAppController({ apiBaseUrl }),
    [apiBaseUrl]
  );

  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? WEB_FALLBACK_METRICS}>
      <FrameworkProvider
        environment={{
          appId: EXAMPLE_APP_ID,
          appName: 'FocusScenes',
          platformName: Platform.OS === 'web' ? 'Expo Web' : 'Expo Android'
        }}
      >
        <FrameworkThemeProvider preference={themePreference}>
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <StatusBar style="auto" />
            <PresetStudioScreen
              controller={controller}
              themePreference={themePreference}
              onThemePreferenceChange={setThemePreference}
              apiBaseUrl={apiBaseUrl}
              onApiBaseUrlChange={setApiBaseUrl}
            />
          </SafeAreaView>
        </FrameworkThemeProvider>
      </FrameworkProvider>
    </SafeAreaProvider>
  );
}
