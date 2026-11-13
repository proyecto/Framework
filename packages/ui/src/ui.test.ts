import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => {
  const host =
    (tag: string) =>
    ({ children, ...rest }: { children?: unknown; [key: string]: unknown }) =>
      createElement(tag, { 'data-rn': true, ...(typeof rest.accessibilityRole === 'string' ? { role: rest.accessibilityRole } : {}) }, children as never);

  return {
    useColorScheme: () => 'light',
    View: host('div'),
    Text: host('span'),
    Pressable: ({ children, ...rest }: { children?: unknown; [key: string]: unknown }) =>
      createElement('button', { type: 'button', 'data-role': rest.accessibilityRole }, children as never),
    ScrollView: host('div'),
    Modal: ({ visible, children }: { visible?: boolean; children?: unknown }) =>
      visible ? createElement('div', { 'data-modal': true }, children as never) : null,
    TextInput: ({ value, placeholder }: { value?: string; placeholder?: string }) =>
      createElement('input', { defaultValue: value, placeholder }),
    ActivityIndicator: () => createElement('span', null, 'loading'),
    PanResponder: {
      create: () => ({ panHandlers: {} })
    }
  };
});

import { FrameworkThemeProvider, useFrameworkThemeContext } from './ThemeProvider.js';
import { AppShell, ModalDialog } from './components/AppShell.js';
import { Badge, SegmentedControl } from './components/Badge.js';
import { Button } from './components/Button.js';
import { Card } from './components/Card.js';
import { GoogleIcon } from './components/Icon.js';
import { Calendar, formatDateIso, parseDateIso } from './components/Calendar.js';
import { Select } from './components/Select.js';
import { SearchInput } from './components/SearchInput.js';
import { SimpleLineChart } from './components/SimpleLineChart.js';
import { Slider } from './components/Slider.js';
import { StorageStatusBar } from './components/StorageStatusBar.js';
import { SwitchToggle } from './components/SwitchToggle.js';
import { TextField } from './components/TextField.js';
import {
  CRIMSON_THEME,
  DARK_THEME,
  LIGHT_THEME,
  OBSIDIAN_THEME,
  THEME_PRESETS,
  textTypographyStyle,
  type FrameworkTheme
} from './tokens.js';

