import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftSlot?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftSlot,
  fullWidth = false,
  style
}: ButtonProps) {
  const theme = useFrameworkTheme();
  const isDisabled = disabled || loading;

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const paddingH = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 15;

  const palette = (() => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.colors.surfaceMuted,
          border: theme.colors.border,
          text: theme.colors.textPrimary
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: theme.colors.border,
          text: theme.colors.textPrimary
        };
      case 'danger':
        return {
          bg: theme.colors.danger,
          border: theme.colors.danger,
          text: '#FFFFFF'
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: 'transparent',
          text: theme.colors.accent
        };
      case 'primary':
      default:
        return {
          bg: theme.colors.accent,
          border: theme.colors.accent,
          text: theme.colors.textInverse
        };
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.spacing.sm,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'ghost' ? 0 : 1,
          borderRadius: theme.radius.md,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto'
        },
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.text} />
      ) : (
        leftSlot && <View>{leftSlot}</View>
      )}
      <Text
        style={{
          color: palette.text,
          fontSize,
          fontWeight: '600'
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

