import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { EXAMPLE_APP_ID } from '@framework/example-domain';
import { FrameworkProvider } from '@framework/react';
import { FrameworkThemeProvider, type ThemeScheme } from '@framework/ui';
import { createExpoAppController } from './src/bootstrap';
import { PresetStudioScreen } from './src/PresetStudioScreen';

/**
 * Raíz de la aplicación Android Expo.
 * Instancia el Controlador MVC una sola vez (o cuando cambia la URL del backend),
 * lo libera en `dispose()` al desmontarse y envuelve la UI en los proveedores de tema y entorno.
 */
export default function App() {
  const [themePreference, setThemePreference] = useState<ThemeScheme>('system');
  const [apiBaseUrl, setApiBaseUrl] = useState(
    process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000'
  );

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
    <SafeAreaProvider>
      <FrameworkProvider
        environment={{
          appId: EXAMPLE_APP_ID,
          appName: 'FocusScenes',
          platformName: 'Expo Android'
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
