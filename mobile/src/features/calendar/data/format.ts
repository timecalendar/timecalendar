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

// The event-details title block's full date + time range (Flutter
// `eventDateTimeText` = `yMMMMd · jm – jm`, but 24-hour per R-3). Same-day:
// "<full date> · HH:mm – HH:mm". A cross-day event (rare for a timetable event)
// shows both full date-times "<full date> HH:mm – <full date> HH:mm". Display
// only, locale-aware over `date-fns`.
export function formatEventDateRange(
  start: Date,
  end: Date,
  locale: AppLocale,
): string {
  const opts = { locale: LOCALES[locale] }
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  if (sameDay) {
    return `${format(start, "PPPP", opts)} · ${formatTimeRange(start, end, locale)}`
  }
  return `${format(start, "PPPP", opts)} ${format(start, "HH:mm", opts)} – ${format(end, "PPPP", opts)} ${format(end, "HH:mm", opts)}`
}

// The "updated" footer's full date + time for `exportedAt` (Flutter
// `fullDateTimeText`): "<full date> · HH:mm". Display only, locale-aware.
export function formatFullDateTime(date: Date, locale: AppLocale): string {
  const opts = { locale: LOCALES[locale] }
  return `${format(date, "PPPP", opts)} · ${format(date, "HH:mm", opts)}`
}

// The home today header's full localized date (Flutter `fullDayText`): the full
// weekday + day + month + year ("Monday, June 15th, 2026" / "lundi 15 juin 2026").
// Display only, locale-aware. Closes roadmap item 5 (date/time) — the date-fns
// seam now covers every formatting need across calendar/agenda/details/home.
export function formatFullDay(day: Date, locale: AppLocale): string {
  return format(day, "PPPP", { locale: LOCALES[locale] })
}
