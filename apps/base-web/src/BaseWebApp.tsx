import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { useFrameworkEnvironment, useMvcController } from '@framework/react';
import { WEB_LAYOUT_BOUNDS } from './bounds';
import type { IBaseAppController } from './mvc';

type ColorSchemeSetting = 'system' | 'light' | 'dark';

function readStoredScheme(): ColorSchemeSetting {
  try {
    const val = localStorage.getItem('color-scheme');
    if (val === 'light' || val === 'dark') return val;
  } catch {
    // Ignora restricciones de acceso a localStorage.
  }
  return 'system';
}

function applySchemeMeta(scheme: ColorSchemeSetting): void {
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) {
    meta.setAttribute('content', scheme === 'system' ? 'light dark' : scheme);
  }
}

interface BaseRangeSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (next: number) => void;
}

function BaseRangeSlider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange
}: BaseRangeSliderProps) {
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
        onInput={(e) => setDraft(Number((e.target as HTMLInputElement).value))}
        onChange={(e) => {
          const next = Number(e.target.value);
          setDraft(next);
          onChange(next);
        }}
      />
    </div>
  );
}

/** Fallback progresivo para `<dialog closedby="any">` en navegadores sin soporte nativo. */
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

/**
 * Vista Web canónica (`@framework/base-web`).
 *
 * Establece los límites visuales, estructurales y de tokens CSS en capas que deben seguir
 * todas las aplicaciones Web del framework, espejando el flujo MVC de `@framework/base-expo`.
 */
