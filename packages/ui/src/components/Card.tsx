import type { ReactNode } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { useFrameworkTheme } from '../ThemeProvider.js';

export interface CardProps {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  highlighted?: boolean;
  style?: ViewStyle;
}

export function Card({
  title,
  subtitle,
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
      {title || subtitle || rightSlot ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: theme.spacing.sm
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            {title ? (
              <Text
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: theme.typography.headingSize,
                  fontWeight: '700'
                }}
              >
                {title}
              </Text>
            ) : null}
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
          {rightSlot}
        </View>
      ) : null}
      {children}
    </View>
  );
}

