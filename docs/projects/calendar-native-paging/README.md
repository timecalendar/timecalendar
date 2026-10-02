---
kind: project
id: calendar-native-paging
status: implementable
decision: go
---

# Calendar native paging

## Intent

Make the Calendar timeline page between weeks and days the way a native calendar does: a new
swipe always takes over immediately on iOS, and paging, vertical scrolling and pinch run at the
display's frame rate on low-end Android. The owned renderer's three-page `react-native-pager-view`
paging, with its idle-only commit and per-week remount, is replaced by an architecture where
frame-by-frame motion never waits on JavaScript or layout. The renderer's defensive machinery and
non-idiomatic React are cleaned up in the same pass.

## State

- Product: `approved` (go)
- Technical design: `approved`, decisions D01–D08 `approved`
- Roadmap: `approved`, epics E01–E07, tickets T01–T15
- Implementation: E01–E04 are merged. E05 and E06 source is merged, and E07 T14 cleanup is merged. E07 long-session diagnostics are recorded for the measured Android source revision.
- Release readiness: blocked. Android P01 rapid chains land 15–16 of 20 swipes on the measured perf APK, and one of five reversals misses its origin. The E07 long-session view budget fails. E05 frame and pinch checks, E06 physical accessibility checks, JavaScript heap stability, and the owner's exact-revision verdict remain open. No preview, store, or OTA publication is approved.

## Research

- `research/R01-current-system-map.md` — current contracts, view tree, test surface
- `research/R02-horizontal-scrollview-mechanics.md` — native horizontal ScrollView paging on Fabric
- `research/R03-rendering-and-zoom-performance.md` — per-frame cost model, pinch, shared grid
- `research/R04-data-window-and-presentation.md` — page identity, data window, presentation cache
- `research/R05-accessibility-header-and-focus.md` — screen readers, header strip, focus restoration
- `research/R06-code-health-and-cleanup.md` — React Compiler, effects, smells
- `research/R07-governance-and-verification.md` — docs/specs impact, verification, rollout
- `research/R08-alternatives-and-adversarial-review.md` — alternatives and the case against

## Approval log

- 2026-10-01, Claude Code planning session: owner approved `product.md` (go) and D01–D08, with round-1 resolutions recorded in `product.md` and D06/D08. The merge gate became a release gate (owner: "we can ship unfinished on main"). E01 started on owner instruction.
- 2026-10-01: owner approved the D04 tile pinch treatment (3-slice background, counter-scaled clipped text) after the interactive comparison, and approved `design.md` and `roadmap.md`. The owner delegated the focus-observer question; it stays per tile (D04).

## Residual risks and caveats

- The E02 spike met diagonal and reversal checks but missed P02 frame criteria; the owner's continue instruction allowed implementation to proceed without converting those measurements into acceptance.
- Android chained swipes still miss P01. Physical accessibility, pinch feel, frame thresholds, and long-session stability need device evidence for the exact release candidate.
