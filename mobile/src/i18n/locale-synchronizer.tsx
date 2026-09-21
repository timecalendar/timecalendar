import { useLocales } from "expo-localization"
import { useEffect } from "react"

import { useLanguagePreference } from "@/features/settings/prefs"
import i18n from "@/i18n"
import { detectLocale } from "@/i18n/detect-locale"

export function LocaleSynchronizer() {
  const locales = useLocales()
  const { preference } = useLanguagePreference()

  useEffect(() => {
    if (preference !== "system") return
    const next = detectLocale(locales)
    if (i18n.resolvedLanguage !== next) {
      void i18n.changeLanguage(next)
    }
  }, [locales, preference])

  return null
}
