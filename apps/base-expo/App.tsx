import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics
} from 'react-native-safe-area-context';
import { FrameworkProvider } from '@framework/react';
import { FrameworkThemeProvider, LIGHT_THEME, type ThemeScheme } from '@framework/ui';
import { createBaseExpoController } from './src/bootstrap';
import { BaseShellScreen } from './src/BaseShellScreen';
import {
  GOOGLE_FONT_FAMILIES,
  renderGoogleMaterialIcon,
  useGoogleDesignFonts
} from './src/googleDesignSystem';
import { BASE_APP_ID } from './src/mvc';

const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://127.0.0.1:4000' : 'http://10.0.2.2:4000');

const WEB_FALLBACK_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 }
};

/**
 * Raíz canónica de la App Base Expo.
 * Precarga Google Fonts (`Inter`) y Google Material Icons antes de montar la interfaz MVC.
 */
export default function App() {
  const [themePreference, setThemePreference] = useState<ThemeScheme>('system');
  const [apiBaseUrl, setApiBaseUrl] = useState(DEFAULT_API_BASE_URL);
  const { ready: fontsReady } = useGoogleDesignFonts();

  const controller = useMemo(
    () => createBaseExpoController({ apiBaseUrl }),
    [apiBaseUrl]
  );

  useEffect(() => {
    return () => {
      controller.dispose();
    };
  }, [controller]);

  if (!fontsReady) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics ?? WEB_FALLBACK_METRICS}>
        <View
          style={{
            flex: 1,
            backgroundColor: LIGHT_THEME.colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12
          }}
        >
          <ActivityIndicator size="small" color={LIGHT_THEME.colors.accent} />
          <Text style={{ color: LIGHT_THEME.colors.textSecondary }}>
            Cargando tipografía e iconos de Google...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? WEB_FALLBACK_METRICS}>
      <FrameworkProvider
        environment={{
          appId: BASE_APP_ID,
          appName: 'Framework Base',
          platformName: Platform.OS === 'web' ? 'Expo Web' : 'Expo Android'
        }}
      >
        <FrameworkThemeProvider
          preference={themePreference}
          fontFamilies={GOOGLE_FONT_FAMILIES}
          iconRenderer={renderGoogleMaterialIcon}
        >
          <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
            <StatusBar style="auto" />
            <BaseShellScreen
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
