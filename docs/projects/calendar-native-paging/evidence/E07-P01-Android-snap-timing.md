# E07 P01 Android rapid-snap diagnosis

Status: **P01 fails on the OnePlus 6.** This file records the earlier 0.9/0.95 diagnosis and its proposal. The owner subsequently authorized a bounded perf-only native prototype; its measured failure and current scope are in [E07 P01 Android native prototype](E07-P01-Android-native-prototype.md). No native repair is accepted for production or release. The measured JavaScript revisions here include the merged Week/Day placement fix from `5201ef6d3ebacdbabf61207120cb0e2eb570e818`. Temporary probes remain on `calendar-paging-p01-diagnostics` and are absent from the release candidate.

## Exact diagnostic identities

| Run | Source commit and change | Perf APK SHA-256 | Device result |
| --- | --- | --- | --- |
| Offset trace | `90a88268e35b0d891db00b795dd52f465b1c7633`; bounded native-touch, drag, crossing and momentum logs | `0dddc92023a6c03fa38ed53f061e4b094e93585d4444908e0e35db056e0b4083` | 20 drags in every scenario; forward +16, back −16 |
| Friction trial | `6680f41a8165a934c4c913aacec0b25830b186df`; Android `decelerationRate=0.95` instead of Android `fast` (0.9) | `55dc925b5e13919f9db68d2c4cb8ffdd6b6a336f2f7df21ba64e50507d53d830` | Same +16/−16 landing; slower rate fails |

Both Android arm64 release perf APKs were built from their exact commits on the PC under WSL with Gradle 9.3.1 and the in-process Kotlin compiler. The first build resumed incrementally after a Kotlin daemon connection stall; the second used the same in-process setting from the start. Each artifact hash matched its transferred file and the installed `base.apk` after `adb install -r`. The app variant was `fr.samuelprak.timecalendar.perf`; testing used the OnePlus 6 on Android 15 at 60 Hz. No app uninstall or data reset occurred. The private raw trace archive has SHA-256 `10cabf53755eaccf52173df69d6f2613ca0700bd1e1f30b2d6bb8e0ea6261720` and is kept outside Git.

## Observed touch, scroll and page sequence

The existing `mobile/perf/run.mjs` scripts used twenty 150 ms forward strokes with 150 ms configured gaps, twenty reverse strokes with the same timing, ten forward/back pairs with 120 ms configured gaps, and twenty 30° diagonal strokes with 1,200 ms configured gaps. The application was started once for the four scenarios in each run. The harness probe did not return a header or canvas value in these runs, so visible title, date and event agreement is **unknown**.

| Measure | Offset trace | Friction trial |
| --- | ---: | ---: |
| Native begin-drag/end-drag pairs, forward/back/reversal/diagonal | 20/20 each | 20/20 each |
| Forward center crossings; final aligned page movement | 16; +16 | 16; +16 |
| Backward center crossings; final aligned page movement | 16; −16 | 16; −16 |
| Reversal center crossings; final observed native offset | 20; origin | 20; origin |
| Diagonal center crossings and settles | 20 and 20 | 20 and 20 |
| Median rapid drag distance; page width | 269 px; about 334 px | 269 px; about 334 px |
| Median extra native offset after forward lift before next begin-drag | 9.6 px in 140 ms | 9.3 px in 143 ms |
| Median extra native offset after backward lift before next begin-drag | 8.8 px in 146 ms | 9.3 px in 145 ms |
| Median diagonal lift-to-momentum-end interval | 267 ms | 266 ms |

The first and last strokes vary because the scroll view starts or finishes on an aligned page. The rapid-chain medians show the mechanism: each accepted drag covers about 0.8 page and its interrupted native snap contributes about 0.03 page before the next drag. Twenty touches therefore move about sixteen pages. With the long diagonal gap, the remaining roughly 83 px completes and all twenty pages settle. The reversed sequence returned to the origin offset in these two runs, but neither produced a new `settle` log when the final index equaled the already settled origin; without a UI probe, exact reversal presentation is unverified. An earlier simultaneous kernel capture on the `151ace57` perf APK recorded all 80 HID down/up pairs across the four scenarios. The two trace APKs did not repeat kernel capture, but their twenty native drag pairs per scenario rule out a missed app-level touch as the cause of these particular +16/−16 results.

