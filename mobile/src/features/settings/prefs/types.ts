// The three persisted Settings preferences (design D2). All default to "system"
// so the app keeps following the device until the user explicitly overrides —
// matching the foundation's device-follows posture for theme, locale, and
// display timezone.
//
// A read parses the raw stored string through a validator: any value outside
// the union (unset / corrupt / legacy / downgrade) returns "system", so a read
// is total — a bad write can never produce an invalid preference or crash.

export type ThemePreference = "system" | "light" | "dark"
export type LanguagePreference = "system" | "fr" | "en"

// The curated display-timezone union (timezone design D1): Europe/Paris + the
// French outre-mer zones. A closed union keeps the parser total and the picker
// buildable; extending the list later is additive.
export const CURATED_TIMEZONES = [
  "Europe/Paris",
  "America/Guadeloupe",
  "America/Martinique",
  "America/Cayenne",
  "America/Miquelon",
  "Indian/Reunion",
  "Indian/Mayotte",
  "Pacific/Noumea",
  "Pacific/Wallis",
  "Pacific/Tahiti",
] as const

export type CuratedTimezone = (typeof CURATED_TIMEZONES)[number]
export type TimezonePreference = "system" | CuratedTimezone

// Flat namespaced storage keys (the i18n flat-key convention applied to storage
// for greppability — the string in code is the string in the store).
export const SETTINGS_KEYS = {
  theme: "settings.themePreference",
  language: "settings.languagePreference",
  timezone: "settings.timezonePreference",
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

export const parseTimezonePreference = makePreferenceParser<TimezonePreference>(
  ["system", ...CURATED_TIMEZONES],
)
