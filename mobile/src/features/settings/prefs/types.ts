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

// Build a total parser over a preference union: a raw string in the union is
// returned as-is, anything else (unset / corrupt / legacy) falls back. Both
// unions include "system", which is always the fallback.
function makePreferenceParser<T extends string>(
  allowed: readonly T[],
): (raw: string | undefined) => T {
  return (raw) => (allowed.includes(raw as T) ? (raw as T) : ("system" as T))
}

export const parseThemePreference = makePreferenceParser<ThemePreference>([
  "system",
  "light",
  "dark",
])

export const parseLanguagePreference = makePreferenceParser<LanguagePreference>(
  ["system", "fr", "en"],
)
