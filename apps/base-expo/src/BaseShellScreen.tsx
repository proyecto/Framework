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
  Slider,
  StorageStatusBar,
  SwitchToggle,
  TextField,
  useFrameworkTheme,
  type ThemeScheme
} from '@framework/ui';
import { APP_LAYOUT_BOUNDS } from './bounds';
import type { IBaseAppController } from './mvc';

type BaseTab = 'workspace' | 'controls' | 'bounds';

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
        setActiveTab('bounds');
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
        { id: 'workspace', label: 'Estructura' },
        { id: 'controls', label: 'Controles UI' },
        { id: 'bounds', label: 'Límites & Nube' }
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
          onManagePress={() => setActiveTab('bounds')}
        />
      }
    >
      {activeTab === 'workspace' ? (
        <>
          <Card
            title="1. Lista maestra estandarizada"
            subtitle="Toda app parte de una lista seleccionable dentro de Card con filtro superior"
            rightSlot={
              <Button
                size="sm"
                variant={state.onlyEnabledFilter ? 'primary' : 'outline'}
                label={state.onlyEnabledFilter ? 'Solo activos' : 'Todos'}
                onPress={() => controller.setOnlyEnabledFilter(!state.onlyEnabledFilter)}
              />
            }
          >
            {visibleItems.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary }}>
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
                      label={`${item.isPrimary ? '★ ' : ''}${item.title} (${item.level}%)`}
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
              label="Crear elemento"
              loading={state.busy}
              onPress={() => void handleCreate()}
              fullWidth
            />
          </Card>
        </>
      ) : null}

      {activeTab === 'controls' ? (
        selectedItem ? (
          <Card
            highlighted={selectedItem.isPrimary}
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
                label={selectedItem.isPrimary ? 'Es principal' : 'Marcar principal'}
                disabled={selectedItem.isPrimary}
                onPress={() => void controller.markAsPrimary(selectedItem.id)}
                style={{ flex: 1 }}
              />
              <Button
                size="sm"
                variant="danger"
                label="Eliminar"
                onPress={() => setDeleteTargetId(selectedItem.id)}
              />
            </View>
          </Card>
        ) : (
          <Card title="Sin elemento seleccionado">
            <Text style={{ color: theme.colors.textSecondary }}>
              Crea o selecciona un elemento en la pestaña Estructura para inspeccionar sus controles.
            </Text>
          </Card>
        )
      ) : null}

      {activeTab === 'bounds' ? (
        <>
          <Card
            title="Límites del Design System"
            subtitle="Reglas obligatorias para que todas las apps compartan el mismo aspecto"
          >
            <View style={{ gap: theme.spacing.sm }}>
              {APP_LAYOUT_BOUNDS.designRules.map((rule, index) => (
                <Text
                  key={index}
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.captionSize + 1
                  }}
                >
                  {`${index + 1}. ${rule}`}
                </Text>
              ))}
              <Text
                style={{
                  color: theme.colors.accentText,
                  fontSize: theme.typography.captionSize,
                  fontWeight: '700'
                }}
              >
                {`Máx. pestañas inferiores: ${APP_LAYOUT_BOUNDS.maxBottomTabs} · Máx. acciones al pie de tarjeta: ${APP_LAYOUT_BOUNDS.maxCardFooterActions}`}
              </Text>
            </View>
          </Card>

          <Card title="Almacenamiento Local / Nube">
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
                label="Activar Plan Pro y Nube"
                loading={state.busy}
                onPress={() => void controller.upgradeToProAndEnableCloud()}
                fullWidth
              />
            ) : (
              <Button
                variant="outline"
                label="Volver a Plan Gratis (Solo local)"
                loading={state.busy}
                onPress={() => void controller.downgradeToFree()}
                fullWidth
              />
            )}
          </Card>

          <Card title="Tema y Servidor">
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
              label="Aplicar URL"
              onPress={() => onApiBaseUrlChange(draftApiUrl.trim())}
            />
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

