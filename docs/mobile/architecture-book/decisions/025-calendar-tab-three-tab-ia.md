# 025 — Three-tab IA: add a Calendar tab (Home · Calendar · Profile)

> Origin: the `add-mobile-calendar-tab` change (Flutter-parity follow-up to
> Phase-04). Records the load-bearing **information-architecture** decision of
> giving the calendar surface a front door; the screen itself is unchanged
> (it shipped behind seams in ADRs [019](./019-calendar-rendering-adopt-calendar-kit.md)/[020](./020-calendar-kit-seam.md)/[021](./021-calendar-event-storage-and-sync.md)).
> Discharges the "Tab placement is the later home item's call" deferral that
> ADR [022](./022-home-ia-today-view.md) / `calendar.md` left open.

## Status

Accepted. **Supersedes-in-part ADR [022](./022-home-ia-today-view.md):** that ADR
shipped a **two-tab IA** (Home · Profile) and, in its alternative (d), rejected
adding a *third tab* — but that rejection was about a *personal-events* tab
("speculative IA expansion from a sample of one"), not the calendar. This ADR adds
a **Calendar** tab; ADR 022's Home-IA decision itself (Home tab = today/next-up
view, the standalone personal-events list relocated to `/personal-events`) **stands
unchanged**.

## Context

Phase 04 shipped the heart of the app — the day/week/agenda timeline
(`src/features/calendar/ui/calendar-screen.tsx`) behind its seams (ADRs 019–021).
But it was wired to a route (`/calendar`) registered **only** as a bare `Stack`
sibling of `(tabs)`, and **nothing in `src/` navigated to it** — no tab, no `Link`,
no `router.push`. The single way to reach it was the `timecalendar-dev://calendar`
deep link, which exists solely for the Maestro e2e (`.maestro/calendar.yaml`). The
app's headline surface was built, tested, and **stranded with no front door.**

ADR 022 deferred the placement explicitly ("Tab placement is the later home item's
call", `calendar.md`) and, lacking the calendar requirement at the time, shipped a
two-tab IA and rejected a third tab. The deferred call now resolves: the in-production
Flutter app ships a **Home · Calendar · Profile** tab bar, and parity plus the
discoverability of the #1 surface (currently zero discoverability) clears the R-4
load-bearing bar. A bare deep link is not an entry point a user can find.

## Decision

**The root tab bar gains a third tab — Calendar — between Home and Profile, exposing
the existing day/week/agenda screen. Order: Home · Calendar · Profile (Flutter parity).**

- The route moves from `src/app/calendar.tsx` (a bare `Stack` sibling) **into the
  `(tabs)` group** as `src/app/(tabs)/calendar.tsx` (the same thin re-export of
  `CalendarScreen` through the `ui/` sub-barrel — route-structure rule). The
  `<Stack.Screen name="calendar" />` line is removed from the root `_layout`.
  **Route groups don't affect the URL**, so the path stays `/calendar`: the
  `timecalendar-dev://calendar` deep link and the Maestro flow keep working — they
  now additionally select the Calendar tab (per the navigation rule, only declared
  `NativeTabs.Trigger` routes are reachable, so the tab and its trigger ship together).
- `app-tabs.tsx` adds a third `NativeTabs.Trigger name="calendar"` between `index`
  and `profile`, with the translated label `calendar.tab.label` (EN "Calendar" / FR
  "Calendrier") and icon `sf="calendar"` (iOS) / `md="calendar_month"` (Android).

*Alternatives rejected.*
- **(a) Keep it deep-link-only** — leaves the headline surface unreachable in the
  shipped app; not a viable product state.
- **(b) A `Link`/button from Home or Profile instead of a tab** — discoverable, but
  demotes the core surface below Settings-level secondary entries and diverges from
  the Flutter tab-bar IA. The calendar is a primary destination, not a secondary one.
- **(c) Replace the Home tab with Calendar** — loses the today/next-up landing view
  (ADR 022), which Flutter also ships as its own tab.

## Consequences

- The three-tab IA (Home · Calendar · Profile) is now the baseline; every later
  surface inherits it. ADR 022's "two-tab IA" framing and its alternative-(d) "no
  third tab" rejection are superseded **only** as to whether a third tab exists.
- The `/calendar` deep-link entry survives unchanged (path-stable across the group
  move), so Maestro and any external deep link are unaffected.
- A new `app-tabs` unit test guards the trigger set + order + route wiring (the
  structure lint and types can't see); a jest-config `@/assets/*` `moduleNameMapper`
  was added so the tab bar (which `require()`s the home PNG icon) renders under Jest
  at all — a latent gap no prior test had exercised.

**Revisit when:** a designer-driven navigation (a center FAB, a "more" overflow,
a custom tab bar) replaces the native tab bar, or a 4th primary surface earns a tab
and forces an overflow decision.
