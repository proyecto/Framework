import { Pressable, Text, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';

export interface SwitchToggleProps {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (next: boolean) => void;
}

/** Interruptor accesible reutilizable implementado sin componentes nativos dependientes de plataforma. */
export function SwitchToggle({
  label,
  description,
  value,
  disabled = false,
  onValueChange
}: SwitchToggleProps) {
  const theme = useFrameworkTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        opacity: disabled ? 0.5 : 1
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: theme.typography.bodySize,
            ...textTypographyStyle(theme, 'semibold')
          }}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              color: theme.colors.textSecondary,
              fontSize: theme.typography.captionSize,
              ...textTypographyStyle(theme, 'regular')
            }}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          width: 48,
          height: 28,
          borderRadius: theme.radius.full,
          backgroundColor: value ? theme.colors.accent : theme.colors.trackInactive,
          padding: 3,
          justifyContent: 'center',
          alignItems: value ? 'flex-end' : 'flex-start'
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: theme.radius.full,
            backgroundColor: '#FFFFFF'
          }}
        />
      </View>
    </Pressable>
  );
}
