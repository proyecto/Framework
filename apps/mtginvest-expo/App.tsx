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
import { createMTGInvestExpoController } from './src/bootstrap';
import {
  GOOGLE_FONT_FAMILIES,
  renderGoogleMaterialIcon,
  useGoogleDesignFonts
} from './src/googleDesignSystem';
import { MTGInvestScreen } from './src/MTGInvestScreen';
import { APP_ID } from './src/mvc';

const WEB_FALLBACK_METRICS = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 }
};

export default function App() {
  const [themePreference] = useState<ThemeScheme>('system');
  const { ready: fontsReady } = useGoogleDesignFonts();

  const controller = useMemo(
    () => createMTGInvestExpoController(),
    []
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
            Iniciando MTGInvest...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? WEB_FALLBACK_METRICS}>
      <FrameworkProvider
        environment={{
          appId: APP_ID,
          appName: 'MTGInvest',
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
            <MTGInvestScreen controller={controller} />
          </SafeAreaView>
        </FrameworkThemeProvider>
      </FrameworkProvider>
    </SafeAreaProvider>
  );
}

