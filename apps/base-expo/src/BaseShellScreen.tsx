import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useFrameworkEnvironment, useMvcController } from '@framework/react';
import {
  AppShell,
  Badge,
  Card,
  textTypographyStyle,
  useFrameworkTheme,
  type ThemeScheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import type { IBaseAppController } from './mvc';

export type BaseTab = 'main' | 'settings';

export interface BaseShellScreenProps {
  controller: IBaseAppController;
  themePreference?: ThemeScheme;
  onThemePreferenceChange?: (next: ThemeScheme) => void;
  apiBaseUrl?: string;
  onApiBaseUrlChange?: (nextUrl: string) => void;
}

/**
 * Pantalla base canónica (`@framework/base-expo`).
 *
 * Cascarón estructural limpio del framework con cabecera estandarizada,
 * dos botones inferiores (Principal y Ajustes) y pantallas listas para construir.
 */
export function BaseShellScreen({
  controller
}: BaseShellScreenProps) {
  const theme = useFrameworkTheme();
  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<BaseTab>('main');
  const [toast, setToast] = useState<string | null>(null);

  useMvcController(controller, {
    onEvent: (event) => {
      setToast(event.message);
    }
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), APP_LAYOUT_BOUNDS.toastDurationMs);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <AppShell<BaseTab>
      appName={env.appName}
      subtitle={`App Base · ${env.platformName}`}
      toastMessage={toast}
      tabs={[
        { id: 'main', label: 'Principal', icon: 'home' },
        {
          id: APP_LAYOUT_BOUNDS.settingsTab.id,
          label: APP_LAYOUT_BOUNDS.settingsTab.label,
          icon: APP_LAYOUT_BOUNDS.settingsTab.icon
        }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerRight={
        <Badge
          label="BASE"
          tone="neutral"
        />
      }
    >
      {activeTab === 'main' ? (
        <Card
          title="Pantalla Principal"
          subtitle="Espacio de trabajo base"
          icon="dashboard"
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.bodySize,
              ...textTypographyStyle(theme, 'regular')
            }}
          >
            Espacio de trabajo listo para construir los módulos de la aplicación.
          </Text>
        </Card>
      ) : null}

      {activeTab === 'settings' ? (
        <Card
          title="Ajustes"
          subtitle="Configuración general"
          icon="settings"
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.bodySize,
              ...textTypographyStyle(theme, 'regular')
            }}
          >
            Sin ajustes configurados por el momento.
          </Text>
        </Card>
      ) : null}
    </AppShell>
  );
}
