import React, { useEffect, useState } from 'react';
import { Image, Platform, View } from 'react-native';
import { GoogleIcon, useFrameworkTheme } from '@framework/ui';
import { getSmallImageUrl, loadCardImageAsDataUri } from './cardImageLoader';

export interface CardThumbnailProps {
  imageUrl?: string;
  title: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain';
  showBorder?: boolean;
  onResolveMissing?: () => Promise<string | null>;
}

/**
 * Componente de miniatura visual de carta MTG con soporte nativo multiplataforma.
 * En Web carga la versión optimizada 'small' directamente.
 * En móviles descarga mediante JS con User-Agent autorizado y convierte a Data URI local en caché.
 */
export function CardThumbnail({
  imageUrl,
  title,
  width = 44,
  height = 62,
  borderRadius = 6,
  resizeMode = 'cover',
  showBorder = true,
  onResolveMissing
}: CardThumbnailProps) {
  const theme = useFrameworkTheme();
  const [displayUri, setDisplayUri] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);

    if (!imageUrl) {
      if (onResolveMissing) {
        let isCancelled = false;
        void onResolveMissing().then((resolved) => {
          if (!isCancelled && resolved) {
            const target = getSmallImageUrl(resolved) ?? resolved;
            if (Platform.OS === 'web') {
              setDisplayUri(target);
            } else {
              void loadCardImageAsDataUri(target).then((dataUri) => {
                if (!isCancelled) setDisplayUri(dataUri);
              });
            }
          }
        });
        return () => {
          isCancelled = true;
        };
      }
      setDisplayUri(null);
      return;
    }

    const targetUrl = getSmallImageUrl(imageUrl) ?? imageUrl;

    if (Platform.OS === 'web') {
      setDisplayUri(targetUrl);
      return;
    }

    loadCardImageAsDataUri(targetUrl)
      .then((dataUri) => {
        if (!active) return;
        setDisplayUri(dataUri);
      })
      .catch(() => {
        if (!active) return;
        setDisplayUri(targetUrl);
      });

    return () => {
      active = false;
    };
  }, [imageUrl]);

  if (displayUri && !hasError) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceMuted,
          borderWidth: showBorder ? 1 : 0,
          borderColor: theme.colors.border
        }}
      >
        <Image
          source={{ uri: displayUri }}
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
          resizeMode={resizeMode}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  // Placeholder con textura sutil e icono temático de carta MTG
  return (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: theme.colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: showBorder ? 1 : 0,
        borderColor: theme.colors.border
      }}
      accessibilityLabel={`Miniatura de ${title}`}
    >
      <GoogleIcon
        name="style"
        size={typeof width === 'number' ? Math.max(14, Math.round(width * 0.42)) : 20}
        color={theme.colors.textSecondary}
      />
    </View>
  );
}
