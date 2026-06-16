## Context

Phase 04 is the calendar — the #1 risk in the migration. The day/week timeline landed
(`add-mobile-calendar-timeline`, ADR
[019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)/[020](../../../.claude/rules/mobile/decisions/020-calendar-kit-seam.md))
and **deliberately split the agenda/planning view out as this follow-up** (timeline design D1):
calendar-kit has **no agenda view**, so the agenda is the custom "easy half" (ADR 019) built on
the **salvaged primitives + the events-source seam the timeline ship already owns**. The roadmap
exit criterion requires day/week/**agenda** to render; this ship closes the rendering surface.

**Verified facts this design relies on (already landed — do not re-derive):**

- The **events-source seam** `useCalendarEvents(range: { from: Date; to: Date }): CalendarEvent[]`
  in `src/features/calendar/data/events.ts` — fixture + personal-events-fed, range-filtered. The
  agenda **reuses it unchanged** (no new source, no seam change).
- The **domain `CalendarEvent`** (`data/types.ts`): `Date` `startsAt`/`endsAt`, `#RRGGBB` `color`,
  `title`, optional `location`/`description`, and the designed-in sync fields.
- The **committed dense-week fixture** (`data/fixtures.ts`), anchored to the current week, with
  stable titles (e.g. "Lecture", "Algorithms") — the Maestro/visual target with no seeded backend.
- The **calendar screen** (`ui/calendar-screen.tsx`) already holds a `view` state (`"day" | "week"`),
  a `visibleDate`, computes a `range`, and renders the day/week grid through `@/components/chrome`.
- The **salvaged primitives** (`data/overlap-layout.ts`, `data/time-grid.ts`) are owned + 90%-gated;
  the agenda is a **list**, so it does **not** need column packing (no intra-day overlap geometry) —
  but the `time-grid` now-indicator math (`nowIndicatorPosition`) is available if the now-marker
  wants the grid posture. The agenda's first real need is **day grouping + locale formatting**, the
  two helpers this ship adds.
- The screen test mocks the calendar-kit seam suite-wide (`jest/setup-calendar-kit.ts`); the agenda
  branch renders a plain `SectionList`, so it needs **no calendar-kit mock** at all.

**Flutter parity (read from `app/lib/modules/calendar/widgets/planning_view/` + helpers):**

- Grouping: `getEventsForPlanningView` sorts by `startsAt`, buckets into `EventsByDay { day, events }`
  per calendar day. The agenda is a **vertical list of day groups** (Flutter `ScrollablePositionedList`).
- Day header: `fullDayToShortDay` = `DateFormat("EEE")` (short weekday, e.g. "lun") **uppercased** +
  the day-of-month number (`day.day`), stacked. Headers for empty days are hidden.
- Event tile (`planning_event_tile` + `planning_rectangle_event`): radius **15px**, a subtle shadow
  (`offset (0,3)`, `rgba(0,0,0,0.06)`, blur 15), title (14px, w500) + a "`HH:mm – HH:mm` (location)"
  line via `eventPlanningDateTimeText` (`DateFormat.jm`). Tap → event details (item 3, **not** here).
- Now indicator (`planning_indicator`): a pink dot + line at `#ff6385` marking the current/upcoming
  position. We render the brand-`primary` analog (R-3 — the platform/brand is the reference, not the
  Flutter pixels).

## Goals / Non-Goals

**Goals:**

- The **agenda/planning view** as a **third in-place view mode** of the calendar screen — a
  day-grouped `SectionList` of events as a designed brand surface (R-3), with day headers, themed
  event tiles (title + time + location), and a now/upcoming indicator.
- A pure **day-grouping helper** (`groupEventsByDay`) — the agenda analog of `layoutOverlaps`,
  90%-gated, mirroring `events_for_planning_view_helper`.
- A **locale-aware display-only date/time formatter** over `date-fns` (roadmap item 6 pulled early),
  90%-gated — the first real date-formatting need.
- Renders from the **unchanged `useCalendarEvents` seam** — calendar sync fills it later with no
  agenda change.
- Full DoD: types, lint, 90/70 coverage, i18n FR+EN, a11y, Maestro, Architecture Book.

**Non-Goals:**

- **Calendar sync** (item 2) — the seam is unchanged; the agenda renders fixture + personal events.
- **Event details / tap-through** (item 3) — the Flutter tile taps into details; this ship is
  read-only render only (no `onPress` navigation target yet — there is no details screen).
- **Recurrence / rrule / Temporal** — `date-fns` is **display formatting only** (recurrence is
  server-side; the synced events arrive already-expanded).
- **A persisted view preference / weekends toggle / `ScrollablePositionedList`-style scroll-to-today
  position sync** — later concerns. The agenda opens scrolled to today's section if trivial (initial
  section), but the Flutter two-way scroll↔current-day binding is out of scope.
- **The home today mini-grid** — a later item; it reuses the salvaged overlap engine, not this list.
- **On-hardware low-end-Android frame-rate verification** — the timeline ship's inbox note already
  covers the calendar surface's perf gate; the agenda is a bounded `SectionList` (lower risk than the
  Reanimated grid), reviewed in the same on-device pass (D6).

## Decisions

### D1 — View integration: extend the existing screen to a 3-way day/week/agenda switch (not a separate route)

**Chosen: grow `ui/calendar-screen.tsx` into a 3-way in-place view switch** (`view: "day" | "week" |
"agenda"`); the agenda branch renders the new `AgendaList` instead of the calendar-kit grid. The
day/week branches are untouched.

Rationale:

- **Flutter parity** — the Flutter app switches *view type* in place on one calendar screen
  (`CalendarViewType`), not across routes. The agenda is a *mode*, not a destination.
- The screen **already owns** the `view` state, `visibleDate`, the `range` computation, and the
  `useCalendarEvents(range)` read — the agenda reuses all of it; a separate route would duplicate
  this plumbing and the events-source wiring for no gain.
- The view switch is already an accessible `tablist` with two `tab` buttons; adding a third tab is
  the natural, consistent extension (one more `ViewButton`).

The one wrinkle: **the agenda wants a wider range than a single day/week** (a planning list shows
several upcoming days). The agenda branch computes a **bounded multi-day window** (the visible week,
or a small fixed horizon such as the current week) so the list has content while staying bounded
(no unbounded scroll-loads-more this ship — D4). The day/week range logic is unchanged.

*Alternatives rejected:* a separate `src/app/agenda.tsx` route + screen (diverges from Flutter's
in-place switching, duplicates the events-source/range plumbing, and fragments "the calendar" across
two routes — the speculative divergence R-2 forbids); a tab (tab placement is the home item's call,
timeline design open question — unchanged here).

### D2 — Day-grouping: a pure `groupEventsByDay` helper in `data/`, 90%-gated (the agenda analog of `layoutOverlaps`)

`data/agenda.ts` exports a pure `groupEventsByDay(events: CalendarEvent[]): AgendaDay[]` where
`AgendaDay = { day: Date; events: CalendarEvent[] }`. It sorts events by `startsAt` (stable, mirroring
`overlap-layout`'s tie-break for determinism), buckets consecutive events into per-**local-calendar-day**
groups (keyed on local Y-M-D, mirroring Flutter `isSameDate` — **not** UTC, so a 23:30 local event lands
on the right day), and returns groups ascending by day. Empty input → `[]`. **Pure** — no React, no
calendar-kit, no `@/db`, no `t()`, no `date-fns` (grouping is calendar-day arithmetic, formatting is D3's
job). Under the `src/features/*/!(ui)/**` 90% glob.

This is the agenda's genuinely-hard product logic isolated as tested pure code (the golden-path
posture — logic in `data/`, not inline in the screen), exactly as `layoutOverlaps` is for the grid.

*Note on the Flutter quirk:* `events_for_planning_view_helper` keys its running day on the *previous*
event's `endsAt` (a subtle bug-ish carry). We do **not** port that — we group by each event's own
`startsAt` local day (the correct, intuitive grouping; the Flutter carry can mis-bucket an event that
starts a new day right after a long prior event). Recorded so a reviewer doesn't "fix" our cleaner
grouping back to the Flutter carry.

*Alternatives rejected:* group inline in the screen (logic belongs in a tested `data/` sublayer — ADR
014 / golden-path); a `Map<dateKey, events>` exposed raw (a sorted `AgendaDay[]` is the `SectionList`'s
exact shape — map it once at the seam, not in the screen).

### D3 — Date/time formatting: pull `date-fns` in now, display-only, behind a `data/format.ts` helper (roadmap item 6, early)

The agenda is the **first real date-formatting need** — locale-aware day-header abbreviations
("LUN"/"MON") and event time ranges ("09:00 – 13:00") that respect FR/EN. The day/week grid let
calendar-kit format its own axis (`luxon`, the library's transitive); the agenda is *our* render, so
the formatting is ours. The roadmap (step 6) explicitly allows pulling date/time early when a view
needs formatting.

**Chosen: add `date-fns` + `date-fns-tz` now (display only), behind `data/format.ts`.** It exposes:

- `formatDayHeaderParts(day: Date, locale: AppLocale): { weekday: string; dayOfMonth: string }` — the
  uppercased short weekday + the day number (Flutter `fullDayToShortDay` + `day.day`). Locale-aware via
  `date-fns/locale` (`fr` / `enUS`).
- `formatTimeRange(start: Date, end: Date, locale: AppLocale): string` — `"HH:mm – HH:mm"` (24-hour;
  the Flutter `DateFormat.jm` is locale-driven, but a 24-hour range is the correct French-first default
  and reads cleanly in EN too — R-3, the platform/brand reference, not the Flutter `jm` AM/PM).

It maps the app's resolved i18n locale (`i18next.language`, `"fr" | "en"`) to the `date-fns` locale
object. **Display only** — no parsing, no rrule, no timezone math beyond `date-fns-tz`'s formatting
(events already carry `Date`; `date-fns-tz` is pulled as the companion the roadmap names, used only if a
formatter needs explicit-zone display — kept minimal). The helper is **pure + 90%-gated** (a function of
`(Date, locale)`; tested for FR + EN day abbreviations + the time range + midnight/boundary times).

**Why date-fns is display-only and not an i18n catalog string:** weekday names and time formats are
*locale data*, not translatable copy — they come from `date-fns`'s locale tables, exactly as the existing
day/week grid lets the library format its axis. The i18n catalog still owns the agenda *view label* and
the a11y label templates (which interpolate the formatted strings).

**Dependency facts (`npx expo install`):** `date-fns` + `date-fns-tz` are **pure-JS** — autolink
nothing, add no `app.config.ts` plugin, **do not bump the EAS fingerprint** (ride the OTA lane). They
work under Jest (Node) unchanged.

*Alternatives rejected:* manual hand-rolled formatting (a locale-aware weekday/short-month map +
zero-padded time — re-implements `date-fns`'s locale tables badly, and roadmap item 6 already chose
`date-fns`; deferring it forces a rewrite when the home/details screens need formatting too); Hermes
`Intl.DateTimeFormat` (available on Hermes, but `date-fns` is the roadmap's named choice for the whole
phase — using `Intl` here then `date-fns` later would split the formatting approach; R-2 consistency);
`luxon` (calendar-kit's transitive — but it is calendar-kit's, behind the seam; reaching for it directly
would couple us to the library's transitive, the opposite of the swap-reversibility ADR 020 bought).

### D4 — List engine: React Native `SectionList` (zero dep), not FlashList

**Chosen: `SectionList` from `react-native` core (zero new dependency).** The agenda is a day-grouped
list — `SectionList`'s `sections: { day, data: events }[]` shape is the exact `AgendaDay[]` output of D2,
with first-class `renderSectionHeader` (the day header) and `renderItem` (the event tile).

Rationale (weighed against FlashList v2, which the spike research found SDK-56-pins **2.0.2**):

- **The data is bounded.** This ship renders a fixture + personal events over a bounded window (the
  visible week — D1), a few dozen tiles at most. Virtualization buys nothing at this size; `SectionList`
  already virtualizes adequately for it.
- **FlashList v2 is a native module** — it autolinks native code, requires the New Architecture (which we
  are on), and **would bump the EAS fingerprint** (forcing a fresh native build, breaking the OTA lane
  for a read surface). That is a real cost — a native dep on a read-only list — for no benefit at this
  data size. `date-fns` (D3) is the only new dep, and it is pure-JS; adding a *native* dep too would be
  the speculative weight R-2 rejects.
- **FlashList has no `SectionList` equivalent** — sections require flattening to a single typed array with
  header sentinel items + `getItemType`, more plumbing than the native `SectionList` for the same result.
- The spike already noted FlashList was the *wrong* tool for the scroll-synced grid; for the agenda it is
  *unnecessary*, not wrong — but "unnecessary native dep" is still the wrong call here (R-2).

**Recorded trigger to revisit (not this ship):** when calendar **sync** lands and a synced calendar can
hold **hundreds–thousands of events over a long horizon**, the agenda's range may widen enough that
`SectionList` jank appears on a low-end device — *then* FlashList v2 (the SDK-pinned native list) earns
its place, swapped behind the unchanged `AgendaList` component (the list engine is an internal detail of
one presentational file). This is recorded in `calendar.md` deferred debt + the changelog, owned by the
sync ship's perf pass.

*Alternatives rejected:* FlashList v2 now (a fingerprint-bumping native dep for no current benefit — R-2;
the trigger above is when it is earned); a plain `FlatList` (no first-class section headers — we'd
hand-roll sticky day headers `SectionList` gives for free); a `ScrollView` + `.map` (no virtualization
at all — wrong even for bounded data once personal events grow).

### D5 — No new ADR

ADR 019 already decided the load-bearing call this ship implements: **"build the agenda view (the
capability calendar-kit lacks) on the salvaged primitives — a simple FlashList/SectionList of day-grouped
events, the easy half."** This change is the execution of that decision, not a new one. The two real
choices here — **`SectionList` over FlashList** (D4) and **`date-fns` display-only** (D3) — are recorded
as design decisions because:

- They are **not patterns reused across many features and costly to reverse** (R-4's ADR trigger). The
  list engine is an internal detail of one component, swappable behind `AgendaList` (D4's recorded
  trigger handles the swap). `date-fns` is a display utility behind one helper.
- ADR 019 explicitly **anticipated** the FlashList/SectionList choice ("a simple FlashList/SectionList")
  and left it to this planner — it is a deferred *detail* of an existing ADR, not a new architectural
  decision. Recording the chosen branch + the revisit trigger in `design.md` + `calendar.md` is the right
  altitude (R-1: the lighter record, not ceremony).

If a *second* consumer adopts `date-fns` (the home/details screens, item 3/4) and a shared formatting
posture emerges, that is when a formatting-approach decision could earn an ADR — recorded as the trigger,
not pre-built (R-2). For now: no ADR, no `decisions/README.md` change.

### D6 — Observability ➖ N/A; perf/visual reviewed in the timeline ship's on-device pass

The agenda is **read-only** — no write/throw path to record, so the Observability DoD axis is **➖ N/A**
with that reason (mirroring the day/week timeline + the school-selection read path). The app imports no
`@react-native-firebase/*` anywhere it adds.

Perf + visual: the agenda is a bounded `SectionList` (no Reanimated worklet grid), materially lower-risk
than the timeline. The calendar surface's on-device **low-end-Android perf pass** and **brand visual
review** are already inboxed by the timeline ship
(`inbox/2026-06-16-calendar-low-end-android-perf.md` + `-calendar-visual-brand-review.md`); the agenda
view is reviewed in **that same pass** (a one-line addition to the existing notes — the agenda's day
headers, tiles, shadow, and now-indicator read correctly on both platforms). No new inbox note is
warranted for a bounded list on an already-inboxed surface; the existing notes are updated to name the
agenda view (HUMAN handoff task).

## Risks / Trade-offs

- **[`SectionList` jank if a synced calendar grows large]** → bounded this ship (fixture + personal
  events over the visible week — D4). The recorded trigger (sync ship's perf pass) swaps FlashList v2
  behind the unchanged `AgendaList`. Not a this-ship risk.
- **[`date-fns` locale wiring drifts from the i18n locale]** → the formatter maps `i18next.language`
  once; tested for both FR + EN. A new app locale would need a `date-fns/locale` mapping entry (recorded
  in the helper).
- **[the agenda's widened range could pull a large personal-events set]** → bounded (the visible week);
  the events-source seam already range-filters. Unbounded "load earlier/later" is out of scope (D1/D4).
- **[grouping by `startsAt` local day diverges from the Flutter `endsAt`-carry quirk]** → intentional
  (D2 — the cleaner, correct grouping). Recorded so it is not "fixed" back.
- **[pulling roadmap item 6 (`date-fns`) early]** → licensed by the roadmap ("pull date/time early if a
  view needs formatting") and earned by a real need (the day headers + time ranges). Display-only, behind
  one helper — the later home/details formatting reuses it, not a premature framework (R-2).

## Migration Plan

Additive — a new `data/` helper pair, a new `ui/` list component, a third branch on the existing screen,
two pure-JS deps. **No schema, no native change, no new route, no EAS-fingerprint bump, no data
migration.** The events-source seam, the salvaged primitives, the calendar-kit seam + ban, and the
day/week behavior all stand unchanged. Rollback is a plain revert (the deps + the helpers + the agenda
branch back out cleanly; no persisted state).

## Open Questions

- **Scroll-to-today position binding** — the Flutter `ScrollablePositionedList` two-way binds scroll
  position ↔ the current day. This ship opens the agenda at today's section (`initialScrollIndex` if
  trivial) but does **not** implement the two-way binding (a later polish; the bounded list makes it
  low-value now). Recorded, not built.
- **Event-details tap-through** — the Flutter agenda tile taps into event details. There is no details
  screen yet (item 3); the agenda tile is render-only this ship, with the tap target added when item 3
  lands (the tile's a11y role stays `text`, not `button`, until then — so it is not a dead touchable).
- **Tab placement of the calendar** — unchanged from the timeline ship's open question (the home item's
  call); the agenda is a view mode of the existing reachable `/calendar` route.
