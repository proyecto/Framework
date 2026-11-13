/**
 * Límites visuales y estructurales de MTGInvest heredados de la plantilla base.
 */
export const APP_LAYOUT_BOUNDS = {
  minBottomTabs: 2,
  maxBottomTabs: 4,
  settingsTab: {
    id: 'settings',
    label: 'Ajustes',
    icon: 'settings'
  },
  maxCardFooterActions: 2,
  toastDurationMs: 3500
} as const;

