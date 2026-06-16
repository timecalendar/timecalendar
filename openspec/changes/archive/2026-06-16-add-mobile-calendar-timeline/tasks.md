## 1. Dependency + root enabler

- [x] 1.1 Add `@howljs/calendar-kit` via `npx expo install @howljs/calendar-kit` (run in `mobile/`) so the SDK-56-aligned version + its pure-JS transitives (`luxon` / `rrule` / `lodash.*`) land and the lockfile regenerates. Confirm it adds **no** `app.config.ts` plugin and no native module (pure-JS — ADR 019).
- [x] 1.2 Mount `GestureHandlerRootView` (from `react-native-gesture-handler`, already a dep) as the **outermost** wrapper in `src/app/_layout.tsx` with `style={{ flex: 1 }}`, above `PersistQueryClientProvider`. Add a one-line comment noting calendar-kit requires it (D5). This is app infra, not a calendar-kit import — it does not go behind the seam.

## 2. Calendar-kit chrome seam + lint ban (D2 / ADR 020)

- [x] 2.1 Create `src/components/chrome/calendar-kit.tsx` — the **single import site** for `@howljs/calendar-kit`. Re-export the surface the screen needs (`CalendarContainer` + `CalendarHeader` + `CalendarBody` + the `EventItem` type) under a stable local API, and own the `theme`-from-`@/theme`-tokens build helper + the `renderEvent` plumbing seam. Keep it thin (no higher-level composed calendar from a sample of one — R-2).
- [x] 2.2 Add the seam exports to `src/components/chrome/index.ts` (the chrome barrel).
- [x] 2.3 In `mobile/eslint.config.js`, add an entry to `chromeAlphaImportPatterns` banning `@howljs/calendar-kit` (regex `^@howljs/calendar-kit($|/)`, message naming the `@/components/chrome` seam), so it is banned everywhere except `src/components/chrome/**` (re-set off there via the existing `banChromeAlpha: false` for the `timecalendar/chrome-seams` block — mirrors `@expo/ui`). Update the `chromeAlphaImportPatterns` doc comment to note the list is "imports reachable only through a chrome wrapper" (single-import-site wrapper, alpha-ness incidental) — the R-1 honesty fix (D2 note). Do NOT rename the constant (out-of-scope line churn).

## 3. Salvaged pure primitives (`data/`, 90%-gated — D4)

- [x] 3.1 Create `src/features/calendar/data/overlap-layout.ts` porting the spike-validated `layoutOverlaps<T extends Interval>` **verbatim** (the `Interval` + `Placed` types, `overlaps`, the unbounded-column packing, the post-pass column normalization, the `startX`/`endX` fractional positions). Pure — no React, no calendar-kit, no `@/db`, no `t()`.
- [x] 3.2 Write `src/features/calendar/data/overlap-layout.test.ts`: disjoint → 1 column full-width; A/B/C → exact thirds; the 5-way cluster → 5 even columns; a freed-column-reuse case; sort-stability. Clear the 90% logic gate.
- [x] 3.3 Create `src/features/calendar/data/time-grid.ts`: the Flutter-parity constants as named exports (`GRID_START_MINUTE = 7*60`, `GRID_END_MINUTE = 21*60`, `DEFAULT_PIXELS_PER_HOUR = 60`, `HOURS_COLUMN_WIDTH = 50`, `MIN_TILE_WIDTH = 20`) and the pure math: `minuteToPixel(minute, { pixelsPerHour, startMinute })`, `eventHeight(durationMinutes, pixelsPerHour)`, `hourLabels(startMinute, endMinute)`, `nowIndicatorPosition(now, opts)`. Pure (no React, no calendar-kit).
- [x] 3.4 Write `src/features/calendar/data/time-grid.test.ts`: minute→pixel formula, event height, hour-label list for 7:00–21:00, now-indicator within/outside the window. Clear 90%.

## 4. Domain CalendarEvent + events-source seam (`data/` — D3)

