# 022 — Home tab IA: the Home tab becomes the today / next-up view; the standalone personal-events list relocates to a Profile-reached `/personal-events` route

> Origin: the `add-mobile-home` change (Phase-04 item 4 — the home / today landing
> view), design D1 + D2. Records the load-bearing **information-architecture**
> decision the today view embodies; the *rendering* of the today view (composition
> of the landed calendar + personal-events seams) is NOT ADR-worthy — it executes
> ADRs [019](./019-calendar-rendering-adopt-calendar-kit.md)/[021](./021-calendar-event-storage-and-sync.md)/[014](./014-layered-feature-module-pattern.md)
> + the route-structure rule, no new reversible pattern. The full wiring lives in
> the Architecture Book "Features → Home / today view" + "Navigation & route
> structure"; this is the IA decision record.

## Status

Accepted. **⚠️ Superseded-in-part by ADR [024](./024-event-checklist-storage-and-surfacing.md)
(2026-06-16):** this ADR's tap-routing (a personal event opens its `/personal-event-form`
edit form directly) is superseded — Phase-05 Ship B unifies the event-details screen for
BOTH event kinds, so a personal-event tap now opens `/event-details/<uid>` (the same
destination as a synced event), and the personal-event **edit/delete** flow is reached via
an "Edit" header action on that unified details screen. The relocate-don't-drop posture this
ADR established is preserved (the form, its route, and `usePersonalEvents` are unchanged — only
the entry point moved one more tap); only the tap *destination* changed. The Home-IA decision
itself (Home tab = today view, the standalone list relocated to `/personal-events`) stands.

**⚠️ Also superseded-in-part by ADR [025](./025-calendar-tab-three-tab-ia.md) (2026-06-16):**
this ADR shipped a **two-tab IA** (Home · Profile) and rejected a third tab (alternative (d)
— a speculative *personal-events* tab). ADR 025 adds a **Calendar** tab (Home · Calendar ·
Profile, Flutter parity), giving the stranded day/week/agenda surface a front door. Only the
two-tab framing / the "no third tab" rejection is superseded; the Home-IA decision above stands.

## Context

Phase-04 item 4 is the **HOME / today landing view** — the surface a TimeCalendar
user opens to. The whole calendar stack already landed behind seams (the day/week
timeline + agenda, calendar sync, read-only event details — ADRs 019/020/021), but
they are reachable only via the standalone `/calendar` deep-link route. **The Home
tab still rendered the flat personal-events list** (`PersonalEventsList`) — a Phase-2
placeholder (Feature B) that ignores the user's synced classes entirely. The Flutter
`home` module shows the displayed-day's **merged** events (classes + personal events)
as a header + an upcoming scroller + a today mini-timeline; a flat personal-events
CRUD list is the wrong landing surface.

The fix is an **IA change to a shipped, established surface** (the Home tab's content
since Phase 2, recorded in `features.md`) — which every later Phase-04+ surface
inherits and which is costly to reverse (it moves a feature's entry point). That
clears the R-4 load-bearing bar, so the IA call earns an ADR (D2). But the
personal-event **create/edit/delete** flow is a real, shipped feature — silently
dropping its entry point would be a regression. So the decision is two-part: what the
Home tab becomes, and where the standalone list goes.

## Decision

**The Home tab renders the today / next-up view; the standalone personal-events list
relocates to a `/personal-events` Stack route reached from a Profile entry link.**

- `src/app/(tabs)/index.tsx` re-exports `HomeScreen` (from `@/features/home/ui`)
  instead of `PersonalEventsList`. `HomeScreen` reads the merged synced+personal
  events through the **unchanged** `useCalendarEvents` seam — no second events source.
- The standalone `PersonalEventsList` moves to a `<Stack.Screen name="personal-events">`
  **sibling of `(tabs)`** (exactly like `/calendar`, `/settings`), with a thin
  `src/app/personal-events.tsx` route re-export and a Profile-tab entry link
  (`<Link href="/personal-events">`, accessible, translated). The `PersonalEventsList`
  component, its Add action, the `/personal-event-form` create/edit route, and the
  reactive `usePersonalEvents` read are **all unchanged** — only the entry point moves.
- Personal events also keep rendering **inside** the home today view — they are already
  merged into `useCalendarEvents` and route to their edit form on tap (Flutter parity:
  both EventKinds render together).

The two-tab IA (Home, Profile) already routes secondary surfaces (`/calendar`,
`/settings`, onboarding) as Stack siblings reached from Profile; `/personal-events`
joins them.

*Alternatives rejected.*
- **(a) Keep `PersonalEventsList` as the home tab, add the today view as a new route**
  — inverts the Flutter IA and leaves the payoff landing surface unreachable from the
  landing tab.
- **(b) Compose both on home (today view + a personal-events sub-list)** — duplicates
  the personal events (they already render in the timeline) and bloats the landing
  surface (R-2).
- **(c) Drop the standalone list, rely only on the timeline tap-to-edit** — removes the
  **create** affordance (you could only *edit* an existing event from a tile), a real
  regression.
- **(d) Add a third "Personal events" tab** — speculative IA expansion from a sample of
  one; the Profile-reached Stack route matches the established pattern (R-2).

## Consequences

- The Home tab is the payoff today view — the salvaged overlap engine's **first
  rendering consumer** (ADR 019's salvage payoff), composing landed seams with only
  three new pure selectors (`displayedDay`/`eventsForDay`/`dynamicHourRange`,
  90%-gated). No new dependency, no native change, no schema, no `app.config.ts`/babel
  change.
- The personal-event create/edit/delete flow stays **fully reachable** (relocated, not
  dropped) — a Profile entry + a stable `/personal-events` route; the
  `personal-events.yaml` Maestro flow is updated to reach the list via that route
  (preserving the CRUD round-trip).
- **Deep-link shift (expected):** a flow that reached the personal list via the bare
  Home tab no longer finds it there; `timecalendar-dev://personal-events` is the stable
  target. No deep-link to the bare home-tab list existed.
- A new `src/features/home/` feature folder is set (`data/` selectors + `ui/` screen),
  consuming the calendar feature's `data` sub-barrel by its full `@/` path (a
  cross-feature `data → data` read, the legitimate lint-allowed edge the sync
  orchestrator already uses) — `home` is the landing surface composing calendar +
  personal events, not a calendar *view mode* (D3).
- Observability axis: **➖ N/A** for the home surface itself (it performs no write of
  its own; the only write it triggers is `useSyncCalendars().sync()` on pull-to-refresh,
  whose observability split is owned by ADR 021 — a fetch failure is a recoverable
  `isError`, not recorded). The selectors are pure and total (empty → fallbacks).
- Rollback is a plain revert: `(tabs)/index.tsx` goes back to `PersonalEventsList`, the
  `home/` folder + `/personal-events` route + the Profile link are deleted, `formatFullDay`
  removed. No schema, no data, no native, no dependency.

## Revisit if

- The post-onboarding first-launch gate (ADR [015](./015-onboarding-flow-shape.md)'s
  deferred decision) lands on the Home tab and wants to gate first paint on
  `isOnboardingComplete()` — the today view is the natural consumer; add the redirect then.
- A designer-driven home layout (a multi-section dashboard, a week-ahead digest) replaces
  the single today view — re-weigh the today-view composition.
- The personal-events list earns its own tab (the feature grows past a single CRUD list)
  — re-open the third-tab option this ADR rejected from a sample of one.
