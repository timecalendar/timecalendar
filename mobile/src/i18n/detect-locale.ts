import { getLocales } from "expo-localization"

export type SupportedLocale = "fr" | "en"

// Resolve the active locale from the device's preferred locales: the first that
// matches fr or en wins, otherwise fall back to en (D2 — a predictable English
// baseline beats forcing French on the non-FR/EN long tail).
export function detectLocale(): SupportedLocale {
  for (const locale of getLocales()) {
    if (locale.languageCode === "fr" || locale.languageCode === "en") {
      return locale.languageCode
    }
  }
  return "en"
}
