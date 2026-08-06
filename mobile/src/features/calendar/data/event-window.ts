import { type DateRange } from "./events"

// The grid feeds calendar-kit a QUARTER-quantized event window (backlog Issue 5 —
// events lag on fast week-to-week scrolling). The range is snapped to the visible
// date's calendar quarter plus a two-month buffer on each side, and is memoized on
// the quarter (via `quarterStartMs`) so scrolling WITHIN a quarter keeps the SAME
// range — the same array identity flows through the events-source seam, so
// calendar-kit's `events` prop never changes on scroll and its `useEffect([events])`
// re-pack (EventsProvider) does not fire. Only CROSSING a quarter boundary
// recomputes; the buffer means the next quarter's edge events are already in the prop
// before the cross, so no page paints blank.
//
// This bounds the prop to ~a quarter of events (it scales) instead of the whole
// synced table, WITHOUT the per-settle refilter/remap cascade a windowStart-keyed
// range would reintroduce (a fresh range object every scroll settle → new identity →
// calendar-kit re-pack). The read stays fully in memory — the coalesced whole-table
// reactive read (ADR 021, `harden-mobile-db-seam`); this is a JS projection WIDTH,
// not a SQL scope, so the documented O(N²) re-read storm cannot recur.
//
// Pure Date math on a stable key, so equal keys yield an equal range — the property
// the memo relies on.

// Two calendar months of slack on each side of the quarter. This buffer is
// LOAD-BEARING and coupled to the grid's `pagesPerSide` (calendar-kit `CalendarBody`,
// GRID_PAGES_PER_SIDE in calendar-screen.tsx): calendar-kit paints events only from an
// internal store packed over ±(defaultOffset=7 · pagesPerSide) days around its anchor,
// which tracks the visible date live while scrolling (throttled — see
// patches/@howljs+calendar-kit+2.5.6.patch). At pagesPerSide=4 the pack reach is
// −28d/+35d, and mid-fling the anchor can run well past the settled quarter bucket
// before windowStart catches up (it only settles at rest) — the buffer must cover that
// anchor travel PLUS the pack reach past the quarter's edge, else the pack lands on
// days the prop never fed. 2 months (~60d) clears the +35d reach with margin. Raising
// pagesPerSide requires re-checking this.
const BUFFER_MONTHS = 2

// A quarter is three months.
const QUARTER_MONTHS = 3

// Local-midnight epoch-ms of the first day of `date`'s calendar quarter — the STABLE
// bucket key (equal for every day in the quarter, so it memoizes the window). Local,
// not UTC: the grid paints local days and the month buffer absorbs any timezone edge
// slack.
export function quarterStartMs(date: Date): number {
  const start = new Date(date)
  start.setMonth(
    Math.floor(start.getMonth() / QUARTER_MONTHS) * QUARTER_MONTHS,
    1,
  )
  start.setHours(0, 0, 0, 0)
  return start.getTime()
}

// The buffered half-open range for the quarter identified by `bucketStartMs` (a value
// from `quarterStartMs`): from = quarter start − 2 months; to = quarter start + 3
// months + 2 months (two months past the quarter's end). Derived purely from the key
// so the same key always yields an equal range (intersectsRange is half-open, so `to`
// is exclusive).
export function quarterWindow(bucketStartMs: number): DateRange {
  const from = new Date(bucketStartMs)
  from.setMonth(from.getMonth() - BUFFER_MONTHS)
  const to = new Date(bucketStartMs)
  to.setMonth(to.getMonth() + QUARTER_MONTHS + BUFFER_MONTHS)
  return { from, to }
}
