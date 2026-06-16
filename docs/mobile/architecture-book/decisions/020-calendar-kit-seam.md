# 020 — Calendar-kit reached through a chrome-wrapper seam with a `no-restricted-imports` ban (swap-reversibility, not alpha churn)

> Origin: the `add-mobile-calendar-timeline` change (Phase-04 item 1, the day/week
> timeline ship), design D2. Records the **seam form** ADR
> [019](./019-calendar-rendering-adopt-calendar-kit.md) deferred to the rendering
> ship's planner. Builds directly on ADR [010](./010-expo-ui-chrome-wrapper.md) (the
> chrome-wrapper seam + `no-restricted-imports` ban mechanism) — this ADR reuses that
> mechanism but records the **different justification** that makes it load-bearing here.

## Status

Accepted.

## Context

ADR 019 adopted `@howljs/calendar-kit` v2 for the day/week timeline "behind a seam"
and **explicitly deferred the seam *form*** to this rendering ship: a
`src/components/chrome/`-style wrapper with a lint ban (like `@expo/ui`), or a
feature-internal boundary a feature-`data/`-style edge suffices. The choice is
load-bearing — copied by every later calendar surface (agenda, details, home) and
costly to reverse — so it earns an ADR (R-4).

The trade space:

1. **Chrome-wrapper + `no-restricted-imports` ban** — `src/components/chrome/calendar-kit.tsx`
   is the single import site; the lint config bans the package everywhere except
   `src/components/chrome/**` (re-set off there, mirroring `@expo/ui` exactly).
2. **A feature-internal boundary** (no lint ban) — rely on the existing
   `eslint-plugin-boundaries` B-1 (`data/`-only-seam) + review to keep calendar-kit out
   of screen code.
3. **A brand-new `src/features/calendar/renderer/` seam** with its own bespoke lint.
4. **No seam** — import calendar-kit in the screen (ADR 019 explicitly rejects this).

## Decision

**The chrome-wrapper + `no-restricted-imports` ban (option 1).**
`src/components/chrome/calendar-kit.tsx` is the single import site for
`@howljs/calendar-kit`; the lint config (`chromeAlphaImportPatterns`) bans the package
(regex `^@howljs/calendar-kit($|/)`) everywhere except `src/components/chrome/**`,
re-set off for the `timecalendar/chrome-seams` block (`banChromeAlpha: false`). The
wrapper re-exports the surface the screen composes (`CalendarContainer` +
`CalendarHeader` + `CalendarBody` + the `EventItem` type) under a stable local API and
owns the `buildCalendarTheme(@/theme tokens)` helper. Feature/screen/route code imports
`@/components/chrome`, never the library.

**The load-bearing nuance — the justification differs from ADR 010.** ADR 010 banned
`@expo/ui` for **alpha-API churn** (it ships unstable entry points). calendar-kit is a
**stable GA-ish dep**, so "alpha churn" does NOT justify the ban here. The justification
is **swap-reversibility** (ADR 019's reversibility argument): the #1-risk surface runs
on a **single-maintainer** dep, and the seam is exactly what makes "fork or swap to
custom behind the unchanged wrapper" cheap (ADR 019's revisit anticipates this). A
lint-enforced single import site is strictly stronger than a review-only convention for
a swap the revisit clause explicitly plans for. Two further reasons:

- The feature-`data/` boundary (B-1) governs `@/api/generated` + `@/db` only — it does
  **not** ban an arbitrary npm package by specifier. To keep calendar-kit out of screen
  code via the existing boundaries alone we'd rely on convention; the chrome ban is the
  encoded form (R-1: encode before document).
- The chrome dir is already the home for "wrap a churning/swappable rendering dependency
  behind one module" (NativeTabs, GlassSurface, @expo/ui). calendar-kit is the same
  shape (a rendering dependency we wrap + theme), so the chrome dir is the natural,
  consistent home — no new dir, no new element type, the existing
  `chromeAlphaImportPatterns` mechanism extended by one entry.

**The constant-name honesty fix (R-1).** The lint constant is `chromeAlphaImportPatterns`,
but calendar-kit is not alpha. The list is really "imports reachable only through a
chrome wrapper" (single-import-site wrapper; alpha-ness is incidental). The constant's
doc comment is updated to say so. **Renaming the constant is out of scope** (it would
touch unrelated lines for no behavior change); the rename is a revisit trigger below.

*Rejected:* (2) the feature-internal-only boundary — review-only, weaker than the swap
reversibility this surface needs, and B-1 doesn't ban an npm package; (3) a bespoke
renderer seam — reinvents the chrome mechanism for no gain; (4) no seam — ADR 019
rejects adopt-without-a-seam (a future swap becomes a rewrite).

## Consequences

- Every later calendar surface (agenda, details, home) reaches calendar-kit through this
  one wrapper; the blast radius of a calendar-kit fork/swap (ADR 019's revisit) is this
  one file, with the wrapper API + every consumer unchanged.
- The chrome dir gains a wrapper whose justification is **swap-reversibility, not alpha
  churn** — the first such entry. The `chromeAlphaImportPatterns` doc comment records
  this so a future reader doesn't assume every entry is alpha.
- The wrapper stays **thin** (R-2): it re-exports the container/header/body + the
  theme-build helper, no higher-level composed calendar from a sample of one consumer.
  Higher-level composition is earned by a second consumer (the agenda/home ships).
- The native picker posture (ADR 010: CI proves wiring, the native control is on-device)
  carries over: the Reanimated grid is mocked suite-wide (`jest/setup-calendar-kit.ts`),
  CI proves OUR wiring (event→tile, mapping, theme/label), the grid + perf are on-device.

## Revisit if

- A **second calendar renderer** wants the same wrapper API — promote the wrapper to a
  renderer-agnostic API (the body the thin wrapper deferred).
- **calendar-kit is dropped behind the seam** (ADR 019's revisit fires — fails the
  low-end-Android perf bar, or breaks on a future SDK with a lagging maintainer) — the
  wrapper API stays, the body swaps to a fork or the salvaged-primitives-+-Reanimated-grid
  renderer.
- The `chromeAlphaImportPatterns` constant grows enough entries (or enough non-alpha
  ones) that "alpha" is the wrong name — rename it to the accurate "imports reachable
  only through a chrome wrapper" (the out-of-scope line churn this ship deferred).
