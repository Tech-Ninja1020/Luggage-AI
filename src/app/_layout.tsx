import '@/global.css';
import '@/lib/icons/setup';

import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { NAV_THEME } from '@/lib/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={NAV_THEME[colorScheme as 'light' | 'dark']}>
      <AnimatedSplashOverlay />
      <Stack />
      <PortalHost />
    </ThemeProvider>
  );
}