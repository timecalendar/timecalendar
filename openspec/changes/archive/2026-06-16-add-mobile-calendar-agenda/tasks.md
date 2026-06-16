## 1. Dependency — date-fns (display-only, pure-JS — D3)

- [x] 1.1 Add `date-fns` and `date-fns-tz` via `npx expo install date-fns date-fns-tz` (run in `mobile/`) so the `expo install`-aligned versions land and the lockfile regenerates. Confirm they add **no** `app.config.ts` plugin and no native module (pure-JS → no EAS fingerprint bump — D3). Do NOT pull rrule/Temporal/recurrence (display only).

## 2. Day-grouping helper (`data/`, 90%-gated — D2)

- [x] 2.1 Create `src/features/calendar/data/agenda.ts` exporting `AgendaDay = { day: Date; events: CalendarEvent[] }` and the pure `groupEventsByDay(events: CalendarEvent[]): AgendaDay[]`: sort events by `startsAt` (stable tie-break, mirroring `overlap-layout`), bucket by **local** calendar day (local Y-M-D, mirroring Flutter `isSameDate` — NOT UTC), return buckets ascending by day; empty input → `[]`. Pure — no React, no calendar-kit, no `@/db`, no `t()`, no `date-fns`. Add a comment noting we group by each event's own `startsAt` local day (NOT the Flutter `endsAt`-carry quirk — D2).
- [x] 2.2 Write `src/features/calendar/data/agenda.test.ts`: multi-day events bucket per local day, ascending; within-day events sorted by start; a late-evening (23:30 local) event lands on its own day; empty input → `[]`; events given out of order are normalized. Clear the 90% logic gate.

## 3. Locale-aware display-only formatter (`data/`, 90%-gated — D3)

- [x] 3.1 Create `src/features/calendar/data/format.ts` over `date-fns` (+ `date-fns/locale` `fr`/`enUS`): a small `AppLocale = "fr" | "en"` type mapped to the `date-fns` locale object; `formatDayHeaderParts(day: Date, locale: AppLocale): { weekday: string; dayOfMonth: string }` (uppercased short weekday + day number — Flutter `fullDayToShortDay` + `day.day`); `formatTimeRange(start: Date, end: Date, locale: AppLocale): string` (`"HH:mm – HH:mm"`, 24-hour). Display only — no parsing, no rrule. Document that locale comes from the app i18n locale (a new app locale needs a `date-fns/locale` entry here).
- [x] 3.2 Write `src/features/calendar/data/format.test.ts`: FR vs. EN short-weekday abbreviation for a known date (e.g. a Monday → "LUN" / "MON"); day-of-month number; the time range `HH:mm – HH:mm` incl. a midnight/boundary time; both locales. Clear the 90% logic gate.

## 4. data/ barrel

- [x] 4.1 Extend `src/features/calendar/data/index.ts` to re-export `AgendaDay` + `groupEventsByDay` (from `./agenda`) and the `AppLocale` type + `formatDayHeaderParts` + `formatTimeRange` (from `./format`). Keep the existing exports.

## 5. Agenda list (`ui/`, 70% floor — D1/D4)

