# E02 — Native ScrollView paging spike: evidence

Evidence for the E02 go/kill decision on the windowed native horizontal `ScrollView` (D01). It
records what was measured on the OnePlus 6, what was observed, what still needs the owner's hands
or eyes, and how the numbers compare with the P02 thresholds and the kill criteria. **No verdict is
recorded here; the verdict is the owner's.**

## Tested revisions and device

|                 | Revision                                | What runs                                                                                           |
| --------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Current build   | `main` at `40eb2241`                    | Production Calendar: PagerView renderer, week mode, 588-event dev calendar (about 17 events a week) |
| Spike           | `spike-native-paging-t04` at `d5038fad` | `/dev-paging-spike`: fixture weeks, the Reanimated synchronous UI-props flags on                    |
| Perfetto traces | spike at `1e126ec7`                     | Same pinch and fling code paths as `d5038fad`, which only changes how the pager is first positioned |

- The spike SHAs name the APKs as built from `spike-native-paging-t04` before it was rebased onto
  `main`. The merged spike has the same behaviour, split into a screen, a pinch hook, chrome and
  panel files, plus its root-layout route registration. A smoke run of that split code (`fc84c461`)
  landed +15 / −16 on the 20-swipe chains, 20/20 diagonals and 0 pages during the pinch.
- Device: OnePlus 6 (A6003), Android 15 (LineageOS userdebug), 60 Hz, 1080×2280, density 450
  (2.8125 px/dp).
- Builds: `APP_VARIANT=perf` release APKs (`fr.samuelprak.timecalendar.perf`), Hermes, profileable,
  built on the Windows PC with `mobile/perf/build-apk.sh`.
- Harness: `mobile/perf/run.mjs`, gestures injected through a virtual HID touchscreen
  (`mobile/perf/lib/gestures.mjs`). Swipes are 150 ms; chained swipes start 150 ms after the
  previous lift, while the previous page is still settling. Diagonal swipes are 30° from horizontal
  and start from rest.
