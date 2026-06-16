## Context

Phase 04 is the calendar — the #1 risk in the migration. The spike (roadmap step 1) ran on the
real host stack (Expo SDK 56, RN 0.85.3, Reanimated 4.3.1, gesture-handler ~2.31.1, New Arch,
Hermes) and decided the adopt/fork/custom gate: **ADR
[019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)** —
adopt `@howljs/calendar-kit` v2 for the day/week timeline behind a seam, salvage the
overlap-layout + time-grid primitives, build the agenda view on those primitives. This ship is
roadmap step 2 (timeline rendering), implementing that decision.

**Verified spike facts this design relies on (do not re-derive):** calendar-kit v2.5.6 installs via
`npx expo install`, boots with no Reanimated-4 crash, renders dense overlaps + now-indicator +
custom `renderEvent` + full `theme`. It is pure-JS (no autolink, no plugin, no fingerprint bump).
It requires a `GestureHandlerRootView` mounted above it — the app does **not** currently mount one
(confirmed in `src/app/_layout.tsx`). API shape (verified): `CalendarContainer` props
`numberOfDays`, `initialDate` (YYYY-MM-DD), `start`/`end` (minutes from midnight), `timeZone`,
`events: EventItem[]`, `theme`; `CalendarHeader` + `CalendarBody` children; `CalendarBody` takes
`showNowIndicator` + `renderEvent={(event, size) => ReactElement}`. `EventItem = { id, title?, start:
{ dateTime: ISOstring }, end: { dateTime }, color?, ...any }`.

The current state: no `src/features/calendar/`, no calendar dep, no `GestureHandlerRootView`. The
events that will eventually feed the calendar (the sync `calendar_events` table) **do not exist yet**
— that is Phase-04 item 2. So this ship must render from a source it can produce today while
designing the seam so item 2 plugs in cleanly.

## Goals / Non-Goals

**Goals:**

- Render **read-only day/week timeline** via calendar-kit, behind a seam, as a designed brand
  surface (R-3) — overlaps, now-indicator, 7:00–21:00 grid, day/week switch.
- **Salvage and own** the pure overlap-layout engine (`layoutOverlaps`) + time-grid math, 90%-gated,
  ready for the agenda follow-up + the home today-grid + the fallback renderer.
- A **`CalendarEvent` domain type + events-source seam** (`useCalendarEvents`) item 2 (sync) fills.
- Full DoD: types, lint (incl. the new seam ban), 90/70 coverage, i18n FR+EN, a11y, Maestro,
  Architecture Book + ADR.

**Non-Goals:**

- **The agenda/planning list view** — the scoped follow-up (`add-mobile-calendar-agenda`); the
  primitives it needs land here (D1).
- **Calendar sync** (item 2) — no `calendar_events` table, no `POST /calendars/sync` wiring. This
  ship renders from a fixture + the personal-events overlay (D3).
- **Event details** (item 3), **home** (item 4), **date/time helpers** (item 6).
- **The home today mini-grid** — a later item; it will reuse the salvaged engine.
- **On-hardware low-end-Android frame-rate verification + Reassure baselines** — inboxed (D8);
  the on-device perf bar is ADR 019's gate, verified on real hardware, never a CI/loop blocker.

## Decisions

### D1 — Split: this ship is day/week timeline; agenda is a scoped follow-up

ADR 019 explicitly licenses the planner to split day/week-adopt vs. agenda-build into ≥1 ship.
**This change scopes to day/week timeline via calendar-kit + the salvaged primitives**; the
**agenda/planning list view** is a follow-up change `add-mobile-calendar-agenda`.

Rationale: the two halves stress different risk axes and the DoD is per-feature finite-perfection
(R-6). The day/week half carries the genuine risk (the adopted library, the Reanimated grid, the
`GestureHandlerRootView` root change, the new seam + lint ban, the brand `theme`) and deserves a
focused DoD pass. The agenda half is "the easy half" (ADR 019) — a `FlashList`/`SectionList` of
day-grouped events over the **same salvaged primitives** this ship lands. Splitting keeps each pass
green-able and attributable.

