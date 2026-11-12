import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';
import { textTypographyStyle } from '../tokens.js';
import { GoogleIcon, type GoogleIconName } from './Icon.js';

export interface CardProps {
  title?: string;
  subtitle?: string;
  /** Icono opcional de Google Material Icons mostrado junto al título de la tarjeta. */
  icon?: GoogleIconName;
  rightSlot?: ReactNode;
  children: ReactNode;
  highlighted?: boolean;
  style?: ViewStyle;
}

/** Tarjeta contenedora estándar con soporte opcional de cabecera, icono, slot derecho y borde destacado. */
export function Card({
  title,
  subtitle,
  icon,
  rightSlot,
  children,
  highlighted = false,
  style
}: CardProps) {
  const theme = useFrameworkTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: highlighted ? 1.5 : 1,
          borderColor: highlighted ? theme.colors.accent : theme.colors.border,
          padding: theme.spacing.lg,
          gap: theme.spacing.md
        },
        style
      ]}
    >
      {title || subtitle || rightSlot || icon ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: theme.spacing.sm
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
            {icon ? (
              <GoogleIcon
                name={icon}
                size="md"
                tone={highlighted ? 'accent' : 'secondary'}
                style={{ marginTop: 1 }}
              />
            ) : null}
            <View style={{ flex: 1, gap: 2 }}>
              {title ? (
                <Text
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: theme.typography.headingSize,
                    ...textTypographyStyle(theme, 'bold')
                  }}
                >
                  {title}
                </Text>
              ) : null}
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
          {rightSlot}
        </View>
      ) : null}
      {children}
    </View>
  );
}
