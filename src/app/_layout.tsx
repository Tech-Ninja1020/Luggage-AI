import '@/global.css';
import '@/lib/icons/setup';

import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FullWindowOverlay } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TOP_OVERLAY_PORTAL_HOST } from '@/lib/portal-hosts';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={NAV_THEME[colorScheme as 'light' | 'dark']}>
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }} />
          <PortalHost />
          {Platform.OS === 'ios' ? (
            <FullWindowOverlay>
              <PortalHost name={TOP_OVERLAY_PORTAL_HOST} />
            </FullWindowOverlay>
          ) : (
            <View
              style={[StyleSheet.absoluteFill, styles.topOverlayHost]}
              pointerEvents="box-none"
            >
              <PortalHost name={TOP_OVERLAY_PORTAL_HOST} />
            </View>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  topOverlayHost: {
    zIndex: 10000,
    elevation: 10000,
  },
});