export function BaseWebApp({ controller }: { controller: IBaseAppController }) {
  const env = useFrameworkEnvironment();
  const [toast, setToast] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [schemeSetting, setSchemeSetting] = useState<ColorSchemeSetting>(() =>
    readStoredScheme()
  );
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  const pendingDeleteIdRef = useRef<string | null>(null);
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const settingsHeadingId = useId();
  const deleteHeadingId = useId();
  const enabledSwitchId = useId();

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
    const timer = setTimeout(() => setToast(null), WEB_LAYOUT_BOUNDS.toastDurationMs);
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
        pendingDeleteIdRef.current = null;
        if (choice === 'delete' && targetId) {
          void controller.deleteItem(targetId);
        }
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
      // Ignora errores de escritura en almacenamiento.
    }
  };

  const visibleItems = state.onlyEnabledFilter
    ? state.items.filter((item) => item.enabled)
    : state.items;
  const selectedItem =
    state.items.find((item) => item.id === state.selectedItemId) ??
    state.items[0] ??
    null;

  return (
    <div className="base-shell">
      <header className="base-topbar">
        <div className="base-title-group">
          <h1>
            {env.appName} · {env.platformName}
          </h1>
          <p className="base-subtitle">
            Plantilla visual canónica y límites del framework MVC ({WEB_LAYOUT_BOUNDS.maxWorkspaceWidthPx}px máx.)
          </p>
        </div>

        <div className="base-topbar-actions">
          <span className={`pill ${state.storage.cloudEnabled ? 'cloud' : ''}`}>
            {state.storage.cloudEnabled ? 'Nube Pro sincronizada' : 'Solo local (Gratis)'}
          </span>
          <span className={`pill ${state.storage.plan === 'pro' ? 'pro' : ''}`}>
            {state.storage.plan === 'pro' ? 'Plan Pro' : 'Plan Base'}
          </span>
          {state.storage.cloudEnabled ? (
            <button
              type="button"
              className="btn"
              disabled={state.storage.isSyncing}
              onClick={() => void controller.syncNow()}
            >
              {state.storage.isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={() => settingsDialogRef.current?.showModal()}
          >
            Nube, Tema y Límites
          </button>
        </div>
      </header>

      <div className="base-grid">
        <aside className="panel base-sidebar" aria-label="Lista maestra y alta">
          <div className="panel-header">
            <h2>1. Lista maestra</h2>
            <button
              type="button"
              className="btn"
              onClick={() => controller.setOnlyEnabledFilter(!state.onlyEnabledFilter)}
            >
              {state.onlyEnabledFilter ? 'Activos' : 'Todos'}
            </button>
          </div>

          <nav aria-label="Elementos base">
            <ul className="item-list">
              {visibleItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="item-select-btn"
                    aria-current={item.id === selectedItem?.id ? 'true' : undefined}
                    onClick={() => controller.selectItem(item.id)}
                  >
                    <span>
                      {item.isPrimary ? '★ ' : ''}
                      {item.title}
                    </span>
                    {item.isPrimary ? <span className="pill cloud">Principal</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <form
            className="field-group"
            onSubmit={(e) => {
              e.preventDefault();
              void controller.createItem({ title: newTitle, description: newDescription });
              if (newTitle.trim()) {
                setNewTitle('');
                setNewDescription('');
              }
            }}
          >
            <h3>2. Entrada estándar</h3>
            <div className="field-group">
              <label htmlFor="base-item-title">Título</label>
              <input
                id="base-item-title"
                className="text-input"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej. Módulo base"
              />
            </div>
            <div className="field-group">
              <label htmlFor="base-item-desc">Descripción</label>
              <input
                id="base-item-desc"
                className="text-input"
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descripción opcional"
              />
            </div>
            <button type="submit" className="btn primary" disabled={state.busy}>
              Crear elemento
            </button>
          </form>
        </aside>

        <main className="panel base-main">
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

          {selectedItem ? (
            <>
              <div className="panel-header">
                <div>
                  <h2>{selectedItem.title}</h2>
                  <p className="base-subtitle">
                    {selectedItem.description || 'Inspector de controles canónicos'}
                  </p>
                </div>
                <span className={`pill ${selectedItem.isPrimary ? 'cloud' : ''}`}>
                  {selectedItem.isPrimary ? 'Principal' : 'Estándar'}
                </span>
              </div>

              <div className="preview-meter" aria-label="Métricas base">
                <div className="preview-stat">
                  <span className="preview-stat-label">Nivel</span>
                  <span className="preview-stat-value">{selectedItem.level}%</span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Estado</span>
                  <span className="preview-stat-value">
                    {selectedItem.enabled ? 'Activo' : 'Pausado'}
                  </span>
                </div>
                <div className="preview-stat">
                  <span className="preview-stat-label">Pendientes</span>
                  <span className="preview-stat-value">{state.storage.pendingChanges}</span>
                </div>
              </div>

              <BaseRangeSlider
                label="Nivel estándar (0–100%)"
                value={selectedItem.level}
                min={0}
                max={100}
                step={WEB_LAYOUT_BOUNDS.defaultSliderStep}
                unit="%"
                onChange={(val) => void controller.updateLevel(selectedItem.id, val)}
              />

              <label className="switch-label" htmlFor={enabledSwitchId}>
                <span>Estado habilitado</span>
                <input
                  id={enabledSwitchId}
                  type="checkbox"
                  checked={selectedItem.enabled}
                  onChange={() => void controller.toggleEnabled(selectedItem.id)}
                  {...({ switch: '' } as Record<string, string>)}
                />
              </label>

              <div className="inspector-actions">
                <button
                  type="button"
                  className="btn primary"
                  disabled={selectedItem.isPrimary}
                  onClick={() => void controller.markAsPrimary(selectedItem.id)}
                >
                  {selectedItem.isPrimary ? 'Es principal' : 'Marcar como principal'}
                </button>
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => {
                    pendingDeleteIdRef.current = selectedItem.id;
                    deleteDialogRef.current?.showModal();
                  }}
                >
                  Eliminar
                </button>
              </div>
            </>
          ) : (
            <p className="base-subtitle">
              Selecciona o crea un elemento en la columna izquierda.
            </p>
          )}

          <section className="bounds-card" aria-label="Límites del Design System">
            <h3>Límites visuales y de arquitectura</h3>
            <ul className="bounds-list">
              {WEB_LAYOUT_BOUNDS.designRules.map((rule, index) => (
                <li key={index}>{rule}</li>
              ))}
            </ul>
          </section>
        </main>
      </div>

      <dialog
        ref={settingsDialogRef}
        className="base-dialog"
        aria-labelledby={settingsHeadingId}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="dialog-header">
          <h2 id={settingsHeadingId}>Nube, Tema y Límites</h2>
          <form method="dialog">
            <button type="submit" className="btn" value="close">
              Cerrar
            </button>
          </form>
        </div>

        <div className="field-group">
          <p className="base-subtitle">
            {state.storage.mode === 'local'
              ? 'Modo Local (Gratis): tus datos permanecen únicamente en este navegador.'
              : 'Modo Nube (Pro): tus datos se sincronizan entre dispositivos a través de @framework/server.'}
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
              Activar Plan Pro y nube
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

          <h3>Esquema de color</h3>
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
        className="base-dialog"
        aria-labelledby={deleteHeadingId}
        {...({ closedby: 'any' } as Record<string, string>)}
      >
        <div className="dialog-header">
          <h2 id={deleteHeadingId}>¿Eliminar elemento?</h2>
        </div>
        <p className="base-subtitle">
          Toda acción destructiva en el framework requiere confirmación modal explícita.
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

