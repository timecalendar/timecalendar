// The locale-aware, display-ONLY date/time formatting seam. Pure + 90%-gated.
// Display only: no parsing, no rrule/recurrence, no Temporal. Locale comes from
// the app i18n locale (i18next.language) mapped to a date-fns/locale object — a
// NEW app locale needs an entry in `LOCALES` below.
//
// Every formatter takes the effective DISPLAY ZONE explicitly (timezone design
// D3/D4): instants are re-projected with date-fns-tz's `formatInTimeZone` using
// the same format strings and locale objects, so a Paris schedule reads in
// Paris time from any device zone. All-day events are the exception — they are
// FLOATING dates (stored as UTC midnight) and format off their UTC day proxy,
// never the zone.

import { format } from "date-fns"
import { enUS, fr } from "date-fns/locale"
import { formatInTimeZone } from "date-fns-tz"

export type AppLocale = "fr" | "en"

const LOCALES = {
  fr,
  en: enUS,
} as const

// Map the i18next language tag (e.g. "fr", "fr-FR", "en-US") to the app locale —
// FR for any `fr*`, EN otherwise (mirroring the EN-fallback detect-locale rule).
// The single source for every screen that needs a date-fns-friendly locale.
export function resolveLocale(language: string): AppLocale {
  return language.startsWith("fr") ? "fr" : "en"
}

// The day header's two parts (Flutter `fullDayToShortDay` + `day.day`): the short
// weekday abbreviation UPPERCASED ("LUN" / "MON") + the day-of-month number.
export function formatDayHeaderParts(
  day: Date,
  locale: AppLocale,
  zone: string,
): { weekday: string; dayOfMonth: string } {
  const opts = { locale: LOCALES[locale] }
  return {
    weekday: formatInTimeZone(day, zone, "EEE", opts).toUpperCase(),
    dayOfMonth: formatInTimeZone(day, zone, "d", opts),
  }
}

// An event's time range "HH:mm – HH:mm" (24-hour, zero-padded). 24-hour is the
// French-first default and reads cleanly in EN too (R-3 — the platform/brand
// reference, not the Flutter `jm` AM/PM).
export function formatTimeRange(
  start: Date,
  end: Date,
  locale: AppLocale,
  zone: string,
): string {
  const opts = { locale: LOCALES[locale] }
  return `${formatInTimeZone(start, zone, "HH:mm", opts)} – ${formatInTimeZone(end, zone, "HH:mm", opts)}`
}

export function formatTime(
  date: Date,
  locale: AppLocale,
  zone: string,
): string {
  return formatInTimeZone(date, zone, "HH:mm", { locale: LOCALES[locale] })
}

// A local-midnight proxy on a Date's UTC calendar day, so date-fns `format` (which
// reads local fields) prints the RIGHT floating day for an all-day event. An all-day
// event is stored as UTC midnight (a floating date — May 25 everywhere); formatting
// its local fields would shift the day for a UTC-negative viewer. Mirrors the grid's
// `utcDayKey`. Deliberately NOT zone-aware — a floating date never shifts with the
// display-timezone preference.
function utcDayProxy(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

// The event-details title block's full date + time range (Flutter
// `eventDateTimeText` = `yMMMMd · jm – jm`, but 24-hour per R-3). A TIMED event
// (`allDay === false`) shows same-day "<full date> · HH:mm – HH:mm" or, cross-day,
// both full date-times "<full date> HH:mm – <full date> HH:mm" — same-day judged on
// the DISPLAY zone's calendar days. An ALL-DAY event shows the date(s) with NO
// time — one full date, or a "<date> – <date>" range for a multi-day all-day
// event — keyed off the UTC day (`endsAt` is the EXCLUSIVE end, so the last
// covered day is `endsAt − 1ms`). Display only, locale-aware over `date-fns`.
export function formatEventDateRange(
  start: Date,
  end: Date,
  locale: AppLocale,
  allDay: boolean,
  zone: string,
): string {
  const opts = { locale: LOCALES[locale] }
  if (allDay) {
    const firstDay = utcDayProxy(start)
    // `max(start, end − 1ms)` mirrors the grid mapper's guard so a degenerate
    // zero-duration all-day event (end === start) formats as the single date, not a
    // backwards "day-before – day" range.
    const lastDay = utcDayProxy(
      new Date(Math.max(start.getTime(), end.getTime() - 1)),
    )
    return firstDay.getTime() === lastDay.getTime()
      ? format(firstDay, "PPPP", opts)
      : `${format(firstDay, "PPPP", opts)} – ${format(lastDay, "PPPP", opts)}`
  }
  const sameDay =
    formatInTimeZone(start, zone, "yyyy-MM-dd") ===
    formatInTimeZone(end, zone, "yyyy-MM-dd")
  if (sameDay) {
    return `${formatInTimeZone(start, zone, "PPPP", opts)} · ${formatTimeRange(start, end, locale, zone)}`
  }
  return `${formatInTimeZone(start, zone, "PPPP", opts)} ${formatInTimeZone(start, zone, "HH:mm", opts)} – ${formatInTimeZone(end, zone, "PPPP", opts)} ${formatInTimeZone(end, zone, "HH:mm", opts)}`
}

// The "updated" footer's full date + time for `exportedAt` (Flutter
// `fullDateTimeText`): "<full date> · HH:mm". Display only, locale-aware.
export function formatFullDateTime(
  date: Date,
  locale: AppLocale,
  zone: string,
): string {
  const opts = { locale: LOCALES[locale] }
  return `${formatInTimeZone(date, zone, "PPPP", opts)} · ${formatInTimeZone(date, zone, "HH:mm", opts)}`
}

// The home today header's full localized date (Flutter `fullDayText`): the full
// weekday + day + month + year ("Monday, June 15th, 2026" / "lundi 15 juin 2026").
export function formatFullDay(
  day: Date,
  locale: AppLocale,
  zone: string,
): string {
  return formatInTimeZone(day, zone, "PPPP", { locale: LOCALES[locale] })
}

export function formatDayMonth(
  day: Date,
  locale: AppLocale,
  zone: string,
): string {
  return formatInTimeZone(day, zone, "EEEE d MMMM", { locale: LOCALES[locale] })
}

// The calendar nav-bar title's month + year — the orientation the day/week/agenda
// views all share ("July 2026" / "juillet 2026"). Standalone month name (`LLLL`)
// so it reads naturally as a heading. Display only, locale-aware.
export function formatMonthYear(
  day: Date,
  locale: AppLocale,
  zone: string,
): string {
  return formatInTimeZone(day, zone, "LLLL yyyy", { locale: LOCALES[locale] })
}

// A compact date + time ("15 juin 08:30" / "15 Jun 08:30") for dense rows — the
// personal-events list and the Android date-time field echo (the two former
// `toLocaleString` seam-bypass sites).
export function formatShortDateTime(
  date: Date,
  locale: AppLocale,
  zone: string,
): string {
  return formatInTimeZone(date, zone, "d MMM HH:mm", {
    locale: LOCALES[locale],
  })
}
