import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { Button } from './Button.js';
import { GoogleIcon, type GoogleIconName } from './Icon.js';

export interface ModalDialogAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  icon?: GoogleIconName;
  onPress: () => void;
}

export interface ModalDialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  leftAction?: ModalDialogAction;
  onConfirm?: () => void;
  onCancel: () => void;
  children?: ReactNode;
  contentMaxHeight?: number;
}

/** Diálogo modal reutilizable implementado sobre el `<Modal>` estándar de React Native. */
export function ModalDialog({
  visible,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  leftAction,
  onConfirm,
  onCancel,
  children,
  contentMaxHeight = 480
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
          alignItems: 'center',
          padding: theme.spacing.md
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
            gap: theme.spacing.md,
            width: '100%',
            maxWidth: 540,
            maxHeight: '92%'
          }}
        >
          <Text
            style={{
              color: theme.colors.textPrimary,
              fontSize: theme.typography.headingSize + 1,
              ...textTypographyStyle(theme, 'bold')
            }}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={{
                color: theme.colors.textSecondary,
                fontSize: theme.typography.bodySize,
                ...textTypographyStyle(theme, 'regular')
              }}
            >
              {description}
            </Text>
          ) : null}
          <ScrollView
            style={{ maxHeight: contentMaxHeight }}
            contentContainerStyle={{ gap: theme.spacing.sm, paddingVertical: 2 }}
            showsVerticalScrollIndicator={true}
          >
            {children}
          </ScrollView>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: leftAction ? 'space-between' : 'flex-end',
              alignItems: 'center',
              gap: theme.spacing.sm,
              marginTop: theme.spacing.xs
            }}
          >
            {leftAction ? (
              <Button
                size="sm"
                variant={leftAction.variant ?? 'danger'}
                icon={leftAction.icon}
                label={leftAction.label}
                onPress={leftAction.onPress}
              />
            ) : null}
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export interface AppShellTab<T extends string> {
  id: T;
  label: string;
  /** Icono opcional de Google Material Icons mostrado encima de la etiqueta de la pestaña. */
  icon?: GoogleIconName;
}

export interface AppShellProps<T extends string> {
  appName: string;
  subtitle?: string;
  appIcon?: ReactNode;
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
  appIcon,
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1 }}>
          {appIcon}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontSize: theme.typography.titleSize - 2,
                ...textTypographyStyle(theme, 'extrabold')
              }}
            >
              {appName}
            </Text>
            {subtitle ? (
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.captionSize,
                  ...textTypographyStyle(theme, 'regular')
                }}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
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
              ...textTypographyStyle(theme, 'semibold')
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
                  justifyContent: 'center',
                  gap: 3,
                  backgroundColor: active ? theme.colors.accentSoft : 'transparent'
                }}
              >
                {tab.icon ? (
                  <GoogleIcon
                    name={tab.icon}
                    size={18}
                    color={active ? theme.colors.accentText : theme.colors.textSecondary}
                  />
                ) : null}
                <Text
                  style={{
                    color: active ? theme.colors.accentText : theme.colors.textSecondary,
                    fontSize: tab.icon ? theme.typography.captionSize : theme.typography.bodySize - 1,
                    ...textTypographyStyle(theme, active ? 'bold' : 'medium')
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
