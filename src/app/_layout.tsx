import '@/global.css';
import '@/lib/icons/setup';

import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAuthStore } from '@/lib/stores/auth-store';
import { NAV_THEME } from '@/lib/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={NAV_THEME[colorScheme as 'light' | 'dark']}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
        <PortalHost />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}