- [x] 5.1 Create `src/features/calendar/ui/agenda-list.tsx` (presentational): a React Native core **`SectionList`** (zero new dep — D4) whose `sections` come from `groupEventsByDay(events)` mapped to `{ day, title, data: events }`. `renderSectionHeader` = a day header (`formatDayHeaderParts` → the short weekday + the day number, stacked, `accessibilityRole="header"`); `renderItem` = an event tile. Theme from `@/theme` tokens (R-3). Take `events: CalendarEvent[]` + the resolved locale as props (the screen owns the read). Open at today's section if trivial (`initialScrollIndex` to today's bucket) — do NOT build the Flutter two-way scroll↔current-day binding (Open Question).
- [x] 5.2 The event tile: title + the `formatTimeRange` time + location (when present), tinted by the event `#RRGGBB` color, a rounded radius (~`Radii.large`/15px, Flutter parity) and a subtle shadow (`@/theme`-tokened shadow, the `rgba(0,0,0,0.06)` blur-15 offset-(0,3) posture). An accessible label (`t("calendar.agenda.event.label", { title, time, location })`). The tile is **not** a touchable (no event-details screen yet — `accessibilityRole="text"`, no `onPress`; the tap target is added when item 3 lands — Open Question).
- [x] 5.3 The now/upcoming indicator: a brand-`primary` line/dot marking the current position (the first event ending after now, or between sections). Expose it accessibly — a labeled/status node, not a silent decorative view (`accessibilityLabel` via `t()` or an `accessibilityLiveRegion`/role; not a dead node — a11y rule). Use `time-grid`'s `nowIndicatorPosition` only if the marker wants the grid posture; for a list, "the next-upcoming event" position is sufficient.
- [x] 5.4 Extend `src/features/calendar/ui/index.ts` to also export `AgendaList` (the screen consumes the sibling sub-barrel — B-2; no self-feature-barrel import).

## 6. Calendar screen — 3-way view switch (D1)

