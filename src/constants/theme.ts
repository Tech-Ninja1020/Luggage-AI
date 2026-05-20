import { Platform } from "react-native";

import { THEME } from "@/lib/theme";

/** Spacing scale used by legacy layout helpers. */
export const Spacing = {
  half: 4,
  two: 8,
  five: 20,
} as const;

export const Fonts = {
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  })!,
};

/** Extended palette for `ThemedText` / `ThemedView` (includes navigation-style tokens). */
export const Colors = {
  light: {
    ...THEME.light,
    textSecondary: THEME.light.mutedForeground,
    backgroundSelected: THEME.light.muted,
  },
  dark: {
    ...THEME.dark,
    textSecondary: THEME.dark.mutedForeground,
    backgroundSelected: THEME.dark.muted,
  },
} as const;

export type ThemeColor = keyof (typeof Colors)["light"];
