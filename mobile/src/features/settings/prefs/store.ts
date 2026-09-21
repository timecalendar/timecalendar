import { getCalendars } from "expo-localization"

import {
  hasTimezoneRecord,
  isTimezoneRuntimeSupported,
} from "@/features/settings/data"
import { detectLocale, type SupportedLocale } from "@/i18n/detect-locale"
import {
  getBoolean,
  getNumber,
  getString,
  remove,
  setBoolean,
  setNumber,
  setString,
} from "@/storage"

import {
  type CalendarView,
  type LanguagePreference,
  parseCalendarView,
  parseCalendarZoomPixelsPerHour,
  parseLanguagePreference,
  parseThemePreference,
  SETTINGS_KEYS,
  type ThemePreference,
  type TimezonePreference,
  type TimezonePreferenceRead,
} from "./types"

// Imperative get/set for the three preferences over the @/storage seam. A pure
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

export function getTimezonePreference(): TimezonePreference {
  return parseTimezonePreference(getString(SETTINGS_KEYS.timezone))
}

export function parseTimezonePreference(
  raw: string | undefined,
): TimezonePreference {
  const read = classifyTimezonePreference(raw)
  return read.kind === "available" || read.kind === "unavailable"
    ? read.identifier
    : "system"
}

export function setTimezonePreference(preference: TimezonePreference): void {
  if (preference === "system") {
    setAutomaticTimezone()
    return
  }
  selectManualTimezone(preference)
}

export function classifyTimezonePreference(
  raw: string | undefined,
): TimezonePreferenceRead {
  if (raw === "system" || raw === undefined) return { kind: "system" }
  if (!hasTimezoneRecord(raw)) return { kind: "invalid", raw }
  return isTimezoneRuntimeSupported(raw)
    ? { kind: "available", identifier: raw }
    : { kind: "unavailable", identifier: raw }
}

export function readTimezonePreference(): TimezonePreferenceRead {
  return classifyTimezonePreference(getString(SETTINGS_KEYS.timezone))
}

export function getLastManualTimezone(): string | undefined {
  return getString(SETTINGS_KEYS.lastManualTimezone)
}

function restoreRaw(key: string, value: string | undefined): void {
  if (value === undefined) remove(key)
  else setString(key, value)
}

function writeTimezonePair(active: string, remembered: string): void {
  const previousActive = getString(SETTINGS_KEYS.timezone)
  const previousRemembered = getString(SETTINGS_KEYS.lastManualTimezone)
  try {
    setString(SETTINGS_KEYS.timezone, active)
    setString(SETTINGS_KEYS.lastManualTimezone, remembered)
  } catch (error) {
    restoreRaw(SETTINGS_KEYS.timezone, previousActive)
    restoreRaw(SETTINGS_KEYS.lastManualTimezone, previousRemembered)
    throw error
  }
}

export function selectManualTimezone(identifier: string): boolean {
  if (
    !hasTimezoneRecord(identifier) ||
    !isTimezoneRuntimeSupported(identifier)
  ) {
    return false
  }
  writeTimezonePair(identifier, identifier)
  return true
}

export function setAutomaticTimezone(): void {
  const current = readTimezonePreference()
  if (current.kind === "available") {
    writeTimezonePair("system", current.identifier)
  } else {
    setString(SETTINGS_KEYS.timezone, "system")
  }
}

function selectableFallback(deviceZone: string | null): string {
  if (
    deviceZone !== null &&
    hasTimezoneRecord(deviceZone) &&
    isTimezoneRuntimeSupported(deviceZone)
  )
    return deviceZone
  return "Europe/Paris"
}

export function restoreManualTimezone(
  deviceZone: string | null = getCalendars()[0]?.timeZone ?? null,
): string {
  const remembered = getLastManualTimezone()
  if (
    remembered &&
    hasTimezoneRecord(remembered) &&
    isTimezoneRuntimeSupported(remembered)
  ) {
    setString(SETTINGS_KEYS.timezone, remembered)
    return remembered
  }
  const fallback = selectableFallback(deviceZone)
  setString(SETTINGS_KEYS.timezone, fallback)
  if (remembered === undefined)
    setString(SETTINGS_KEYS.lastManualTimezone, fallback)
  return fallback
}

export function getShowWeekends(): boolean {
  return getBoolean(SETTINGS_KEYS.showWeekends) ?? true
}

export function setShowWeekends(showWeekends: boolean): void {
  setBoolean(SETTINGS_KEYS.showWeekends, showWeekends)
}

export function getCalendarView(): CalendarView {
  return parseCalendarView(getString(SETTINGS_KEYS.calendarView))
}

export function setCalendarView(view: CalendarView): void {
  setString(SETTINGS_KEYS.calendarView, view)
}

export function getCalendarZoomPixelsPerHour(): number {
  return parseCalendarZoomPixelsPerHour(
    getNumber(SETTINGS_KEYS.calendarZoomPixelsPerHour),
  )
}

export function setCalendarZoomPixelsPerHour(pixelsPerHour: number): void {
  setNumber(
    SETTINGS_KEYS.calendarZoomPixelsPerHour,
    parseCalendarZoomPixelsPerHour(pixelsPerHour),
  )
}

// Resolve a timezone preference to the effective display zone: an explicit
// curated zone wins, "system" falls through to the device IANA zone, and
// "Europe/Paris" backstops a device that yields none (some simulators). The
// `deviceZone` parameter defaults to the imperative expo-localization read;
// the reactive hook passes `useCalendars()`'s value so a device-zone change
// re-resolves under "system".
export function resolveTimezone(
  preference: TimezonePreference,
  deviceZone: string | null = getCalendars()[0]?.timeZone ?? null,
): string {
  if (
    preference !== "system" &&
    hasTimezoneRecord(preference) &&
    isTimezoneRuntimeSupported(preference)
  )
    return preference
  return selectableFallback(deviceZone)
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
