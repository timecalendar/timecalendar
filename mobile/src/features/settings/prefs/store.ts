import { detectLocale, type SupportedLocale } from "@/i18n/detect-locale"
import { getString, setString } from "@/storage"

import {
  type LanguagePreference,
  parseLanguagePreference,
  parseThemePreference,
  SETTINGS_KEYS,
  type ThemePreference,
} from "./types"

// Imperative get/set for the two preferences over the @/storage seam. A pure
// store-only module: it imports @/storage + ./types + the detect-locale leaf,
// but NEVER the @/i18n instance — so the i18n startup read (getInitialLocale)
// stays cycle-free (@/i18n init → this store → @/storage, no edge back; D5).

export function getThemePreference(): ThemePreference {
  return parseThemePreference(getString(SETTINGS_KEYS.theme))
}

export function setThemePreference(preference: ThemePreference): void {
  setString(SETTINGS_KEYS.theme, preference)
}

export function getLanguagePreference(): LanguagePreference {
  return parseLanguagePreference(getString(SETTINGS_KEYS.language))
}

export function setLanguagePreference(preference: LanguagePreference): void {
  setString(SETTINGS_KEYS.language, preference)
}

// Resolve a language preference to a concrete locale: an explicit "fr"/"en"
// wins, "system" falls through to device detection.
export function resolveLanguage(
  preference: LanguagePreference,
): SupportedLocale {
  return preference === "fr" || preference === "en"
    ? preference
    : detectLocale()
}

// The initial locale for i18n init — the stored preference if explicit, else
// device detection. A pure store read (synchronous, MMKV is synchronous),
// imports the detect-locale leaf, not the i18n instance (no cycle; D5).
export function getInitialLocale(): SupportedLocale {
  return resolveLanguage(getLanguagePreference())
}
