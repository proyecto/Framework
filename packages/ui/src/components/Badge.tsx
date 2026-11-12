import { Pressable, Text, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useFrameworkTheme();

  const palette = (() => {
    switch (tone) {
      case 'accent':
        return { bg: theme.colors.accentSoft, text: theme.colors.accentText };
      case 'success':
        return { bg: theme.colors.successSoft, text: theme.colors.success };
      case 'warning':
        return { bg: theme.colors.warningSoft, text: theme.colors.warning };
      case 'danger':
        return { bg: theme.colors.dangerSoft, text: theme.colors.danger };
      case 'neutral':
      default:
        return { bg: theme.colors.surfaceMuted, text: theme.colors.textSecondary };
    }
  })();

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
          fontWeight: '700'
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
                fontWeight: active ? '700' : '500'
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

