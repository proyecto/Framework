import { Text, TextInput, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';

export interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  multiline?: boolean;
}

/** Campo de texto estándar del Design System con etiqueta superior y validación visual inline. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false
}: TextFieldProps) {
  const theme = useFrameworkTheme();

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text
        style={{
          color: theme.colors.textPrimary,
          fontSize: theme.typography.captionSize,
          fontWeight: '600'
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        multiline={multiline}
        style={{
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          color: theme.colors.textPrimary,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm + 2,
          fontSize: theme.typography.bodySize,
          minHeight: multiline ? 76 : 44
        }}
      />
      {error ? (
        <Text
          style={{
            color: theme.colors.danger,
            fontSize: theme.typography.captionSize
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
