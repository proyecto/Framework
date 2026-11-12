import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import type { IPresetController } from '@framework/example-domain';
import { useMvcController } from '@framework/react';

type ColorSchemeSetting = 'system' | 'light' | 'dark';

function readStoredScheme(): ColorSchemeSetting {
  try {
    const val = localStorage.getItem('color-scheme');
    if (val === 'light' || val === 'dark') return val;
  } catch {
    // Ignore storage access restrictions.
  }
  return 'system';
}

function applySchemeMeta(scheme: ColorSchemeSetting): void {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', scheme === 'system' ? 'light dark' : scheme);
  }
}

interface NativeRangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (next: number) => void;
}

function NativeRangeSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: NativeRangeSliderProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const styleVars = {
    '--attr-min': String(min),
    '--attr-max': String(max),
    '--control-value': String(draft)
  } as CSSProperties;

  return (
    <div className="slider-row">
      <div className="slider-header">
        <label htmlFor={id}>{label}</label>
        <span className="slider-value">
          {draft}
          {unit}
        </span>
      </div>
      <input
        id={id}
        className="web-range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={draft}
        aria-valuetext={`${draft}${unit}`}
        style={styleVars}
        onInput={(e) => {
          const next = Number((e.target as HTMLInputElement).value);
          setDraft(next);
        }}
        onChange={(e) => {
          const next = Number(e.target.value);
          setDraft(next);
          onChange(next);
        }}
      />
    </div>
  );
}

function installClosedByFallback(dialog: HTMLDialogElement): () => void {
  if ('closedBy' in HTMLDialogElement.prototype) return () => {};
  const outside = (e: PointerEvent) => {
    const r = dialog.getBoundingClientRect();
    return (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    );
  };
  let pressedOutside = false;
  const onDown = (e: PointerEvent) => {
    pressedOutside = outside(e);
  };
  const onUp = (e: PointerEvent) => {
    if (pressedOutside && outside(e)) dialog.close();
  };
  dialog.addEventListener('pointerdown', onDown);
  dialog.addEventListener('pointerup', onUp);
  return () => {
    dialog.removeEventListener('pointerdown', onDown);
    dialog.removeEventListener('pointerup', onUp);
  };
}

