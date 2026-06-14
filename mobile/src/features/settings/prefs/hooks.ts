import { useCallback } from "react"

import i18n from "@/i18n"
import { useStoredString } from "@/storage"

import {
  resolveLanguage,
  setLanguagePreference,
  setThemePreference,
} from "./store"
import {
  type LanguagePreference,
  parseLanguagePreference,
  parseThemePreference,
  SETTINGS_KEYS,
  type ThemePreference,
} from "./types"

// Reactive preference hooks. Each reads through the seam's reactive
// useStoredString (so a change re-renders consumers) and validates the raw
// string into the typed union. setPreference persists through the imperative
// store (one write path; the reactive read picks the change up).
//
// The @/i18n instance is imported here (the hooks layer), not in the pure
// store — so the i18n startup read stays cycle-free (@/i18n init → store →
// @/storage; the store never reaches the i18n instance). hooks.ts → @/i18n →
// store is a clean DAG: the store imports neither hooks nor the i18n instance,
// so no cycle closes (D5).

export function useThemePreference(): {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
} {
  const preference = parseThemePreference(useStoredString(SETTINGS_KEYS.theme))
  // setThemePreference is a stable module-level function (no closure over render
  // state), so it is referentially stable across renders without useCallback.
  return { preference, setPreference: setThemePreference }
}

export function useLanguagePreference(): {
  preference: LanguagePreference
  setPreference: (preference: LanguagePreference) => void
} {
  const preference = parseLanguagePreference(
    useStoredString(SETTINGS_KEYS.language),
  )
  const setPreference = useCallback((next: LanguagePreference) => {
    setLanguagePreference(next)
    // Switch the live language: changeLanguage re-renders every t() consumer.
    // resolveLanguage maps "system" → device detection, "fr"/"en" → itself.
    void i18n.changeLanguage(resolveLanguage(next))
  }, [])
  return { preference, setPreference }
}
