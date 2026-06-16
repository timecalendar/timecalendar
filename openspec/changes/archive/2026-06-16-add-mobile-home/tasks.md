# Tasks — add-mobile-home

All paths under `mobile/`. The today view is **composition of landed primitives** — most work is
wiring, not new logic. Run the gates (`npx tsc --noEmit`, `npm run lint`, `npm test`) in `mobile/`.

## 1. Date/time helper (closes roadmap item 5)

- [x] 1.1 Add `formatFullDay(day: Date, locale: AppLocale): string` to
  `src/features/calendar/data/format.ts` (the today header's full localized date — Flutter
  `fullDayText`; date-fns `PPPP`/`EEEE d MMMM` over the existing `LOCALES` map; display-only). Export
  it from `src/features/calendar/data/index.ts`.
- [x] 1.2 Extend `src/features/calendar/data/format.test.ts` to cover `formatFullDay` in FR + EN
  (keeps the format seam at 90%). No new dependency.

## 2. `home/data/` — the pure selectors (90%-gated)

- [x] 2.1 Create `src/features/home/data/selectors.ts` (pure — no React, no `@/db`, no `t()`),
  importing `CalendarEvent` from `@/features/calendar/data`:
  - `displayedDay(events, now): Date` — today (local midnight) if any event `endsAt > now` on today's
    local day; else local midnight of the first event with `startsAt > now`; else today (D4 — note the
    `endsAt > now` refinement over Flutter's `startsAt.isAfter(today)` in a comment).
  - `eventsForDay(events, day): CalendarEvent[]` — events whose `startsAt` is on `day`'s local
    calendar day, sorted by start with a stable `id` tie-break (mirror `groupEventsByDay`/`layoutOverlaps`).
  - `dynamicHourRange(events): { startHour: number; endHour: number }` — min start hour .. max end
    hour + 1, clamped to `[0, 24]`; empty → `{ startHour: 8, endHour: 18 }`.
- [x] 2.2 Create `src/features/home/data/index.ts` (sub-barrel) re-exporting the three selectors.
- [x] 2.3 Write `src/features/home/data/selectors.test.ts` covering each branch: empty, in-progress
  (today), all-past-today → next future day, future-only, cross-hour spans, the 8–18 fallback, the
  `[0,24]` clamp, the local-day boundary (a 23:30 event). Clear the 90% logic gate.

## 3. `home/ui/` — the today view (presentational, 70% floor)

- [x] 3.1 Create `src/features/home/ui/today-timeline.tsx` — an absolute-positioned grid (NOT
  calendar-kit, D5): `View` with hour lines + `hourLabels` time column, event tiles placed via
  `layoutOverlaps(eventsForDay(...))` + `minuteToPixel`/`eventHeight` at `pixelsPerHour = 70`
  (Flutter parity), hour window from `dynamicHourRange`. Each tile a `Pressable` →
  `onPressEvent(event)`. Now-indicator via `nowIndicatorPosition` (brand `primary`) only when the
  displayed day is today. Reuse `MIN_TILE_WIDTH` text-hiding for narrow columns. Themed from `@/theme`.
- [x] 3.2 Create `src/features/home/ui/upcoming-scroller.tsx` — a horizontal RN-core list of
  `eventsForDay(...)` cards (color accent + title + `formatTimeRange` + location), each a `Pressable`
  → `onPressEvent(event)`. Renders nothing when the day is empty. Themed from `@/theme`.
- [x] 3.3 Create `src/features/home/ui/home-screen.tsx` — `HomeScreen`: reads `useCalendarEvents`
  over a displayed-day range, computes `displayedDay`/`eventsForDay`, renders the header (app name
  heading + `formatFullDay` date + the pluralized count line / empty state), the `UpcomingScroller`,
  the today section header (`accessibilityRole="header"`), the `TodayTimeline`, and an "Add personal
  event" entry (Link to `/personal-event-form`). Wire `useSyncCalendars()` → pull-to-refresh
  (`RefreshControl`, brand-tinted) + the accessible error/retry banner (reuse the calendar screen's
  pattern). Define `handlePressEvent(uid, userCalendarId)` routing synced→`/event-details/<uid>`,
  personal→`/personal-event-form?uid=<uid>` (item 3 parity). Resolve locale from `i18next.language`.
- [x] 3.4 Create `src/features/home/ui/index.ts` (ui sub-barrel, `export { HomeScreen }`) and
  `src/features/home/index.ts` (feature barrel re-exporting `ui`; no self-barrel cycle — B-2).
- [x] 3.5 Write `src/features/home/ui/home-screen.test.tsx` — render through real theme + i18n,
  mock the `customFetch` mutator seam (real `QueryClient` + real sync mutation), drive
  `usePersonalEvents`/`useSyncedEvents` (or `useCalendarEvents`) with fixtures: assert the header +
  empty state render (no events), the scroller + timeline render with events, a card/tile press fires
  the origin-correct `router.push`, and pull-to-refresh calls `sync()` (calendar-kit is NOT used, so
  no calendar-kit mock is needed for home). Clear the 70% floor.

## 4. Routing + IA relocation

- [x] 4.1 Edit `src/app/(tabs)/index.tsx` to render `HomeScreen` from `@/features/home/ui` (replace
  `PersonalEventsList`). Update the file's doc comment to describe the today view.
- [x] 4.2 Create `src/app/personal-events.tsx` — a thin route re-exporting
  `PersonalEventsList as default` from `@/features/personal-events/ui` (route-structure rule).
- [x] 4.3 Register `<Stack.Screen name="personal-events" />` in `src/app/_layout.tsx` (sibling of
  `(tabs)`, mirroring `calendar`/`settings`), with a localized header title via the route or screen.
- [x] 4.4 Add a "Personal events" entry link to `src/components/profile.tsx`
  (`<Link href="/personal-events">`, accessible, translated label), mirroring the existing Profile
  entries (Calendar / Settings / onboarding).

## 5. i18n

- [x] 5.1 Add the flat keys to `src/i18n/locales/en.json` and `fr.json` (both — `tsc` parity fails
  otherwise): `home.header.count_one`/`home.header.count_other` (plural, takes `{{count}}`),
  `home.header.empty`, `home.today.title`, `home.today.empty`, `home.addPersonalEvent`,
  the a11y labels for the upcoming card / timeline tile (`home.event.openLabel` with title/time/location
  + a view-details/edit hint), `home.nowLabel`, the refresh label, and `profile.personalEvents.label`
  (the Profile entry). Reuse `app.name` for the header app-name. Date/time values come from the
  formatter, not catalog keys.

## 6. E2E (Maestro)

- [x] 6.1 Create `mobile/.maestro/home.yaml` — launch → assert the Home tab renders (the app-name
  heading + the empty-day state, since the dev harness seeds no synced events) → assert pull-to-refresh
  is reachable. Note in the file the seeded-data limitation (the populated today render is the on-device
  visual pass, like calendar/agenda/details).
- [x] 6.2 Update `mobile/.maestro/personal-events.yaml` to reach the personal-events list via its new
  `/personal-events` route (or the Profile entry) instead of the Home tab, preserving the CRUD
  round-trip assertions.

## 7. Architecture Book + ADR + roadmap (R-1: docs after the code/gates)

- [x] 7.1 Write ADR `decisions/022-home-ia-today-view.md` (copy `TEMPLATE.md`) — "Home tab is the
  today view; the standalone personal-events list relocates to a Profile-reached `/personal-events`
  route" (D1 + D2): context (the Flutter home parity + the Phase-2 placeholder), decision, alternatives
  rejected, consequences, revisit-if. Add the row to `decisions/README.md` index.
- [x] 7.2 Add a "Home / today view" section to `.claude/rules/mobile/features.md` (the new feature
  folder, the composition of landed seams, the displayed-day selector, the salvage-engine reuse, the
  observability ➖N/A note) AND update the existing "Settings/Personal events" / Home-tab references so
  the book reflects the IA move (the Home tab is the today view; the personal-events list is now a
  Profile-reached route — link ADR 022).
- [x] 7.3 Add a note to `.claude/rules/mobile/calendar.md` that the salvaged overlap engine
  (`layoutOverlaps` + `time-grid`) now has its **first rendering consumer** (the home today timeline),
  and update the "Deferred" line that named "the home today mini-grid" to point at this landed ship.
- [x] 7.4 Update `.claude/rules/mobile/i18n.md` (or confirm no change) re: item-5 closure — note that
  the date-fns formatter now covers home too and roadmap item 5 (date/time) is closed (relative-time +
  ICU remain the existing earned-when-needed debt).
- [x] 7.5 Append a `architecture-changelog.md` entry (live section, newest last): `add-mobile-home`
  (Phase-04 item 4) — the Home tab today view, the IA relocation, the salvage-engine first render,
  item-5 closure; link ADR 022.
- [x] 7.6 Tick roadmap item 4 (home) and mark item 5 (date/time) closed in
  `docs/react-native-migration/01-roadmap/` (the Phase-04 file).

## 8. Verify (the green gate — foundation work isn't done until CI-green)

- [x] 8.1 Run in `mobile/`: `npx tsc --noEmit` (clean), `npm run lint` (`--max-warnings 0`, incl.
  feature-boundary B-1…B-4, no-hardcoded-strings, a11y-on-touchables), `npm test -- --coverage`
  (90% on `home/data/**`, 70% global incl. `home/ui/**`). Fix any failure before considering done.
- [x] 8.2 Run `openspec validate add-mobile-home` — must pass.