- [x] 4.1 Create `src/features/calendar/data/types.ts` exporting the `CalendarEvent` domain type (Date timestamps, `#RRGGBB` color, and the designed-in sync-model fields `allDay`/`teachers`/`tags`/`canceled`/`location`/`description`/`userCalendarId`). Add a comment: the shape mirrors the eventual Flutter `calendar_event.toDbMap()` so item 2's `calendar_events` table maps onto it (ADR 011/018 importer-fidelity posture) — **not persisted here**.
- [x] 4.2 Create `src/features/calendar/data/fixtures.ts` — a committed **dense-week fixture** (`CalendarEvent[]`) mirroring the spike's worst case (a Tuesday 5-way overlap cluster + back-to-back blocks across the week) so the brand surface + overlap rendering are reviewable and Maestro-assertable. Use stable titles for the Maestro assertion.
- [x] 4.3 Create `src/features/calendar/data/events.ts` exporting `useCalendarEvents(range: { from: Date; to: Date }): CalendarEvent[]` — the single events-source seam. This ship: map the fixture + `usePersonalEvents()` (imported from `@/features/personal-events` barrel — a cross-feature edge through the barrel, allowed) `PersonalEvent → CalendarEvent` (`allDay: false`, empty `teachers`/`tags`, `canceled: false`), merge, filter to the range. Comment it as the seam the sync ship swaps (signature/shape/consumers stay fixed — D3).
- [x] 4.4 Write `src/features/calendar/data/events.test.ts`: the personal-events→CalendarEvent mapping; merge with the fixture; range filtering includes intersecting + excludes outside; empty range. Mock `@/features/personal-events` (or rely on the suite-wide db mock) as the existing hooks tests do. Clear 90%.
- [x] 4.5 Create `src/features/calendar/data/index.ts` sub-barrel re-exporting the primitives, the constants, `CalendarEvent`, the fixture, and `useCalendarEvents`.

## 5. Timeline screen (`ui/` sublayer — D6)

- [x] 5.1 Create `src/features/calendar/ui/calendar-screen.tsx` (presentational, 70% floor): hold view state (day | week) + the visible date, compute the range, call `useCalendarEvents(range)` (via the sibling `@/features/calendar/data` sub-barrel — B-2), map `CalendarEvent[] → EventItem[]` and render through `@/components/chrome` (`CalendarContainer` + `CalendarHeader` + `CalendarBody` with `showNowIndicator` + `renderEvent`). Build the `theme` from `@/theme` tokens (grid/labels/header/now-indicator → brand `primary`). `start`/`end` from the time-grid constants (7:00–21:00). `numberOfDays` = 1 (day) / 5 (week, weekends-off default).
- [x] 5.2 `renderEvent` tile: title (+ location when present), tinted by the event `#RRGGBB` color, an accessible label (title + time + location). Respect the min-tile-width → hide-text rule (use `size` from `renderEvent`).
- [x] 5.3 Day/week view switch: two accessible buttons / a segmented control — each with `accessibilityRole`, a translated `accessibilityLabel`, `accessibilityState={{ selected }}`, and a ≥44pt/48dp target (hitSlop + minHeight). Title carries a heading role (`ThemedText type="title"`). Empty-range state with `accessibilityLiveRegion="polite"` + a status role. All copy via `t()`.
- [x] 5.4 Create `src/features/calendar/ui/index.ts` sub-barrel exporting the screen; create `src/features/calendar/index.ts` feature barrel re-exporting `data` + `ui` (note the no-self-barrel-cycle rule B-2 in a comment).

## 6. Route + reachability

- [x] 6.1 Create `src/app/calendar.tsx` as a thin re-export of the screen through the `ui/` sub-barrel (`export { CalendarScreen as default } from "@/features/calendar/ui"` — route-structure rule; no colocated test under `src/app/`).
- [x] 6.2 Register the route as a `<Stack.Screen name="calendar" />` sibling of `(tabs)` in `src/app/_layout.tsx` (reachable for deep-link/Maestro). Tab placement is the later home item's call (design open question) — this ship makes it reachable, not a tab.

## 7. i18n

- [x] 7.1 Add flat keys to `src/i18n/locales/en.json` for every new user-facing string (screen title, day/week labels, the view-switch a11y labels, the empty-range message, the event-tile a11y label template).
- [x] 7.2 Add the identical key set to `src/i18n/locales/fr.json` (translated) — bidirectional `tsc` parity must pass.

## 8. Jest proof (mock the calendar-kit seam — D7)

- [x] 8.1 Create `jest/setup-calendar-kit.ts` mocking `@howljs/calendar-kit` suite-wide: `CalendarBody` invokes `props.renderEvent(event, size)` for each event in context (rendering the real plain-View tile) so the screen's event→tile wiring + the mapping + theme/label plumbing are provable; `CalendarContainer`/`CalendarHeader` render their children. Follow the `setup-expo-ui.ts` factory conventions (plain JS factory, lazy `require`). Register it in `jest.config.js` `setupFilesAfterEnv` after the existing setups.
- [x] 8.2 Write `src/features/calendar/ui/calendar-screen.test.tsx`: render through the real theme + i18n trees; assert localized text (not keys); assert a fixture event's tile renders with its translated label; drive the day/week switch and assert the selected state / numberOfDays change; assert the empty-range state when no events intersect.
- [x] 8.3 Confirm the coverage split holds: `data/` (overlap-layout, time-grid, events) clears 90%; the `ui/` screen falls under the 70% global floor (the `src/features/*/!(ui)/**` glob excludes `ui/`).

