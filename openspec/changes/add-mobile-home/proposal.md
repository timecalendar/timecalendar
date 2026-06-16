## Why

Phase 04 ("Calendar core", roadmap item 4) adds the **HOME / today landing view** — the
payoff surface of the Home tab. The calendar's rendering surfaces (day / week / agenda),
calendar sync, and the read-only event details screen have all landed
(`add-mobile-calendar-timeline` / `-agenda` / `-sync` / `add-mobile-event-details`, ADRs
[019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)/[020](../../../.claude/rules/mobile/decisions/020-calendar-kit-seam.md)/[021](../../../.claude/rules/mobile/decisions/021-calendar-event-storage-and-sync.md)),
but they are reachable only via the standalone `/calendar` deep-link route. **The Home tab
still renders the flat personal-events list** (`PersonalEventsList`) — a Phase-2 placeholder
that ignores the user's synced classes entirely. The landing surface a TimeCalendar user
opens to should be *what's next*: their merged calendar + personal events for the relevant
day, not an unrelated CRUD list.

This change makes the Home tab the **today / next-up view** (Flutter `home` module parity):
a header, a horizontal scroller of the day's events, and a today mini-timeline rendered
through the **salvaged overlap engine** — the explicit salvage payoff ADR 019 named ("the
home today-grid reuses the overlap engine"; its first *rendering* consumer of `layoutOverlaps`
+ `time-grid`). It is **composition of landed primitives**, not new infrastructure: events
come from the unchanged `useCalendarEvents` seam, pull-to-refresh reuses `useSyncCalendars`,
tap→details reuses item 3's origin-keyed routing, and formatting reuses `format.ts`.

This ship also **closes roadmap item 5 (date/time)**: `format.ts`'s date-fns helpers already
cover the agenda + details; home adds only a `formatFullDay` header helper to the same locale-
aware seam. No separate date/time ship remains.

## What Changes

- **The Home tab becomes the today view (IA change — load-bearing, ADR-recorded).** A new
  `src/features/home/` feature folder owns the landing surface; `src/app/(tabs)/index.tsx`
  renders the new `HomeScreen` instead of `PersonalEventsList`. The standalone personal-events
  list is **relocated, not dropped** — it moves to a `/personal-events` Stack route (reachable
  from the Profile tab, mirroring how `/calendar`, `/settings`, and onboarding are reached),
  preserving the personal-event create/edit/delete flow in full. Personal events also continue
  to render *within* the home today view (they are already merged into `useCalendarEvents`).
- **New `home/data/` pure selectors (90%-gated):** `displayedDay(events, now)` (Flutter
  `dayDisplayedOnHomePage` parity — today if any event ends after now today, else the day of
  the next future event, else today), `eventsForDay(events, day)` (the day's events), and
  `dynamicHourRange(events)` (min start hour .. max end hour + 1, fallback 8–18 — Flutter
  `today_events` parity). These are the only genuinely new logic; everything else is composition.
- **New `home/ui/` presentational surface (70% floor):** `HomeScreen` composing a header
  (app name + an event-count line), a horizontal `UpcomingScroller` of the day's event cards,
  a day section header, and a `TodayTimeline` mini-grid built on `layoutOverlaps` + `time-grid`
  (~70px/hour Flutter zoom, dynamic hour range, hours column, brand now-indicator), plus
  pull-to-refresh + the accessible sync-error/retry banner (reusing `useSyncCalendars`). Tapping
  any event reuses the existing origin-keyed `handlePressEvent` routing (synced → event-details,
  personal → edit form). An "Add personal event" entry point remains on the home surface.
- **`format.ts` gains `formatFullDay(day, locale)`** (the today header's full date — Flutter
  `fullDayText`), display-only over the existing date-fns `LOCALES` map — **no new dependency**.
- **No new runtime dependency, no `app.config.ts` / native / babel change** — `@howljs/calendar-kit`
  is NOT used for the today grid (the custom overlap engine is, per ADR 019's salvage purpose);
  `date-fns` is already present.
- **Book + roadmap:** a new "Home / today view" section in `features.md`, a calendar.md note that
  the salvaged overlap engine now has its first rendering consumer, the IA decision recorded in a
  small ADR (or in `features.md` if judged non-load-bearing — decided in design), and the
  changelog. Roadmap item 5 (date/time) marked closed.

## Capabilities

### New Capabilities
- `mobile-home`: The Home-tab landing surface — a today / next-up view merging synced calendar
  events and personal events, with a header, a horizontal upcoming scroller, and a today
  mini-timeline rendered on the salvaged overlap engine; pull-to-refresh and tap-to-details
  reuse the landed calendar seams; the IA relocation of the standalone personal-events list.

### Modified Capabilities
<!-- None: the events-source seam, sync orchestrator, event-details routing, and personal-events
     CRUD are all consumed unchanged. The Home-tab IA change is captured in the new mobile-home
     capability, not as a requirement change to an existing spec. -->

## Impact

- **New code:** `mobile/src/features/home/` (`data/` selectors + tests, `ui/` screen +
  subcomponents + test, barrels), a relocated `mobile/src/app/personal-events.tsx` route,
  `mobile/.maestro/home.yaml`.
- **Modified code:** `mobile/src/app/(tabs)/index.tsx` (renders `HomeScreen`),
  `mobile/src/app/_layout.tsx` (register the new `personal-events` Stack route),
  `mobile/src/components/profile.tsx` (a "Personal events" entry link),
  `mobile/src/features/calendar/data/format.ts` (+ `formatFullDay`),
  the i18n catalogs (`en.json` / `fr.json` — home header/greeting/section/empty/a11y keys).
- **Consumed unchanged:** `useCalendarEvents`, `useSyncCalendars`, `layoutOverlaps`,
  `time-grid`, `formatTimeRange`/`formatDayHeaderParts`, the origin-keyed event routing,
  `usePersonalEvents` + the personal-event form route.
- **Dependencies:** none added. **Native:** none. **EAS fingerprint:** unchanged (no native dep).
- **Architecture Book:** `features.md` (new Home section + Personal-events relocation note),
  `calendar.md` (overlap-engine first-rendering-consumer note), the changelog; possibly a small
  ADR for the IA decision; roadmap item 5 closed.
