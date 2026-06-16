# Calendar

The Phase-04 calendar surface. Entries below are R-1 pointers plus the caveats
tooling can't carry; the load-bearing decisions are **ADR
[019](./decisions/019-calendar-rendering-adopt-calendar-kit.md)** (adopt
`@howljs/calendar-kit` v2 behind a seam, salvage the overlap/time-grid primitives)
and **ADR [020](./decisions/020-calendar-kit-seam.md)** (the seam form). The **day/week
timeline** (item 1, first half) and the **agenda/planning view** (the "Agenda / planning
view" section — `add-mobile-calendar-agenda`) have both landed; calendar sync is the
remaining scoped follow-up that builds on the unchanged events-source seam.

## The renderer dependency — `@howljs/calendar-kit` v2, pure-JS

- `@howljs/calendar-kit` (`~2.5.6`, `npx expo install`-pinned) is the day/week timeline
  renderer (ADR 019 — the Phase-04 spike's adopt decision). It is **pure-JS**: it
  autolinks **nothing**, adds **no `app.config.ts` plugin**, and **does not bump the EAS
  fingerprint** — it rides the OTA lane (its native footprint is inherited entirely from
  the already-present Reanimated/gesture-handler). Its `luxon` / `rrule` / `lodash.*`
  transitives enter the lockfile.
- It requires a **`GestureHandlerRootView` ancestor** (verified in the spike). Mounted as
  the **outermost** wrapper in `src/app/_layout.tsx` (`style={{ flex: 1 }}`, from
  `react-native-gesture-handler`, already a dep). This is **app infrastructure**, not a
  calendar-kit import — it is the standard RN gesture root and benefits any future gesture
  surface, so it is NOT behind the calendar seam (D5).

## The chrome-wrapper seam + lint ban — ADR 020

- `src/components/chrome/calendar-kit.tsx` is the **single import site** for
  `@howljs/calendar-kit`. Feature/screen/route code imports `@/components/chrome`, never
  the library — **lint-enforced**: `mobile/eslint.config.js` `chromeAlphaImportPatterns`
  bans `@howljs/calendar-kit` (+ subpaths) everywhere except `src/components/chrome/**`
  (re-set off for the `timecalendar/chrome-seams` block, mirroring `@expo/ui`).
- **The ban's justification is swap-reversibility, NOT alpha churn** (the load-bearing
  nuance vs. ADR 010): calendar-kit is a stable dep, but it is the #1-risk surface on a
  single maintainer, so the lint-enforced single import site is what makes "fork or swap
  to custom behind the unchanged wrapper" cheap (ADR 019's revisit anticipates exactly
  this). The constant is named `chromeAlphaImportPatterns` but the list is really "imports
  reachable only through a chrome wrapper" — its doc comment says so; a rename is ADR
  020's revisit trigger (out-of-scope line churn here).
- The wrapper stays **thin** (R-2): it re-exports `CalendarContainer` / `CalendarHeader` /
  `CalendarBody` + the `EventItem` type, and owns `buildCalendarTheme(@/theme tokens)` —
  the token → calendar-kit `theme` mapping so the grid/header/now-indicator can't drift
  from the brand palette (the now-indicator rides `primary`). No higher-level composed
  calendar from a sample of one consumer; that is earned by the agenda/home ships.

## The salvaged primitives — pure, owned, 90%-gated, the fallback insurance

