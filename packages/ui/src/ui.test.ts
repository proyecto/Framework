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

import { FrameworkThemeProvider } from './ThemeProvider.js';
import { AppShell, ModalDialog } from './components/AppShell.js';
import { Badge, SegmentedControl } from './components/Badge.js';
import { Button } from './components/Button.js';
import { Card } from './components/Card.js';
import { GoogleIcon } from './components/Icon.js';
import { Slider } from './components/Slider.js';
import { StorageStatusBar } from './components/StorageStatusBar.js';
import { SwitchToggle } from './components/SwitchToggle.js';
import { TextField } from './components/TextField.js';
import {
  DARK_THEME,
  LIGHT_THEME,
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
});