**Crucially, the salvaged primitives (`overlap-layout.ts` + `time-grid.ts`) land in THIS ship**, not
the agenda ship — they are owned regardless of the library (ADR 019's salvage mandate), they are the
de-risking insurance behind the seam (the fallback renderer), and landing them now lets the agenda
follow-up be a thin consumer. They are unit-tested to 90% here even though the day/week screen renders
through calendar-kit (which has its own internal layout); the primitives' first **rendering** consumer
is the agenda follow-up, but their first **tested** consumer is this ship's test suite. This is the
ADR-019 posture made concrete: salvage primitives REGARDLESS of the adopt outcome.

*Alternatives rejected:* one mega-ship (day/week + agenda) — too large for one DoD pass on the #1-risk
surface; defer the primitives to the agenda ship — violates ADR 019's "salvage regardless" and leaves
the seam with no fallback insurance.

### D2 — Seam form: a chrome-style wrapper with a `no-restricted-imports` ban (not a feature-internal boundary)

ADR 019 leaves the seam form to this planner: a `src/components/chrome/`-style wrapper with a lint ban
(like `@expo/ui`), or a feature-internal boundary that a feature-`data/`-style edge suffices. **Chosen:
the chrome-wrapper + `no-restricted-imports` ban.** `src/components/chrome/calendar-kit.tsx` is the
single import site for `@howljs/calendar-kit`; the lint config bans the package everywhere except
`src/components/chrome/**` (re-set off there, mirroring `@expo/ui` exactly). The wrapper re-exports the
calendar-kit surface the screen needs (`CalendarContainer` + `CalendarHeader` + `CalendarBody` +
the `EventItem` type) under a stable local API, and owns the `theme`-from-`@/theme`-tokens mapping +
the `renderEvent` plumbing seam.

Rationale — this is **load-bearing enough to record as ADR 020** (see Decision block below) because it
*extends* the chrome-ban pattern to a **stable GA-ish dep**, where ADR 010's rationale was
"alpha-API churn." The justification is different and reused by every future calendar surface:

- The seam exists for **swap-localization** (ADR 019's reversibility argument), not alpha churn. The
  #1-risk surface is on a single-maintainer dep; the seam is exactly what makes "fork or swap to
  custom behind the unchanged seam" cheap. A lint-enforced single import site is strictly stronger than
  a review-only convention for a swap that the revisit clause explicitly anticipates.
- A feature-`data/` boundary (B-1) governs `@/api/generated` + `@/db` only; it does **not** ban an
  arbitrary npm package by specifier. To keep calendar-kit out of screen code via the existing
  boundaries alone we'd rely on convention. The chrome ban is the encoded form (R-1: encode before
  document).
- The chrome dir is already the home for "wrap a churning/swappable rendering dependency behind one
  module" (NativeTabs, GlassSurface, @expo/ui). calendar-kit is the same shape (a rendering
  dependency we wrap + theme), so the chrome dir is the natural, consistent home — no new dir, no new
  element type, the existing `chromeAlphaImportPatterns` mechanism extended by one entry.

*Alternatives rejected:* (a) feature-internal-only boundary (no lint ban) — review-only, weaker than
the swap reversibility this surface needs, and the existing B-1 boundary doesn't ban an npm package;
(b) a brand-new `src/features/calendar/renderer/` seam with its own bespoke lint — reinvents the chrome
mechanism for no gain; (c) no seam, import calendar-kit in the screen — ADR 019 explicitly rejects
adopt-without-a-seam (a future swap becomes a rewrite).

> **Note on the chrome-ban name:** the lint constant is named `chromeAlphaImportPatterns`. calendar-kit
> is *not* alpha. The pattern list is really "imports reachable only through a chrome wrapper"; we add
> calendar-kit to it and update the constant's doc comment to say so (the mechanism is "single-import-site
> wrapper," alpha-ness is incidental). Renaming the constant is out of scope (it would touch unrelated
> lines); the doc-comment clarification is the R-1 honesty fix.

### Decision — ADR 020: calendar-kit reached through a chrome-wrapper seam with a lint ban

