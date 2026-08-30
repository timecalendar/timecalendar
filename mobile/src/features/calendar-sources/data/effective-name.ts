// The effective display name for a calendar — the ONE place the fallback rule
// lives, so the list row and the rename dialog cannot drift apart.
//
// A stored name is `trim`ed for display and, when that leaves nothing, replaced
// by the caller's localized fallback ("My timetable" / "Mon emploi du temps",
// `userCalendars.namePlaceholder`). The naive `stored || fallback` this replaces
// is NOT equivalent: it passes a whitespace-only name straight through to the UI,
// which is the exact production case TIM-274 measured (a large share of rows are
// empty or whitespace, and the app rendered a blank label for them).
//
// This is display substitution only — the stored value is never rewritten, and an
// over-long stored name is displayed in full (the 100-char maximum bounds what a
// rename may WRITE, not what may be shown). The fallback is passed in rather than
// resolved here so the helper stays pure and i18n-free (unit-testable without an
// i18next runtime).
export function effectiveCalendarName(
  stored: string,
  fallback: string,
): string {
  return stored.trim() || fallback
}
