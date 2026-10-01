# R03 — Rendering and zoom performance model

Scope: the per-frame cost of pinch, the mount cost of pages, the JS cost of a page crossing, and a
measurement plan. Baseline: RN 0.85.3 Fabric, Reanimated 4.3.1, React Compiler on
(`mobile/app.config.ts:225`). Paths are repo-relative; `rea/` = `mobile/node_modules/react-native-reanimated`,
`rn/` = `mobile/node_modules/react-native`.

## 1. What a pinch frame costs today

### Observed facts

- Every pinch update writes `pixelsPerHour` on the UI thread
  (`mobile/src/features/calendar/renderer/owned-calendar-zoom.ts:136`) and `scrollTo`s per frame
  through a reaction (`owned-calendar-zoom.ts:177-183`).
- Every mapper that reads `pixelsPerHour` writes **layout props only** (`top`/`height`):
  - 3 container heights (`owned-calendar-canvas.tsx:204-212`);
  - 23 hour labels, `top` (`:286-295`, `:106-116`);
  - per page: page height (`:412`), clock plane height (`:886`), **49 grid lines** (25 major + 24 minor,
    `:924-942`, counts in `data/time-grid.ts:85-93`), now indicator (`:964`);
  - per tile: **two** mappers, interaction and visual, both `top`+`height` (`:730-758`).
  - Total = 3 + 23 + 3×(2+49) = **179 mappers + 2 per tile**, so a week with 20 tiles/page is ~300
    layout-prop updates per frame; 40 tiles/page is ~420.
