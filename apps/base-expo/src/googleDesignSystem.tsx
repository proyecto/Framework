import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import type { IconRenderer, ThemeFontFamilies } from '@framework/ui';

type MaterialGlyphName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Mapa de fuentes de Google (`Inter`) registrado por peso en `expo-font`.
 * Todos los componentes de `@framework/ui` leen estas claves desde `theme.typography.fonts`.
 */
export const GOOGLE_FONT_FAMILIES: ThemeFontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold'
};

/**
 * Hook de arranque tipográfico e icónico para la App Base Expo.
 * Carga simultáneamente la familia Google Fonts `Inter` y el glifo vectorial de Google `MaterialIcons`.
 */
export function useGoogleDesignFonts() {
  const [fontsLoaded, fontError] = useFonts({
    ...MaterialIcons.font,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold
  });

  return {
    ready: fontsLoaded || fontError !== null,
    fontsLoaded,
    fontError
  };
}

/**
 * Adaptador concreto (**Strategy / Adapter**) que conecta `<GoogleIcon />` de `@framework/ui`
 * con `MaterialIcons` de `@expo/vector-icons`, manteniendo a `@framework/ui` desacoplado de Expo.
 */
export const renderGoogleMaterialIcon: IconRenderer = ({ name, size, color }) => (
  <MaterialIcons name={name as MaterialGlyphName} size={size} color={color} />
);

