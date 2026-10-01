---
kind: evidence
epic: E02
---

# E02 — Spike evidence and verdict

- Measurements, checklists and findings: `docs/perf/E02-spike-evidence.md` (spike `d5038fad`, merged in #442 as `f032ef00`; harness #441 `40eb2241`).
- Device: OnePlus 6, Android 15, 60 Hz. iOS not run.

## Verdict

**Continue to E04**, under the owner's standing instruction for the overnight run of 2026-10-02 ("always continue": proceed with E04 onward even if a kill criterion trips, and log the issues for owner review).

Kill criterion 4 (P02 missed by more than 2×) holds on the spike:
- pinch frames within 16.7 ms: 12.6% (P02 ≥95%);
- frames over 16.7 ms per fling crossing: about 30 (≤1);
- page mount on the UI thread: 13.6–48.4 ms (≤12 ms);
- crossing to React commit: 40–47 ms median (≤8 ms JS).

The other kill criteria do not hold: diagonals 20/20, reversals exact, pinch recognised alongside both scroll views. Chained swipes land 16 of 20 each way (`main`: 5 of 20).

## Carried into the rebuild

- E04 (T08): one page mount per crossing at most, pages memoized by key and fed from the presentation cache; measure crossing commit and mount cost; investigate the 4 of 20 dropped chained swipes. Use `snapToInterval` + `disableIntervalMomentum` on Android (`pagingEnabled` loses chained swipes under Gesture Handler, finding 3). Keep `disallowInterruption(true)` on both native handlers (finding 1). Place the pager with `scrollTo` after layout, not `contentOffset` (finding 4).
- E05 (T11): replace the animated day `height` with a fixed maximum content height so the pinch stays transform-only (finding 5); handle the first-finger-lift focal update (finding 2).
- Open owner checks: hand feel, re-base hop, 1 px seams, TalkBack and VoiceOver, rotation and split view, iOS.
