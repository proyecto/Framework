import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { Button } from './Button.js';

export interface ModalDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/** Diálogo modal reutilizable implementado sobre el `<Modal>` estándar de React Native. */
export function ModalDialog({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
  children
}: ModalDialogProps) {
  const theme = useFrameworkTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          justifyContent: 'center',
          padding: theme.spacing.xl
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.border,
            padding: theme.spacing.xl,
            gap: theme.spacing.md
          }}
        >
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.headingSize + 1,
              fontWeight: '700'
            }}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.bodySize
              }}
            >
              {description}
            </Text>
          ) : null}
          {children}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.xs
            }}
          >
            <Button size="sm" variant="outline" label={cancelLabel} onPress={onCancel} />
            {onConfirm ? (
              <Button
                size="sm"
                variant={destructive ? 'danger' : 'primary'}
                label={confirmLabel}
                onPress={onConfirm}
              />
            ) : null}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface AppShellTab<T extends string> {
  id: T;
  label: string;
}

export interface AppShellProps<T extends string> {
  appName: string;
  subtitle?: string;
  headerRight?: ReactNode;
  topBanner?: ReactNode;
  toastMessage?: string | null;
  tabs?: Array<AppShellTab<T>>;
  activeTab?: T;
  onTabChange?: (tab: T) => void;
  children: ReactNode;
}

/**
 * Contenedor maestro (**Template / Layout Shell**) que unifica el aspecto visual de todas las
 * aplicaciones creadas con el framework: cabecera fija, banda de notificaciones, cuerpo
 * desplazable y barra inferior de pestañas.
 */
export function AppShell<T extends string>({
  appName,
  subtitle,
  headerRight,
  topBanner,
  toastMessage,
  tabs,
  activeTab,
  onTabChange,
  children
}: AppShellProps<T>) {
  const theme = useFrameworkTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.titleSize - 2,
              fontWeight: '800'
            }}
          >
            {appName}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.captionSize
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight}
      </View>

      {toastMessage ? (
        <View
          style={{
            backgroundColor: theme.colors.accentSoft,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.accent,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.sm
          }}
        >
          <Text
            style={{
              color: theme.colors.accentText,
              fontSize: theme.typography.captionSize + 1,
              fontWeight: '600'
            }}
          >
            {toastMessage}
          </Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
          paddingBottom: theme.spacing.xxl
        }}
      >
        {topBanner}
        {children}
      </ScrollView>

      {tabs && tabs.length > 0 && onTabChange ? (
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: theme.colors.surface,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            gap: theme.spacing.sm
          }}
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => onTabChange(tab.id)}
                style={{
                  flex: 1,
                  paddingVertical: theme.spacing.sm + 2,
                  borderRadius: theme.radius.md,
                  alignItems: 'center',
                  backgroundColor: active ? theme.colors.accentSoft : 'transparent'
                }}
              >
                <Text
                  style={{
                    color: active ? theme.colors.accentText : theme.colors.textSecondary,
                    fontSize: theme.typography.bodySize - 1,
                    fontWeight: active ? '700' : '500'
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
