import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ViewStyle
} from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';
import { GoogleIcon } from './Icon.js';

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  badge?: string;
}

export interface SelectProps<T = string> {
  label?: string;
  placeholder?: string;
  value?: T | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  modalTitle?: string;
  style?: ViewStyle;
}

/**
 * Componente canónico de selección desplegable (`<Select />`) del Design System.
 *
 * Características:
 * - Construido exclusivamente sobre primitivas puras de React Native (`View`, `Pressable`, `Modal`, `ScrollView`).
 * - Soporta listas grandes con buscador integrado en tiempo real.
 * - Soporta etiquetas descriptivas y badges en cada opción (ideal para colecciones, ediciones, estados).
 * - Totalmente adaptado a temas claro y oscuro (`useFrameworkTheme()`).
 */
export function Select<T = string>({
  label,
  placeholder = 'Selecciona una opción...',
  value,
  options,
  onChange,
  disabled = false,
  error,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  modalTitle,
  style
}: SelectProps<T>) {
  const theme = useFrameworkTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchDesc = opt.description?.toLowerCase().includes(q) ?? false;
      const matchBadge = opt.badge?.toLowerCase().includes(q) ?? false;
      const matchValue = typeof opt.value === 'string' && opt.value.toLowerCase().includes(q);
      return matchLabel || matchDesc || matchBadge || matchValue;
    });
  }, [options, searchQuery]);

  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery('');
    setModalVisible(true);
  };

  const handleSelect = (val: T) => {
    onChange(val);
    setModalVisible(false);
  };

  return (
    <View style={[{ gap: theme.spacing.xs }, style]}>
      {label ? (
        <Text
          style={{
            color: theme.colors.textPrimary,
            fontSize: theme.typography.captionSize,
            ...textTypographyStyle(theme, 'semibold')
          }}
        >
          {label}
        </Text>
      ) : null}

      {/* Botón activador del selector */}
      <Pressable
        accessibilityRole="combobox"
        accessibilityLabel={label ?? placeholder}
        disabled={disabled}
        onPress={handleOpen}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.md,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm + 2,
          minHeight: 44,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1
        })}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          {selectedOption?.badge ? (
            <Badge label={selectedOption.badge} tone="accent" />
          ) : null}
          <Text
            numberOfLines={1}
            style={{
              color: selectedOption ? theme.colors.textPrimary : theme.colors.textSecondary,
              fontSize: theme.typography.bodySize,
              ...textTypographyStyle(theme, selectedOption ? 'medium' : 'regular')
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>

        <GoogleIcon name="unfold-more" size={20} tone="secondary" />
      </Pressable>

      {error ? (
        <Text
          style={{
            color: theme.colors.danger,
            fontSize: theme.typography.captionSize,
            ...textTypographyStyle(theme, 'regular')
          }}
        >
          {error}
        </Text>
      ) : null}

      {/* Modal buscador de opciones */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            justifyContent: 'center',
            padding: theme.spacing.lg
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: theme.spacing.lg,
              maxHeight: '80%',
              gap: theme.spacing.md
            }}
          >
            {/* Cabecera del modal */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.headingSize,
                  ...textTypographyStyle(theme, 'bold')
                }}
              >
                {modalTitle ?? label ?? 'Seleccionar opción'}
              </Text>

              <Pressable
                onPress={() => setModalVisible(false)}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: theme.radius.full
                }}
              >
                <GoogleIcon name="close" size={20} tone="secondary" />
              </Pressable>
            </View>

            {/* Buscador opcional */}
            {searchable ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.md,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  paddingHorizontal: theme.spacing.sm + 2
                }}
              >
                <GoogleIcon name="search" size={18} tone="secondary" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={theme.colors.textSecondary}
                  autoFocus
                  style={{
                    flex: 1,
                    height: 40,
                    paddingHorizontal: theme.spacing.xs,
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.bodySize - 1,
                    ...textTypographyStyle(theme, 'regular')
                  }}
                />
                {searchQuery ? (
                  <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                    <GoogleIcon name="cancel" size={16} tone="secondary" />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Lista scrollable de opciones */}
            <ScrollView
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ gap: 4 }}
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.length === 0 ? (
                <View style={{ paddingVertical: theme.spacing.lg, alignItems: 'center' }}>
                  <Text
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: theme.typography.bodySize,
                      ...textTypographyStyle(theme, 'regular')
                    }}
                  >
                    No se encontraron resultados.
                  </Text>
                </View>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => handleSelect(opt.value)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: theme.spacing.sm + 2,
                        paddingHorizontal: theme.spacing.md,
                        borderRadius: theme.radius.md,
                        backgroundColor: isSelected
                          ? theme.colors.accentSoft
                          : pressed
                          ? theme.colors.surfaceMuted
                          : 'transparent'
                      })}
                    >
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {opt.badge ? (
                            <Badge label={opt.badge} tone={isSelected ? 'accent' : 'neutral'} />
                          ) : null}
                          <Text
                            style={{
                              color: isSelected
                                ? theme.colors.accentText
                                : theme.colors.textPrimary,
                              fontSize: theme.typography.bodySize,
                              ...textTypographyStyle(theme, isSelected ? 'bold' : 'medium')
                            }}
                          >
                            {opt.label}
                          </Text>
                        </View>
                        {opt.description ? (
                          <Text
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: theme.typography.captionSize,
                              ...textTypographyStyle(theme, 'regular')
                            }}
                          >
                            {opt.description}
                          </Text>
                        ) : null}
                      </View>

                      {isSelected ? (
                        <GoogleIcon name="check" size={20} color={theme.colors.accent} />
                      ) : null}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

