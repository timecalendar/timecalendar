# E02 — Native ScrollView paging spike: iOS Simulator evidence

iOS evidence for the E02 spike (`/dev-paging-spike`, the Reanimated synchronous UI-props flags on),
gathered on the iOS Simulator. It complements the OnePlus 6 evidence in
[`E02-spike-evidence.md`](E02-spike-evidence.md) and uses the same scenarios where a simulator can
run them. **Simulator results are not device results.** The Simulator runs on the Mac's CPU and GPU
at 60 Hz with no ProMotion, the build is a Debug build with the JS bundle served by Metro, and
gestures are synthetic. Landing, arbitration, settlement and rendering correctness carry over to a
device; timing does not. No verdict is recorded here.

The tooling assessment of Argent, used to drive the Simulator for this run, is in
[`argent-mcp-assessment.md`](argent-mcp-assessment.md).

## Tested revision and setup

|              |                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Revision     | `main` at `01183856` (the merged spike, `mobile/src/features/paging-spike/`)                                             |
| Build        | `APP_VARIANT=development`, Debug, `npm run ios -- --port 8091`, Xcode 26.6 (17F113), iOS 26.5 SDK, Hermes, Metro on 8091 |
| Host         | MacBook Air, macOS 27.0 (26A428)                                                                                         |
| iPhone       | iPhone 17 Pro Simulator, iOS 26.5, 402 × 874 pt, 3× (page width 352 pt = 1056 px), 60 Hz                                 |
| iPad         | iPad Pro 11-inch (M5) Simulator, iOS 26.5, same `.app`                                                                   |
| Gestures     | Argent 0.26.0 `gesture-custom` (timed one- and two-finger touch streams), `gesture-swipe`, `rotate`, `run-sequence`      |
| Observations | `PAGING_SPIKE` lines in the Metro log, the status line read with Argent `describe`, `simctl io` screenshots and video    |

- Swipes follow the Android harness: 150 ms strokes over 50% of the screen width (201 pt), chained
  strokes start 150 ms after the previous lift, and diagonal strokes run 30° from horizontal and
  start from rest (900 ms apart). A 20-swipe chain took 6.5–6.7 s of wall time against 6.0 s
  planned.
