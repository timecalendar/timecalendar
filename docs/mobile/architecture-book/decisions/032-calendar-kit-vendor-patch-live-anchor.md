# 032 — Vendor-patch calendar-kit: events-store anchor tracks the scroll live

## Status

Accepted (2026-07-10).

## Context

Grid events blank out on a fast multi-week scroll (calendar backlog Issue 5).
Verified in the installed `@howljs/calendar-kit@2.5.6` source: events paint only
from an internal store packed over `anchor ± (defaultOffset=7 · pagesPerSide)`
days, and the anchor advances only ~300ms after the scroll **fully stops** — a
Reanimated offset reaction calls `onVisibleColumnChanged` every scroll frame,
each call resets a 150ms settle debounce (`hooks/useSyncedList.tsx`), and a
second trailing 150ms debounce sits in `context/VisibleDateProvider.tsx`. A
sustained fast scroll therefore freezes the anchor at its starting week and
every page past the packed radius mounts eventless until the user rests.

No prop, callback, or imperative handle reaches this mechanism
(`CalendarKitHandle.setVisibleDate` writes refs, not the store). Widening
`pagesPerSide` only moves the cliff (and mounts proportionally more pages); the
app-side quarter-quantized feed is orthogonal (paint is gated by the store
window, not the events prop).

## Decision

Patch the library with **patch-package** (`patches/@howljs+calendar-kit+2.5.6.patch`,
applied by the `postinstall` script; the patch targets `src/`, which Metro
resolves via the package's `react-native: src/index` field):

1. `hooks/useSyncedList.tsx` — advance the events-store anchor
   (`notifyDateChanged`) on every visible-**column** change, not only at settle.
   A new `lastDateChangedUnix` ref keeps the settled `onDateChanged` firing
   exactly as before (the settle check previously compared against the store
   anchor, which now already equals the settled date).
2. `context/VisibleDateProvider.tsx` — the trailing 150ms debounce becomes a
   **leading+trailing 150ms throttle**, so the store re-packs at most every
   150ms *during* a scroll instead of only after it stops.

Rejected alternatives: raising `pagesPerSide` to 6–8 (cliff remains, 13–17
mounted week pages); forking the library (heavy for a two-file behavior fix);
upstream-PR-and-wait (no timeline; a PR can still be filed from this patch).

## Consequences

- The fast-fling blank is removed at the mechanism for any fling length; the
  app-visible callback contract (`onChange` mid-scroll, `onDateChanged` at
  settle) is unchanged, so screen wiring and tests are untouched.
- `mobile/` now runs `patch-package --error-on-fail` on `postinstall` (fresh
  installs and worktrees pick the patch up automatically; a mismatch fails the
  install on CI *and* locally — without the flag it exits 0 locally and only
  prints an error). The dependency is pinned exact (`2.5.6`, no caret) so a
  version bump is always a deliberate act that re-derives the patch — re-read
  `useSyncedList.tsx` + `VisibleDateProvider.tsx` upstream and re-generate.
- Mid-fling re-packs cost ≤1 pack per 150ms, each one re-rendering all mounted
  pages AND running a whole-snapshot `lodash.isequal` per mounted subscriber
  (the lib's subscription hook deep-compares the full store state before any
  selector `isEqual` — `useSyncExternalStoreWithSelector.ts:53-54`); at ~600
  events × ~9 mounted week pages that is the real frame-budget line the
  dense-calendar device pass owns.
- The Jest suite mocks calendar-kit, so the patch is proven by source citation
  and the device oracle, not unit tests.

## Revisit if

- calendar-kit ships a release that packs on visible-column change (or exposes
  the debounce/anchor) — drop the patch.
- A calendar-kit upgrade changes either patched file — re-derive, don't
  blind-port.
- The dense-calendar device pass shows re-pack jank mid-fling — the effective
  levers, in order: raise the throttle interval (150ms →
  200–250ms, `VisibleDateProvider.tsx`); lower `pagesPerSide` (shrinks both the
  pack width and the mounted-page count, re-check `BUFFER_MONTHS`); patch the
  store-subscription compare (`useSyncExternalStoreWithSelector.ts:53-54`
  deep-compares the WHOLE snapshot per subscriber per *commit* via
  `lodash.isequal`, *before* consulting any selector `isEqual` — and in the
  fling case the shifted window guarantees a full walk that returns false; the
  store replaces the snapshot object each `setState`, so a reference check is
  a pure O(1) win, last only because it is a third vendored hunk in a third
  file). A selector `isEqual` is complementary, not a substitute — it bails
  the re-render, never the walk — a distant fourth lever, relevant only if
  profiling shows the re-render (not the walk) costs the frames.
