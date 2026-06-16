## Why

Phase 04 ("Calendar core", roadmap step 2) builds the heart of the app — the timeline.
The spike (roadmap step 1) is done and the adopt/fork/custom gate is decided:
**ADR [019](../../../.claude/rules/mobile/decisions/019-calendar-rendering-adopt-calendar-kit.md)**
adopts `@howljs/calendar-kit` v2 for the day/week timeline **behind a seam**, salvages the
overlap-layout + time-grid primitives as our own pure modules, and builds the agenda view
(which calendar-kit lacks) on those primitives. This ship implements **read-only day/week
timeline rendering** — the first, highest-risk half of step 2.

## What Changes

This change is the **first of two timeline sub-ships** (split decision in design D1): it ships
**day/week timeline rendering via calendar-kit behind a seam + the salvaged primitives**. The
**agenda/planning list view** is a scoped follow-up (`add-mobile-calendar-agenda`) that consumes
the same salvaged primitives this ship lands; see design D1.

- Add **`@howljs/calendar-kit`** (`npx expo install`, the SDK-56-pinned version) as the day/week
  timeline renderer. It is **pure-JS** — autolinks nothing, adds no `app.config.ts` plugin, does
  **not** bump the EAS fingerprint (rides the OTA lane). Its `luxon`/`rrule`/`lodash.*` transitives
  enter the lockfile. (ADR 019.)
- Mount a **`GestureHandlerRootView`** at the app root (`src/app/_layout.tsx`) — calendar-kit
  requires it and the app does not currently mount one. (`react-native-gesture-handler` is already a
  dependency.)
- Create the **`src/features/calendar/`** feature folder (the home for all Phase-04 calendar
  rendering): `data/` (the salvaged pure primitives + the events-source seam) + `ui/` (the timeline
  screen). Mirrors the layered feature-module pattern (ADR 014).
- A **calendar-kit seam wrapper** at `src/components/chrome/calendar-kit.tsx` — the single import
  site for `@howljs/calendar-kit`, exported from the chrome barrel, with a new
  `no-restricted-imports` ban keeping the library out of feature/screen code (design D2 / ADR 020).
  A future fork/custom swap is localized to this one module behind a stable wrapper API.
- **Salvage the overlap-layout engine** (`data/overlap-layout.ts` — the pure `layoutOverlaps`
  ported + validated in the spike) and the **time-grid math** (`data/time-grid.ts` — minute→pixel,
  event height, hour labels, now-indicator position), both **pure and 90%-gated**. These are owned
  regardless of the library (ADR 019's salvage mandate); the agenda follow-up + the Phase-04 home
  today-grid + the fallback renderer all consume them.
- A **domain `CalendarEvent` shape** + an **events-source seam** (`data/events.ts` — a
  `useCalendarEvents(range)` hook returning `CalendarEvent[]`) designed so Phase-04 item 2 (sync)
  plugs in by swapping only the source. **This ship feeds it from a fixture + the existing
  personal-events overlay** (sync isn't built yet); item 2 replaces the source behind the unchanged
  hook. (Design D3.)
- A **timeline screen** (`ui/calendar-screen.tsx`) rendering day/week views through the seam — a
  designed **brand surface** (R-3): `renderEvent` tiles + a `theme` built from `@/theme` tokens,
  the 7:00–21:00 time grid, the now-indicator, a day/week view switch, accessible event tiles and
  controls. A thin route under `src/app/`.
- FR + EN i18n keys (view labels, day/week switch, accessibility labels, empty state).
- Jest/component proofs: the salvaged primitives at 90%; the events-source seam; the screen at the
  70% floor (mocking the calendar-kit seam wrapper so the screen wiring is provable without the
  Reanimated grid). A Maestro flow asserting the calendar renders + a fixture-backed event is
  reachable (design D7).
- Architecture Book updates: ADR 020 (the calendar-kit seam form) + index row, a new
  `calendar.md` topical rule file, a `features.md` entry, a `lint-format.md` note (the new chrome
  ban target), the `architecture-changelog.md` entry. ADR 019 referenced throughout.

## Capabilities

### New Capabilities
- `mobile-calendar-timeline`: read-only day/week timeline rendering — the calendar-kit seam +
  ban, the `GestureHandlerRootView` root mount, the salvaged overlap-layout + time-grid pure
  primitives, the domain `CalendarEvent` + events-source seam (fixture/personal-events-fed this
  ship, sync-fed next), the brand-themed timeline screen, and its i18n/a11y/CI-proof posture.

### Modified Capabilities
<!-- None — this is a new, self-contained rendering surface. The root layout gains a
     GestureHandlerRootView wrapper and a new Stack-sibling route, but no existing spec
     requirement (onboarding, storage, navigation) changes its behavior. -->

## Impact

- **Dependencies:** `+ @howljs/calendar-kit` (SDK-56-aligned) in `mobile/package.json` (+ its
  pure-JS transitives `luxon` / `rrule` / `lodash.*`); lockfile regenerated. **No native dep, no
  `app.config.ts`/native change, no EAS-fingerprint bump** (pure-JS — ADR 019).
- **Root layout:** `src/app/_layout.tsx` gains a `GestureHandlerRootView` wrapping the tree, and a
  `<Stack.Screen>` registration for the new calendar route.
- **New code:** `src/components/chrome/calendar-kit.tsx` (+ barrel export); `src/features/calendar/{data,ui}/`
  + barrels; a calendar fixture; `src/app/calendar.tsx` (thin route); a `jest/setup-calendar-kit.ts`
  suite-wide mock.
- **Lint:** `mobile/eslint.config.js` `chromeAlphaImportPatterns` gains the `@howljs/calendar-kit`
  ban (re-set off for `src/components/chrome/**`, mirroring `@expo/ui`).
- **i18n:** new flat keys in `en.json` + `fr.json` (tsc-typed parity, both directions).
- **Tests:** colocated Jest (primitives + events-source at 90%; screen at the 70% floor); a Maestro
  calendar flow.
- **Docs:** ADR 020, `decisions/README.md` index, new `calendar.md`, `features.md`, `lint-format.md`,
  `architecture-changelog.md`, the `architecture.md` topical-file index row. Two inbox notes (the
  on-device low-end-Android perf + Reassure baseline pass; the brand visual review).