- [x] 6.1 Extend `src/features/calendar/ui/calendar-screen.tsx`: widen the `CalendarView` type to `"day" | "week" | "agenda"`; add a third `ViewButton` ("Agenda") to the existing accessible `tablist` (role `tab`, translated label, `accessibilityState.selected`, ≥44pt target — mirror the day/week buttons).
- [x] 6.2 When `view === "agenda"`: compute a **bounded multi-day range** (the visible week — D1; reuse `visibleDate` + a fixed horizon, not unbounded), read `useCalendarEvents(range)` (the unchanged seam), resolve the locale from `i18next.language` (via `useTranslation`'s `i18n.language`, mapped to `AppLocale`), and render `<AgendaList events={events} locale={locale} />` instead of the `CalendarContainer` grid. The day/week branches + their range logic are unchanged. Keep the empty-range polite-live-region state for the agenda too.

## 7. i18n

- [x] 7.1 Add flat keys to `src/i18n/locales/en.json`: the agenda view label (`calendar.view.agenda`) + its a11y label (`calendar.view.agendaLabel`), the agenda event-tile a11y label template (`calendar.agenda.event.label` = `"{{title}}, {{time}} {{location}}"`), the now-indicator a11y label (`calendar.agenda.nowLabel`), and an agenda empty-range message if it differs from `calendar.empty` (reuse `calendar.empty` if it fits). Day-header + time strings come from the formatter, NOT catalog keys (D3).
- [x] 7.2 Add the identical key set (translated) to `src/i18n/locales/fr.json` — bidirectional `tsc` parity must pass.

## 8. Jest proof (D6 — the agenda renders a plain SectionList, no calendar-kit mock needed)

- [x] 8.1 Extend `src/features/calendar/ui/calendar-screen.test.tsx` (or add a focused test): select the agenda view (press the Agenda tab); assert a committed-fixture event's **day header** (formatted weekday + day) and its **tile** render with translated/formatted text (not raw keys); assert the day/week→agenda switch toggles the rendered surface; assert the agenda empty state when no events intersect. The agenda branch needs no calendar-kit mock (it is a plain `SectionList`); the existing `jest/setup-calendar-kit.ts` still covers the day/week branch.
- [x] 8.2 Confirm the coverage split holds: `data/agenda.ts` + `data/format.ts` clear 90% (the `src/features/*/!(ui)/**` glob); the `ui/agenda-list.tsx` + the screen fall under the 70% global floor (the `!(ui)` extglob excludes `ui/`).

## 9. Maestro

- [x] 9.1 Extend `mobile/.maestro/calendar.yaml`: after the existing day/week assertions, tap the Agenda view control (by its translated label / a testID), and assert a **day header** (a fixture event's day) and a committed fixture event title are visible in the agenda list (the fixture is committed data — reachable with no seeded backend, since sync isn't built). Note in a comment that the agenda is a bounded `SectionList`; frame rate / dense visual correctness remain the on-device manual pass.

## 10. Architecture Book + docs (R-1; no ADR — D5)

- [x] 10.1 Update `/.claude/rules/mobile/calendar.md`: in the "Deferred" section, mark the agenda/planning list view as **landed** (remove from deferred) and add a live "## Agenda / planning view" section: the day-grouping helper (`groupEventsByDay`, the agenda analog of `layoutOverlaps`, 90%-gated, the local-day grouping + the deliberate divergence from the Flutter `endsAt`-carry quirk), the display-only `date-fns` formatter (`format.ts`, pure-JS, no fingerprint bump, locale from i18n — roadmap item 6 pulled early), the **`SectionList`-over-FlashList** choice + its recorded **revisit trigger** (sync grows the range → swap FlashList v2 behind the unchanged `AgendaList`), the 3-way in-place view switch, observability ➖ N/A. R-1 pointer style; reference ADR 019 (the "build agenda on salvaged primitives" decision this executes) — note **no new ADR** (D5).
- [x] 10.2 Update `/.claude/rules/mobile/features.md` calendar section: extend the "Calendar" entry to record the agenda view (the third in-place view mode, the `data/agenda.ts` + `data/format.ts` helpers, the `ui/agenda-list.tsx` `SectionList`, the new `date-fns` dep display-only, the now-indicator, observability ➖ N/A). Note it reuses the unchanged events-source seam + salvaged primitives.
- [x] 10.3 Append a live entry to `/.claude/rules/mobile/architecture-changelog.md` (date `2026-06-16`, slug `add-mobile-calendar-agenda`): what moved (the agenda/planning view as a 3rd view mode — the pure `groupEventsByDay` helper, the display-only `date-fns` formatter pulled early per roadmap item 6, the zero-dep `SectionList` agenda list, the now-indicator; the SectionList-over-FlashList call + its revisit trigger), why (Phase-04 item 1b — completes the day/week/**agenda** rendering surface per ADR 019's "build agenda on salvaged primitives"), pointers (calendar.md, features.md, ADR 019). Note **no new ADR / no dependency-decisions-README change** (D5) and that `date-fns`/`date-fns-tz` are pure-JS (no fingerprint bump).
- [x] 10.4 If the `lint-format.md` rule inventory needs no change, state so in the change (no new lint rule — the agenda rides existing feature-boundary B-1..B-4, no-hardcoded-strings, a11y, import-order, coverage gates; `date-fns` is not a banned/seam import). Confirm `date-fns` does NOT need a chrome-seam ban (it is a plain pure-JS utility, not a swappable rendering surface — unlike calendar-kit).

## 11. Human handoff (inbox — fold into the existing calendar on-device pass, D6)

- [x] 11.1 (HUMAN: see inbox/2026-06-16-calendar-visual-brand-review.md) Extend the **existing** calendar brand-visual review note to cover the **agenda view** on iOS + Android (DoD native-correctness — designed brand surface, R-3): day headers (weekday + number), event tiles (radius, subtle shadow, color tint, title/time/location), the now/upcoming indicator read correctly and on-brand; the 3-way day/week/agenda switch reads correctly. Skip-and-continue — CI cannot review a rendered surface. (Update the existing inbox note to name the agenda; no new note for a bounded list on an already-inboxed surface — D6.)

## 12. Local verification (run in `mobile/`)

- [x] 12.1 `npx tsc --noEmit` — clean (FR/EN parity included; the `CalendarView` widening + the formatter locale type compile).
- [x] 12.2 `npm run lint` — clean (`--max-warnings 0`; no hardcoded strings — day/time strings come from the formatter, the view label + a11y labels from `t()`; feature boundaries B-1..B-4; import order; the calendar-kit ban still holds).
- [x] 12.3 `npm test` — green, including `agenda.test.ts` + `format.test.ts` (90%) and the screen/agenda-list test (70% floor), with the coverage thresholds met.
- [x] 12.4 `openspec validate add-mobile-calendar-agenda --strict` — passes.
