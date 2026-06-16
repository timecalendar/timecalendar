// The agenda's locale-aware, display-ONLY date/time formatting — roadmap item 6
// pulled early (the first real date-formatting need). Pure + 90%-gated. Display only:
// no parsing, no rrule/recurrence, no Temporal. Locale comes from the app i18n locale
// (i18next.language) mapped to a date-fns/locale object — a NEW app locale needs an
// entry in `LOCALES` below.

import { format } from "date-fns"
import { enUS, fr } from "date-fns/locale"

export type AppLocale = "fr" | "en"

const LOCALES = {
  fr,
  en: enUS,
} as const

// The day header's two parts (Flutter `fullDayToShortDay` + `day.day`): the short
// weekday abbreviation UPPERCASED ("LUN" / "MON") + the day-of-month number.
export function formatDayHeaderParts(
  day: Date,
  locale: AppLocale,
): { weekday: string; dayOfMonth: string } {
  return {
    weekday: format(day, "EEE", { locale: LOCALES[locale] }).toUpperCase(),
    dayOfMonth: format(day, "d", { locale: LOCALES[locale] }),
  }
}

// An event's time range "HH:mm – HH:mm" (24-hour, zero-padded). 24-hour is the
// French-first default and reads cleanly in EN too (R-3 — the platform/brand
// reference, not the Flutter `jm` AM/PM).
export function formatTimeRange(
  start: Date,
  end: Date,
  locale: AppLocale,
): string {
  const opts = { locale: LOCALES[locale] }
  return `${format(start, "HH:mm", opts)} – ${format(end, "HH:mm", opts)}`
}