**This is ADR-worthy** (R-4: a pattern reused by every later calendar surface, costly to reverse —
extending the chrome ban to a stable dep on the #1-risk surface). It will be written as ADR
[020](../../../.claude/rules/mobile/decisions/020-calendar-kit-seam.md). Context: ADR 019 adopts
calendar-kit behind "a seam" and defers the seam *form*. Decision: the chrome-wrapper + lint-ban form
(D2 above), justified by swap-reversibility (not alpha churn) — the difference from ADR 010's rationale
is the load-bearing nuance the ADR records. Alternatives: the feature-internal boundary, the bespoke
seam, no seam (all rejected as in D2). Revisit-if: a second calendar renderer wants the same wrapper
(promote the wrapper API); calendar-kit is dropped behind the seam (ADR 019's revisit — the wrapper API
stays, the body swaps); the chrome-ban constant grows enough that "alpha" is the wrong name (rename it).

### D3 — Events-source seam: `useCalendarEvents(range)` → `CalendarEvent[]`, fixture/personal-events-fed now, sync-fed next

The screen must not know where events come from. `data/events.ts` exposes
`useCalendarEvents(range: { from: Date; to: Date }): CalendarEvent[]` — the **single seam** item 2
(sync) fills. The domain `CalendarEvent` shape is designed against the eventual sync model (the Flutter
`calendar_event.toDbMap()` fields, so item 2's `calendar_events` table maps onto it with the ADR-011/018
importer-fidelity posture — but **this ship does not persist them**):

```ts
export interface CalendarEvent {
  id: string                  // uid
  title: string
  color: string               // #RRGGBB
  startsAt: Date              // domain Date (mappers own the storage ISO/UTC format, ADR 011)
  endsAt: Date
  location: string | undefined
  allDay: boolean
  description: string | undefined
  // designed-in for sync (item 2 populates from calendar_events; optional/empty until then):
  teachers: string[]
  tags: string[]
  canceled: boolean
  userCalendarId: string | undefined
}
```

**What this ship feeds it from:** a committed **fixture** (`data/fixtures.ts` — a worst-case dense
week mirroring the spike's Tuesday 5-way cluster, so the brand surface and overlap rendering are
reviewable and Maestro-assertable) **plus** an overlay of the existing **personal-events** read
(`usePersonalEvents()` mapped `PersonalEvent → CalendarEvent`, `allDay: false`, empty `teachers`/`tags`).
The hook merges and filters to the range. Personal events are real device data that already render
elsewhere, so the overlay proves the seam against real rows, not only a fixture.

**How item 2 plugs in:** sync lands `calendar_events` + a repository, and `useCalendarEvents` swaps its
source to the synced rows (or merges synced + personal). The hook signature, the `CalendarEvent` shape,
and every consumer stay unchanged — the swap is one file. The fixture is removed (or kept dev-only) then.

*Alternatives rejected:* render directly from `usePersonalEvents()` (couples the calendar to the wrong
table and gives no dense-overlap surface to review/assert — the spike's whole point); a stubbed empty
source (nothing renders, no Maestro target, no visual review); building the `calendar_events` table now
(that is item 2's scope — premature, R-2).

### D4 — Salvaged primitives: pure, owned, 90%-gated, the exact validated implementation

`data/overlap-layout.ts` ports the spike-validated `layoutOverlaps<T extends Interval>` **verbatim**
(the unbounded-column packing: 5-way cluster → 5 even columns; A/B/C → exact thirds; `startX`/`endX`
fractional positions). `data/time-grid.ts` holds the time-grid math (minute→pixel given a px/hour and
a day start-minute; event height from duration; the hour-label list for a `[start,end]` window; the
now-indicator's fractional/pixel position). Both are **pure** (no React, no calendar-kit, no `@/db`, no
`t()`), under the `src/features/*/!(ui)/**` 90% glob. They are the de-risking insurance: the agenda
follow-up renders day-grouped events through `layoutOverlaps`; if calendar-kit is ever dropped (ADR 019
revisit), these + a Reanimated grid become the renderer behind the unchanged seam.

The grid constants match Flutter parity (read from the Flutter calendar module): **7:00–21:00**, default
**60px/hour**, hours column **50px** wide, now-indicator pink (the brand `primary` token), event radius
4px (week) / 15px (agenda — follow-up), min tile width 20px → hide text. These live as named token-ish
constants in `time-grid.ts` (or the theme), not magic numbers.

### D5 — `GestureHandlerRootView` at the app root

calendar-kit requires a `GestureHandlerRootView` ancestor (verified in the spike; the app has none).
Mount it as the **outermost** wrapper in `src/app/_layout.tsx` (above `PersistQueryClientProvider`), with
`style={{ flex: 1 }}`, imported from `react-native-gesture-handler` (already a dep). This is a root
change but a safe, idempotent, app-wide enabler (gesture-handler is the standard RN gesture root and
benefits any future gesture surface). It is **not** behind the calendar seam — it is app infrastructure,
not a calendar-kit import (the screen/seam still own the calendar-kit specifics). Verified by the app
launching (Maestro) + the existing test suite.

### D6 — The timeline screen is a brand surface (R-3), themed from `@/theme` tokens

`ui/calendar-screen.tsx` (presentational, 70% floor) renders the day/week timeline through the seam:
`renderEvent` tiles (title + location, the `#RRGGBB` event color, accessible label) and a `theme`
object built from `@/theme` tokens (grid lines, hour labels, header, now-indicator → brand `primary`).
A **day/week view switch** (a segmented control / two accessible buttons) toggles `numberOfDays` (1 vs.
5/7 — 5 days when weekends off, matching Flutter; weekends-toggle is a later concern, default 5). The
screen holds view state and the visible-date, calls `useCalendarEvents(range)`, and passes events to the
seam. No write path (read-only). Accessible: heading role on the title, each event tile is an accessible
element with a translated label (title + time + location), the view-switch controls have roles +
translated labels + ≥44pt/48dp targets, an empty-range state with a polite live region.

A thin route `src/app/calendar.tsx` re-exports the screen through the `ui/` sub-barrel (route-structure
rule) and is registered as a `<Stack.Screen>` sibling of `(tabs)` (reachable for deep-link/Maestro;
the eventual tab placement is the home item's call — this ship makes it reachable, not a tab).

### D7 — CI proves wiring; the grid + perf are on-device

calendar-kit's Reanimated grid cannot be meaningfully driven under Jest (it needs the worklet runtime).
So `jest/setup-calendar-kit.ts` mocks the seam's calendar-kit re-exports suite-wide: the mocked
`CalendarBody` invokes `renderEvent` for each passed event (rendering a real plain-View tile) so the
**screen's event→tile wiring + the `CalendarEvent`→`EventItem` mapping + the theme/label plumbing** are
provable; the mocked container renders its children. The screen test renders through real theme + i18n,
asserts localized text (not keys), drives the day/week switch, and asserts a fixture event's tile renders
with its label. The **primitives** (`overlap-layout`, `time-grid`) and the **events-source seam**
(`useCalendarEvents` merge/filter/map) are unit-tested at 90% with no mock needed (pure / hook over
`usePersonalEvents` which the existing db mock covers).

**Maestro:** deep-link to `timecalendar-dev://calendar` and assert the screen renders + a **fixture**
event's title is visible (the fixture is committed data, so it is reachable with no seeded backend — the
right target since sync isn't built and seeded `calendar_events` don't exist). The dense-overlap visual
correctness + frame rate are the on-device manual pass (D8), not Maestro.

### D8 — Observability ➖ N/A; perf + visual review inboxed

A read-only render has **no write/throw path** to record — Observability is **➖ N/A** with that reason
(mirroring school-selection's read path; a failed events read would be a recoverable UI state, and this
ship's source is a fixture + a local read, neither of which throws crash-worthily). The **low-end-Android
frame-rate bar + Reassure perf baselines** (ADR 019's gate, real hardware) and the **brand visual review**
(both platforms, DoD native-correctness) are **HUMAN-blocked** → two inbox notes; the tasks mark them
`(HUMAN: …)` skip-and-continue.

## Risks / Trade-offs

- **[calendar-kit single-maintainer / lags ~1 SDK]** → bounded by ADR 019's escape hatch: pure-JS +
  forkable + the salvaged engine + the lint-enforced seam. If it breaks on a future SDK, fork or swap
  behind the unchanged wrapper. The seam (D2) is the mitigation.
- **[low-end-Android frame rate unmeasured in CI]** → ADR 019's residual risk shared by any path;
  inboxed for on-hardware verification (D8). Not a loop blocker.
- **[`GestureHandlerRootView` root change is app-wide]** → safe, idempotent, the standard RN gesture
  root; verified by app launch + the full suite staying green.
- **[fixture-fed events could rot when sync lands]** → the events-source seam (D3) is the single swap
  point; item 2 removes/dev-gates the fixture. The `CalendarEvent` shape is designed against the sync
  model now so the swap is non-breaking.
- **[the chrome-ban constant is named "alpha" but calendar-kit isn't]** → doc-comment honesty fix in
  this ship; a rename is deferred (out-of-scope line churn) and recorded as ADR 020's revisit trigger.
- **[mocking the calendar-kit grid means CI can't catch a grid regression]** → accepted and explicit
  (D7): the grid is the library's; CI proves *our* wiring/mapping/theme; the grid + perf are the
  on-device pass. Same posture as the @expo/ui picker (CI proves wiring, not the native control).

## Migration Plan

Additive — a new feature, a new dep, a new route, a root wrapper, a new lint ban. No schema, no native
change, no data migration. Rollback is a plain revert (the dep + the `GestureHandlerRootView` wrapper +
the route + the lint entry all back out cleanly; no persisted state).

## Open Questions

- **Tab placement of the calendar** — deferred to the home item (item 4). This ship makes the calendar a
  reachable Stack-sibling route, not a tab, so item 4 decides the navigation home without rework.
- **Weekends on/off + persisted view preference** — out of scope; default 5-day week (Flutter parity),
  no preference store this ship (a later Settings/home concern).
