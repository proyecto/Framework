import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFrameworkEnvironment, useMvcController } from '@framework/react';
import {
  AppShell,
  Badge,
  Button,
  Card,
  ModalDialog,
  SegmentedControl,
  SimpleLineChart,
  Slider,
  StorageStatusBar,
  SwitchToggle,
  TextField,
  textTypographyStyle,
  useFrameworkTheme,
  type ChartSeries,
  type ThemeScheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import type { IBaseAppController } from './mvc';
import { APP_BUILD, APP_VERSION } from './version';

type BaseTab = 'workspace' | 'controls' | 'settings';
type ChartTimeframe = '1D' | '1S' | '1M' | '1A';

const STOCK_DATA: Record<ChartTimeframe, { labels: string[]; series: ChartSeries[] }> = {
  '1D': {
    labels: ['09:00', '11:00', '13:00', '15:00', '17:30'],
    series: [
      { id: 'aapl', name: 'AAPL', color: '#10B981', values: [181.2, 182.4, 181.9, 183.1, 183.8] },
      { id: 'goog', name: 'GOOGL', color: '#3B82F6', values: [138.5, 137.9, 139.1, 138.8, 140.2] }
    ]
  },
  '1S': {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    series: [
      { id: 'aapl', name: 'AAPL', color: '#10B981', values: [178.5, 180.1, 179.4, 182.0, 183.8] },
      { id: 'goog', name: 'GOOGL', color: '#3B82F6', values: [135.2, 136.8, 138.0, 137.5, 140.2] }
    ]
  },
  '1M': {
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
    series: [
      { id: 'aapl', name: 'AAPL', color: '#10B981', values: [172.0, 175.4, 178.9, 183.8] },
      { id: 'goog', name: 'GOOGL', color: '#3B82F6', values: [131.0, 134.5, 137.0, 140.2] }
    ]
  },
  '1A': {
    labels: ['Ene', 'Abr', 'Jul', 'Oct', 'Nov'],
    series: [
      { id: 'aapl', name: 'AAPL', color: '#10B981', values: [155.0, 168.2, 175.1, 180.4, 183.8] },
      { id: 'goog', name: 'GOOGL', color: '#3B82F6', values: [120.5, 128.0, 133.4, 136.2, 140.2] }
    ]
  }
};

export interface BaseShellScreenProps {
  controller: IBaseAppController;
  themePreference: ThemeScheme;
  onThemePreferenceChange: (next: ThemeScheme) => void;
  apiBaseUrl: string;
  onApiBaseUrlChange: (nextUrl: string) => void;
}

/**
 * Pantalla base canónica (`@framework/base-expo`).
 *
 * Define visualmente los límites estructurales que heredarán todas las aplicaciones Expo del
 * framework: cabecera fija, barra de estado local/nube, tarjetas estandarizadas, controles del
 * Design System (`@framework/ui`) y navegación inferior acotada.
 */
export function BaseShellScreen({
  controller,
  themePreference,
  onThemePreferenceChange,
  apiBaseUrl,
  onApiBaseUrlChange
}: BaseShellScreenProps) {
  const theme = useFrameworkTheme();
  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<BaseTab>('workspace');
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>('1S');
  const [toast, setToast] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [draftApiUrl, setDraftApiUrl] = useState(apiBaseUrl);

  useEffect(() => {
    setDraftApiUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  const state = useMvcController(controller, {
    onEvent: (event) => {
      setToast(event.message);
      if (event.type === 'upgrade-required') {
        setActiveTab('settings');
      }
    }
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), APP_LAYOUT_BOUNDS.toastDurationMs);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleItems = state.onlyEnabledFilter
    ? state.items.filter((item) => item.enabled)
    : state.items;
  const selectedItem =
    state.items.find((item) => item.id === state.selectedItemId) ?? state.items[0] ?? null;

  const handleCreate = async () => {
    await controller.createItem({
      title: newTitle,
      description: newDescription
    });
    if (newTitle.trim()) {
      setNewTitle('');
      setNewDescription('');
    }
  };

  return (
    <AppShell<BaseTab>
      appName={env.appName}
      subtitle={`App Base · ${env.platformName}`}
      toastMessage={toast}
      tabs={[
        { id: 'workspace', label: 'Estructura', icon: 'dashboard' },
        { id: 'controls', label: 'Controles UI', icon: 'tune' },
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
          label={state.storage.plan === 'pro' ? 'PRO' : 'BASE'}
          tone={state.storage.plan === 'pro' ? 'accent' : 'neutral'}
        />
      }
      topBanner={
        <StorageStatusBar
          status={state.storage}
          onSyncPress={() => void controller.syncNow()}
          onManagePress={() => setActiveTab('settings')}
        />
      }
    >
      {activeTab === 'workspace' ? (
        <>
          <Card
            title="1. Lista maestra estandarizada"
            subtitle="Toda app parte de una lista seleccionable dentro de Card con filtro superior"
            icon="view-list"
            rightSlot={
              <Button
                size="sm"
                variant={state.onlyEnabledFilter ? 'primary' : 'outline'}
                icon="filter-list"
                label={state.onlyEnabledFilter ? 'Solo activos' : 'Todos'}
                onPress={() => controller.setOnlyEnabledFilter(!state.onlyEnabledFilter)}
              />
            }
          >
            {visibleItems.length === 0 ? (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                Sin elementos visibles. Añade uno nuevo en el bloque inferior.
              </Text>
            ) : (
              <View style={{ gap: theme.spacing.sm }}>
                {visibleItems.map((item) => {
                  const selected = item.id === selectedItem?.id;
                  return (
                    <Button
                      key={item.id}
                      size="sm"
                      variant={selected ? 'primary' : 'secondary'}
                      icon={item.isPrimary ? 'star' : 'star-outline'}
                      label={`${item.title} (${item.level}%)`}
                      onPress={() => controller.selectItem(item.id)}
                      fullWidth
                    />
                  );
                })}
              </View>
            )}
          </Card>

          <Card
            title="2. Formulario de entrada acotado"
            subtitle="Los campos usan exclusivamente TextField y un botón primario al pie"
            icon="add-circle-outline"
          >
            <TextField
              label="Título del elemento"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Ej. Módulo principal"
              error={state.errorMessage ?? undefined}
            />
            <TextField
              label="Descripción breve"
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Opcional"
            />
            <Button
              icon="add-circle-outline"
              label="Crear elemento"
              loading={state.busy}
              onPress={() => void handleCreate()}
              fullWidth
            />
          </Card>
        </>
      ) : null}

      {activeTab === 'controls' ? (
        <>
        {selectedItem ? (
          <Card
            highlighted={selectedItem.isPrimary}
            icon="tune"
            title={selectedItem.title}
            subtitle={selectedItem.description || 'Inspector de controles canónicos'}
            rightSlot={
              <Badge
                label={selectedItem.isPrimary ? 'Principal' : 'Estándar'}
                tone={selectedItem.isPrimary ? 'success' : 'neutral'}
              />
            }
          >
            <Slider
              label="Nivel estándar (0–100%)"
              value={selectedItem.level}
              min={0}
              max={100}
              step={APP_LAYOUT_BOUNDS.defaultSliderStep}
              unit="%"
              onSlidingComplete={(val) => void controller.updateLevel(selectedItem.id, val)}
            />

            <SwitchToggle
              label="Estado habilitado"
              value={selectedItem.enabled}
              onValueChange={() => void controller.toggleEnabled(selectedItem.id)}
            />

            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Button
                size="sm"
                variant="primary"
                icon="star"
                label={selectedItem.isPrimary ? 'Es principal' : 'Marcar principal'}
                disabled={selectedItem.isPrimary}
                onPress={() => void controller.markAsPrimary(selectedItem.id)}
                style={{ flex: 1 }}
              />
              <Button
                size="sm"
                variant="danger"
                icon="delete-outline"
                label="Eliminar"
                onPress={() => setDeleteTargetId(selectedItem.id)}
              />
            </View>
          </Card>
        ) : (
          <Card icon="info-outline" title="Sin elemento seleccionado">
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              Crea o selecciona un elemento en la pestaña Estructura para inspeccionar sus controles.
            </Text>
          </Card>
        )}

        <Card
          icon="show-chart"
          title="Gráfica de Valores (Multi-serie)"
          subtitle="Trazado nativo interactivo con selector de período y cursor táctil"
        >
          <SimpleLineChart
            height={185}
            unit="$"
            series={STOCK_DATA[chartTimeframe].series}
            labels={STOCK_DATA[chartTimeframe].labels}
            timeframeOptions={[
              { value: '1D', label: '1D' },
              { value: '1S', label: '1S' },
              { value: '1M', label: '1M' },
              { value: '1A', label: '1A' }
            ]}
            activeTimeframe={chartTimeframe}
            onTimeframeChange={(tf: string) => setChartTimeframe(tf as ChartTimeframe)}
          />
        </Card>
        </>
      ) : null}

      {activeTab === 'settings' ? (
        <>
          <Card
            icon="info-outline"
            title="Límites del Design System"
            subtitle="Reglas obligatorias para que todas las apps compartan el mismo aspecto"
          >
            <View style={{ gap: theme.spacing.sm }}>
              {APP_LAYOUT_BOUNDS.designRules.map((rule, index) => (
                <Text
                  key={index}
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize + 1,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                >
                  {`${index + 1}. ${rule}`}
                </Text>
              ))}
              <Text
                style={{
                  color: theme.colors.accentText,
                  fontSize: theme.typography.captionSize,
                  ...textTypographyStyle(theme, 'bold')
                }}
              >
                {`Máx. pestañas inferiores: ${APP_LAYOUT_BOUNDS.maxBottomTabs} · Máx. acciones al pie de tarjeta: ${APP_LAYOUT_BOUNDS.maxCardFooterActions}`}
              </Text>
            </View>
          </Card>

          <Card icon="cloud-queue" title="Almacenamiento Local / Nube">
            <SegmentedControl
              value={state.storage.mode}
              options={[
                { value: 'local', label: 'Local (Gratis)' },
                { value: 'cloud', label: 'Nube (Pro)' }
              ]}
              onChange={(nextMode) => void controller.setStorageMode(nextMode)}
            />
            {state.storage.plan === 'free' ? (
              <Button
                icon="cloud-upload"
                label="Activar Plan Pro y Nube"
                loading={state.busy}
                onPress={() => void controller.upgradeToProAndEnableCloud()}
                fullWidth
              />
            ) : (
              <Button
                variant="outline"
                icon="cloud-off"
                label="Volver a Plan Gratis (Solo local)"
                loading={state.busy}
                onPress={() => void controller.downgradeToFree()}
                fullWidth
              />
            )}
          </Card>

          <Card icon="palette" title="Tema y Servidor">
            <SegmentedControl<ThemeScheme>
              value={themePreference}
              options={[
                { value: 'system', label: 'Sistema' },
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Oscuro' }
              ]}
              onChange={onThemePreferenceChange}
            />
            <TextField
              label="URL del backend reutilizable"
              value={draftApiUrl}
              onChangeText={setDraftApiUrl}
              placeholder="http://10.0.2.2:4000"
            />
            <Button
              size="sm"
              variant="secondary"
              icon="link"
              label="Aplicar URL"
              onPress={() => onApiBaseUrlChange(draftApiUrl.trim())}
            />
          </Card>

          <Card icon="verified-user" title="Información de Release" subtitle="CalVer monotónico sincronizado">
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'medium')
                }}
              >
                Versión de la app
              </Text>
              <Badge label={`v${APP_VERSION}`} tone="accent" />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.bodySize,
                  ...textTypographyStyle(theme, 'medium')
                }}
              >
                Código de Build (Android)
              </Text>
              <Badge label={String(APP_BUILD)} tone="neutral" />
            </View>
          </Card>
        </>
      ) : null}

      <ModalDialog
        visible={deleteTargetId !== null}
        title="¿Eliminar elemento?"
        description="Toda acción destructiva en el framework requiere confirmación modal."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            void controller.deleteItem(deleteTargetId);
          }
          setDeleteTargetId(null);
        }}
      />
    </AppShell>
  );
}

