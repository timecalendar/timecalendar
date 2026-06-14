// The two persisted Settings preferences (design D2). Both default to "system"
// so the app keeps following the device until the user explicitly overrides —
// matching the foundation's device-follows posture for theme and locale.
//
// A read parses the raw stored string through a validator: any value outside
// the union (unset / corrupt / legacy / downgrade) returns "system", so a read
// is total — a bad write can never produce an invalid preference or crash.

export type ThemePreference = "system" | "light" | "dark"
export type LanguagePreference = "system" | "fr" | "en"

// Flat namespaced storage keys (the i18n flat-key convention applied to storage
// for greppability — the string in code is the string in the store).
export const SETTINGS_KEYS = {
  theme: "settings.themePreference",
  language: "settings.languagePreference",
} as const

const THEME_PREFERENCES: readonly ThemePreference[] = [
  "system",
  "light",
  "dark",
]
const LANGUAGE_PREFERENCES: readonly LanguagePreference[] = [
  "system",
  "fr",
  "en",
]

export function parseThemePreference(raw: string | undefined): ThemePreference {
  return THEME_PREFERENCES.includes(raw as ThemePreference)
    ? (raw as ThemePreference)
    : "system"
}

export function parseLanguagePreference(
  raw: string | undefined,
): LanguagePreference {
  return LANGUAGE_PREFERENCES.includes(raw as LanguagePreference)
    ? (raw as LanguagePreference)
    : "system"
}
