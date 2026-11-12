import type { StorageStatus } from '@framework/core';
import { Text, View } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { Badge } from './Badge.js';
import { Button } from './Button.js';

export interface StorageStatusBarProps {
  status: StorageStatus;
  onSyncPress?: () => void;
  onManagePress?: () => void;
}

/**
 * Standardized Cloud/Local indicator shared across every app built on the framework.
 * Users simply see "Local (Solo este dispositivo)" vs "Nube sincronizada (Pro)" without
 * exposing Turso internals.
 */
export function StorageStatusBar({
  status,
  onSyncPress,
  onManagePress
}: StorageStatusBarProps) {
  const theme = useFrameworkTheme();

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
        <Badge label={badgeLabel} tone={tone} />
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.typography.captionSize
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
            fontSize: theme.typography.captionSize
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
            label="Sincronizar"
            loading={status.isSyncing}
            onPress={onSyncPress}
          />
        ) : null}
        {onManagePress ? (
          <Button
            size="sm"
            variant="outline"
            label={status.cloudEnabled ? 'Gestionar nube' : 'Activar copia en la nube'}
            onPress={onManagePress}
          />
        ) : null}
      </View>
    </View>
  );
}

