---
kind: ticket
id: T08b
epic: E04
status: done
traces-to: [P01, P03, D03, D08]
depends-on: [T08]
size: M
confidence: medium
---

# T08b — Recover Android pager rest and measure chained swipes

## Outcome

The Android horizontal pager checks observed native offsets on the UI thread after 45 still
frames without a tracked finger or pinch lock. An aligned page settles once. An unaligned page
gets two animated snap requests and one direct placement; a requested target cannot settle
until a native scroll event confirms its alignment. The watcher stops after three ignored
commands. Explicit Today placement clears stale drag and momentum flags. iOS keeps native
`UIScrollView` paging.

## Verification

- `TZ=UTC npm test -- --coverage`: 229 suites and 2,263 tests pass at `55574e46`.
- `npx tsc --noEmit` and eslint pass.
- OnePlus 6 perf APK `55574e46`: ten of ten 20-swipe chains end with a settle; forward
  +15–16/20, back −16/20. Diagonals 20/20 and flings 5/5 in all five passes. One of five
  reversal runs ends at −1.
- Full device evidence: `evidence/E04-android-chained-swipes.md`.

P01's exact chained-swipe and reversal gates remain open. The dated inbox note
`docs/react-native-migration/inbox/2026-10-02-calendar-paging-android-chain-gate.md`
records the release decision needed for a native intervention or owned pager.
