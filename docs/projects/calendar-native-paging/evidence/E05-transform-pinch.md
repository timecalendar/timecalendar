---
kind: evidence
epic: E05
status: pending-device-verdict
---

# E05 — Transform pinch evidence

## Code and host checks

- Renderer commit `f57a6e03` adds pixel-rounded transform movement for the shared grid, gutter, current-time rule and committed tile tops. Tile surfaces use fixed end caps, a stretched middle and counter-scaled clipped text. The day row owns the single animated layout height; settled props commit tile and grid layout after pinch. Each committed tile retains its focus observer.
- Test commit `dd050789` covers the final iOS two-pointer update after a finger lifts. Renderer tests also cover tiny intervals, increased-contrast slice borders, text origin and a completed pinch whose finalization reports failure.
- On the integrated T09 base at `dd050789`, `npm run react-compiler:check` reports 24 compiled renderer functions with no bail-out. `npx tsc --noEmit` and relevant ESLint pass. `TZ=UTC npm test -- --coverage` passes 228 suites and 2,254 tests, with one skipped test.

## Native check

- An iPhone 17 Pro Simulator Debug native build succeeded from `3929bf1a`, the same E05 renderer source before the T09 rebase. Its generated RNReanimated xcconfig has `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS:true`.
- The iOS 26.5 Simulator did not finish booting: SpringBoard repeatedly quit, and app installation and the Argent pinch smoke could not run. The Simulator was shut down and the failure was passed to the coordinator for a separate investigation. This build establishes compilation only.

## Verdict and remaining evidence

**Code implemented; E05 is not complete.** The T08b pager integration is merged. The P02 frame thresholds, zero per-frame JS/layout trace, fixed-cap seams, text sharpness, focal stability, VoiceOver behavior and owner hand-feel need exact-revision device evidence. OnePlus 6 and physical iPhone measurements must be recorded before an owner verdict or release/OTA publication.
