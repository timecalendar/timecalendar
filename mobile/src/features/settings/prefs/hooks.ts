import { useCalendars } from "expo-localization"
import { useCallback } from "react"

import i18n from "@/i18n"
import { useParsedStoredString } from "@/storage"

import {
  resolveLanguage,
  resolveTimezone,
  setLanguagePreference,
  setStartupTabPreference,
  setThemePreference,
  setTimezonePreference,
} from "./store"
import {
  type LanguagePreference,
  parseLanguagePreference,
  parseStartupTabPreference,
  parseThemePreference,
  parseTimezonePreference,
  SETTINGS_KEYS,
  type StartupTabPreference,
  type ThemePreference,
  type TimezonePreference,
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
  const preference = useParsedStoredString(
    SETTINGS_KEYS.theme,
    parseThemePreference,
  )
  // setThemePreference is a stable module-level function (no closure over render
  // state), so it is referentially stable across renders without useCallback.
  return { preference, setPreference: setThemePreference }
}

export function useLanguagePreference(): {
  preference: LanguagePreference
  setPreference: (preference: LanguagePreference) => void
} {
  const preference = useParsedStoredString(
    SETTINGS_KEYS.language,
    parseLanguagePreference,
  )
  const setPreference = useCallback((next: LanguagePreference) => {
    setLanguagePreference(next)
    // Switch the live language: changeLanguage re-renders every t() consumer.
    // resolveLanguage maps "system" → device detection, "fr"/"en" → itself.
    void i18n.changeLanguage(resolveLanguage(next))
  }, [])
  return { preference, setPreference }
}

export function useTimezonePreference(): {
  preference: TimezonePreference
  setPreference: (preference: TimezonePreference) => void
} {
  const preference = useParsedStoredString(
    SETTINGS_KEYS.timezone,
    parseTimezonePreference,
  )
  // setTimezonePreference is a stable module-level function (see the theme hook).
  return { preference, setPreference: setTimezonePreference }
}

export function useStartupTabPreference(): {
  preference: StartupTabPreference
  setPreference: (preference: StartupTabPreference) => void
} {
  const preference = useParsedStoredString(
    SETTINGS_KEYS.startupTab,
    parseStartupTabPreference,
  )
  return { preference, setPreference: setStartupTabPreference }
}

// The reactive effective display zone: re-renders on a preference change (the
// reactive parsed read) and, under "system", on a device-zone change
// (useCalendars re-renders and feeds the fresh device zone into the resolver).
export function useDisplayZone(): string {
  const preference = useParsedStoredString(
    SETTINGS_KEYS.timezone,
    parseTimezonePreference,
  )
  const deviceZone = useCalendars()[0]?.timeZone ?? null
  return resolveTimezone(preference, deviceZone)
}
