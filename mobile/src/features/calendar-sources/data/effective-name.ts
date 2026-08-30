// The effective display name for a held calendar (TIM-391 / design D8).
//
// Production is whitespace-heavy: of 444 028 live calendars, 80 685 names are
// empty and 119 511 are whitespace-only (TIM-274). `calendar.name || fallback`
// therefore renders a row of blanks — `" "` is truthy. Trimming first is the
// whole point.
//
// Returns null rather than a localized string so the helper stays pure and
// unit-testable, matching validate-url.ts (no `t` in data/). The caller renders
// `effectiveCalendarName(name) ?? t("userCalendars.nameFallback")`.
//
// DISPLAY ONLY. The stored value is never rewritten — no backfill, no migration.
export function effectiveCalendarName(stored: string): string | null {
  const trimmed = stored.trim()
  return trimmed === "" ? null : trimmed
}
