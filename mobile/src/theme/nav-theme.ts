import { DarkTheme, DefaultTheme } from "expo-router"

import { Colors } from "@/theme/tokens"

// expo-router re-exports the React Navigation theming constants (Expo Router is
// the only nav API — @react-navigation/* is lint-banned). It does not export the
// `Theme` type by name, so derive it from the constant.
type NavTheme = typeof DefaultTheme

/**
 * Builds the React Navigation theme for `ThemeProvider` from `@/theme` tokens, so
 * nav chrome (header, card, hairline border, the active tint) follows the token
 * palette instead of stock blue — it can't drift from `@/theme` (design D4).
 *
 * Spread-then-override: spreading the stock DefaultTheme/DarkTheme supplies the
 * full `colors` set and `fonts` the nav Theme type requires; we override only the
 * keys we tokenize. Pure (no hooks) so the proof test can call it without rendering
 * the route tree (the routes-not-importable boundary).
 */
export function buildNavTheme(scheme: "light" | "dark"): NavTheme {
  const base = scheme === "dark" ? DarkTheme : DefaultTheme
  const tokens = Colors[scheme]

  return {
    ...base,
    colors: {
      ...base.colors,
      background: tokens.background,
      card: tokens.backgroundElement,
      text: tokens.text,
      border: tokens.backgroundSelected,
      primary: tokens.primary,
    },
  }
}
