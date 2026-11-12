import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { IPresetController } from '@framework/example-domain';
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

type ScreenTab = 'scenes' | 'cloud';

export interface PresetStudioScreenProps {
  /** Interfaz pura del Controlador MVC: esta vista jamás importa el Modelo ni el Repositorio. */
  controller: IPresetController;
  themePreference: ThemeScheme;
  onThemePreferenceChange: (next: ThemeScheme) => void;
  apiBaseUrl: string;
  onApiBaseUrlChange: (nextUrl: string) => void;
}

/**
 * Vista Android (`Expo` + `@framework/ui`).
 * Consume exclusivamente `IPresetController` a través del adaptador `useMvcController`.
 */
export function PresetStudioScreen({
  controller,
  themePreference,
  onThemePreferenceChange,
  apiBaseUrl,
  onApiBaseUrlChange
}: PresetStudioScreenProps) {
  const theme = useFrameworkTheme();
  const env = useFrameworkEnvironment();
  const [activeTab, setActiveTab] = useState<ScreenTab>('scenes');
  const [toast, setToast] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [draftApiUrl, setDraftApiUrl] = useState(apiBaseUrl);

  useEffect(() => {
    setDraftApiUrl(apiBaseUrl);
  }, [apiBaseUrl]);

  // Suscripción reactiva al Controlador usando el contrato IView.
  const state = useMvcController(controller, {
    onEvent: (event) => {
      setToast(event.message);
      if (event.type === 'upgrade-required') {
        setActiveTab('cloud');
      }
    }
  });

  // Limpia automáticamente el banner tipo toast tras 3.5 segundos.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const visiblePresets = state.filterFavoritesOnly
    ? state.presets.filter((p) => p.isFavorite)
    : state.presets;
  const selectedPreset =
    state.presets.find((p) => p.id === state.selectedPresetId) ?? state.presets[0] ?? null;

  const handleCreate = async () => {
    await controller.createPreset({
      name: newName,
      notes: newNotes
    });
    if (newName.trim()) {
      setNewName('');
      setNewNotes('');
    }
  };

  return (
    <AppShell<ScreenTab>
      appName={env.appName}
      subtitle={`Framework MVC · ${env.platformName}`}
      toastMessage={toast}
      tabs={[
        { id: 'scenes', label: 'Escenas' },
        { id: 'cloud', label: 'Nube & Ajustes' }
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerRight={
        <Badge
          label={state.storage.plan === 'pro' ? 'PRO' : 'GRATIS'}
          tone={state.storage.plan === 'pro' ? 'accent' : 'neutral'}
        />
      }
      topBanner={
        <StorageStatusBar
          status={state.storage}
          onSyncPress={() => void controller.syncNow()}
          onManagePress={() => setActiveTab('cloud')}
        />
      }
    >
      {activeTab === 'scenes' ? (
        <>
          {/* Lista seleccionable de escenas + filtro rápido de favoritas */}
          <Card
            title="Tus escenas"
            subtitle="Selecciona una escena para ajustar sus controles"
            rightSlot={
              <Button
                size="sm"
                variant={state.filterFavoritesOnly ? 'primary' : 'outline'}
                label={state.filterFavoritesOnly ? 'Solo favoritas' : 'Todas'}
                onPress={() =>
                  controller.setFilterFavoritesOnly(!state.filterFavoritesOnly)
                }
              />
            }
          >
            {visiblePresets.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary }}>
                No hay escenas con este filtro. Crea una nueva abajo.
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {visiblePresets.map((preset) => {
                  const selected = preset.id === selectedPreset?.id;
                  return (
                    <View
                      key={preset.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8
                      }}
                    >
                      <Button
                        size="sm"
                        variant={selected ? 'primary' : 'secondary'}
                        label={`${preset.isFavorite ? '★ ' : ''}${preset.name}${
                          preset.isActive ? ' · Activa' : ''
                        }`}
                        onPress={() => controller.selectPreset(preset.id)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Inspector de escena seleccionada usando Sliders y Switch del Design System */}
          {selectedPreset ? (
            <Card
              highlighted={selectedPreset.isActive}
              title={selectedPreset.name}
              subtitle={selectedPreset.notes || 'Sin descripción'}
              rightSlot={
                <Badge
                  label={selectedPreset.isActive ? 'Activa' : 'Inactiva'}
                  tone={selectedPreset.isActive ? 'success' : 'neutral'}
                />
              }
            >
              <Slider
                label="Intensidad ambiente"
                value={selectedPreset.ambientLevel}
                min={0}
                max={100}
                step={5}
                unit="%"
                onSlidingComplete={(val) =>
                  void controller.updateSlider(selectedPreset.id, 'ambientLevel', val)
                }
              />

              <Slider
                label="Calidez"
                value={selectedPreset.warmthLevel}
                min={0}
                max={100}
                step={5}
                unit="%"
                onSlidingComplete={(val) =>
                  void controller.updateSlider(selectedPreset.id, 'warmthLevel', val)
                }
              />

              <Slider
                label="Duración enfoque"
                value={selectedPreset.focusMinutes}
                min={5}
                max={120}
                step={5}
                unit=" min"
                onSlidingComplete={(val) =>
                  void controller.updateSlider(selectedPreset.id, 'focusMinutes', val)
                }
              />

              <SwitchToggle
                label="Marcar como favorita"
                value={selectedPreset.isFavorite}
                onValueChange={() => void controller.toggleFavorite(selectedPreset.id)}
              />

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Button
                  size="sm"
                  variant="primary"
                  label={selectedPreset.isActive ? 'Activa ahora' : 'Activar escena'}
                  disabled={selectedPreset.isActive}
                  onPress={() => void controller.activatePreset(selectedPreset.id)}
                  style={{ flex: 1 }}
                />
                <Button
                  size="sm"
                  variant="danger"
                  label="Eliminar"
                  onPress={() => setDeleteTargetId(selectedPreset.id)}
                />
              </View>
            </Card>
          ) : null}

          {/* Formulario de creación conectado directamente al Controlador */}
          <Card title="Nueva escena" subtitle="Se guarda en local o en la nube según tu modo">
            <TextField
              label="Nombre"
              value={newName}
              onChangeText={setNewName}
              placeholder="Ej. Café de mañana"
              error={state.errorMessage ?? undefined}
            />
            <TextField
              label="Notas"
              value={newNotes}
              onChangeText={setNewNotes}
              placeholder="Descripción opcional"
            />
            <Button
              label="Crear escena"
              loading={state.busy}
              onPress={() => void handleCreate()}
              fullWidth
            />
          </Card>
        </>
      ) : (
        <>
          {/* Gestión transparente de almacenamiento Local (Gratis) vs Nube (Pro) */}
          <Card
            title="Almacenamiento y Nube"
            subtitle="Tú decides si tus datos permanecen solo en el móvil o se sincronizan"
          >
            <SegmentedControl
              value={state.storage.mode}
              options={[
                { value: 'local', label: 'Local (Gratis)' },
                { value: 'cloud', label: 'Nube (Pro)' }
              ]}
              onChange={(nextMode) => void controller.setStorageMode(nextMode)}
            />

            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
              {state.storage.mode === 'local'
                ? 'Modo Local: tus escenas no salen de este teléfono. Si borras la app se perderán.'
                : 'Modo Nube activo: tus datos se respaldan automáticamente y puedes abrirlos en otro dispositivo.'}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
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
            </View>
          </Card>

          <Card title="Apariencia y Servidor">
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
              label="URL Backend (emulador 10.0.2.2 o IP local)"
              value={draftApiUrl}
              onChangeText={setDraftApiUrl}
              placeholder="http://10.0.2.2:4000"
            />
            <Button
              size="sm"
              variant="secondary"
              label="Aplicar URL del servidor"
              onPress={() => onApiBaseUrlChange(draftApiUrl.trim())}
            />
          </Card>
        </>
      )}

      <ModalDialog
        visible={deleteTargetId !== null}
        title="¿Eliminar escena?"
        description="Esta acción eliminará la escena seleccionada."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) {
            void controller.deletePreset(deleteTargetId);
          }
          setDeleteTargetId(null);
        }}
      />
    </AppShell>
  );
}
