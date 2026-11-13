import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  initialWindowMetrics
} from 'react-native-safe-area-context';
import { FrameworkProvider } from '@framework/react';
import {
  FrameworkThemeProvider,
  LIGHT_THEME,
  useFrameworkTheme,
  type ThemeScheme
} from '@framework/ui';
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

const THEME_STORAGE_KEY = 'mtginvest_theme_preference';
const LANGUAGE_STORAGE_KEY = 'mtginvest_language_preference';

function getStoredThemePreference(): ThemeScheme {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['light', 'dark', 'crimson', 'obsidian', 'system'].includes(saved)) {
        return saved as ThemeScheme;
      }
    }
  } catch {}
  return 'system';
}

function getStoredLanguagePreference(): 'es' | 'en' {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'es' || saved === 'en') {
        return saved;
      }
    }
  } catch {}
  return 'es';
}

function MTGInvestAppShell({
  controller,
  themePreference,
  onThemePreferenceChange,
  languagePreference,
  onLanguagePreferenceChange
}: {
  controller: ReturnType<typeof createMTGInvestExpoController>;
  themePreference: ThemeScheme;
  onThemePreferenceChange: (next: ThemeScheme) => void;
  languagePreference: 'es' | 'en';
  onLanguagePreferenceChange: (next: 'es' | 'en') => void;
}) {
  const theme = useFrameworkTheme();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'bottom']}
    >
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <MTGInvestScreen
        controller={controller}
        themePreference={themePreference}
        onThemePreferenceChange={onThemePreferenceChange}
        languagePreference={languagePreference}
        onLanguagePreferenceChange={onLanguagePreferenceChange}
      />
    </SafeAreaView>
  );
}

export default function App() {
  const [themePreference, setThemePreference] = useState<ThemeScheme>(getStoredThemePreference);
  const [languagePreference, setLanguagePreference] = useState<'es' | 'en'>(getStoredLanguagePreference);
  const { ready: fontsReady } = useGoogleDesignFonts();

  const handleThemeChange = (next: ThemeScheme) => {
    setThemePreference(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      }
    } catch {}
  };

  const handleLanguageChange = (next: 'es' | 'en') => {
    setLanguagePreference(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      }
    } catch {}
  };

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
          onPreferenceChange={handleThemeChange}
          fontFamilies={GOOGLE_FONT_FAMILIES}
          iconRenderer={renderGoogleMaterialIcon}
        >
          <MTGInvestAppShell
            controller={controller}
            themePreference={themePreference}
            onThemePreferenceChange={handleThemeChange}
            languagePreference={languagePreference}
            onLanguagePreferenceChange={handleLanguageChange}
          />
        </FrameworkThemeProvider>
      </FrameworkProvider>
    </SafeAreaProvider>
  );
}