Frame histograms in these diagnostic runs do not establish [P02](../product.md): the 99th percentile ranged from 38 to 85 ms across scenarios and neither the gesture windows nor this trace measure the named UI-thread mount and JS-work limits. The long-session, view, heap, accessibility, iOS and owner release gates in [E07 release evidence](E07-release.md) remain open or failed as recorded there.

## Source-level mechanism and limits of inference

React Native 0.85.3 `ReactHorizontalScrollView.java` handles a dragging `ACTION_UP` by emitting end-drag and calling `handlePostTouchScrolling` (lines 830–849). Its `fling` override can call `flingAndSnap` immediately (lines 915–967); the posted momentum runnable can also request `flingAndSnap(0)` after a 20 ms delay (lines 1183–1236). In the interval branch, `disableIntervalMomentum` replaces the predicted position with the current `getScrollX()`, chooses an adjacent snap offset, and asks `OverScroller.fling` to land there (lines 1337–1514). A following `ACTION_DOWN` cancels post-touch work (lines 845–847, 1239–1245), and Android's horizontal scroll owner aborts the active scroller on the new touch. The new gesture thus begins at the observed partial offset.

The app trace records event boundaries and observed offsets; it does **not** record the native target, exact snap start, individual animation frames or the first aborted scroller frame. It cannot say whether the immediate fling, delayed fallback, UI-thread contention or their combination accounts for the small 9 px between touches. The 0.95 trial changed neither the median travel nor the 266–267 ms full-settle interval. Android `fast` maps to 0.9 in React Native 0.85.3 `processDecelerationRate.js`, so the 0.95 trial actually **reduced** OverScroller friction. It rejects only that slower setting; a value below 0.9 that might finish the snap sooner has not been tested. Previous [E04 Android chain experiments](E04-android-chained-swipes.md) also found plain `pagingEnabled` worse, no gesture wrapper harmful to diagonals, and short rest snapping disruptive.

## Smallest native-policy prototype requiring an owner decision

First test an Android-only rate below 0.9 within the existing ScrollView design, measuring both chain landing and native feel; the 0.95 trial did not exercise that direction. If a prop-only rate still fails, prototype only inside React Native's Android horizontal ScrollView interval-snap path, behind the Calendar perf variant first. Instrument `flingAndSnap` with release offset, velocity, chosen target and animation start/end; record `ACTION_DOWN` offset and canceled target, then correlate with the app and kernel traces. If the measured cancellation confirms an incomplete previous target, retain that native pending target when computing the next same-direction or reversed swipe's single-page destination, while animating from the **current visual offset**. Bound the native snap duration so the residual travel keeps up with the 150 ms chain, and cancel it on the next down. The exact hook is `ReactHorizontalScrollView.java` around `flingAndSnap` (lines 1337–1514), `onTouchEvent`/`cancelPostTouchScrolling` (lines 830–849 and 1239–1245), with any duration change confined to `ReactScrollViewHelper`'s native fling animator. Do not substitute a fixed 250 ms `reactSmoothScrollTo` without measurement; the existing plain-paging trial failed more chains.

This changes the React Native dependency's paging policy, so [D01](../decisions/D01-native-scrollview-paging-owner.md) and [D08](../decisions/D08-delivery-gate-and-rollout.md) need an explicit owner decision before a patch. Risks include a backlog that travels multiple pages after a long chain, a reversal that targets an obsolete page, altered fling feel, and conflict with TalkBack, pinch, diagonal arbitration or one-page-per-fling behavior. Reject the prototype if it needs a visible offset jump, accumulates more than one unresolved page, or cannot preserve an immediate reversal from the current visible position. A candidate would need an exact-revision PC APK and repeated forward/back 20/20, reversal, diagonal, short/slow drags, frame and accessibility checks on device. P01 remains **failed** until that evidence exists.