## 9. Maestro

- [x] 9.1 Add `mobile/.maestro/calendar.yaml`: launch the dev-variant app, deep-link `timecalendar-dev://calendar`, assert the screen renders and a committed fixture event's title is visible (the fixture is committed data — reachable with no seeded backend, the right target since sync isn't built). Note in a comment that dense-overlap visual correctness + frame rate are the on-device manual pass, not Maestro.

## 10. Architecture Book + ADR + docs

- [x] 10.1 Write `/.claude/rules/mobile/decisions/020-calendar-kit-seam.md` (ADR 020) recording the calendar-kit seam form (the chrome-wrapper + `no-restricted-imports` ban), justified by **swap-reversibility** (ADR 019), distinguished from ADR 010's alpha-churn rationale; alternatives (feature-internal boundary, bespoke seam, no seam) rejected; revisit-if (a 2nd renderer wants the wrapper; calendar-kit dropped behind the seam; the chrome-ban constant outgrows the "alpha" name → rename). Mirror ADR 010/017 rigor; reference ADR 019.
- [x] 10.2 Add the ADR 020 row to `/.claude/rules/mobile/decisions/README.md` index.
- [x] 10.3 Create `/.claude/rules/mobile/calendar.md` (new topical rule file): the calendar-kit dep (pure-JS, no fingerprint bump), the chrome seam + ban, the salvaged pure primitives (overlap-layout + time-grid, owned regardless, 90%-gated, the fallback insurance), the `CalendarEvent` + events-source seam (fixture/personal-events-fed now, sync-fed next), the brand-surface posture (R-3), the `GestureHandlerRootView` root mount, what CI proves vs. on-device. R-1 pointer style. Reference ADR 019 + 020.
- [x] 10.4 Add the `calendar.md` row to the topical-file index table in `/.claude/rules/mobile/architecture.md`.
- [x] 10.5 Update `/.claude/rules/mobile/lint-format.md`: add `@howljs/calendar-kit` to the chrome-seam ban list note (the rule inventory's chrome-alpha entry) — note it is a stable dep banned for swap-localization, not alpha churn.
- [x] 10.6 Add a `calendar` feature entry to `/.claude/rules/mobile/features.md` (day/week timeline ship; `data/` primitives + events-source seam + `ui/` screen; the seam; observability ➖ N/A; the agenda follow-up + home reuse the salvaged primitives).
- [x] 10.7 Append a live entry to `/.claude/rules/mobile/architecture-changelog.md` (date 2026-06-16, slug `add-mobile-calendar-timeline`): what moved (calendar-kit + chrome seam/ban, `GestureHandlerRootView` root, the salvaged primitives, the `CalendarEvent`/events-source seam, the brand timeline screen, the calendar.md rule file), why (Phase-04 item 1, first half — day/week timeline per ADR 019), pointers (ADR 019, ADR 020, calendar.md, features.md). Note the agenda follow-up.

## 11. Human handoff (inbox)

- [ ] 11.1 (HUMAN: see inbox/2026-06-16-calendar-low-end-android-perf.md) Verify the day/week timeline holds the frame-rate bar on a real **low-end Android** device (ADR 019's exit-criterion gate) and capture **Reassure** perf baselines for the timeline screen. Skip-and-continue — CI cannot drive the Reanimated grid or measure on-hardware frame rate. (Inbox note already present; deferred to human.)
- [ ] 11.2 (HUMAN: see inbox/2026-06-16-calendar-visual-brand-review.md) Brand visual review of the calendar surface on iOS + Android (DoD native-correctness axis — designed brand surface, R-3): grid, tiles, overlaps, now-indicator, day/week switch read correctly and on-brand. Skip-and-continue. (Inbox note already present; deferred to human.)

## 12. Local verification (run in `mobile/`)

- [x] 12.1 `npx tsc --noEmit` — clean (FR/EN parity included).
- [x] 12.2 `npm run lint` — clean (`--max-warnings 0`; no hardcoded strings, the new `@howljs/calendar-kit`-outside-chrome ban holds, feature boundaries B-1..B-4, import order).
- [x] 12.3 `npm test` — green, including the primitives + events-source + screen tests and the coverage thresholds (90% logic / 70% global).
- [x] 12.4 `openspec validate add-mobile-calendar-timeline --strict` — passes.