- Every scenario starts with the pager at rest. The `describe` call that reads the status line stalls
  the app's UI thread for about 500 ms, so the frame measurements start 2.5 s after it (see
  [Frame timing](#frame-timing)).
- Findings 1 and 2 and the frame timing used temporary probes in the spike: scroll-event and
  pinch-event `console.log` lines and a frame-interval probe. They were reverted and are not part of
  the tested revision.

### Reproduce

```sh
cd mobile
APP_VARIANT=development BACKEND_ENVIRONMENT_CAPABILITY=development npx expo start --port 8091 --dev-client
CI=1 npm run ios -- --port 8091 --device <booted simulator udid>
xcrun simctl openurl <udid> "timecalendar-dev://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8091"
xcrun simctl openurl <udid> "timecalendar-dev://dev-paging-spike"
```

Gestures go through Argent's CLI (no MCP registration needed), for example one chained swipe:

```sh
npm install --prefix <scratch dir> @swmansion/argent@0.26.0
DO_NOT_TRACK=1 <scratch dir>/node_modules/.bin/argent run gesture-custom --udid <udid> \
  --events-json '[{"type":"Down","x":0.85,"y":0.55},{"type":"Move","x":0.6,"y":0.55,"delayMs":75},{"type":"Up","x":0.35,"y":0.55,"delayMs":75}]' \
  --interpolate 4
```

A deep link to `/dev-paging-spike` while the spike is already open keeps the mounted screen and its
state, so `?k=small` only applies on a fresh mount. This run switched the content size with the
panel's `K=` button, which runs the same re-base path.

## Results

| #   | Checklist item                                        | iOS Simulator result                                                                                                                                                                                                                                                | Verdict            |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| 1   | 20 rapid swipes each way, 150 ms apart (R08 1)        | **+20 / −20, twice each.** Crossings are strictly monotonic, one settle at the end of each chain, no snap-back or skip. Android snap mode: +16 / −16.                                                                                                               | Pass               |
| 1b  | Same chains 50 ms apart (stress, tighter than R08)    | +18 and +20 forward, −20 back.                                                                                                                                                                                                                                      | Pass at R08 timing |
| 2   | Fling, 5 swipes 900 ms apart                          | +5, 5 settles.                                                                                                                                                                                                                                                      | Pass               |
| 3   | Reversal mid-deceleration (R08 2)                     | 10 forward-then-back pairs, back 150 ms after the lift: returns to the start page, 0 stray settles.                                                                                                                                                                 | Pass               |
| 3b  | Cancelled partial drag (R08 2)                        | Drag 50 pt, return, lift: snaps back to its page with no stale snap (3 of 3).                                                                                                                                                                                       | Pass               |
| 3c  | Grab mid-fling and release without moving             | The pager stops, then lands aligned on the next page, but **no settle is reported** (5 of 5). See [finding 1](#findings).                                                                                                                                           | **Bug**            |
| 4   | Diagonal start at 30° (R08 4)                         | **20 of 20** page; the vertical ScrollView never claims the touch.                                                                                                                                                                                                  | Pass               |
| 5   | Vertical fling (R08 4)                                | 3 up/down pairs and 5 fast down flings: the vertical ScrollView scrolls, 0 horizontal scroll events, 0 crossings.                                                                                                                                                   | Pass               |
| 6   | Pinch                                                 | Recognised; both ScrollViews lock, 0 crossings during the pinch; pinch out clamps at 120 px/h, pinch in at the fractional scales tested.                                                                                                                            | Pass               |
| 6b  | Pinch release                                         | At the clamp, the held frame and the committed frame are pixel-identical. At a fractional scale the release jumps by about 1–2% of scale and up to 3 pt. See [finding 2](#findings).                                                                                | **Bug** (small)    |
| 7   | +20 or Today, then an immediate swipe (R08 6)         | Swipe 100 ms after the tap: +20 then swipe lands **+21, 5 of 5**; Today then swipe lands **today + 1, 5 of 5**. Today first settles on today, then the swipe moves on.                                                                                              | Pass               |
| 8   | First frame at the initial offset (R02 3)             | The first painted pager frame shows today's week: no frame of another week and no jump. During the 350 ms push transition the calendar body is blank. See [finding 3](#findings).                                                                                   | Pass, with a gap   |
| 9   | Re-base with `k=small` (R02 4, R08 3)                 | Single swipes: 8 of 8 land with 1 re-base. Chains: +18 and −19 with 2 re-bases each; every missing page is the chain hitting the content edge. See [finding 4](#findings). A recording of the re-base shows no hop and no empty slot.                               | Pass               |
| 10  | Reanimated #8810 / #10631 (pinch, page switch, pinch) | Pinch → page → pinch → page back → pinch → page: every tile sits on its grid line in each frame, and a neighbour page dragged into view renders at the committed scale. No stale transform and no layout snapping back after the commit. **Not reproduced on iOS.** | Pass               |
| 11  | 3-slice tile seams and text sharpness during pinch    | Held mid-pinch at 2× and at 0.75×, inspected at device resolution: no seam between caps and body, and the counter-scaled text stays sharp, with no stretched glyphs.                                                                                                | Pass               |
| 12  | Integer-pixel alignment (R02 2)                       | Every landing offset is an exact multiple of the 352 pt page (for example `x=108768.00` = 309 pages), across more than 300 pages travelled.                                                                                                                         | Pass               |
| 13  | Rotation during a fling, iPad (R02 8)                 | The pager is re-placed aligned on the **last settled page**, so the in-flight swipe is dropped. One rotation also produced a crossing to an index 84 pages away and a commit of that window before it returned. See [finding 5](#findings). Split view: not run.    | Partial            |
| 14  | Largest Dynamic Type (R05 9)                          | At AX XXXL the header day names and dates and the gutter hour labels scale up and are clipped by the fixed header height and the 50 pt gutter.                                                                                                                      | **Fails**          |
| 15  | Hitch ratio (P02 ≤5 ms/s)                             | Not measurable: Instruments reports "Hitches is not supported on this platform" for the Simulator. A UI-thread frame-interval probe gives a rough stand-in (below).                                                                                                 | Not measured       |
| 16  | VoiceOver (R02 7; R05 1, 4, 6)                        | Not run: the Simulator has no VoiceOver.                                                                                                                                                                                                                            | Owner, on device   |

### Frame timing

Animation Hitches needs a device: on the Simulator `xctrace record --template 'Animation Hitches'`
records nothing and reports "Hitches is not supported on this platform". As a stand-in, a temporary
`useFrameCallback` probe measured gaps between display-link callbacks on the UI thread (callbacks
under 8 ms apart are folded together, since Reanimated runs extra callbacks during gestures). The
"hitch" column sums the time each gap overran 16.7 ms. This is **not** Apple's hitch ratio: it
misses render-server hitches, it includes Debug-build cost, and it moved by up to 10× between two
identical passes on a shared host. Read it as "the UI thread was not stalled for long", not as a
P02 result.

| Scenario         | Pass 1: late frames | Pass 1: ms/s | Pass 2: late frames | Pass 2: ms/s | Worst gap |
| ---------------- | ------------------- | ------------ | ------------------- | ------------ | --------- |
| swipe-forward-20 | 16.8%               | 79.9         | 6.4%                | 7.6          | 69 ms     |
| swipe-back-20    | 5.8%                | 7.1          | 7.5%                | 15.5         | 33 ms     |
| fling-5          | 7.6%                | 46.7         | 5.4%                | 26.4         | 60 ms     |
| reversal-10      | 20.7%               | 53.7         | 7.2%                | 12.9         | 57 ms     |
| diagonal-20      | 8.5%                | 50.5         | 4.4%                | 18.1         | 62 ms     |
| vertical-scroll  | 1.3%                | 2.0          | 1.3%                | 2.2          | 21 ms     |
| pinch-3s         | 2.3%                | 9.9          | 1.7%                | 7.3          | 41 ms     |

- Vertical scrolling and pinching keep the UI thread close to every vsync. The pinch is
  transform-only apart from the animated day height, which matches the Android Perfetto finding.
- Paging scenarios stall the UI thread at crossings. In this Debug build the crossing → React commit
  time was a 36–39 ms median (worst 130–168 ms), against 40–47 ms on the OnePlus 6 release build.
- An Argent native profile (Instruments CPU and hangs, through Argent's `native-profiler-*` tools)
  over two 20-swipe chains flagged no hangs. The heaviest stacks were the JS thread (26% of
  samples, Debug Hermes interpreter), `YGNodeCalculateLayout` on the JS thread (5%) and
  `updateClippedSubviewsWithClipRect` on the main thread (3%).

## Findings

1. **Grab and release loses the settle on iOS.** Touching the pager while it decelerates fires
   `onBeginDrag`. Lifting without moving fires no `onEndDrag`; UIKit then snaps to the nearest page
   as a momentum animation (`onMomentumBegin` … `onMomentumEnd`, ending aligned). The spike's
   `dragging` flag stays `true`, so `settleIfAligned` returns early. The pager is visibly on the
   next page while the settled index, status and re-base still point at the previous one, until a
   later drag resets the flag. Logged sequence: `beginDrag x=108768` → `endDrag x=108946.67` →
   `momentumBegin` → `beginDrag x=109100` (the grab) → `momentumBegin x=109100` →
   `momentumEnd x=109120` (aligned), and no settle. Clearing `dragging` in `onMomentumBegin` (a
   momentum phase implies the finger is up) fixed it: 5 of 5 grab-and-release runs settled. The
   patch was verified locally and not committed. **Carry into E04 (T08) settlement.**
2. **The Android first-finger-lift revert costs iOS a small jump.** On iOS, `onTouchesUp` arrives
   _before_ the update that follows a finger lift, and that update carries an unchanged scale and
   focal point (`touchesUp n=1 live=119.91 prev=118.39`, then
   `update n=2 scale=1.1069 focalY=357.5`). The revert added for Android finding 2 therefore throws
   away the last real update: the zoom steps back by one update (119.91 → 118.39 px/h here, 1.3%)
   and the anchored hour shifts by up to 3 pt at the first lift. With both fingers lifted at once,
   the committed scale (89.6 pt/h) differed from the held frame (87.8 pt/h). Apply the revert on
   Android only, or only when the post-lift update moves the focal point. **Carry into E05 (T11).**
3. **The calendar body is blank during the push.** The spike renders nothing until `onLayout`
   reports a width (`pageWidth > 0`), and it keeps the pager at opacity 0 until its first scroll
   event (the Android `contentOffset` workaround, Android finding 4). On iOS the stack push slides in
   an empty body for about 350 ms. The first painted frame is the right week, so nothing jumps.
   Production should size the first render from the window width and place the pager before it is
   shown, so the push carries a filled page.
4. **Re-base waits for a settle, so a chain can reach the content edge.** With `K=8` (17 pages) and
   a re-base threshold of 3, a 20-swipe chain never settles, reaches `x=5632` (the last page) and
   the next stroke bounces off the edge. Every page missing from the `k=small` chains is one of
   those edge bounces. A re-base issued just as the next drag began (`momentumEnd x=2816` arriving
   after `beginDrag x=5632`) moved the drag to the new offset without a visible hop, and the drag
   kept paging. With the production radius (±260 pages) a chain would need about 230 uninterrupted
   pages to reach the edge. Android shows the same `k=small` loss (+15 / −15).
5. **Rotation re-places the pager at the settled page.** On a width change the spike scrolls to
   `settled`, which drops a swipe still in flight (the pager returns to the page it left). In the
   run that rotated during a fling and then rotated back, the pager also reported a crossing to index 2877, 84 pages from the settled index, and
   committed a window there (330 ms, Debug) before committing the settled window again (685 ms).
   The cause is likely an `onScroll` offset from one width divided by the other. No frame of the
   wrong week was seen in screenshots or in a recording sampled at one frame in four, but that
   sampling cannot rule out a single frame. E04 should compute the index from an offset and width
   pair that belong together, and keep the in-flight target across a width change.
6. **Dynamic Type clips the chrome.** The header (day name and date) and gutter (hour labels) text
   follows the system text size. At the largest accessibility size it is clipped by the fixed
   header height and gutter width. E04 and E06 need either a capped `maxFontSizeMultiplier` with a
   layout that grows, or the production header's own sizing.

## Kill criteria on iOS

| Criterion (`product.md` and R08)                                             | iOS Simulator observation                                                                                                                                                        | Trips? |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| Second swipe during settle snaps back, skips or is dropped in more than 1/20 | 0 of 20 each way at the R08 timing (twice). 2 of 20 forward in one of two runs at 50 ms gaps.                                                                                    | No     |
| Diagonal start captured by the vertical owner more often than today          | 0 of 20.                                                                                                                                                                         | No     |
| Second touch during the snap cannot be reconciled without a visible jump     | Reversals, cancelled drags and grab-and-release all land aligned with no jump. Grab-and-release loses the settle event (finding 1): a logic bug with a one-line fix, not a jump. | No     |
| Window shift shows a wrong page, an empty slot or a hop                      | None seen across re-bases. The rotation crossing (finding 5) needs a device recording.                                                                                           | No     |
| Pinch does not win over a drag; focal drift during the pinch                 | Pinch wins and locks both scroll views. The release jump of up to 3 pt (finding 2) comes from the Android-specific revert.                                                       | No     |
| Pinch cannot run simultaneously with both native scroll views                | Recognised alongside both.                                                                                                                                                       | No     |
| P02 thresholds missed by more than 2×                                        | The iOS hitch ratio cannot be measured on the Simulator. The frame-interval stand-in is above 5 ms/s for paging in a Debug build, which is not evidence either way.              | Open   |

Nothing observed on the Simulator trips a kill criterion. Criterion 4 (P02) stays open for iOS until
an Animation Hitches trace on a physical iPhone with a Release build. Kill criterion 4 already holds
on Android (see the Android evidence).

## Still open for a physical iPhone

- Animation Hitches (≤5 ms/s) on a Release build of the spike, on a ProMotion iPhone.
- VoiceOver: R02 7 and R05 1, 4 and 6.
- Hand feel of paging, a grab mid-fling and pinch, including finger-lift order (finding 2).
- iPad split view and Stage Manager resizing during a fling (R02 8).
- A high-frame-rate recording of a rotation during a fling (finding 5).
