# E04 Android chained-swipe evidence

The OnePlus 6 perf build runs Android 15 at 60 Hz with a 588-event development calendar. The
`mobile/perf/run.mjs` harness starts each 150 ms swipe 150 ms after the previous lift. The
reported landing is the committed week in the `owned-calendar-canvas` probe; a `settle` log line
records a committed page. Raw `logcat` and frame dumps remain outside the repository because
they contain device paths and identifiers.

## Gesture configuration

The baseline APK without rest recovery lands +15–16 and −15–16 pages across five 20-swipe
chains in each direction. Each chain in those five runs ends with one settle. The earlier T08
device pass found approximately 3 of 25 chains ending without a settle.

The gesture options below use the `d6879c78` diagnostic APK with rest recovery disabled. The
diagnostic flags and logs are not part of the production renderer.

| Configuration | Forward, five or two runs | Back, five or two runs | Reversal-10 | Diagonal-20 | Fling-5 | Result |
| --- | --- | --- | --- | --- | --- | --- |
| `Gesture.Native` baseline, five | +16, +16, +15, +16, +15 | −16, −16, −15, −16, −16 | 0 in two runs | 20/20 in two runs | 5/5 in two runs | Retains axis arbitration, drops chained swipes. |
| No horizontal `GestureDetector`, five | +16, +16, +16, +16, +15 | −16 in all five | 0 in all five | 6–7/20 | 4–5/5 | Vertical owner wins most diagonals. |
| `shouldActivateOnStart(true)`, two | no final settle; 0, +7 committed | no final settle in either | 0 in both | 20/20, 13/20 committed | no final settle in either | Touch activation disrupts settlement. |
| Page/content `pointerEvents="box-none"`, two | +16 in both | −16 in both | 0 in both | 20/20 in both | 5/5 in both | Does not improve chain landing. |

RNGH's own `ScrollView` in version 2.31.1 wraps React Native's `ScrollView` with a native
gesture handler configured with `disallowInterruption: true`. It follows the same touch-owner
path as the current `Gesture.Native` wrapper, so it has no distinct Android `ACTION_DOWN`
mechanism to test with another APK. Removing the wrapper gives the React Native responder a
chance to own the horizontal axis, but the measured diagonal regression makes it unsuitable.

The first rest-check APK (`37fc15fa`, eight still frames) lands +11, +10, 0, +13, +12 and
−13, −13, 0, −12, −13 across five chains each way. It logs 19–23 rest interventions during each
chain, including snaps close to a lift. Eight frames can elapse during a still part of a drag,
so that threshold interferes with native paging. The current 45-frame threshold allows a
150 ms chained touch to arrive before recovery starts.

## UI-thread rest recovery

The Android pager monitors observed horizontal offsets while it is mounted. After 45 still
frames without a tracked finger or pinch lock, it clears stale drag and momentum flags. If the
observed offset is aligned, it settles that page; otherwise it asks native scroll to snap to the
nearest page. Two animated attempts precede a direct third placement. A commanded target never
commits until `onScroll` observes an aligned native offset. The watcher stops after three
attempts when native ignores all commands.

The focused regression tests cover an unaligned rest, an aligned rest with a missing drag end,
a held finger, a held pinch, three ignored scroll commands, a new finger before delayed native
alignment, unmount and unchanged iOS behavior. The Today regression covers a programmatic
placement that stops a fling without a momentum-end event. `TZ=UTC npm test -- --coverage`
passes 229 suites and 2,263 tests at `55574e46`; TypeScript and eslint pass.

## Exact candidate on the OnePlus 6

The `APP_VARIANT=perf` APK was built on the Windows PC from `55574e46` and installed with
`adb install -r`. The copied APK matched the PC SHA-256
`29d06b2ea0b5835f9b6eb352d56503eb0ff3582a3713cebd6601e7067c910239`. Five complete
harness passes used `--probe owned-calendar-canvas --logcat CALENDAR_PAGING` and the scenarios
`swipe-forward-20,swipe-back-20,reversal-10,diagonal-20,fling-5`. The committed summaries are in
`mobile/perf/samples/t08b-55574e46-1/` through `t08b-55574e46-5/`.

| Run | Forward landing; settles | Back landing; settles | Reversal-10 | Diagonal-20 | Fling-5 |
| --- | --- | --- | --- | --- | --- |
| 1 | +15; 1 | −16; 1 | 0 | 20/20 | 5/5 |
| 2 | +16; 1 | −16; 1 | 0 | 20/20 | 5/5 |
| 3 | +15; 1 | −16; 1 | 0 | 20/20 | 5/5 |
| 4 | +15; 1 | −16; 1 | 0 | 20/20 | 5/5 |
| 5 | +16; 1 | −16; 1 | −1 | 20/20 | 5/5 |

The final settle log agrees with the committed probe after each of the ten chains. The rest
watcher logged no intervention in these chains; this sample does not reproduce the rarer
missing-settle failure seen in the earlier 25-chain pass. The unit regressions prove the
recovery path when native motion stops between pages, but this device sample alone does not
establish a 25/25 settle rate. The fifth reversal ends one page behind its start.

The Calendar is below P01's exact 20/20 chained-swipe requirement in both directions and below
the reversal-exact requirement. The safety net is bounded and avoids committing an unobserved
native target. An Android native pager intervention or the owned-pager fallback needs a new
bounded device pass before release. D08's no-native-module boundary has not changed in this
candidate; no native prototype was merged.