- Reanimated has no fast path for these. `PropValueProcessor::layoutProps = {width, height, top, left}`
  (`rea/Common/cpp/reanimated/NativeModules/PropValueProcessor.cpp:12`). The synchronous set is
  opacity/elevation/zIndex/shadow*/colors/border radii/**transform** on Android
  (`ReanimatedModuleProxy.cpp:960-1098`) and the same plus `transform` on iOS (`:1105-1143`). The sync
  path is also **compiled out by default**: `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` and
  `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` are `false` in `rea/src/featureFlags/staticFlags.json`, gated at
  `ReanimatedModuleProxy.cpp:37-46`.
- So each frame: all mappers run on the UI runtime → one `performOperations` (`:668-724`) →
  `commitUpdates` clones the shadow tree along every updated family
  (`ShadowTreeCloner.cpp:61-88`) → `ShadowTree::commit(... mountSynchronously=true)` (`:1200-1210`) →
  Yoga relayout of everything whose `top`/`height` changed, including the ScrollView content →
  `emitLayoutEvents` (`rn/ReactCommon/react/renderer/mounting/ShadowTree.cpp:430,539-552`) →
  a mount pass with one `UpdateLayout` per node.
- Centre-page tiles carry an `onLayout` prop whenever they are accessible
  (`owned-calendar-canvas.tsx:829-839`, the condition does not depend on `onProbeDiagnostic`). Fabric
  emits `onLayout` to JS for every node whose metrics changed and has the prop
  (`ShadowTree.cpp:549-552`). **Every pinch frame therefore dispatches N JS events** (N = centre-page
  tiles), which is per-frame JS work during pinch.
- Android extra: when an event arrives inside a draw pass Reanimated applies only non-layout ops and
  defers the rest to the next frame (`rea/android/.../NodesManager.java:134-142`). Layout-prop pinch
  is therefore structurally one frame behind on Android.
- Minor lines use `opacity: 0.5` (`:1066`); `ReactViewGroup.hasOverlappingRendering()` returns
  `needsOffscreenAlphaCompositing` (`rn/ReactAndroid/.../ReactViewGroup.kt:313`), which is false by
  default, so these are cheap `setAlpha`s, not layers. Fine.

### Inference

The frame is dominated by (shadow clone + Yoga + N `UpdateLayout` mounts + N `onLayout` events),
proportional to ~300-400 nodes, three times over (three pages). This is the documented anti-pattern:
"Animating non-layout properties (like transform, opacity or backgroundColor) is generally more
performant than animating styles that affect layout" and "animate no more than 100 components for
low-end Android devices" ([Reanimated performance guide](https://docs.swmansion.com/react-native-reanimated/docs/guides/performance/)).
No flag fixes this; only moving to `transform` does.

### Feature flags, what they do, how to set them

| Flag | Effect | How here |
| --- | --- | --- |
| Reanimated `ANDROID_/IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` | Non-layout props applied directly to the view (`NativeProxy.java:317`, `REANodesManager.mm:156-168`), bypassing `ShadowTree::commit` and the commit-pausing skip (`ReanimatedModuleProxy.cpp:700-715`). Added 4.0.0 / 4.2.0, default false ([feature flags](https://docs.swmansion.com/react-native-reanimated/docs/guides/feature-flags/)). | `mobile/package.json` → `"reanimated": {"staticFeatureFlags": {...}}`; read by `rea/android/build.gradle:84` and `rea/scripts/reanimated_utils.rb:83` into `-DREANIMATED_FEATURE_FLAGS`. Native rebuild; fingerprint changes. No plugin needed. |
| Reanimated `USE_COMMIT_HOOK_ONLY_FOR_REACT_COMMITS` | Already true (`staticFlags.json`). | nothing |
| Reanimated `DISABLE_COMMIT_PAUSING_MECHANISM` | Stops pausing Reanimated commits after a React commit (`ReanimatedCommitHook.cpp:96-104`); needs RN `preventShadowTreeCommitExhaustion` or React commits starve. | Not recommended: on iOS needs source-built RN core (`ios/Podfile:19` uses prebuilt) or the Experimental level. The sync path makes it moot for transforms. |
| RN `preventShadowTreeCommitExhaustion` | Locks after `MAX_COMMIT_ATTEMPTS_BEFORE_LOCKING` failed commits (`ShadowTree.cpp:286-298`). Only in OSS **Experimental** level (`ReactNativeFeatureFlagsOverridesOSSExperimental.h:46`, Android `..._Experimental_Android.kt:34`), which also enables cxxNativeAnimated, useSharedAnimatedBackend, accessibilityOrder. | `expo-build-properties` `android.reactNativeReleaseLevel` / `ios.reactNativeReleaseLevel` (`node_modules/expo-build-properties/build/pluginConfig.js:168,209`; iOS writes Info.plist `ReactNativeReleaseLevel`, read in `expo/ios/AppDelegates/ExpoReactNativeFactory.swift:17-26`; Android → `BuildConfig.REACT_NATIVE_RELEASE_LEVEL` in the generated `MainApplication.kt`). Too broad for one flag. |
| RN `enableCppPropsIteratorSetter` | Alternative Props construction (`rn/ReactCommon/react/renderer/core/ConcreteComponentDescriptor.h:140`). In no OSS level. | Skip. |
| RN `enableViewCulling` | Does not mount ScrollView subtrees outside the viewport (`mounting/internal/CullingContext.cpp`). | **Harmful here**: offscreen pages and tiles below the fold would mount during the gesture. Keep off. |
| RN `enableViewRecycling(+ForView/Text)` | Android view pools, per-ViewManager opt-in (`ReactViewManager.kt`, `ReactTextViewManager.kt`). iOS already recycles (`RCTComponentViewRegistry.mm:22`, pool 1024). | Android-only, a per-flag override, see below. Low priority. |

Overriding single RN flags: Android needs `ReactNativeFeatureFlags.dangerouslyForceOverride(...)`
(`rn/ReactAndroid/.../ReactNativeFeatureFlags.kt:628`) after `loadReactNative(this)` via a config plugin
on `MainApplication.kt`, because `override` throws once flags were read. iOS has no Swift hook: the
factory calls `ReactNativeFeatureFlags::override` once (`rn/Libraries/AppDelegate/RCTReactNativeFactory.mm:361-376`)
and a second override throws (`ReactNativeFeatureFlagsAccessor.cpp:1656`); it would need an ObjC++
file calling the C++ `dangerouslyForceOverride` before the factory. Not worth it for this project.

## 2. Pinch design without per-frame layout

Options against product §7.2 (focal time stationary, no settle jump, continuous zoom,
`docs/projects/owned-calendar-renderer/product.md:418-430`) and the T03 rejection of unstable
transformed hairlines.

**(a) Transform-only live zoom.** Each line/label/now-rule/tile anchor gets `translateY` instead of
`top`; tile backgrounds get `scaleY` with `transformOrigin: top`; text sits in a sibling that only
translates. Real `top`/`height` are committed once at `onEnd`. All updates are in the sync set on both
platforms (`ReanimatedModuleProxy.cpp:960-1098, 1105-1143`), so with the two flags on there is no
shadow commit, no Yoga, no mount pass, no `onLayout` events per frame. Hairlines: a translation
rounded to device pixels in the worklet (`Math.round(y·r)/r`, `r = PixelRatio.get()`) puts the
hairline on exactly the pixel row layout would have, so the raster is identical; the rejected
instability comes from fractional translation and scaled thickness, both avoided. Tradeoffs: tile text
clipping is stale during the pinch (it reflects settled height); the visual-vs-interaction split
(`:730-758`) collapses to one animated view per tile with the hit-target expansion committed at the
end only; tile `borderRadius: 2` and `borderWidth: 2` scale vertically by the pinch ratio (invisible at
these sizes). Mapper count per frame: 1 + 23 + 49 (shared) + 1 + N tiles on the visible page only.

**(b) Container `scaleY` + counter-scaled text.** Fewest transforms (1 + texts) but every hairline is
scaled: thickness 0.38 px × s on a 2.625-density device is exactly the rejected artefact, and
counter-scaled glyphs re-rasterise at fractional scales each frame (shimmer). Reject.

**(c) Quantised steps via React state.** Each step is a React render plus a Fabric commit of the whole
window (≈500-1300 views, §4) on the JS thread: a visible hitch and a focal jump per step, which §7.2
forbids ("without a perceptible settle jump or drift") and "continuous within the measured bounds"
forbids snapping. Reject as the live mechanism.

**(d) Layout animation, fewer nodes.** Sharing the grid and dropping the second tile mapper leaves
~75 + N layout nodes per frame, still a clone + Yoga + mount per frame and still one frame behind on
Android. Might reach 30 fps on OnePlus 6; not deterministic. Reject.

**Pick: (a), with exactly one layout prop per frame.** The ScrollView content height must track the
live scale or the focal-preserving `scrollTo` is clamped; keep **one** animated `height` on the
page-stack container (gutter and pages `absoluteFill` inside it). One node with no laid-out
descendants is a cheap commit. The horizontal content width is constant (pages × width) and never
animates. Keep the existing focal math untouched. Verify the per-frame order "height commit before
`scrollTo`" on Android (`dispatchCommand` is queued as a mount item, `ReanimatedModuleProxy.cpp:1214-1235`);
if the bottom edge jitters, pre-size the container to the `MAX_PIXELS_PER_HOUR` height and animate a
bottom spacer instead.

Known sync-path risks to test, not assume: styles dropped when animated props change
([#8810](https://github.com/software-mansion/react-native-reanimated/issues/8810)); sync props after a
React commit mount ([#10631](https://github.com/software-mansion/react-native-reanimated/pull/10631),
post-4.3.1); the docs' note that the Android flag "impacts touch gesture behavior" (hit testing uses
the shadow tree, which is why the end-of-pinch layout commit is mandatory).

## 3. The shared grid layer

- Today: 49 line views + clock plane + 8 column views **per page** (`:886-943`), i.e. 174 views for 3
  pages, 290 for 5. Hour lines are horizontal, full-width and identical on every page, so one layer
  behind the pages saves 49×(pages−1)+pages views: **98 (3 pages) / 196 (5 pages)**.
- Day separators are per-column borders (`:1040`). They slide horizontally with the page content;
  a shared, viewport-fixed copy would stand still under a drag. Keep them in pages (7 border views, no
  mapper). Same for the now-indicator: today's column only, per page (`:909-919`).
- Pages must become transparent: drop `backgroundColor: theme.backgroundElement` (`:427`) and paint
  the surface once on the shared layer or the row. Z-order is layer < pages < tiles, all inside the
  vertical ScrollView content, so vertical scroll moves them together and pinch applies the same
  rounded `translateY` to the 49 lines.
- One-view alternative: `experimental_backgroundImage` with `experimental_backgroundSize: ['100% <pph>px']`
  and `experimental_backgroundRepeat: ['repeat-y']` is implemented natively on both platforms
  (Android tiles `drawRect` per repeat, `rn/ReactAndroid/.../BackgroundImageDrawable.kt:135-257`; iOS
  uses `CAReplicatorLayer`, `rn/React/Fabric/Utils/RCTBackgroundImageUtils.mm:47-101`). Two blockers:
  Reanimated's style builder marks all three props `false // TODO`
  (`rea/src/common/style/config.ts:195-201`), so the tile height cannot be animated during pinch, and
  a hard-stop gradient cannot express a 0.38-px hairline at a fractional tile height (`hairlineWidth`
  is `roundToNearestPixel(0.4)`, `rn/Libraries/StyleSheet/StyleSheetExports.js:97`). Keep as a
  settled-state optimisation only if the settled scale is integer-snapped; not now. `react-native-svg`
  and Skia are not installed.

## 4. Page mount cost on Fabric/Android

Views per week page today (7 columns, N tiles, `__DEV__` preview excluded):

| Part | Views |
| --- | --- |
| Page root | 1 |
| Grid: clock plane + columns wrapper + 7 columns + 49 lines + now (3) | 61 |
| Tiles wrapper + 7 columns | 8 |
| Per tile: anchor, Pressable, visual, title Text, location Text (≥40 px), checklist (View+SymbolView+Text, ≥60 px), + `CalendarFocusObserverView` on the centre page | 4-8 |
| Header slot per page: 7 cells × (cell, Text, badge, Text) | 28 |
| **Total** | **≈100 + 5N** (N=20 → 200; N=40 → 300) |

Three pages with 20 tiles each ≈ 600 views, fully remounted on every settle because of the pager key
(`:301`). What makes a mount expensive:

- **Text**: a `ReactTextView`, a Spannable, and a C++→JNI measure (`TextLayoutManager`) per node;
  `adjustsFontSizeToFit` (header weekday `owned-calendar-header.tsx:107`, checklist count
  `checklist-progress-indicator.tsx:76`) measures iteratively (`rn/ReactCommon/.../BaseParagraphProps.cpp`,
  `RCTTextLayoutManager.mm`). Header: 7 of 14 Texts per slot fit-to-size for one letter.
- **Pressable**: JS-side Pressability plus responder props; an a11y label/role per tile is set as
  contentDescription/delegate. Moderate.
- **`overflow: hidden` + `borderRadius: 2`** on every tile visual (`:1080-1088`): a clip path on each
  draw, paid on every scroll frame, not just at mount.
- **`CalendarFocusObserverView`** per centre-page tile: an Expo `ExpoView` (`modules/calendar-focus-observer/android/.../CalendarFocusObserverView.kt`)
  through Expo's Fabric wrapper, three props via `Prop` closures; on iOS each instance registers an
  `NSNotificationCenter` observer in `didMoveToWindow` (`ios/CalendarFocusObserverView.swift:15-25`).
  One observer per page (or per canvas) that matches the focused element's tag is enough.
- **`onLayout` probes** on every centre-page tile (`:829-839`) emit a JS event per layout change.
- **Two animated views per tile** register two mappers and two view descriptors.

Budget (binding for design, to be confirmed by `dumpsys meminfo` Views count, §6):

- per page ≤ 120 views and ≤ 40 Text nodes at 24 tiles (≈ 3 views/tile: anchor+Pressable merged,
  background, title; location/checklist only when the settled tile is tall enough, as today);
- window ≤ 5 pages, ≤ 700 views mounted, ≤ 1 page mounted per crossing;
- a page mount ≤ 12 ms UI thread on OnePlus 6 (one 60 Hz frame with margin), so the inevitable
  hitch at a window shift is at most one frame; shift the window at crossing when the user is within
  one page of the edge, otherwise at settle, so most mounts land on an idle thread.

## 5. JS cost at a page crossing

- Chain today: `onPageSelected` → idle → `settleSelectedPage` → `onTransitionSettled`
  (`owned-calendar-coordinator.ts:343-396`) → controller state → generation++ → range replan,
  snapshot, **two** `buildCalendarTimelinePresentation` passes (`data/timeline-presentation-hook.ts:63-85`)
  → canvas render → pager remount → full mount of three pages.
- Formatting on the React render path: 3 `formatInTimeZone` per header cell (`owned-calendar-header.tsx:75-84`)
  × 7 × pages; `eventLabel` = `formatTimeRange` (2 `formatInTimeZone`) + `t()` per tile
  (`owned-calendar-canvas.tsx:759`), again per chooser row. `formatInTimeZone` tokenises through
  date-fns with a cached `Intl.DateTimeFormat` per zone (`node_modules/date-fns-tz/dist/esm/_lib/tzTokenizeDate/index.js:54-71`).
- Measured on this Mac (V8, warm, `node` with `mobile/node_modules`): `formatTimeRange` 7.7 µs,
  a header cell 11.5 µs, a cached `Intl` pair 1.2 µs. Hermes has no JIT; a 3-10× factor on OnePlus 6
  (inference) puts 100 tile labels + 35 header cells at roughly 3-10 ms per crossing. Not the
  bottleneck, but it must not run under the gesture.
- React Compiler: on (`app.config.ts:225`), but memoisation cannot help a keyed remount; it only
  helps once pages are keyed by index and kept mounted. `pages.map` closures (`:316-339`) and
  `onPress={() => ...}` per tile (`:568`) are compiler-memoised only if the component is not bailed
  out; the `ref` callbacks (`:809-812`, header `:89-92`) and inline worklets are the likely bail-out
  points to check with `npm run react-doctor` (script in `mobile/package.json`).

Recommendations: compute labels in the presentation builder (per tile `label`, `timeRange`; per column
`weekday`, `narrowWeekday`, `dayOfMonth`) keyed by `(uid, zone, locale)` with a small LRU; replace
`formatInTimeZone` on hot paths with cached `Intl.DateTimeFormat` instances (same seam, `data/format.ts`);
build the presentation per page keyed by page index and cache it in a `Map` so a crossing builds only
the one new page; one presentation pass, not two (fold checklist progress in by uid).

## 6. Measurement plan without a Mac build

Android, release APK (EAS or the existing release-config dev-variant e2e build), OnePlus 6 at 60 Hz:

- `adb shell dumpsys gfxinfo fr.samuelprak.timecalendar reset`, run a scripted gesture (Maestro flow
  or `adb shell input swipe` sequences), then `... gfxinfo <pkg> framestats`: per-frame timeline →
  compute p50/p95/p99 total frame time, janky %, longest frame.
- Perfetto: `adb shell perfetto -c - --txt -o /data/misc/perfetto-traces/cal.pftrace` with
  `linux.ftrace` (sched, gfx, view, input, hwui, freq), `android.surfaceflinger.frametimeline`,
  `linux.process_stats`, `atrace_apps: fr.samuelprak.timecalendar`. RN Java sections reach
  `android.os.Trace` (`rn/ReactAndroid/.../systrace/Systrace.kt:42-48`); Reanimated C++ sections need
  `ext.enableReanimatedProfiling = true` (`rea/android/build.gradle:102`) via a config plugin on the
  project `build.gradle` in the perf build only; a non-debuggable build needs `<profileable android:shell="true"/>`.
  Assertions: zero `FabricUIManager` commit/mount sections and an idle `mqt_js` thread during pinch
  and fling; one mount section per crossing.
- `adb shell dumpsys meminfo <pkg>` → "Views:" count before/after opening Calendar and after the
  30-minute stress run (§13 resource bound).
- JS attribution in release: `performance.mark/measure` around crossing work, logged to logcat in the
  perf build; Hermes sampling profiler needs the dev client and is a secondary check.

iPhone without a Mac: TestFlight build + MetricKit subscriber in the perf build reading
`MXAnimationMetric.scrollHitchTimeRatio` and hang histograms; the on-device Performance HUD
(Settings → Developer) for live FPS/hitches. Instruments (Core Animation hitches) remains the final
pass and needs a Mac.

Acceptance proposal against product §13 (`product.md:684-700`) and P05 devices
(`research/technical-acceptance-plan.md:52-53`; OnePlus 6 is a proxy, not a listed floor):

| Scenario | Threshold (OnePlus 6, 60 Hz) | Galaxy A16 5G (90 Hz) |
| --- | --- | --- |
| 3 s pinch | ≥95% frames ≤16.7 ms, none >33 ms, 0 React commits, 0 JS events | same ratios at 11.1 ms |
| Fling across 5 pages | janky ≤5%, p99 ≤33 ms, ≤1 frame >16.7 ms per crossing | same at 11.1 ms |
| Page mount | ≤12 ms UI thread | ≤8 ms |
| Crossing JS | ≤8 ms `mqt_js` | ≤6 ms |
| Views | ≤700 for the 5-page window; ±50 after 30 min | same |
| iOS | hitch ratio ≤5 ms/s during pinch and fling | SE 3 and 15 Pro |

## Recommendations for design

1. Enable `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` and `IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS` in
   `mobile/package.json`; leave every RN core flag at the Stable level.
2. Live pinch = transforms only (pixel-rounded `translateY`, tile background `scaleY`), one animated
   `height` on the page-stack container, real layout committed at `onEnd`; one animated view per tile;
   only the visible page's tiles update per frame.
3. Shared hour-line layer (49 views total), transparent pages, separators and now-rule stay per page.
4. Remove per-tile `onLayout` from the production path; one focus observer per page.
5. Per-page presentation cache keyed by page index; labels precomputed; one builder pass.
6. Window shift at crossing only near the edge, else at settle; view budget 120/page, 700/window.
7. Perf build variant (profileable, Reanimated profiling) and the §6 scripts before the first
   implementation PR, so numbers exist for the ADR.

## Questions for the owner

1. During a pinch, is stale text clipping inside tiles (text may overhang a shrinking tile until the
   finger lifts) acceptable, or must labels fade out below a readable height during the gesture?
2. Is the OnePlus 6 the agreed Android proxy until the Galaxy A16 5G exists (PL-003), with the
   thresholds above provisionally binding on it?
3. Does the per-tile focus observer have a reason to stay per tile (focus matching by identity) that
   a per-page observer would break?
