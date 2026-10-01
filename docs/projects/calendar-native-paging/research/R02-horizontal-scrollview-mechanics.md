# R02 — Horizontal ScrollView as the paging owner (RN 0.85.3 Fabric)

Legend: **[F]** observed in source/docs · **[I]** inference · **[Q]** open question. Paths are repo-relative; `rn/` = `mobile/node_modules/react-native`, `rea/` = `mobile/node_modules/react-native-reanimated`, `rngh/` = `mobile/node_modules/react-native-gesture-handler`.

**Verdict:** a native horizontal `ScrollView` nested in the existing vertical one can own paging on both platforms. iOS is UIKit paging with no caveats. Android pagination is RN's own re-implementation on top of `HorizontalScrollView`, and its two configurations trade physics against integer-pixel hygiene. Settle detection, large offsets and initial positioning have well-defined but platform-divergent rules; all are designable without native code. Nothing found disproves the candidate; the risks are precision/rounding and the Android settle animation, both retirable in a device spike.

## 1. Paging semantics

### iOS [F]
- `pagingEnabled` maps 1:1 to `UIScrollView.pagingEnabled` (`rn/React/Fabric/Mounting/ComponentViews/ScrollView/RCTScrollViewComponentView.mm:356`). Apple: "the scroll view stops on multiples of the scroll view's bounds when the user scrolls" ([isPagingEnabled](https://developer.apple.com/documentation/uikit/uiscrollview/ispagingenabled)). UIKit paging only ever targets an adjacent page; a fast fling cannot cross two pages. This satisfies product §6.1 ("one swipe or fling settles only one page") by construction.
- Mid-deceleration touch: UIKit stops the deceleration and the new drag continues from the current offset; this is native UIScrollView behaviour, nothing in RN interposes (the Fabric view only observes delegate callbacks, `:737-832`).
- `snapToInterval` on iOS is implemented by RN in `scrollViewWillEndDragging` (`RCTEnhancedScrollView.mm:246-289`): it rewrites `targetContentOffset` to `ceil/floor/round(fractionalIndex)`. With `disableIntervalMomentum` it uses the *current* offset instead of UIKit's predicted target (`:261`), so velocity > 0 always lands on the very next interval. Without it, a fast fling can cross several intervals. RN JS disables `pagingEnabled` on iOS when `snapToInterval` is set (`rn/Libraries/Components/ScrollView/ScrollView.js:1813-1817`).
- `decelerationRate` maps to `UIScrollView.decelerationRate` (`:350`). With `pagingEnabled`, UIKit uses its own paging deceleration and the rate is effectively ignored. [I]

### Android [F]
`pagingEnabled`, `snapToInterval`, `disableIntervalMomentum` are all RN code in `rn/ReactAndroid/src/main/java/com/facebook/react/views/scroll/ReactHorizontalScrollView.java`:
- `fling(velocityX)` with paging → `flingAndSnap` (`:932-933`). Two branches:
  - **No `snapToInterval`** → `smoothScrollAndSnap` (`:1332-1334`, `:1267-1320`): computes `currentPage/nextPage/previousPage` from `getSnapInterval()` = `getWidth()` **in integer px** (`:1056-1061`), moves at most one page, then `reactSmoothScrollTo` → `ReactScrollViewHelper.smoothScrollTo` → `startFlingAnimator` = `ObjectAnimator.ofInt(scrollX)` with the OverScroller default duration (250 ms, `ReactScrollViewHelper.kt:64,212-221`) and the default `AccelerateDecelerateInterpolator` (`:1773-1787`, `:1805-1811`). **Fixed 250 ms ease, not velocity-matched physics.** This is the "instant page change on fast swipe" family of reports (#20155 below).
  - **With `snapToInterval`** → interval branch (`:1337-1515`): predicts the OverScroller end point (`predictFinalScrollPosition`, `ReactScrollViewHelper.kt:492-533`), picks `smaller/largerOffset` around it (`:1426-1430`), and with `disableIntervalMomentum` replaces the prediction with `getScrollX()` (`:1340-1342`) so velocity > 0 targets `ceil(scrollX/interval)` = exactly the next page. Settles with `mScroller.fling(min = max = target)` to get real fling easing (`:1486-1514`), with a velocity boost for slow swipes (`:1458-1476`). This branch is the one that feels like physics.
- `decelerationRate` → `OverScroller.setFriction(1 − rate)` (`:333-339`); affects both prediction and settle.
- Mid-fling touch: AOSP `HorizontalScrollView.onTouchEvent(ACTION_DOWN)` aborts the OverScroller ([AOSP](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/widget/HorizontalScrollView.java)); RN additionally cancels the post-touch runnable and the ObjectAnimator (`:845-847`, `:1239-1245`). The next fling starts from `getNextFlingStartValue` which honours an unfinished animation target (`ReactScrollViewHelper.kt:305-327`), so rapid repeated swipes chain one page each. [I] Rapid swipes should work; the 250 ms animator path cancelling on every DOWN is the thing to watch visually.

**Recommendation:** iOS `pagingEnabled`; Android `snapToInterval={pageWidth}` + `disableIntervalMomentum` + `decelerationRate="fast"` (RN JS turns `pagingEnabled` on for Android automatically, `ScrollView.js:1818-1821`). Spike must compare feel against plain `pagingEnabled` on Android.

## 2. Events and settle detection

### iOS [F] (`RCTScrollViewComponentView.mm`)
- `onScroll` every `scrollViewDidScroll` when `scrollEventThrottle ≤ 16 ms` (`:377-390`, `:743-751`); throttle resets on every drag/momentum boundary (`_forceDispatchNextScrollEvent`).
- Order: `onScrollBeginDrag` (`:778`) → `onScrollEndDrag` with `velocity` + `targetContentOffset` (`:710-728`; emitted from `willEndDragging`, i.e. *before* `didEndDragging`) → `onMomentumScrollBegin` (`:808`) → `onMomentumScrollEnd` (`:819`).
- **No momentum-end when the finger lifts without deceleration** (`:800-805`). With paging this only happens if the lift is exactly on a page boundary. [I]
- Programmatic: non-animated `scrollTo` emits `onScroll` + `onMomentumScrollEnd` synchronously (`:1028-1032`, `:862-873`); animated emits `onMomentumScrollEnd` from `scrollViewDidEndScrollingAnimation` (`:834-837`). Removal from window emits a synthetic momentum end (`:839-860`).

### Android [F]
- `onScroll` from `onScrollChanged`, deduped at 10 ms (`OnScrollDispatchHelper.kt:33-45`), throttled only if `scrollEventThrottle ≥ 17` (`ReactScrollViewHelper.kt:115-124`).
- `onScrollBeginDrag` on intercept (`:750-759`); `onScrollEndDrag` + `handlePostTouchScrolling` on every `ACTION_UP` while dragging (`:830-843`).
- Momentum events exist only if `sendMomentumEvents` is true; RN JS sets it when `onMomentumScrollBegin/End` props exist (`ScrollView.js:1801-1804`). `handlePostTouchScrolling` emits `MOMENTUM_BEGIN` on every touch-up, fling or not (`:1183-1185`), and `MOMENTUM_END` after 3 stable 20 ms frames (`:1215-1219`). **So no, momentum-end is not missing without a fling on Android** — it fires ~60 ms after the view stops. The `reactSmoothScrollTo` path additionally emits begin/end from the animator (`:1789-1796`), so a paging settle can yield two momentum-end events. [I]
- Programmatic: non-animated `scrollTo` command → `scrollTo(x,y)` → `onScroll` only, no momentum events (`ReactHorizontalScrollViewManager.kt:237-244`, `:1617-1625`). Animated → animator-driven momentum begin/end.
- TalkBack `ACTION_SCROLL_FORWARD/BACKWARD` calls AOSP `smoothScrollTo(scrollX ± viewportWidth)` ([AOSP](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/widget/HorizontalScrollView.java)), bypassing RN's snapping and post-touch runnable: `onScroll` events only, no momentum-end, and the target is page-aligned only because viewport width = page width.

### Settle rule (design) [I]
Platform-agnostic: **settled ⇔ `contentOffset.x` is page-aligned (|x − i·w| < ε) ∧ not dragging ∧ no momentum in flight**, evaluated on the UI thread from `onScroll`, `onEndDrag` (iOS: compare `targetContentOffset` to current), and `onMomentumEnd`. Do not rely on momentum-end alone (iOS lift-on-boundary, Android TalkBack). Keep a `dragging` shared value from begin/end-drag. Use the same rule for programmatic and accessibility scrolls.

## 3. Large content, initial offset, re-base

- Fabric layout is **float32**: Yoga stores dimensions/positions as `float` (`rn/ReactCommon/yoga/yoga/node/LayoutResults.h:57-77`), rounding to the pixel grid in double but returning float (`yoga/algorithm/PixelGrid.cpp:15-20`). Float32 ULP: 182 000 pt → 0.016; 1.28 M → 0.125; 3.65 M → 0.25; 11 M px → 1.0. [F]
- Android scroll positions are **integer px** (`scrollX`, `computeHorizontalScrollRange`); the `scrollTo` command rounds dp→px (`ReactScrollViewCommandHelper.kt:73-74`), `contentOffset` prop truncates (`ReactHorizontalScrollViewManager.kt:386-395`, `.toInt()`), `snapToInterval` truncates (`:125-130`). Fling clamp is `Integer.MAX_VALUE` (`:954`); no Android view-size limit is hit at ~10 M px unless a hardware layer is forced on the content view. [F] iOS `CGFloat` is double; UIKit has no practical limit. [F]
- **Consequence [I]:** ±5 years of weeks (520 × 350–1000 pt ≤ 520 k pt, ULP ≤ 0.03) is safe. ±5 years of days (3650 × up to 1000 pt = 3.65 M pt; 11 M px on 3×) is not: page origins lose sub-pixel precision and Android integer snapping diverges from Yoga-rounded child origins. Keep the content width below ~2^20 pt (~1 M): e.g. ±5 years of weeks, or ±1 year of days, and **re-base**.
- Initial offset: iOS sets `contentOffset` in `updateProps` before `contentSize` arrives (`:404-406`, `:484-495`); UIKit does not clamp a programmatic offset, so the first frame is already positioned. Android parks the value as a pending offset applied in `onLayout` once content is ready (`:536-545`, `:1646-1658`). **Both paths pre-position before first draw** — pass `contentOffset={{x: initialIndex·w}}` and verify the no-jump claim on device (#33221 reports FlatList jumps on iOS; the plain ScrollView path above is different). [F]/[Q]
- Re-base design [I]: when the settled index comes within `K` pages of either edge, at settle (not mid-motion), (1) shift the window's logical origin by Δ pages, (2) re-render the window at the same *visual* positions, (3) `scrollTo({x: x − Δ·w, animated: false})` in the same commit. iOS emits `onScroll` + momentum-end for that scrollTo (`:1028-1032`); Android emits `onScroll`; the settle rule must ignore the re-base offset by comparing against a `rebaseEpoch` shared value. `maintainVisibleContentPosition` is not usable: it anchors to the first visible *child* (`:1052-1124`) and both platforms clamp-then-adjust ([#58578](https://github.com/facebook/react-native/issues/58578)).

## 4. Fractional page widths

- Android pages in integer px (`getWidth()`; `snapToInterval` truncated; `scrollTo` rounded). Yoga rounds each child origin `i·w` to the pixel grid independently. If `w·density` is not an integer, `i·trunc(w·density)` and `round(i·w·density)` drift by up to 1 px per page (≈500 px over 500 pages). [F]/[I]
- iOS pages by `bounds.width` exactly; Yoga positions are pixel-rounded; drift is bounded by float32 ULP only. [F]
- **Rule:** `pageWidth = round((viewportWidth − gutter) · scale) / scale` (physical-pixel aligned), give the horizontal ScrollView that exact width, position pages at `i·pageWidth`, and pass `snapToInterval = pageWidth + 1e-3` on Android to defeat `.toInt()` truncation of `935.9999`. Spike must assert `scrollX % widthPx === 0` after 50 pages.

## 5. Nesting and gesture coexistence

- Current tree: `Animated.ScrollView` (vertical, `directionalLockEnabled`, `nestedScrollEnabled`, `scrollEventThrottle=16`) → `AnimatedPagerView` keyed by `${generation}:${geometryRevision}` (`mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx:215-345`). The pinch (`owned-calendar-zoom.ts:84-175`) is composed with `Gesture.Native()` wrappers for both scroll owners (`owned-calendar-coordinator.ts:208-229`). The coordinator notes RNGH iOS mirrors state only for RN ScrollViews, not PagerView (`:315-317`) — a horizontal RN ScrollView removes that asymmetry. [F]
- iOS [F]: RNGH's `Gesture.Native` becomes a dummy recognizer whose state mirrors the UIScrollView pan (`rngh/apple/Handlers/RNNativeViewHandler.mm:101-112`), resolved through `RCTScrollViewComponentView.scrollView` (`rngh/apple/RNGestureHandler.mm:609-616`), so `simultaneousWithExternalGesture(pinch)` works for the horizontal ScrollView exactly as it does for the vertical one today. Nested orthogonal UIScrollViews arbitrate natively; `directionalLockEnabled` on *both* keeps a diagonal drag on one axis ([directionalLockEnabled](https://developer.apple.com/documentation/uikit/uiscrollview/isdirectionallockenabled)). [I] Lock is decided by the first few points of the inner pan; it is the same UIKit behaviour as PagerView-in-ScrollView and is not a regression.
- Android [F]: arbitration is AOSP touch-slop racing. Inner `HorizontalScrollView` drags when `xDiff > slop` and calls `requestDisallowInterceptTouchEvent(true)`; outer `ScrollView` intercepts when `yDiff > slop && (nestedScrollAxes & VERTICAL) == 0` ([AOSP ScrollView](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/main/core/java/android/widget/ScrollView.java)). RN's `ReactScrollView.onInterceptTouchEvent` adds nothing (`ReactScrollView.java:605-626`); `ReactHorizontalScrollView` additionally refuses the DOWN if a deeper nested-scroll-enabled horizontal view exists (`:719-729`), irrelevant here. `nestedScrollEnabled` on the **inner** horizontal view only sets `ViewCompat.setNestedScrollingEnabled` (`ReactHorizontalScrollViewManager.kt:206-211`); AOSP `HorizontalScrollView` does not implement `NestedScrollingChild`, so it changes nothing for axis arbitration ([#21436](https://github.com/facebook/react-native/issues/21436)). One axis still wins per gesture (whichever slop breaks first), which meets product §9. [I]
- RNGH `NativeViewGestureHandler` on Android drives the view via `onInterceptTouchEvent`/`onTouchEvent` (`rngh/android/.../NativeViewGestureHandler.kt:94-151,199`), recognizes `ReactHorizontalScrollView` (`:88`), and `shouldRecognizeSimultaneously` honours `simultaneousHandlers` (`:45-78`). Works for both axes.
- **RN `Animated.ScrollView` vs RNGH `ScrollView`:** RNGH's wrapper is `createNativeWrapper(RNScrollView, {disallowInterruption: true, shouldCancelWhenOutside: false})` (`rngh/src/components/GestureComponents.tsx:38-43`) — the same `Gesture.Native` the code already builds by hand, plus `disallowInterruption`, which would *prevent* the pinch from interrupting a started pan. Keep `Animated.ScrollView` + explicit `Gesture.Native().simultaneousWithExternalGesture(pinch)`; `useAnimatedScrollHandler` needs the Reanimated component anyway.

## 6. Reanimated 4.3.1 on the UI thread

- `useAnimatedScrollHandler` subscribes to `onScroll` and, only when handlers are given, `onScrollBeginDrag/EndDrag/MomentumScrollBegin/End` (`rea/src/hook/useAnimatedScrollHandler.ts:63-76`). `createAnimatedComponent` injects a dummy JS listener prop for every subscribed event name (`rea/src/createAnimatedComponent/PropsFilter.tsx:76-87`), which is what flips RN's `sendMomentumEvents` on Android (`ScrollView.js:1801-1804`). The historical "onMomentumEnd never fires on Android" ([#5416](https://github.com/software-mansion/react-native-reanimated/issues/5416), [#2735](https://github.com/software-mansion/react-native-reanimated/issues/2735)) is therefore covered by current code; spike should still confirm. [F]/[Q]
- Events reach worklets via the native event dispatcher (`rea/android/.../NodesManager.java:86,204`; C++ `ReanimatedModuleProxy::handleEvent`, `Common/cpp/.../ReanimatedModuleProxy.cpp:538-545`), never touching JS.
- Pattern (already used by the zoom): `useAnimatedReaction` + `scheduleOnRN` once per change (`owned-calendar-zoom.ts:102,151,177-183`). Header strip: `translateX = −(x − base)` in `useAnimatedStyle`, replacing `pager-page-scroll.ts:87-93`. Page-index crossing: `const i = Math.round(x / w); if (i !== lastIndex.get()) { lastIndex.set(i); scheduleOnRN(onIndexCrossed, i) }` inside `onScroll` — one RN call per crossing, zero per frame.
- Programmatic paging from the UI thread: `scrollTo(ref, x, 0, animated)` dispatches the native `scrollTo` command (`rea/src/platformFunctions/scrollTo.ts:28-36`), which is clamped to content bounds on iOS (`RCTScrollViewComponentView.mm:924-949`) and animated on Android via the 250 ms animator (`ReactHorizontalScrollViewManager.kt:237-244`).

## 7. Resize / rotation / split view [I]

Width change ⇒ `w` changes ⇒ every page origin and the current offset change. At `onLayout`: recompute `pageWidth`, re-render the window at `i·w'`, and `scrollTo({x: index·w', animated: false})` in the same layout effect; mark the frame with a geometry epoch so the settle rule and the header reaction ignore the synthetic `onScroll`. Android's `onLayout` re-applies the pending offset (`:536-545`) and has a measure/layout fling-reset hack (`:499-534`), so an in-flight fling during rotation is cancelled natively; iOS keeps `contentOffset` and may reveal a half page until the `scrollTo` lands — must be the same commit.

## 8. Accessibility (brief)

- iOS: VoiceOver three-finger swipe uses UIScrollView's built-in page scroll (bounds-sized), landing on a page boundary; completion arrives through `scrollViewDidEndScrollingAnimation` → `onMomentumScrollEnd` (`:834-837`). [I] The existing `adjustable` increment/decrement actions (`owned-calendar-canvas.tsx:236-261`) remain the primary path.
- Android: `isScrollable` exposed (`ReactScrollViewAccessibilityDelegate.kt:135-137`); TalkBack scroll uses AOSP `smoothScrollTo(±viewportWidth)` with no RN snapping or momentum events (§2). RNGH's native handler short-circuits under TalkBack for buttons only (`NativeViewGestureHandler.kt:97-105`). Keyboard arrow paging exists only with `pagingEnabled` (`:786-815`).

## 9. GitHub issues (facebook/react-native)

- [#20155](https://github.com/facebook/react-native/issues/20155) Android `pagingEnabled` "instant" page change on fast fling (closed/locked; the 250 ms animator path in §1 is the current mitigation).
- [#21643](https://github.com/facebook/react-native/issues/21643) Android snap fling speed/last-item bugs (closed; snap branch rewritten since).
- [#33925](https://github.com/facebook/react-native/issues/33925) Android `onScroll` jerky during paging snap (stale/closed, no fix).
- [#34327](https://github.com/facebook/react-native/issues/34327) Fabric iOS `scrollTo` emitting `onScroll` on identical offsets (fixed; `scrollToOffset` now early-returns, `:1020-1022`).
- [#21436](https://github.com/facebook/react-native/issues/21436) `nestedScrollEnabled` ineffective for horizontal (open, by design per AOSP).
- [#58578](https://github.com/facebook/react-native/issues/58578) `maintainVisibleContentPosition` clamp bug (open; reason not to use it for re-base).
- [#33221](https://github.com/facebook/react-native/issues/33221) iOS initial `contentOffset` jumps (FlatList; plain ScrollView path differs, verify).
- [#55090](https://github.com/facebook/react-native/issues/55090) iOS recycled ScrollView keeps `contentOffset` (fixed in 0.85: `prepareForRecycle` resets, `:676-706`).
- No open Fabric-0.8x issue specific to horizontal `pagingEnabled` was found.

## Component sketch

```tsx
<Animated.ScrollView               // RN component, Reanimated-wrapped
  ref={pagerRef}                   // useAnimatedRef
  horizontal
  pagingEnabled                    // iOS owner
  snapToInterval={isAndroid ? pageWidth + 1e-3 : undefined}
  disableIntervalMomentum
  decelerationRate="fast"
  directionalLockEnabled           // both axes
  bounces={false} overScrollMode="never"
  showsHorizontalScrollIndicator={false}
  scrollEventThrottle={16}
  contentOffset={{ x: initialIndex * pageWidth, y: 0 }}
  contentContainerStyle={{ width: pageCount * pageWidth }}
  onScroll={scrollHandler}         // onScroll + onBeginDrag + onEndDrag + onMomentumBegin + onMomentumEnd
  style={{ width: pageWidth }}     // = round((viewport − gutter)·scale)/scale
  accessible accessibilityRole="adjustable" accessibilityActions={…} onAccessibilityAction={…}
>
  {window.map(i => <Page key={i} style={{ position: 'absolute', left: i * pageWidth, width: pageWidth }} />)}
</Animated.ScrollView>
```
Wrapped in `<GestureDetector gesture={Gesture.Native().simultaneousWithExternalGesture(pinch)}>`. Shared values: `offsetX`, `dragging`, `momentum`, `lastIndex`, `geometryEpoch`. Reactions: header `translateX`; `onIndexCrossed(i)` via `scheduleOnRN`; `onSettled(i)` via the §2 rule.

## Residual risks the device spike must retire

1. Android settle feel: `snapToInterval+disableIntervalMomentum` physics vs `pagingEnabled` 250 ms ease; and whether rapid DOWN cancels mid-animation without a visible stutter (OnePlus 6).
2. Integer-pixel hygiene: `scrollX % widthPx === 0` after 50+ pages on a 2.75× density device; page seams at 1 px.
3. iOS first frame at `contentOffset.x = initialIndex·w` with no visible jump; Android `onLayout` pending-offset path with absolutely positioned children.
4. Re-base jump-free (`scrollTo` non-animated at settle) with the synthetic `onScroll`/momentum-end filtered.
5. Momentum-end delivery on Android through Reanimated (dummy-listener mechanism) and double momentum-end tolerance.
6. Diagonal arbitration with both `directionalLockEnabled` and the pinch simultaneous; lift-on-boundary settle on iOS.
7. VoiceOver three-finger paging and TalkBack scroll settling via the aligned-offset rule.
8. Rotation / iPad split-view width change during a fling.

## Recommendations for design

- Adopt the horizontal `Animated.ScrollView` with the §1 platform config; keep `Gesture.Native` composition, drop RNGH `ScrollView`.
- Bound content width below ~1 M pt and re-base at settle (§3); never use `maintainVisibleContentPosition`.
- Pixel-align `pageWidth` and page origins (§4); make the horizontal view's own width equal the page width so Android `getWidth()` paging is exact.
- Settle = aligned-offset ∧ ¬dragging ∧ ¬momentum, with epochs for geometry and re-base (§2, §7).
- UI-thread only: header translate, index-crossing `scheduleOnRN`, settle `scheduleOnRN`.

## Questions for the owner

1. Is a fixed 250 ms Android page settle acceptable if the snap-interval physics path turns out worse on the OnePlus 6, or is velocity-matched settle a hard requirement of §6.1 "native-feeling platform physics"?
2. Day mode range: accept ±1 year of days (re-based) instead of ±5 years, given float32 layout precision?
