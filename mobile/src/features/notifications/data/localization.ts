import {
  getLanguagePreference,
  getTimezonePreference,
  resolveLanguage,
  resolveTimezone,
} from "@/features/settings/prefs"
import type { SupportedLocale } from "@/i18n/detect-locale"

// The subscription DTO's localization pair, each behind one accessor (design
// D1/D2). Locale is the app's EFFECTIVE language — the explicit settings
// preference wins, "system" falls through to device detection — because a user
// who forces English in settings must not receive French pushes (a data → data
// cross-feature read of the settings store, same pattern as the user_calendars
// read; B-1). Timezone is the app's EFFECTIVE display timezone — the explicit
// settings display-timezone preference wins, "system" falls through to the
// device IANA zone with the server's default ("Europe/Paris") as fallback — so
// the server renders push bodies in the same zone the app displays (timezone
// design D2).

export function getEffectiveLocale(): SupportedLocale {
  return resolveLanguage(getLanguagePreference())
}

export function getEffectiveTimezone(): string {
  return resolveTimezone(getTimezonePreference())
}
