import { useColorScheme as useDeviceColorScheme } from "react-native"

import { useThemePreference } from "@/features/settings/prefs"

// The single color-scheme seam (C1): both useTheme and the root _layout read
// the scheme through here, so the Settings theme override is resolved in one
// place. A stored "light"/"dark" preference wins; "system" falls through to the
// device scheme. The return type stays ColorSchemeName ("light" | "dark" |
// "unspecified" | null) so useTheme's `unspecified → light` mapping and
// buildNavTheme are untouched — the C1 promise (design D4).
//
// The infra→feature import (this seam reads @/features/settings) is the
// deliberate, recorded edge: preferences are the Settings feature's domain, and
// the graph stays a clean DAG (ADR 009 / design D8).
export function useColorScheme() {
  const deviceScheme = useDeviceColorScheme()
  const { preference } = useThemePreference()
  if (preference === "light" || preference === "dark") {
    return preference
  }
  return deviceScheme
}
