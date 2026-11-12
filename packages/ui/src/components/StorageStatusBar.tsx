import type { StorageStatus } from '@framework/core';
import { Text, View } from 'react-native';
import { useFrameworkIconRenderer, useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';
import { GoogleIcon } from './Icon.js';

export interface StorageStatusBarProps {
  status: StorageStatus;
  onSyncPress?: () => void;
  onManagePress?: () => void;
}

/**
 * Barra estandarizada de estado Local / Nube compartida por todas las apps del framework.
 * Muestra lenguaje comprensible para el usuario final ("Solo local (Gratis)" vs "Nube Pro activa")
 * ocultando por completo detalles internos de Turso o SQLite.
 */
export function StorageStatusBar({
  status,
  onSyncPress,
  onManagePress
}: StorageStatusBarProps) {
  const theme = useFrameworkTheme();
  const hasIconRenderer = Boolean(useFrameworkIconRenderer());

  const tone = status.lastSyncError
    ? 'danger'
    : status.cloudEnabled
      ? 'success'
      : 'neutral';

  const badgeLabel = status.isSyncing
    ? 'Sincronizando...'
    : status.cloudEnabled
      ? 'Nube Pro activa'
      : 'Solo local (Gratis)';

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        gap: theme.spacing.sm
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing.sm
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
          {hasIconRenderer ? (
            <GoogleIcon
              name={
                status.lastSyncError
                  ? 'warning-amber'
                  : status.cloudEnabled
                    ? 'cloud-queue'
                    : 'cloud-off'
              }
              size="sm"
              tone={tone === 'neutral' ? 'secondary' : tone}
            />
          ) : null}
          <Badge label={badgeLabel} tone={tone} />
        </View>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.captionSize,
            ...textTypographyStyle(theme, 'regular')
          }}
        >
          {status.cloudEnabled
            ? status.pendingChanges > 0
              ? `${status.pendingChanges} pendiente(s)`
              : 'Al día'
            : 'Los datos no salen del dispositivo'}
        </Text>
      </View>

      {status.lastSyncError ? (
        <Text
          style={{
            color: theme.colors.danger,
            fontSize: theme.typography.captionSize,
            ...textTypographyStyle(theme, 'regular')
          }}
        >
          {status.lastSyncError}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {status.cloudEnabled && onSyncPress ? (
          <Button
            size="sm"
            variant="secondary"
            icon={hasIconRenderer ? 'sync' : undefined}
            label="Sincronizar"
            loading={status.isSyncing}
            onPress={onSyncPress}
          />
        ) : null}
        {onManagePress ? (
          <Button
            size="sm"
            variant="outline"
            icon={hasIconRenderer ? 'cloud-upload' : undefined}
            label={status.cloudEnabled ? 'Gestionar nube' : 'Activar copia en la nube'}
            onPress={onManagePress}
          />
        ) : null}
      </View>
    </View>
  );
}
