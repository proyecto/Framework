import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle, type FrameworkTheme } from '../tokens.js';
import { GoogleIcon, type GoogleIconName } from './Icon.js';

export type ToggleChipTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger';

export interface ToggleChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: GoogleIconName;
  tone?: ToggleChipTone;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

const TONE_SELECTED_STYLES: Record<
  ToggleChipTone,
  (colors: FrameworkTheme['colors']) => { bg: string; border: string; text: string; icon: string }
> = {
  accent: (c) => ({ bg: c.accentSoft, border: c.accent, text: c.accent, icon: c.accent }),
  neutral: (c) => ({ bg: c.surfaceMuted, border: c.textSecondary, text: c.textPrimary, icon: c.textPrimary }),
  success: (c) => ({ bg: c.successSoft, border: c.success, text: c.success, icon: c.success }),
  warning: (c) => ({ bg: c.warningSoft, border: c.warning, text: c.warning, icon: c.warning }),
  danger: (c) => ({ bg: c.dangerSoft, border: c.danger, text: c.danger, icon: c.danger })
};

/** Chip interactivo conmutador para filtros, atributos y selecciones múltiples. */
export function ToggleChip({
  label,
  selected,
  onPress,
  icon,
  tone = 'accent',
  disabled = false,
  accessibilityLabel,
  testID,
  style
}: ToggleChipProps) {
  const theme = useFrameworkTheme();
  const selectedStyle = TONE_SELECTED_STYLES[tone](theme.colors);

  const bg = selected ? selectedStyle.bg : theme.colors.surfaceMuted;
  const borderColor = selected ? selectedStyle.border : theme.colors.border;
  const textColor = selected ? selectedStyle.text : theme.colors.textSecondary;
  const iconColor = selected ? selectedStyle.icon : theme.colors.textSecondary;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={accessibilityLabel || label}
      disabled={disabled}
      onPress={onPress}
      unstable_pressDelay={0}
      hitSlop={4}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: theme.radius.full,
          backgroundColor: bg,
          borderWidth: 1,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1
        },
        style
      ]}
    >
      {icon ? <GoogleIcon name={icon} size={14} color={iconColor} /> : null}
      <Text
        style={{
          fontSize: 12,
          color: textColor,
          ...textTypographyStyle(theme, selected ? 'bold' : 'regular')
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
