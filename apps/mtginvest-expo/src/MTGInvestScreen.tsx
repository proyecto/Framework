import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFrameworkEnvironment, useMvcController } from '@framework/react';
import {
  AppShell,
  Badge,
  Button,
  Card,
  textTypographyStyle,
  useFrameworkTheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import type { IMtginvestController } from './mvc';
import { APP_BUILD, APP_VERSION } from './version';

export type MTGTab = 'main' | 'settings';

export interface MTGInvestScreenProps {
  controller: IMtginvestController;
}

/**
 * Pantalla principal de MTGInvest (@framework/mtginvest-expo).
 *
 * Hereda la arquitectura visual de la plantilla base:
 * - Cabecera fija con el título MTGInvest.
 * - 2 botones inferiores (Principal y Ajustes).
 * - Componentes puros del Design System (@framework/ui).
 */
export function MTGInvestScreen({ controller }: MTGInvestScreenProps) {
  const theme = useFrameworkTheme();
  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<MTGTab>('main');
  const [toast, setToast] = useState<string | null>(null);

  const state = useMvcController(controller, {
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
    <AppShell<MTGTab>
      appName="MTGInvest"
      subtitle={`Gestor de Inversiones MTG · ${env.platformName}`}
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
          label={`v${APP_VERSION}`}
          tone="accent"
        />
      }
    >
      {activeTab === 'main' ? (
        <Card
          title="Cartera de Inversión MTG"
          subtitle="Seguimiento de cartas, cajas selladas y colecciones"
          icon="account-balance-wallet"
        >
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.bodySize,
              ...textTypographyStyle(theme, 'regular')
            }}
          >
            Bienvenido a MTGInvest. Tu base de datos local SQLite está lista para registrar compras, valoraciones y evolución de precios.
          </Text>

          <View style={{ marginTop: theme.spacing.sm }}>
            <Button
              icon="add-circle-outline"
              label="Añadir Carta / Producto"
              onPress={() => setToast('Función lista para conectar con la API de Scryfall/Precios')}
            />
          </View>
        </Card>
      ) : null}

      {activeTab === 'settings' ? (
        <Card
          title="Ajustes"
          subtitle="Configuración general de MTGInvest"
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

