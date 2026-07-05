// The local calendar day of a `Date` as a `YYYY-MM-DD` string — the machine
// day-key (NOT UTC, NOT locale-aware display; formatting is `format.ts`'s job).
// Local so a 23:30-local instant keys on its OWN local day (mirroring Flutter
// `isSameDate`). Shared by the agenda's per-day bucketing (`groupEventsByDay`)
// and the calendar grid's `initialDate` — both need "which local day is this".
export function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