export function WebStudioApp({ controller }: { controller: IPresetController }) {
  const [toast, setToast] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [schemeSetting, setSchemeSetting] = useState<ColorSchemeSetting>(() =>
    readStoredScheme()
  );
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);
  pendingDeleteIdRef.current = pendingDeleteId;

  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const settingsHeadingId = useId();
  const deleteHeadingId = useId();
  const favoriteSwitchId = useId();

  const state = useMvcController(controller, {
    onEvent: (event) => {
      setToast(event.message);
      if (event.type === 'upgrade-required') {
        settingsDialogRef.current?.showModal();
      }
    }
  });

  useEffect(() => {
    if (!('switch' in HTMLInputElement.prototype)) {
      void import('input-switch-polyfill');
    }
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mql.addEventListener('change', onChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        const next = readStoredScheme();
        setSchemeSetting(next);
        applySchemeMeta(next);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      mql.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const settingsEl = settingsDialogRef.current;
    const deleteEl = deleteDialogRef.current;
    const cleanups: Array<() => void> = [];

    if (settingsEl) {
      cleanups.push(installClosedByFallback(settingsEl));
      const onClose = () => {
        settingsEl.returnValue = '';
      };
      settingsEl.addEventListener('close', onClose);
      cleanups.push(() => settingsEl.removeEventListener('close', onClose));
    }

    if (deleteEl) {
      cleanups.push(installClosedByFallback(deleteEl));
      const onClose = () => {
        const choice = deleteEl.returnValue;
        deleteEl.returnValue = '';
        const targetId = pendingDeleteIdRef.current;
        if (choice === 'delete' && targetId) {
          void controller.deletePreset(targetId);
        }
        setPendingDeleteId(null);
      };
      deleteEl.addEventListener('close', onClose);
      cleanups.push(() => deleteEl.removeEventListener('close', onClose));
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [controller]);

  const updateScheme = (next: ColorSchemeSetting) => {
    setSchemeSetting(next);
    applySchemeMeta(next);
    try {
      if (next === 'system') {
        localStorage.removeItem('color-scheme');
      } else {
        localStorage.setItem('color-scheme', next);
      }
    } catch {
      // Ignore storage errors.
    }
  };

  const visiblePresets = state.filterFavoritesOnly
    ? state.presets.filter((p) => p.isFavorite)
    : state.presets;
  const selectedPreset =
    state.presets.find((p) => p.id === state.selectedPresetId) ??
    state.presets[0] ??
    null;

  return (
    <div className="studio-shell">
      <header className="studio-topbar">
        <div className="studio-title-group">
          <h1>FocusScenes · Escritorio Web</h1>
          <p className="studio-subtitle">
            Vista Web alternativa conectada al mismo Modelo y Controlador MVC
          </p>
        </div>

        <div className="studio-topbar-actions">
          <span className={`pill ${state.storage.cloudEnabled ? 'cloud' : ''}`}>
            {state.storage.cloudEnabled ? 'Nube Pro sincronizada' : 'Solo local (Gratis)'}
          </span>
          <span className={`pill ${state.storage.plan === 'pro' ? 'pro' : ''}`}>
            {state.storage.plan === 'pro' ? 'Plan Pro' : 'Plan Gratis'}
          </span>
          {state.storage.cloudEnabled ? (
            <button
              type="button"
              className="btn"
              disabled={state.storage.isSyncing}
              onClick={() => void controller.syncNow()}
            >
              {state.storage.isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={() => settingsDialogRef.current?.showModal()}
          >
            Nube y Ajustes
          </button>
        </div>
      </header>

      <div className="studio-grid">
        <aside className="panel" aria-label="Lista de escenas y creación">
          <div className="panel-header">
            <h2>Escenas</h2>
            <button
              type="button"
              className="btn"
              onClick={() =>
                controller.setFilterFavoritesOnly(!state.filterFavoritesOnly)
              }
            >
              {state.filterFavoritesOnly ? 'Favoritas ★' : 'Todas'}
            </button>
          </div>

          <nav aria-label="Escenas guardadas">
            <ul className="scene-list">
              {visiblePresets.map((preset) => (
                <li key={preset.id}>
                  <button
                    type="button"
                    className="scene-item-btn"
                    aria-current={preset.id === selectedPreset?.id ? 'true' : undefined}
                    onClick={() => controller.selectPreset(preset.id)}
                  >
                    <span>
                      {preset.isFavorite ? '★ ' : ''}
                      {preset.name}
                    </span>
                    {preset.isActive ? <span className="pill cloud">Activa</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <form
            className="field-group"
            onSubmit={(e) => {
              e.preventDefault();
              void controller.createPreset({ name: newName, notes: newNotes });
              if (newName.trim()) {
                setNewName('');
                setNewNotes('');
              }
            }}
          >
            <h3>Crear escena</h3>
            <div className="field-group">
              <label htmlFor="new-scene-name">Nombre</label>
              <input
                id="new-scene-name"
                className="text-input"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Estudio nocturno"
              />
            </div>
            <div className="field-group">
              <label htmlFor="new-scene-notes">Notas</label>
              <input
                id="new-scene-notes"
                className="text-input"
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>
            <button type="submit" className="btn primary" disabled={state.busy}>
              Añadir escena
            </button>
          </form>
        </aside>

        <main className="panel">
          {toast ? (
            <div className="toast-banner" role="status">
              {toast}
            </div>
          ) : null}

          {state.errorMessage ? (
            <div className="error-banner" role="alert">
              {state.errorMessage}
            </div>
          ) : null}

          {selectedPreset ? (
            <>
              <div className="panel-header">
                <div>
                  <h2>{selectedPreset.name}</h2>
                  <p className="studio-subtitle">
                    {selectedPreset.notes || 'Sin descripción'}
                  </p>
                </div>
                <span className={`pill ${selectedPreset.isActive ? 'cloud' : ''}`}>
                  {selectedPreset.isActive ? 'Escena activa' : 'En espera'}
                </span>
              </div>

              <div className="preview-meter" aria-label="Resumen de parámetros">
                <div className="preview-stat">
                  <span className="preview-stat-label">Ambiente</span>
                  <span className="preview-stat-value">
                    {selectedPreset.ambientLevel}%
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Calidez</span>
                  <span className="preview-stat-value">
                    {selectedPreset.warmthLevel}%
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Sesión</span>
                  <span className="preview-stat-value">
                    {selectedPreset.focusMinutes} min
                  </span>
                </div>
              </div>

              <NativeRangeSlider
                label="Intensidad ambiente"
                value={selectedPreset.ambientLevel}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(val) =>
                  void controller.updateSlider(selectedPreset.id, 'ambientLevel', val)
                }
              />

              <NativeRangeSlider
                label="Calidez"
                value={selectedPreset.warmthLevel}
                min={0}
                max={100}
                step={5}
                unit="%"
                onChange={(val) =>
                  void controller.updateSlider(selectedPreset.id, 'warmthLevel', val)
                }
              />

              <NativeRangeSlider
                label="Duración enfoque"
                value={selectedPreset.focusMinutes}
                min={5}
                max={120}
                step={5}
                unit=" min"
                onChange={(val) =>
                  void controller.updateSlider(selectedPreset.id, 'focusMinutes', val)
                }
              />

              <label className="switch-label" htmlFor={favoriteSwitchId}>
                <span>Marcar escena como favorita</span>
                <input
                  id={favoriteSwitchId}
                  type="checkbox"
                  checked={selectedPreset.isFavorite}
                  onChange={() => void controller.toggleFavorite(selectedPreset.id)}
                  {...({ switch: '' } as Record<string, string>)}
                />
              </label>

              <div className="inspector-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={selectedPreset.isActive}
                  onClick={() => void controller.activatePreset(selectedPreset.id)}
                >
                  {selectedPreset.isActive ? 'Activa actualmente' : 'Activar escena'}
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    setPendingDeleteId(selectedPreset.id);
                    deleteDialogRef.current?.showModal();
                  }}
                >
                  Eliminar escena
                </button>
              </div>
            </>
          ) : (
            <p className="studio-subtitle">
              Selecciona o crea una escena en el panel izquierdo.
            </p>
          )}
        </main>
      </div>

      <dialog
        ref={settingsDialogRef}
        className="studio-dialog"
        aria-labelledby={settingsHeadingId}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="dialog-header">
          <h2 id={settingsHeadingId}>Nube y Ajustes</h2>
          <form method="dialog">
            <button type="submit" className="btn" value="close">
              Cerrar
            </button>
          </form>
        </div>

        <div className="field-group">
          <p className="studio-subtitle">
            {state.storage.mode === 'local'
              ? 'Modo Local (Gratis): tus datos no salen de este navegador. Si borras los datos del sitio se pierden.'
              : 'Modo Nube (Pro): tus escenas se sincronizan con la nube para abrirlas en cualquier dispositivo.'}
          </p>

          <div className="theme-radio-row">
            <button
              type="button"
              className={`btn ${state.storage.mode === 'local' ? 'primary' : ''}`}
              onClick={() => void controller.setStorageMode('local')}
            >
              Local (Gratis)
            </button>
            <button
              type="button"
              className={`btn ${state.storage.mode === 'cloud' ? 'primary' : ''}`}
              onClick={() => void controller.setStorageMode('cloud')}
            >
              Nube (Pro)
            </button>
            <button
              type="button"
              className="btn"
              disabled={!state.storage.cloudEnabled || state.storage.isSyncing}
              onClick={() => void controller.syncNow()}
            >
              Sincronizar
            </button>
          </div>

          {state.storage.plan === 'free' ? (
            <button
              type="button"
              className="btn primary"
              disabled={state.busy}
              onClick={() => void controller.upgradeToProAndEnableCloud()}
            >
              Activar Plan Pro y copia en la nube
            </button>
          ) : (
            <button
              type="button"
              className="btn"
              disabled={state.busy}
              onClick={() => void controller.downgradeToFree()}
            >
              Volver a Plan Gratis (Solo local)
            </button>
          )}

          {state.storage.lastSyncError ? (
            <p className="error-banner">{state.storage.lastSyncError}</p>
          ) : null}

          <h3>Tema de interfaz</h3>
          <div className="theme-radio-row">
            <button
              type="button"
              className={`btn ${schemeSetting === 'system' ? 'primary' : ''}`}
              onClick={() => updateScheme('system')}
            >
              Sistema ({systemIsDark ? 'Oscuro' : 'Claro'})
            </button>
            <button
              type="button"
              className={`btn ${schemeSetting === 'light' ? 'primary' : ''}`}
              onClick={() => updateScheme('light')}
            >
              Claro
            </button>
            <button
              type="button"
              className={`btn ${schemeSetting === 'dark' ? 'primary' : ''}`}
              onClick={() => updateScheme('dark')}
            >
              Oscuro
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={deleteDialogRef}
        className="studio-dialog"
        aria-labelledby={deleteHeadingId}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="dialog-header">
          <h2 id={deleteHeadingId}>¿Eliminar escena?</h2>
        </div>
        <p className="studio-subtitle">
          Esta acción eliminará permanentemente la escena seleccionada.
        </p>
        <form method="dialog" className="dialog-actions">
          <button type="submit" className="btn" value="cancel" autoFocus>
            Cancelar
          </button>
          <button type="submit" className="btn danger" value="delete">
            Eliminar
          </button>
        </form>
      </dialog>
    </div>
  );
}
