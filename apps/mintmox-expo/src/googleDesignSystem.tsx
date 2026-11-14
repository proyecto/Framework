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

export const GOOGLE_FONT_FAMILIES: ThemeFontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold'
};

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

export const renderGoogleMaterialIcon: IconRenderer = ({ name, size, color }) => {
  return <MaterialIcons name={name as MaterialGlyphName} size={size} color={color} />;
};