- Summaries: `mobile/perf/samples/main-40eb2241*` and `mobile/perf/samples/spike-d5038fad-*`.
- iOS: not run (see [iOS](#ios)).

### Reproduce

```sh
# build on the PC (mobile/perf/README.md), then from the Mac:
cd mobile
node perf/run.mjs --serial 86fa07cc --apk <spike apk> --label spike --out perf/out \
  --url timecalendar-perf://dev-paging-spike --probe paging-spike-status --logcat PAGING_SPIKE \
  --scenarios swipe-forward-20,swipe-back-20,fling-5,reversal-10,diagonal-20,vertical-scroll,pinch-3s
# variants: --url 'timecalendar-perf://dev-paging-spike?android=paging'  (pagingEnabled on Android)
#           --url 'timecalendar-perf://dev-paging-spike?k=small'          (±8 pages, re-base after 5)
node perf/run.mjs ... --label main --probe owned-calendar-canvas   # current build, default URL
```

The spike screen opens with `adb shell am start -a android.intent.action.VIEW -d
timecalendar-perf://dev-paging-spike fr.samuelprak.timecalendar.perf` once the app is running. Its
bottom panel jumps −20 / −1 / Today / +1 / +20 weeks, toggles Android `snap` ↔ `paging` and the
content size, and prints the settled week, crossings, settles, re-bases, page mounts and the last
and worst crossing commit time.

## What the spike is

`mobile/src/features/paging-spike/` behind the dev-only `/dev-paging-spike` route:

- One vertical `ScrollView` holding the hour gutter, one shared layer of 49 hour and half-hour
  lines, and a horizontal `Animated.ScrollView` of 5 week pages keyed by page index at
  `left = (index − contentStart) × pageWidth`, inside ±260 pages of content (±8 with `k=small`).
  The content re-bases with a non-animated `scrollTo` at settle when the settled page is within
  30 pages (3 with `k=small`) of an edge.
- The week header strip follows `translateX = −scrollX` on the UI thread.
- Settlement runs on the UI thread: a page is settled when no drag or momentum is active and the
  offset is within one device pixel of a page boundary. JS hears only index crossings and settles
  (`scheduleOnRN`).
- Android uses `snapToInterval` + `disableIntervalMomentum` by default; `?android=paging` switches
  to `pagingEnabled`.
- Pinch is transform-only for every line, label and tile of the settled page: tiles are three
  slices (top cap, scaled middle, bottom cap) with the text counter-scaled inside a `scaleY` clip
  window. Neighbour pages render plain tiles at the last committed scale. The day height is an
  animated `height`. One React commit applies the new scale when the pinch ends.
- Gesture relations: both scroll views are `Gesture.Native()` with `disallowInterruption(true)`,
  simultaneous with the pinch. A second finger locks both scroll views (`scrollEnabled: false`
  through `useAnimatedProps`) until every touch ends; a pager locked mid-drag then snaps to the
  nearest page.

## Results

### Landing: pages travelled

| Scenario                     | Swipes                     | `main` 40eb2241 | Spike, snap            | Spike, `pagingEnabled`                                                        | Spike, `k=small` |
| ---------------------------- | -------------------------- | --------------- | ---------------------- | ----------------------------------------------------------------------------- | ---------------- |
| `swipe-forward-20`           | 20 forward, 150 ms apart   | +5              | +16                    | +13 (one settle, at the end); a second run crossed 12 pages and never settled | +15 (2 re-bases) |
| `swipe-back-20`              | 20 back                    | −5              | −16                    | –                                                                             | −15 (2 re-bases) |
| `fling-5`                    | 5 forward, 900 ms apart    | +3              | +5                     | +5                                                                            | +5               |
| `reversal-10`                | 10 forward-then-back pairs | 0               | 0                      | 0                                                                             | –                |
| `diagonal-20`                | 20 forward at 30°          | **0**           | **+20**                | +20                                                                           | –                |
| `pinch-3s`                   | 3 s pinch                  | –               | stays                  | –                                                                             | stays            |
| +20 or Today, then one swipe | 5 attempts                 | –               | 5/5 land on target + 1 | –                                                                             | –                |

The `pagingEnabled` reversal and diagonal results come from the same scenarios on `1e126ec7`.

### Frame timing (`gfxinfo`, whole scenario)

| Scenario             | Build | p50 ms | p95 ms | p99 ms | ≤16 ms | >33 ms | Janky (HWUI) | JS CPU ms | UI CPU ms | RenderThread CPU ms |
| -------------------- | ----- | ------ | ------ | ------ | ------ | ------ | ------------ | --------- | --------- | ------------------- |
| swipe-forward-20     | main  | 14     | 24     | 113    | 87.8%  | 11     | 4.81%        | 7070      | 2914      | 1336                |
|                      | spike | 16     | 36     | 44     | 50.2%  | 20     | 12.31%       | 2047      | 3341      | 2798                |
| swipe-back-20        | main  | 15     | 24     | 117    | 88.9%  | 12     | 3.49%        | 6838      | 2690      | 1326                |
|                      | spike | 17     | 34     | 46     | 44.4%  | 24     | 11.48%       | 2351      | 3321      | 2873                |
| fling-5              | main  | 15     | 53     | 125    | 62.6%  | 6      | 6.96%        | 3847      | 1968      | 741                 |
|                      | spike | 18     | 38     | 44     | 33.3%  | 14     | 7.66%        | 2219      | 2844      | 2025                |
| reversal-10          | main  | 17     | 22     | 29     | 46.7%  | 3      | 5.00%        | 1570      | 3156      | 2202                |
|                      | spike | 16     | 34     | 38     | 58.2%  | 17     | 14.65%       | 1678      | 2711      | 2186                |
| diagonal-20          | main  | 16     | 21     | 27     | 75.0%  | 0      | 4.59%        | 1200      | 3852      | 10120               |
|                      | spike | 15     | 42     | 48     | 63.4%  | 45     | 22.19%       | 6108      | 6392      | 2990                |
| vertical-scroll      | main  | 18     | 27     | 36     | 40.6%  | 2      | 6.29%        | 1132      | 1156      | 1563                |
|                      | spike | 20     | 44     | 48     | 31.9%  | 12     | 10.08%       | 174       | 1035      | 1508                |
| pinch-3s             | main  | 61     | 85     | 97     | 18.5%  | 55     | 74.07%       | 485       | 3275      | 654                 |
|                      | spike | 19     | 30     | 44     | 12.6%  | 6      | 6.29%        | 467       | 2304      | 993                 |
| pinch-3s (`k=small`) | spike | 20     | 31     | 44     | 19.6%  | 4      | 6.99%        | 393       | 2289      | 1010                |

Read with care:

- `main` lands 5 of 20 chained swipes and 0 of 20 diagonals, so its swipe scenarios animate far
  fewer page transitions than the spike's; its frame percentages describe a mostly idle pager.
- The harness reports HWUI buckets truncated to whole milliseconds, so `≤16 ms` stands for the
  16.7 ms deadline.
- The injector runs about 1.2 s behind plan over a 20-swipe chain (`achievedGestureMs` in the
  samples). Some chained strokes may land closer together than planned.
- UI-thread traversal stays under 1 ms at p95 in every spike scenario; the frame time is RenderThread
  and commit/mount work.

### Per-crossing cost (spike)

| Measure                                                          | Value                                                                                | Source                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Crossing → React commit applied (`useLayoutEffect`)              | median 40–47 ms, worst 75 ms per scenario                                            | `PAGING_SPIKE commit` logcat lines, `d5038fad` |
| UI-thread mount per crossing (`MountItemDispatcher::mountViews`) | 13.6–48.4 ms (the nine largest mounts during `fling-5`)                              | Perfetto, `1e126ec7`                           |
| Page mounts per crossing                                         | 1 (the `pageMounts` counter grows by one per crossing; existing pages never remount) | status line                                    |
| Android views                                                    | 665 after launch, 722 after all scenarios (`main`: 692 → 577)                        | `dumpsys activity top`                         |
| Cold launch to MainActivity                                      | 7.6 s (both)                                                                         | `am start -W`                                  |

### Commits during gestures (Perfetto, spike `1e126ec7`)

| Window                      | Reanimated shadow-tree commits (UI thread) | Commits from the JS thread | Vertical `onScrollChanged` |
| --------------------------- | ------------------------------------------ | -------------------------- | -------------------------- |
| `pinch-3s` (3.0 s of input) | 925                                        | 96                         | 92                         |
| `fling-5` (4.4 s of input)  | 501                                        | 135                        | 0                          |

During the pinch, the animated `height` of the day container is a layout prop. Reanimated commits it
through the shadow tree on every update. The JS-thread commits match the vertical ScrollView's 92
scroll-state updates, driven by the pinch's per-frame `scrollTo`. During the fling, the
JS-thread commits are the crossing renders and the horizontal ScrollView's scroll-state updates.

## P02 thresholds

| Threshold                                         | P02     | `main`                  | Spike                                                                          | Missed by      |
| ------------------------------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------------ | -------------- |
| Pinch: frames ≤16.7 ms                            | ≥95%    | 18.5%                   | 12.6% (19.6% with `k=small`)                                                   | about 7.5×     |
| Pinch: frames >33 ms                              | 0       | 55                      | 6                                                                              | –              |
| Pinch: React commits / JS events                  | 0 / 0   | –                       | 1 React commit at the end; 925 Reanimated layout commits; 96 JS-thread commits | –              |
| Fling across 5: janky                             | ≤5%     | 6.96%                   | 7.66%                                                                          | 1.5×           |
| Fling across 5: p99                               | ≤33 ms  | 125 ms                  | 44 ms                                                                          | 1.3×           |
| Fling: frames >16.7 ms per crossing               | ≤1      | 43 frames / 3 crossings | 148 frames / 5 crossings (about 30)                                            | about 30×      |
| Page mount (UI thread)                            | ≤12 ms  | –                       | 13.6–48.4 ms                                                                   | up to 4×       |
| JS per page crossing                              | ≤8 ms   | –                       | crossing → commit 40–47 ms median                                              | about 5–6×     |
| Views in the window                               | ≤700    | 692                     | 665–722                                                                        | 1.03× at worst |
| iOS hitch ratio                                   | ≤5 ms/s | not measured            | not measured                                                                   | –              |
| Perfetto: no Fabric commits during pinch or fling | none    | –                       | commits in both (table above)                                                  | –              |

## Kill criteria

From `product.md` (kill or rescope if any holds):

| Criterion                                                                                            | Observation                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Android horizontal drag loses to the vertical scroll more than 1 in 20 diagonal starts, after tuning | Spike: 0 of 20 lost at 30° (snap and `pagingEnabled`), with `disallowInterruption(true)` on both native handlers. Without that tuning, the vertical ScrollView activating mid-swipe cancelled the horizontal one and left it between pages. `main`: 20 of 20 lost. Owner hand check open.                                                 |
| A second touch during the Android snap cannot be reconciled without a visible jump                   | Snap mode: chained swipes land +16/−16 of 20, reversals return to the start, a swipe right after a +20 or Today jump lands on target + 1; 4 of 20 chained swipes produced no crossing (injector timing not excluded). `pagingEnabled`: a swipe started during the snap never snaps (see finding 3). Visual jump check open for the owner. |
| Pinch cannot run simultaneously with both native scroll views                                        | The pinch is recognised alongside both (`simultaneousWithExternalGesture`). Panning and zooming at once is disabled on purpose: the second finger locks both scroll views (the owner's call during the spike).                                                                                                                            |
| P02 thresholds missed by more than 2× with the shared grid and transform pinch in place              | Pinch ≤16.7 ms share, frames over 16.7 ms per fling crossing, page mount and JS per crossing are each missed by more than 2× (P02 table).                                                                                                                                                                                                 |

From R08 "Kill criteria for B":

| Criterion                                                                                         | Observation                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Second swipe during settle snaps back, skips or is dropped in more than 1 of 20, either direction | Snap: 4 of 20 dropped forward, 4 of 20 back; no snap-back or skip seen in the crossing logs. `main`: 15 of 20 dropped each way.                                                       |
| Diagonal start (≈30°) captured by the vertical owner more often than on the current build         | Spike 0 of 20, `main` 20 of 20.                                                                                                                                                       |
| Window shift shows a page at the wrong x, an empty slot or a hop, or takes longer than a fling    | Landings stay exact across 2–4 re-bases with `k=small`, and pages never remount. Frame-level hop check needs the owner's eyes on a recording.                                         |
| Pinch does not win over a horizontal drag start; focal time drifts during a pinch begun mid-page  | Pinch wins: the second finger locks the pager and a drag in progress snaps back to its page on release (scripted pinch sliding 500 px sideways). Focal drift not measured: **owner**. |
| Android paging below the display's deadline with the shared grid in place                         | Swipe scenarios hold 44–58% of frames within 16.7 ms; see P02.                                                                                                                        |

## R02 residual risks

| #   | Risk                                                                                                       | Status                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Android settle feel: `snapToInterval+disableIntervalMomentum` vs `pagingEnabled`; rapid DOWN mid-animation | Measured: snap lands chains and flings; `pagingEnabled` lands flings but loses chained swipes (finding 3). **Owner:** the feel of each mode by hand (toggle in the panel).                                                                                                                                                              |
| 2   | Integer-pixel hygiene; 1 px seams                                                                          | Page width is rounded to device pixels; every settle passed the one-device-pixel alignment rule, including at page 43. One screenshot showed about 1 px of the next page at the right edge after a settle. Tile slices overlap by one device pixel to close the seam between body and caps. **Owner:** look for seams after 50+ pages.  |
| 3   | First frame at the initial offset with no jump; Android pending-offset path                                | Android re-applies a `contentOffset` prop each time the view's props are re-sent, which a Reanimated `scrollEnabled` update does, throwing the pager back to its first page. The spike places the pager with `scrollTo` after layout and keeps it at opacity 0 until its first scroll event. **Owner:** first frame on Android and iOS. |
| 4   | Re-base without a jump, synthetic scroll and momentum-end filtered                                         | `k=small` re-bases 2–4 times per run with exact landings; settle counts match landings. **Owner:** recording or hand check for a hop.                                                                                                                                                                                                   |
| 5   | Momentum-end delivery on Android through Reanimated; double momentum-end                                   | Snap mode delivers a settle per landing in every run. In `pagingEnabled` mode the momentum end can be missing or fire unaligned (finding 3).                                                                                                                                                                                            |
| 6   | Diagonal arbitration with `directionalLockEnabled` and the pinch simultaneous; lift-on-boundary on iOS     | Android: 20 of 20 at 30° with uninterruptible native handlers (`directionalLockEnabled` is iOS-only). iOS: not run.                                                                                                                                                                                                                     |
| 7   | VoiceOver three-finger paging and TalkBack settling                                                        | Not run: needs the owner with VoiceOver and TalkBack. The horizontal ScrollView is `importantForAccessibility="no"`.                                                                                                                                                                                                                    |
| 8   | Rotation and iPad split-view width change during a fling                                                   | Not run. The app allows all orientations and resizable iPad windows. The spike re-places the pager at the settled page on any width change. **Owner:** rotate and resize during a fling on the iPad.                                                                                                                                    |

## R05 accessibility checks

| #   | Check                                                                                                                                                        | Status                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 1   | iOS, current build: VoiceOver swipe reaches tiles inside the adjustable canvas                                                                               | **Owner** (iPhone with VoiceOver)                                                    |
| 2   | Android, current build: TalkBack's adjust gesture on the canvas pages the calendar                                                                           | **Owner** (TalkBack; enabling it changes device settings, which this run did not do) |
| 3   | Adjustable corner element: one page per increment, one utterance                                                                                             | Not built in the spike (E06 owns the control)                                        |
| 4   | iOS three-finger swipe on a page with events                                                                                                                 | **Owner** with an iOS build                                                          |
| 5   | Android, horizontal ScrollView `importantForAccessibility="no"`: never pages past the last event, vertical auto-scroll reaches 23:00, two-finger swipe pages | **Owner** with TalkBack on the spike                                                 |
| 6   | Neighbour pages unreachable by swipe or explore-by-touch                                                                                                     | **Owner** with TalkBack and VoiceOver                                                |
| 7   | Focus restoration after paging                                                                                                                               | Not built in the spike                                                               |
| 8   | Reduce Motion while running                                                                                                                                  | Not built in the spike                                                               |
| 9   | Largest Dynamic Type and font scale                                                                                                                          | **Owner**; the spike header uses fixed font sizes                                    |

## R08 spike demonstrations

| #   | Demonstration                                                                 | Status                                                                                          |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1   | 20 rapid same-direction swipes both ways land 20 pages away                   | Android snap: +16 and −16; `pagingEnabled`: +13 or never settles; iOS not run                   |
| 2   | Reversal mid-deceleration, cancelled partial drag: no stale snap-back         | 10 reversal pairs return to the start in both modes. Cancelled partial drag: **owner** by hand  |
| 3   | Window shift mid-deceleration: no hop, no remount                             | Page-mount counter shows no remounts; landings exact across re-bases. Hop: **owner**            |
| 4   | Diagonal starts and vertical scrolls from a moving page: one axis per gesture | 20 of 20 diagonals page; vertical flings never page. A touch stays on the axis it claims first. |
| 5   | Pinch during a horizontal drag; focal invariant                               | Pinch wins and the page holds. Focal invariant: **owner**                                       |
| 6   | `scrollTo` for Today across the range, then immediate swipe                   | +20 then swipe lands +21; Today then swipe lands +1 (5 of 5)                                    |
| 7   | Android frame timing with and without the shared grid                         | With the grid only (the spike has no variant without it)                                        |

## Reanimated synchronous UI props (#8810, #10631)

`ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` and `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` are on in
`mobile/package.json`. The A/B used the same spike built with and without them (branch
`spike-noflags-probe`); the two `libreanimated.so` builds differ, so the flags reached native code.
Pinch → page switch → pinch rendered the same with and without the flags: no stale transform,
no tile left at an old scale and no layout snapping back after a React commit. The Reanimated issues
#8810 and #10631 were not reproduced on Android. iOS is untested.

## Findings

1. **A native handler is interruptible by default.** With both scroll views in `Gesture.Native()`,
   the vertical ScrollView activating mid-swipe cancels the horizontal one, which then never snaps
   and stays between pages. `disallowInterruption(true)` on both keeps a touch on the first axis
   that claims it (diagonal 0/20 → 20/20).
2. **Pinch end on Android.** The pinch stays active until every finger lifts, and the event that
   lifts the first finger already reports the focal point on the remaining finger. Anchoring the
   focal hour on that update scrolls by half the finger spread. The spike undoes that update and
   holds the zoom until the last finger lifts.
3. **`pagingEnabled` on Android under Gesture Handler.** The gesture handler forwards touches to the
   ScrollView only after it claims the drag, so `ReactHorizontalScrollView` never sees the
   `ACTION_DOWN` that cancels its post-touch snap runnable. A swipe started during a snap then
   finds a stale runnable, skips its own snap and can stop between pages without a settle.
   `snapToInterval` snaps on lift and is not affected.
4. **`contentOffset` on Android** is applied again whenever the ScrollView's props are re-sent, which
   Reanimated does for an animated `scrollEnabled`; the pager jumps back to its initial page.
5. **Layout props commit.** An animated `height` makes every pinch frame a Reanimated shadow-tree
   commit (925 in 3 s); a fixed maximum content height would keep the pinch transform-only.
6. **Cold deep link on the current build.** Cold-starting `main` straight into a deep link crashes
   with "Attempted to navigate before mounting the Root Layout component"; the harness starts the
   launcher activity first.
7. **Short flicks.** A 90 ms flick does not page the current PagerView at all; the harness uses
   150 ms swipes.

## iOS

No iOS run was made: no EAS or other cloud build was started. An iOS run needs:

- A new native iOS binary. The synchronous UI-props flags are compiled into Reanimated, so they
  change the runtime fingerprint and cannot arrive by OTA. A development build (`APP_VARIANT=development`) carries the dev-only
  route: an EAS build the owner starts, or a local Xcode 26.6 build on a machine that can take a
  native build.
- The physical iPhone with the dev calendar seeded, opening
  `timecalendar-dev://dev-paging-spike`.
- Instruments (Animation Hitches) for the ≤5 ms/s hitch ratio, plus the R02 6–8 and R05 1, 4, 6
  and 9 checks by hand. The `mobile/perf/` harness is Android-only.

## Open owner checks

- The go/kill verdict, recorded wherever the E02 epic tracks it.
- Hand feel of snap vs `pagingEnabled` on the OnePlus 6, including a grab mid-fling and a cancelled
  partial drag.
- Visual hop at re-base (`?k=small`, swipe past 5 weeks) and 1 px seams after 50+ pages.
- R05 checks 1–2 on the current production build (VoiceOver, TalkBack) and 4–6, 9 on the spike.
- The iOS run above, including iPad rotation and split view during a fling.