describe('@framework/ui design tokens & typography resolver', () => {
  it('defines coherent geometric metrics and color palettes for light and dark schemes', () => {
    expect(LIGHT_THEME.scheme).toBe('light');
    expect(DARK_THEME.scheme).toBe('dark');

    // Mismo espaciado y radios garantizados entre temas
    expect(LIGHT_THEME.spacing).toEqual(DARK_THEME.spacing);
    expect(LIGHT_THEME.radius).toEqual(DARK_THEME.radius);
    expect(LIGHT_THEME.typography.titleSize).toBe(DARK_THEME.typography.titleSize);

    // Tokens de color presentes
    expect(LIGHT_THEME.colors.background).toBeTruthy();
    expect(LIGHT_THEME.colors.accent).toBeTruthy();
    expect(DARK_THEME.colors.background).toBeTruthy();
    expect(DARK_THEME.colors.accent).toBeTruthy();

    // Temas estilizados adicionales (Carmesí estilo Todoist y Obsidiana estilo Obsidian)
    expect(CRIMSON_THEME.scheme).toBe('light');
    expect(CRIMSON_THEME.colors.accent).toBe('#DC4C3E');
    expect(OBSIDIAN_THEME.scheme).toBe('dark');
    expect(OBSIDIAN_THEME.colors.accent).toBe('#8B5CF6');
    expect(THEME_PRESETS.crimson).toBe(CRIMSON_THEME);
    expect(THEME_PRESETS.obsidian).toBe(OBSIDIAN_THEME);
  });

  it('resolves standard fontWeight when custom font families are not defined', () => {
    expect(textTypographyStyle(LIGHT_THEME, 'regular')).toEqual({ fontWeight: '400' });
    expect(textTypographyStyle(LIGHT_THEME, 'medium')).toEqual({ fontWeight: '500' });
    expect(textTypographyStyle(LIGHT_THEME, 'semibold')).toEqual({ fontWeight: '600' });
    expect(textTypographyStyle(LIGHT_THEME, 'bold')).toEqual({ fontWeight: '700' });
    expect(textTypographyStyle(LIGHT_THEME, 'extrabold')).toEqual({ fontWeight: '800' });
  });

  it('resolves dedicated fontFamily per weight without conflicting fontWeight on custom Google Fonts', () => {
    const customTheme: FrameworkTheme = {
      ...LIGHT_THEME,
      typography: {
        ...LIGHT_THEME.typography,
        fonts: {
          regular: 'Inter_400Regular',
          medium: 'Inter_500Medium',
          semibold: 'Inter_600SemiBold',
          bold: 'Inter_700Bold',
          extrabold: 'Inter_800ExtraBold'
        }
      }
    };

    expect(textTypographyStyle(customTheme, 'bold')).toEqual({ fontFamily: 'Inter_700Bold' });
    expect(textTypographyStyle(customTheme, 'regular')).toEqual({ fontFamily: 'Inter_400Regular' });
    expect(textTypographyStyle(customTheme, 'semibold')).toEqual({ fontFamily: 'Inter_600SemiBold' });
  });

  it('injects Google Icon adapter via FrameworkThemeProvider and degrades safely when absent', () => {
    const fallbackHtml = renderToStaticMarkup(
      createElement(GoogleIcon, { name: 'dashboard', size: 'lg' })
    );
    expect(fallbackHtml).toContain('•');

    const renderedCalls: Array<{ name: string; size: number; color: string }> = [];
    const withAdapterHtml = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'dark',
        fontFamilies: { regular: 'Inter_400Regular', bold: 'Inter_700Bold' },
        iconRenderer: (params) => {
          renderedCalls.push(params);
          return createElement('span', { 'data-icon': params.name }, `icon:${params.name}`);
        },
        children: createElement(AppShell<'main'>, {
          appName: 'App Test',
          tabs: [{ id: 'main', label: 'Inicio', icon: 'dashboard' }],
          activeTab: 'main',
          onTabChange: () => {},
          topBanner: createElement(StorageStatusBar, {
            status: {
              mode: 'local',
              plan: 'free',
              cloudEnabled: false,
              pendingChanges: 0,
              lastSyncedAt: null,
              isSyncing: false,
              lastSyncError: null
            },
            onManagePress: () => {}
          }),
          children: createElement(Button, { label: 'Guardar', icon: 'save', onPress: () => {} })
        })
      })
    );

    expect(withAdapterHtml).toContain('icon:dashboard');
    expect(withAdapterHtml).toContain('icon:cloud-off');
    expect(withAdapterHtml).toContain('icon:cloud-upload');
    expect(withAdapterHtml).toContain('icon:save');
    expect(renderedCalls.some((c) => c.name === 'save' && c.color === DARK_THEME.colors.textInverse)).toBe(
      true
    );
  });

  it('supports crimson and obsidian themes via FrameworkThemeProvider and useFrameworkThemeContext', () => {
    function ThemeProbe() {
      const { theme, preference, setPreference } = useFrameworkThemeContext();
      return createElement(
        'div',
        { 'data-theme-scheme': theme.scheme, 'data-accent': theme.colors.accent, 'data-preference': preference },
        createElement('button', { onClick: () => setPreference('obsidian') }, 'Switch')
      );
    }

    const crimsonHtml = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'crimson',
        children: createElement(ThemeProbe)
      })
    );
    expect(crimsonHtml).toContain('data-theme-scheme="light"');
    expect(crimsonHtml).toContain(`data-accent="${CRIMSON_THEME.colors.accent}"`);
    expect(crimsonHtml).toContain('data-preference="crimson"');

    const obsidianHtml = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'obsidian',
        children: createElement(ThemeProbe)
      })
    );
    expect(obsidianHtml).toContain('data-theme-scheme="dark"');
    expect(obsidianHtml).toContain(`data-accent="${OBSIDIAN_THEME.colors.accent}"`);
    expect(obsidianHtml).toContain('data-preference="obsidian"');
  });

  it('renders Card, Badge, SegmentedControl, Slider, SwitchToggle, TextField and ModalDialog without native linkage', () => {
    const html = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'light',
        children: createElement(Card, {
          title: 'Tarjeta Base',
          subtitle: 'Subtítulo',
          icon: 'tune',
          highlighted: true,
          rightSlot: createElement(Badge, { label: 'PRO', tone: 'accent' }),
          children: [
            createElement(SegmentedControl<'local' | 'cloud'>, {
              key: 'seg',
              value: 'local',
              options: [
                { value: 'local', label: 'Local' },
                { value: 'cloud', label: 'Nube' }
              ],
              onChange: () => {}
            }),
            createElement(Slider, {
              key: 'slider',
              label: 'Nivel',
              value: 65,
              min: 0,
              max: 100,
              step: 5,
              unit: '%'
            }),
            createElement(SwitchToggle, {
              key: 'switch',
              label: 'Activo',
              description: 'Estado principal',
              value: true,
              onValueChange: () => {}
            }),
            createElement(TextField, {
              key: 'field',
              label: 'Nombre',
              value: 'Perfil Base',
              placeholder: 'Escribe...',
              error: 'Campo requerido',
              onChangeText: () => {}
            }),
            createElement(ModalDialog, {
              key: 'modal',
              visible: true,
              title: 'Confirmar',
              description: 'Acción destructiva',
              destructive: true,
              onConfirm: () => {},
              onCancel: () => {}
            })
          ]
        })
      })
    );

    expect(html).toContain('Tarjeta Base');
    expect(html).toContain('PRO');
    expect(html).toContain('Local');
    expect(html).toContain('65%');
    expect(html).toContain('Activo');
    expect(html).toContain('Campo requerido');
    expect(html).toContain('Confirmar');
  });

  it('renders SimpleLineChart with multi-series, labels, unit and interactive legend', () => {
    const html = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'light',
        children: createElement(SimpleLineChart, {
          unit: '€',
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
          series: [
            { id: 'aapl', name: 'Apple', color: '#3B82F6', values: [150, 155, 153, 162, 160] },
            { id: 'goog', name: 'Google', color: '#10B981', values: [130, 132, 138, 140, 142] }
          ],
          timeframeOptions: [
            { value: '1D', label: '1D' },
            { value: '1W', label: '1S' },
            { value: '1M', label: '1M' }
          ],
          activeTimeframe: '1W',
          onTimeframeChange: () => {}
        })
      })
    );

    expect(html).toContain('Apple');
    expect(html).toContain('Google');
    expect(html).toContain('160.0€');
    expect(html).toContain('142.0€');
    expect(html).toContain('1S');
  });

  it('formats and parses ISO dates without timezone shift', () => {
    expect(formatDateIso(2026, 11, 13)).toBe('2026-11-13');
    expect(formatDateIso(2026, 5, 4)).toBe('2026-05-04');
    expect(parseDateIso('2026-11-13')).toEqual({ year: 2026, month: 11, day: 13 });
    expect(parseDateIso('invalid-date')).toBeNull();
  });

  it('renders Calendar with month header, weekdays, day cells and marked events', () => {
    const html = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'light',
        children: createElement(Calendar, {
          initialYear: 2026,
          initialMonth: 11,
          selectedDate: '2026-11-13',
          firstDayOfWeek: 1,
          markedDates: {
            '2026-11-13': { marked: true, dotColor: '#3B82F6' },
            '2026-11-20': { marked: true, dotColor: '#10B981' }
          }
        })
      })
    );

    // Encabezado de mes y año
    expect(html).toContain('Noviembre 2026');
    // Botón Hoy
    expect(html).toContain('Hoy');
    // Días de la semana
    expect(html).toContain('Lun');
    expect(html).toContain('Mar');
    expect(html).toContain('Mié');
    expect(html).toContain('Dom');
    // Días del mes representados
    expect(html).toContain('13');
    expect(html).toContain('20');
  });

  it('renders Select with label, placeholder, and selected option value and badge', () => {
    const html = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'light',
        children: createElement(Select, {
          label: 'Edición',
          value: '2ED',
          options: [
            { label: 'Unlimited Edition', value: '2ED', badge: '2ED', description: '1993' },
            { label: 'Revised Edition', value: '3ED', badge: '3ED', description: '1994' }
          ],
          onChange: () => {}
        })
      })
    );

    expect(html).toContain('Edición');
    expect(html).toContain('Unlimited Edition');
    expect(html).toContain('2ED');
  });

  it('renders SearchInput with search icon and placeholder', () => {
    const html = renderToStaticMarkup(
      createElement(FrameworkThemeProvider, {
        preference: 'light',
        children: createElement(SearchInput, {
          value: 'Serra Angel',
          placeholder: 'Buscar cartas...',
          onChangeText: () => {}
        })
      })
    );

    expect(html).toContain('Buscar cartas...');
    expect(html).toContain('Serra Angel');
  });
});
