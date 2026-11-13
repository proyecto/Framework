import { Pressable, TextInput, View, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { GoogleIcon } from './Icon.js';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/**
 * Campo de búsqueda reutilizable con icono de lupa integrado y botón de limpieza automática.
 * Construido exclusivamente con primitivas estándar de React Native.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Buscar...',
  onClear,
  autoFocus = false,
  style,
  testID
}: SearchInputProps) {
  const theme = useFrameworkTheme();

  const handleClear = () => {
    onChangeText('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          minHeight: 44,
          gap: theme.spacing.sm
        },
        style
      ]}
    >
      <GoogleIcon name="search" size={20} color={theme.colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        style={{
          flex: 1,
          color: theme.colors.textPrimary,
          fontSize: theme.typography.bodySize,
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: 0,
          ...textTypographyStyle(theme, 'regular')
        }}
      />
      {value.trim().length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          onPress={handleClear}
          hitSlop={8}
          style={({ pressed }) => ({
            padding: 2,
            opacity: pressed ? 0.6 : 0.9
          })}
        >
          <GoogleIcon name="close" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