Owned **regardless of the renderer** (ADR 019's salvage mandate), under
`src/features/calendar/data/`, pure (no React, no calendar-kit, no `@/db`, no `t()`):

- **`overlap-layout.ts` — `layoutOverlaps<T extends Interval>`** ports the spike-validated
  unbounded-column packing (5-way cluster → 5 even columns; A/B/C → exact thirds; freed
  columns reused; chronological stable sort; fractional `startX`/`endX`).
- **`time-grid.ts`** — the Flutter-parity grid constants as named exports
  (`GRID_START_MINUTE = 7*60`, `GRID_END_MINUTE = 21*60`, `DEFAULT_PIXELS_PER_HOUR = 60`,
  `HOURS_COLUMN_WIDTH = 50`, `MIN_TILE_WIDTH = 20`) + the pure math (`minuteToPixel`,
  `eventHeight`, `hourLabels`, `nowIndicatorPosition`).
- These are the **de-risking insurance**: the day/week screen renders through calendar-kit
  (its own internal layout), so the primitives' first **rendering** consumer is the agenda
  follow-up + the home today-grid; their first **tested** consumer is this ship's suite. If
  calendar-kit is ever dropped (ADR 019 revisit), these + a Reanimated grid become the
  renderer behind the unchanged wrapper. Under the `src/features/*/!(ui)/**` 90% glob.

## The domain `CalendarEvent` + the events-source seam

- **`data/types.ts` `CalendarEvent`** exposes `Date` timestamps + a `#RRGGBB` color and is
  **designed against the sync model** — the sync-model fields
  (`allDay`/`teachers`/`tags`/`canceled`/`userCalendarId`) mirror the Flutter
  `calendar_event.toDbMap()` so the sync ship's `calendar_events` table maps onto it with the
  ADR-011/018/021 importer-fidelity posture, **without a shape change** to any consumer. **Now
  persisted** (the sync ship landed — see storage.md "Calendar events store").
- **`data/events.ts` `useCalendarEvents(range): CalendarEvent[]`** is the **single
  events-source seam** — the screen must not know where events come from. **Calendar sync
  LANDED the source swap** (`add-mobile-calendar-sync`, ADR 021): it now reads the synced
  `calendar_events` rows reactively (`useSyncedEvents()` over `useLiveQuery`, row→domain
  mapped) merged with the existing **personal-events read** (`usePersonalEvents()` mapped
  `PersonalEvent → CalendarEvent`), then range-filters the combined set **once** here — same
  signature, same `CalendarEvent` shape, **no consumer change** (the seam absorbed the swap,
  exactly as designed — the swap was this one file). The
  **dense-week fixture is no longer in the default runtime merge** — `denseWeekFixture` stays
  exported from `data/index.ts` **dev/test-only** (the primitive/screen tests + optional
  `__DEV__` seeding; it is the overlap-engine's worst-case test anchor).

## The timeline screen — a brand surface (R-3)

- `src/features/calendar/ui/calendar-screen.tsx` (presentational, 70% floor): holds the view
  (day | week) + visible date, computes the range, reads through the sibling `data` sub-barrel
  (B-2), maps `CalendarEvent[] → EventItem[]`, and renders through `@/components/chrome`
  (`CalendarContainer` + `CalendarHeader` + `CalendarBody` with `showNowIndicator` +
  `renderEvent`). The `theme` is built from `@/theme` tokens (now-indicator → brand
  `primary`); `start`/`end` from the 7:00–21:00 time-grid constants; `numberOfDays` = 1 (day)
  / 5 (week, weekends-off default, Flutter parity). **No event-write path** — the only write
  it triggers is the sync orchestrator's `sync()` (pull-to-refresh / retry — see "Calendar
  sync"), staying presentational (it calls the `data/` hook, holds no fetch logic).
- **a11y:** the title is a `ThemedText type="title"` heading; the day/week switch is two
  `accessibilityRole="tab"` controls with translated labels + `accessibilityState.selected` +
  ≥44pt targets; each event tile is an accessible element with a translated label (title +
  time + location); the empty-range state uses a polite live region. Below `MIN_TILE_WIDTH`
  the tile text is hidden (the column is too narrow).
- A thin route `src/app/calendar.tsx` re-exports the screen through the `ui/` sub-barrel
  (route-structure rule), registered as a `<Stack.Screen name="calendar" />` sibling of
  `(tabs)` — reachable for deep-link/Maestro. Tab placement is the later home item's call.

## Agenda / planning view

The **third in-place view mode** (day → week → **agenda**), grown in
`src/features/calendar/` on the salvaged primitives + the **unchanged** events-source seam
(the timeline ship deliberately split this out — calendar-kit has no agenda view, so this is
the custom "easy half" ADR 019 anticipated). A **day-grouped list, not a timeline grid** — it
does **not** use calendar-kit (**no new ADR** — D5; the load-bearing call is ADR 019's). The
two real choices (`SectionList`-over-FlashList, `date-fns` display-only) are `design.md`
decisions, not ADR-worthy.

- **`data/agenda.ts` `groupEventsByDay(events): AgendaDay[]`** — the agenda analog of
  `layoutOverlaps`, pure (no React/calendar-kit/`@/db`/`t()`/`date-fns`), **90%-gated**. Sorts
  by `startsAt` (stable `localeCompare` tie-break), buckets by **local** calendar day (local
  Y-M-D, mirroring Flutter `isSameDate` — **not** UTC, so a 23:30-local event lands on its own
  day), ascending. **Deliberate divergence from the Flutter `events_for_planning_view_helper`
  `endsAt`-carry quirk** — we group by each event's own `startsAt` local day (the correct
  grouping); recorded so it is not "fixed" back.
- **`data/format.ts`** — the locale-aware **display-only** date/time formatter over `date-fns`
  (+ `date-fns-tz`), **roadmap item 6 pulled early** (the first real date-formatting need),
  pure + **90%-gated**: `formatDayHeaderParts(day, locale)` (uppercased short weekday + day
  number — Flutter `fullDayToShortDay`) and `formatTimeRange(start, end, locale)`
  (`"HH:mm – HH:mm"`, 24-hour, French-first). Locale comes from the app i18n locale
  (`i18next.language` → `AppLocale`); **a new app locale needs a `date-fns/locale` entry in the
  helper's `LOCALES` map.** Display only — no parsing, no rrule/Temporal/recurrence.
- **`date-fns` + `date-fns-tz` are pure-JS** (`npx expo install`-pinned: `date-fns` v4,
  `date-fns-tz` v3) — autolink nothing, add no `app.config.ts` plugin, **do not bump the EAS
  fingerprint** (ride the OTA lane), work under Jest unchanged. **Not** a chrome-seam / banned
  import — a plain utility, unlike calendar-kit (no swappable rendering surface to localize).
- **`ui/agenda-list.tsx`** (presentational, 70% floor) — a React Native core **`SectionList`**
  (**zero new dep** — D4) of day sections (`renderSectionHeader` = the day header with a
  heading role; `renderItem` = an event tile). Themed from `@/theme` tokens (R-3): a `Radii.large`
  (~15px) radius, a subtle shadow (offset (0,3), 6% black, blur 15 — Flutter planning-tile
  parity), the `#RRGGBB` event color as the tile's **left accent border**, the **now/upcoming
  indicator** a brand-`primary` accent column on the next-upcoming event (the first ending after
  the mount-time clock, read once via `useState(() => Date.now())` so render stays pure).
  **Read-only** — the tile is **not** a touchable (`accessibilityRole="text"`, no `onPress`; the
  tap target lands with event details, a later item — so it is not a dead touchable).
- **`SectionList` over FlashList — recorded revisit trigger:** the data is bounded this ship
  (fixture + personal events over the visible week — a few dozen tiles), so virtualization buys
  nothing and FlashList v2 would be a **fingerprint-bumping native dep** for no gain (R-2). **When
  calendar sync widens the range** to hundreds–thousands of events over a long horizon and
  `SectionList` janks on a low-end device, swap FlashList v2 behind the **unchanged `AgendaList`**
  (the list engine is an internal detail of one file) — owned by the sync ship's perf pass.
- The screen (`ui/calendar-screen.tsx`) widens `view` to `"day" | "week" | "agenda"`, adds a
  third accessible `tab` to the existing `tablist`, and in the agenda branch computes a **bounded
  multi-day window** (the visible week, `AGENDA_DAYS = 7`), reads the **unchanged**
  `useCalendarEvents(range)`, resolves the locale from `i18next.language`, and renders
  `<AgendaList>` instead of the calendar-kit grid. The day/week branches + range logic are
  unchanged. The empty-range polite-live-region state covers the agenda too.
- **i18n/a11y:** new flat keys (`calendar.view.agenda`/`…agendaLabel`,
  `calendar.agenda.event.label`, `calendar.agenda.nowLabel`); the day-header + time strings come
  from the **formatter (locale data), not catalog keys** (D3). Day headers carry a heading role,
  tiles a translated label (title + time + location), the now-indicator a translated status label.
- **Observability ➖ N/A** (read-only — D6; same as the day/week timeline). **CI proves** the
  `groupEventsByDay` + the formatter at 90% and the screen's events→sections→tiles wiring
  (a plain `SectionList`, **no calendar-kit mock needed**); the dense visual correctness + frame
  rate stay the calendar surface's existing on-device pass
  (`inbox/2026-06-16-calendar-visual-brand-review.md`, extended to name the agenda — no new note).

## Calendar sync — the source swap, durable cache, triggers (ADR 021)

Calendar sync **landed** (`add-mobile-calendar-sync`, Phase-04 item 3): the events the
calendar renders now come from `POST /calendars/sync { tokens }` over the durable
`user_calendars` tokens, persisted into the third Drizzle table `calendar_events`
(schema + the full `data/sync/` layer + the transactional drop+replace live in
storage.md "Calendar events store"; the storage/sync decisions are **ADR
[021](./decisions/021-calendar-event-storage-and-sync.md)**).

- **The source swap** is invisible to consumers — `useCalendarEvents(range)` now sources
  `useSyncedEvents()` (reactive `useLiveQuery` over `calendar_events`, row→domain mapped)
  merged with the personal-events read and range-filtered once here; the timeline + agenda
  screens are **unchanged** for the swap (only the pull-to-refresh wiring is new). The fixture
  is dev/test-only now.
- **Sync triggers (design D5):** a fire-and-forget **startup sync** (`useStartupSync()`, a
  once-effect mounted in `_layout.tsx` inside the query provider — it goes through the feature
  `data/` hook, never `@/db` directly, B-3/B-4; silent on failure — an offline launch shows the
  last-good rows), and **pull-to-refresh** on the calendar screen (a `RefreshControl` on the
  agenda `SectionList`, brand-tinted from `@/theme` `primary`, calling `sync()`). The grid view
  (calendar-kit's own Reanimated scroller) is not wrapped for pull-to-refresh — the accessible
  **sync-error + retry** banner (a polite live region + `accessibilityRole="alert"` + a labeled
  retry control) shows across **all** views, so a failed sync is recoverable from any view.
- **Offline-safe by construction:** the drop+replace runs only after a successful fetch, so a
  failed fetch leaves the last-good rows; the durable `calendar_events` reads offline.

## Event details (read-only)

The view reached by **tapping a synced event** (`add-mobile-event-details`, Phase-04 item 3). It
is the **first consumer of ADR 021's verbatim row** — the rich data the lossy rendering
`CalendarEvent` deliberately drops lives in the row, and this read consumes it. **Read-only
VIEW HALF ONLY** — no edit / delete / hide / checklist, no header overflow menu, no write path
(design D1). **No new ADR** (D8): the read-only-vs-edit scope, the synced-vs-personal routing,
and the rich-read-over-the-verbatim-row are *executions of* ADRs 019/020/021/014 + the
route-structure rule, not new reversible patterns.

- **The rich read — `data/event-details.ts`** (90%-gated): a pure **`rowToEventDetails(row):
  EventDetails`** mapper — the rich counterpart to the lossy `rowToCalendarEvent` — that keeps the
  fields the rendering projection drops (`groupColor`, the real `type` enum, `exportedAt`, the
  **full** `tags: {name,color,icon}[]` — not name-only), decoding the JSON columns **defensively**
  by **reusing the sync mapper's `decodeJsonArray`/`decodeFields`** (now exported from
  `data/sync/types.ts` — corrupt/legacy → `[]`/`null`/`false`, never throws; ADR 021/D2). `type`
  narrows to `EventTypeEnum` with a safe `class` fallback for an unknown verbatim value (importer
  fidelity). A **`getByUid(uid): Promise<EventDetails | null>`** repository read on `calendar_events`
  (the only `@/db` import site for this read, B-1; reuses the already-re-exported `eq`, no new
  operator — R-2). A reactive **`useEventDetails(uid)`** hook over the seam's `useLiveQuery` that
  distinguishes **loading** (`updatedAt === undefined`) from **not-found** (`event === null` after
  load), so the screen re-renders if a sync replaces the row while open. The rich `EventDetails`
  type is **separate** — the rendering `CalendarEvent` is NOT widened (D3 — the grid/agenda don't
  need the rich fields; widening bloats every tile for one consumer, against ADR 021/D1).
- **The full date/time formatters — `data/format.ts`** (90%-gated): `formatEventDateRange(start,
  end, locale)` (the title block's full date + `HH:mm – HH:mm` range — Flutter `eventDateTimeText`,
  24-hour per R-3; same-day = one date + both times, cross-day = both full date-times) and
  `formatFullDateTime(date, locale)` (the footer's `exportedAt` full date+time — Flutter
  `fullDateTimeText`). Display-only over the existing `date-fns` + `LOCALES` map — **no new dep**.
- **The details screen — `ui/event-details-screen.tsx`** (presentational, 70% floor): a designed
  brand surface themed from `@/theme` (R-3) — a `ScrollView` with the **title block** (a labeled
  color **swatch** with a translated `accessibilityLabel`, the title as `ThemedText type="title"` =
  heading role, the formatted full date/time), **tag bubbles** (each the tag `color` background +
  the tag `name`; **no icon** — no icon-font dep is wired in the app and R-3 forbids porting
  Flutter's FontAwesome; the glyph is a **recorded parity gap**, the bubble name+color is the
  parity-meaningful surface), **content lines** (a label + value for `location`, the **calendar
  name** when the user has 2+ calendars — resolved via `useUserCalendars()`, `teachers`
  newline-joined, `description` — each only when present), and the **"Updated …" footer**. An
  accessible **not-found state** (`{ event: null, loading: false }` — a stale deep link / a row
  dropped by a sync) renders a translated message in a polite live region — not a crash, not a
  blank (the read-only analog of the school read's `isError`). No icons → the line **label is its
  accessible affordance**.
- **The tap-through** (D2/D4): the **agenda tile** became a `Pressable`
  (`accessibilityRole="button"` + a translated `…openLabel` incl. a view-details hint + a ≥44pt
  `minHeight` target) calling a screen-provided `onPressEvent(event)`; the **calendar-kit grid**
  wires `onPressEvent` on **`CalendarContainer`** (where calendar-kit actually exposes it — *not*
  `CalendarBody` as first assumed) through the chrome seam (the screen never imports the library —
  the ADR-020 ban holds; the seam re-exports `CalendarContainer` so the prop passes through with no
  seam change). **Routing is keyed on origin** at the one screen handler: a synced event (it carries
  a `userCalendarId`) → `router.push("/event-details/<uid>")`; a personal event (`userCalendarId ===
  undefined`, from `personalToCalendarEvent`) → its existing `personal-event-form?uid=<uid>` edit
  route. The merged `EventItem` carries `userCalendarId` so the grid press routes without a re-query.
- **The route — `src/app/event-details/[uid].tsx`**: a thin re-export of the feature `ui/` screen
  (route-structure rule), registered as a `<Stack.Screen name="event-details/[uid]">` sibling of
  `(tabs)` with `headerShown: true` (the default accessible back affordance; the screen sets its
  localized title via its own `<Stack.Screen options>`), deep-linkable
  (`timecalendar-dev://event-details/<uid>`).
- **Observability ➖ N/A** (read-only — D7): a `getByUid` miss is a recoverable accessible
  not-found state and a corrupt column degrades safely, so there is no crash-worthy write/throw
  path; the change imports `@react-native-firebase/*` nowhere.
- **CI vs. on-device:** CI proves the mapper (rich-field survival, corrupt-JSON safe default,
  null↔undefined, unknown-type fallback) + the two formatters at 90%, the `getByUid` query shape +
  `useEventDetails` loading/not-found against the mocked `@/db` seam, the screen's row→sections
  render (heading / formatted date / tags / lines / footer / not-found) + the tap-through routing
  (a press fires the origin-correct `router.push`) at the 70% floor — the calendar-kit Jest mock
  now invokes the container's `onPressEvent` so the grid-press route is provable. The **real
  populated render** needs a seeded synced event the dev harness lacks, so Maestro asserts
  **reachability** (a deep link to the details route shows the not-found state) and the populated
  render is the on-device manual pass (`inbox/2026-06-16-event-details-on-device.md`).
- **Revisit trigger (recorded, no ADR yet):** if a **second** rich-row consumer wants a *different*
  rich-projection shape, that is when an "event-details rich domain" ADR earns its place (D8).

## Observability — split: read/sync-fetch ➖ N/A, local replace-transaction ✅ (ADR 021 / D6)

A **read-only render** and a **sync fetch failure** are **recoverable** — the last-good rows
render and the user can retry — so they are an `isError` UI state and are **NOT** `recordError`'d
(mirroring the school-selection read path). The deliberate exception: a failure of the local
**`replaceAll` transaction** (a SQLite write failure, not a network failure) IS a crash-worthy
local-persistence failure and is recorded through `@/firebase`
`recordError(error, "calendar/sync")` — the only place the calendar feature touches the firebase
seam. The orchestrator distinguishes the two by where the chain throws (a mutation rejection →
`isError` only; a `replaceAll` throw → `recordError` + `isError`).

## What CI proves vs. what's on-device

- **CI proves OUR wiring** (D7): the salvaged primitives + the events-source seam are
  unit-tested at 90% (pure / a mocked `usePersonalEvents`); the screen test renders through
  real theme + i18n with the **calendar-kit grid mocked suite-wide**
  (`jest/setup-calendar-kit.ts` — the mocked `CalendarBody` invokes `renderEvent` per event)
  so the event→tile wiring + the `CalendarEvent`→`EventItem` mapping + theme/label plumbing
  are provable without the Reanimated grid. Same posture as the `@expo/ui` picker (CI proves
  wiring, not the native control).
- **The sync layer** (`data/sync/**`) is unit-tested at 90% — mappers (`dtoToRow`
  **verbatim survival** of groupColor/type/rich-tags/rich-fields + canonical-UTC + null
  handling; `rowToCalendarEvent` round-trip + **corrupt-JSON → safe default** + the lossy
  rendering projection), the repository query shape + the **transactional drop+replace**
  (delete-then-insert inside one `transaction`, chunked, taking rows), the **sync wiring at
  the `customFetch` seam** (success writing **verbatim rows**, no-tokens no-op, fetch-failure
  → `isError` no-record, replace-failure → `recordError`), the reactive hook + the startup
  trigger, and a **restart-simulation** (a fresh repository module reads back a prior
  `replaceAll` through a
  stateful Map-backed `@/db` fake). See storage.md.
- **On-device (manual, inboxed) — CI cannot drive the Reanimated grid, measure on hardware,
  prove on-disk SQLite survival, or drive a real sync:** the dense-overlap visual correctness +
  the **low-end-Android frame-rate bar + Reassure baselines on REAL synced data** (ADR 019's
  exit-criterion gate, real hardware — `inbox/2026-06-16-calendar-low-end-android-perf.md`,
  scoped to dense synced timetables), the **brand visual review**
  (`inbox/2026-06-16-calendar-visual-brand-review.md`), and the **sync on-device proofs** —
  real synced render, offline-after-sync, drop+replace atomicity after a mid-sync kill,
  Crashlytics arrival for a forced `replaceAll` failure (`inbox/2026-06-16-calendar-sync-on-device.md`).
- **Maestro** (`.maestro/calendar.yaml`) deep-links `timecalendar-dev://calendar` and asserts
  the screen renders + reachability. The real synced render isn't Maestro-driven (the dev
  harness seeds no `user_calendars` token + synced events reachable by deep link — recorded in
  the inbox note; no new server-seeding work this ship). Not the dense-overlap packing or frame
  rate.

## Deferred (recorded debt — not built this ship)

- **The agenda/planning list view** — **LANDED** (`add-mobile-calendar-agenda`; see the
  "Agenda / planning view" section above). The `SectionList`→FlashList swap when sync widens the
  range is now **reachable on real synced data** — the live trigger is the sync ship's on-device
  perf pass (`inbox/2026-06-16-calendar-low-end-android-perf.md`); no code change unless it janks.
- **Calendar sync** — **LANDED** (`add-mobile-calendar-sync`, ADR 021; see "Calendar sync"
  above + storage.md "Calendar events store"). `POST /calendars/sync` → the durable
  `calendar_events` table; the `useCalendarEvents` source swapped behind the unchanged seam.
- **Event details** — **LANDED** (`add-mobile-event-details`, Phase-04 item 3; see the
  "Event details (read-only)" section above). The agenda/timeline tap target the agenda ship
  forward-referenced is now wired.
- **The checklist + hide-event sibling features** — deliberately **out of this read-only view
  half** (design D1). Each is a **state-writing** feature with its own persistence/store, deferred
  to its own ship: the **checklist** (interactive add/toggle, a fourth Drizzle table + an
  importer-fidelity question) and the **hide-event / hidden-events** feature (writes hidden state +
  filters the events-source seam). Recorded in `inbox/2026-06-16-event-details-deferrals.md`.
- **The home today mini-grid**, weekends-toggle / persisted view preference,
  incremental/delta sync, per-calendar visibility filtering, an offline write queue,
  edit/delete of synced events — later Phase-04+ items; the home grid reuses the salvaged
  overlap engine.
