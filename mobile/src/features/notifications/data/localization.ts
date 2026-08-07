import { getCalendars } from "expo-localization"

import {
  getLanguagePreference,
  resolveLanguage,
} from "@/features/settings/prefs"
import type { SupportedLocale } from "@/i18n/detect-locale"

// The subscription DTO's localization pair, each behind one accessor (design
// D1/D2). Locale is the app's EFFECTIVE language — the explicit settings
// preference wins, "system" falls through to device detection — because a user
// who forces English in settings must not receive French pushes (a data → data
// cross-feature read of the settings store, same pattern as the user_calendars
// read; B-1). Timezone is the device IANA zone with the server's default as
// fallback (expo-localization can yield none on some simulators); a future
// display-timezone preference overrides ONLY this accessor's body — the DTO
// assembly and the re-registration triggers never change.

export function getEffectiveLocale(): SupportedLocale {
  return resolveLanguage(getLanguagePreference())
}

export function getEffectiveTimezone(): string {
  return getCalendars()[0]?.timeZone ?? "Europe/Paris"
}
