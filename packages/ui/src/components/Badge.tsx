import { Pressable, Text, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle, type FrameworkTheme } from '../tokens.js';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

/** Estrategia de mapeo semántico entre tono de insignia y tokens de color del tema. */
const BADGE_TONE_PALETTES: Record<
  BadgeTone,
  (colors: FrameworkTheme['colors']) => { bg: string; text: string }
> = {
  neutral: (c) => ({ bg: c.surfaceMuted, text: c.textSecondary }),
  accent: (c) => ({ bg: c.accentSoft, text: c.accentText }),
  success: (c) => ({ bg: c.successSoft, text: c.success }),
  warning: (c) => ({ bg: c.warningSoft, text: c.warning }),
  danger: (c) => ({ bg: c.dangerSoft, text: c.danger })
};

/** Etiqueta compacta para mostrar estado del plan (`PRO`/`GRATIS`), sincronización o escena activa. */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useFrameworkTheme();
  const palette = BADGE_TONE_PALETTES[tone](theme.colors);

  return (
    <View
      style={{
        backgroundColor: palette.bg,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.spacing.sm + 2,
        paddingVertical: theme.spacing.xs
      }}
    >
      <Text
        style={{
          color: palette.text,
          fontSize: theme.typography.captionSize,
          ...textTypographyStyle(theme, 'bold')
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
}

/** Control segmentado reutilizable (p. ej. interruptor Local vs Nube o selector de tema). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: SegmentedControlProps<T>) {
  const theme = useFrameworkTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceMuted,
        borderRadius: theme.radius.md,
        padding: 4,
        gap: 4
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(opt.value)}
            style={{
              flex: 1,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              backgroundColor: active ? theme.colors.surface : 'transparent'
            }}
          >
            <Text
              style={{
                color: active ? theme.colors.textPrimary : theme.colors.textSecondary,
                fontSize: theme.typography.captionSize + 1,
                ...textTypographyStyle(theme, active ? 'bold' : 'medium')
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
