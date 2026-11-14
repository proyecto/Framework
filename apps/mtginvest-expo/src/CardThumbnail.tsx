import React, { useEffect, useMemo, useState } from 'react';
import { Image, Platform, View } from 'react-native';
import { GoogleIcon, useFrameworkTheme } from '@framework/ui';
import { getSmallImageUrl, loadCardImageAsDataUri, SCRYFALL_IMAGE_HEADERS } from './cardImageLoader';

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
 * Componente de miniatura visual de carta MTG con soporte nativo multiplataforma de alto rendimiento.
 * - En Web y Móvil carga directamente usando el pipeline nativo con cabeceras Scryfall.
 * - Utiliza `cache: 'force-cache'` para leer de la memoria flash local del teléfono tras la primera descarga (0ms latencia).
 * - Envuelto en `React.memo` para evitar re-renderizados innecesarios durante el scroll o filtrado.
 */
export const CardThumbnail = React.memo(function CardThumbnail({
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
  // Estado inicial instantáneo si imageUrl ya viene definido (evita el parpadeo de placeholder)
  const [displayUri, setDisplayUri] = useState<string | null>(() =>
    imageUrl ? (getSmallImageUrl(imageUrl) ?? imageUrl) : null
  );
  const [hasError, setHasError] = useState(false);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setHasError(false);
    setIsFallback(false);

    if (!imageUrl) {
      if (onResolveMissing) {
        let isCancelled = false;
        void onResolveMissing().then((resolved) => {
          if (!isCancelled && resolved) {
            const target = getSmallImageUrl(resolved) ?? resolved;
            setDisplayUri(target);
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
    setDisplayUri(targetUrl);

    return () => {
      active = false;
    };
  }, [imageUrl, onResolveMissing]);

  const handleImageError = () => {
    // Si la carga nativa falló en móvil y aún no hemos probado el fallback data URI
    if (Platform.OS !== 'web' && displayUri && !isFallback && !displayUri.startsWith('data:')) {
      setIsFallback(true);
      void loadCardImageAsDataUri(displayUri)
        .then((dataUri) => {
          setDisplayUri(dataUri);
        })
        .catch(() => {
          setHasError(true);
        });
      return;
    }
    setHasError(true);
  };

  // Referencia de objeto de imagen memoizada con caché nativa persistente
  const imageSource = useMemo(() => {
    if (!displayUri) return null;
    return {
      uri: displayUri,
      headers: SCRYFALL_IMAGE_HEADERS,
      cache: 'force-cache' as const
    };
  }, [displayUri]);

  if (displayUri && imageSource && !hasError) {
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
          source={imageSource}
          style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
          resizeMode={resizeMode}
          onError={handleImageError}
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
});
