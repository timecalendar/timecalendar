# R08: Alternatives and the case against the candidate

Scope: argue against the owner-favoured target (B) and rank it against five alternatives on the
requirements in `docs/investigations/2026-09-21-calendar-rapid-swipes/03-design-direction.md`
(movement / rendering / data / settlement separation) and product law
(`docs/projects/owned-calendar-renderer/product.md` §6.1 one page per fling with native physics,
§7.2 pinch focal invariant, §9 one-axis arbitration, §13 frame deadlines and bounded resources).
Sources are the installed `mobile/node_modules`, the scratchpad clones, and the archived T02/T03
designs. No build or device run was made; everything below is source reading plus prior traces.

## What the winner must do

1. Accept a new drag while the previous one is still moving, in the same direction, past the
   initial window, with no idle gap (03-design-direction.md "Required behavior"). The iPhone trace
   proves the current failure is structural: the second swipe is recognised but has no page beyond
   index 2 (01-findings.md "Owner trace").
2. Never remount the scroll owner on commit (design-direction "Settlement").
3. One page per fling, native physics (§6.1); one-axis lock with pinch precedence (§9).
4. No per-frame JS on the motion path (§13, D04).

## A. Smallest intervention: keep PagerView, drop `generation` from the key, tune

Mechanism: keep the 3-child `AnimatedPagerView` at `owned-calendar-canvas.tsx:298-341`, key it on
`geometryRevision` only, rebind the three pages' dates after commit and recenter with
`setPageWithoutAnimation(1)` (`owned-calendar-coordinator.ts:463-488` already does this per
generation).

What the native sources say:

- iOS `react-native-pager-view` 8.0.1 is a SwiftUI `TabView(.page)` whose `ForEach` identity is a
  per-insert `UUID` and whose whole view is `.id(props.children.count)`
  (`ios/PagerView.swift:12-21`, `ios/PagerViewProps.swift:4-6`). Rebinding React content inside the
  three existing `UIView`s keeps identity, so the remount goes away. But recentering is
  `props.currentPage = 1` through `goTo(index:animated:)` (`ios/PagerViewProvider.swift:84-92`),
  which is a SwiftUI selection write against a `UICollectionView` the user may be dragging. With
  only three pages, a second same-direction swipe before the commit still has no destination
  (01-findings.md). Widening to five children changes `children.count`, which resets the SwiftUI
  identity (`.id(...)`), the exact hazard 03-design-direction.md recorded.
- Android is a `ViewPager2` with a non-recycling adapter (`ViewPagerAdapter.kt:17`
  `setIsRecyclable(false)`) and every child add/remove calls `notifyItemInserted/Removed` plus a
  posted re-measure/re-layout of the whole pager (`PagerViewViewManagerImpl.kt:30-45,66-78,
  170-177`). Dropping the remount removes that per-commit storm; it does nothing for per-page cost.
- Android horizontal recognition is handicapped by design: `NestedScrollableHost` scales horizontal
  movement by 0.5 before the slop test ("assuming ViewPager2 touch-slop is 2x touch-slop of child",
  `NestedScrollableHost.kt:69-71`), so the vertical `ScrollView` parent wins diagonal starts. That is
  the sluggishness reported in
  [pager-view #450](https://github.com/callstack/react-native-pager-view/issues/450).
- Every `onPageScroll` on iOS is a `scrollViewDidScroll` → delegate → RN event
  (`ios/PagerScrollDelegate.swift:23-35`); the app already consumes it on the UI thread via
  `useEvent` (`pager-page-scroll.ts:25-45`), so A does not add JS per frame.

Verdict: A can plausibly cut the Android settle hitch (R01 §5 attributes the remount of 3 pages and
their `useAnimatedStyle`s to each commit) and is worth two hours as a *measurement*, because R01's
open question ("how much of the ~2 FPS is the remount") is unanswered. It cannot satisfy
requirement 1 on iOS: the three-page boundary is intrinsic and widening the pager fights SwiftUI
identity. It keeps the `generation`/revision machinery the project wants gone. Not a ship
candidate.

## B. Windowed native horizontal `ScrollView` with `pagingEnabled` (the candidate)

Mechanism in the calendar-kit v2.5.6 clone, which is the closest shipped precedent:

- One RNGH `ScrollView`, `horizontal`, `pagingEnabled`, `contentContainerStyle.width =
  count * itemSize`, `contentOffset` set to the initial page
  (`src/service/CalendarList/index.tsx:274-299`). Default range ±2 years
  (`src/constants.tsx:22-33`), `drawDistance` 600 px (`index.tsx:99`).
- Pages are absolutely positioned at `index*itemSize` relative to the first visible page, inside a
  container translated by that first position, keyed by index
  (`HorizontalVirtualizedList.tsx:27-48,63-73`). No remount on page change: the window slides.
- Its weakness, as the task brief says: `useAnimatedReaction` on the scroll offset calls
  `runOnJS(handleColumnChanged)` **and** `runOnJS(setScrollOffset)` on every frame
  (`index.tsx:191-197`), so the window `useMemo` and a React render run at scroll rate. calendar-kit
  shipped a "laggy scrolling on Android (new architecture)" fix in 2.5.0
  ([releases](https://github.com/howljs/react-native-calendar-kit/releases)); the candidate's
  once-per-crossing `scheduleOnRN` is the right correction.
- Its date commit is a 150 ms JS debounce after momentum begins (`hooks/useSyncedList.tsx:92-109`),
  i.e. it commits mid-motion and tolerates it because nothing remounts. The candidate commits at
  settle, which is stricter and compatible with §6.1 "title represents the old page while held".
- Vertical/horizontal order is outer vertical `Animated.ScrollView`, inner horizontal list
  (`CalendarBody.tsx:320-345`), the same shape as the app today (canvas.tsx:263-345), so the T03
  arbitration evidence carries over.

Platform facts that favour B:

- Android `pagingEnabled` is one-page-per-fling by construction: `flingAndSnap` routes to
  `smoothScrollAndSnap` when no snap interval/offsets are set ("pagingEnabled only allows snapping
  one interval at a time", `ReactHorizontalScrollView.java` `flingAndSnap`), which picks
  `currentPage ± 1` from crossing the page midpoint plus predicted fling direction
  (`smoothScrollAndSnap`). iOS `pagingEnabled` is UIKit's `isPagingEnabled`
  (`RCTScrollViewComponentView.mm:356`), which is already one page per fling. §6.1 is met natively.
- iOS Gesture.Native mirrors a real `UIScrollView`'s pan state (`RNNativeViewHandler.mm:101-112`);
  pager-view's collection view is not reachable, which is why the coordinator needs the
  `dragging`-event workaround (`owned-calendar-coordinator.ts:315-324`). B deletes that workaround.
- Android: a child `HorizontalScrollView` calls `requestDisallowInterceptTouchEvent` once it starts
  dragging, and RN's vertical `ReactScrollView.onInterceptTouchEvent` is the stock slop test
  (`ReactScrollView.java` `onInterceptTouchEvent`). No 0.5× penalty applies, so horizontal starts
  compete on equal slop. RN 0.85 also ships a `NestedScrollView`-based vertical variant behind
  `useNestedScrollViewAndroid` (`ReactNativeFeatureFlags.kt:520-523`) if arbitration needs it.
- Android post-touch snap uses a 20 ms `MOMENTUM_DELAY` runnable and 250 ms smooth scroll
  (`ReactScrollViewHelper.kt:48,64`): deterministic, no JS in the loop.

Cost: R01 §2 lists every contract that assumes a three-tuple, generation and idle commit (data,
renderer, ui, 2310-line shell test). B is a renderer rewrite of the paging layer, not a swap.

## C. Owned Reanimated + Gesture Handler slot pager

T02 built exactly this (`openspec/changes/archive/2026-09-13-swipe-one-empty-week-at-a-time/
design.md` "one three-slot renderer with UI-thread transient translation") and the owner rejected
it on device for non-native **vertical** settlement, unstable transformed hairlines, and inset
defects (T03 design.md "Context"). T03 then rejected "pair a native vertical ScrollView with the
custom horizontal pan" because "static activation/failure thresholds do not reproduce platform
scroll ownership and a parent handler can cancel the native scroll" (T03 design.md, alternatives
under "Use native PagerView settlement").

Would horizontal-only owned motion over a native vertical ScrollView avoid T02's failures?

- Vertical settlement: yes, the vertical owner is native.
- Hairlines: partly. Horizontal translation blurs only vertical separators (column lines) at
  fractional offsets; horizontal hour lines are untouched. Rounding `translateX` per frame avoids
  it but changes the feel.
- Arbitration: no. RNGH's Pan is exclusive with the native scroll by default; the only tools are
  `activeOffsetX`/`failOffsetY` thresholds, which is what T03 called static. The two unused clones
  show the ceiling: `react-native-infinite-pager` 0.3.18 activates manually in `onTouchesMove`
  (`src/index.tsx:312-345`), settles with `withSpring` (`:223,435`), keys pages by index so each
  crossing mounts a new page (`:531-549`), and reports the page via `runOnJS` from a reaction
  (`:262-270`). `react-native-reanimated-carousel` settles with `withDecay`/`withSpring`
  (`src/components/ScrollViewGesture.tsx:127-172`). Neither is platform physics (§6.1).
- Neither library is installed (`mobile/node_modules` has no `react-native-infinite-pager`,
  `react-native-reanimated-carousel`, `@shopify/flash-list`, `@legendapp/list`, `recyclerlistview`).

C is the fallback if B's nested arbitration fails on device, accepted with non-native horizontal
physics and a thresholds-based axis lock. It should not be first.

## D. Virtualized horizontal list (FlatList / FlashList v2 / LegendList)

Only `FlatList` is installed. It mounts and unmounts cells (no recycling), computes the window on
the JS thread from batched `onScroll` events, and the RN docs warn that fast scrolling outruns the
fill rate (03-design-direction.md "Options"). That is B's per-frame-JS weakness made structural,
with less control over when the window shifts. `react-native-calendars` avoids it with
`recyclerlistview`, 100 pre-generated pages and a debounced re-centre jump
(`src/timeline-list/useTimelinePages.ts:10-12,51-66`), the "more fixed pages" shortcut the owner
rejected. FlashList v2/LegendList would recycle but add a dependency to solve a problem B's 5-page
hand window already solves. RN 0.85 ships an experimental `VirtualView`
(`react-native/src/private/components/virtualview/`), private and unusable. D is dominated by B.

## E. Native module pager

- `@expo/ui` ~56.0.17 is installed. Its iOS `PagerView` is a SwiftUI `ScrollView` with paging that
  "Requires iOS 17+" and needs iOS 18+ for `onPageScroll`/state events
  (`src/community/pager-view/PagerView.ios.tsx:46-54`); the app floor is 16.4
  (`app.config.ts:172`). Its Android `HorizontalPager` is Compose hosting RN children through
  `RNHostView` (`src/jetpack-compose/HorizontalPager/index.tsx`, `PagerView.android.tsx:14-17`),
  which puts an RN vertical ScrollView inside Compose inside RN: a third arbitration layer.
- A hand-written `UICollectionView`/`RecyclerView` pager hosting Fabric pages is the most native
  motion but requires two implementations and recycling choreography against Fabric mount/unmount,
  for a single owner. The existing `calendar-focus-observer` module is a one-file prop bridge, not a
  precedent for this.

E is not viable under the current floor and effort; revisit only if B and C both fail on device.

## F. Do nothing

Contradicts the project intent and leaves the structural iOS boundary (01-findings.md). The only
honest version of F is "ship A's key change as a patch", which is covered above.

## Comparison

| | Req 1: swipe past window, no idle gap | Req 2: no remount | §6.1 native one-page | §9 axis lock | Per-frame JS | Effort | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | iOS no (3 pages); widening resets SwiftUI identity | yes | yes | Android 0.5× handicap | none | days | pager sources |
| B | yes if window ≥ 5 | yes | yes (native) | native, unproven in this tree | none by design | weeks | calendar-kit, RN sources |
| C | yes | yes | no (spring/decay) | thresholds | none | weeks | T02 rejection, clones |
| D | partial | yes | yes | native | JS windowing | weeks | RN docs, rn-calendars |
| E | yes | yes | yes | three layers | none | months | floor conflict |
| F | no | no | yes | — | — | 0 | trace |

## The strongest case against B

1. **Android `pagingEnabled` is RN's own snap, not the OS's.** `smoothScrollAndSnap` fires from a
   posted runnable 20 ms after touch-up and animates with `reactSmoothScrollTo` over the stock 250
   ms. A second finger landing inside that window begins a new drag from a mid-animation offset,
   and `getNextFlingStartValue` reconciles the animated position. This is the exact "obsolete
   completion snaps the user back" case the design direction forbids; it must be observed, not
   assumed.
2. **Nested arbitration regresses before it improves.** The vertical parent and the horizontal
   child race on the same slop; `findDeepestScrollViewForMotionEvent`
   (`ReactHorizontalScrollView.java:672-715`) only protects nested *horizontal* views. TalkBack
   with a horizontal list inside a vertical one has a known scroll-to-end bug
   ([RN #32023](https://github.com/facebook/react-native/issues/32023)). The old `nestedScrollEnabled`
   caveat is vertical-only ([RN #21436](https://github.com/react/react-native/issues/21436)).
3. **Blank or "loading" pages become reachable.** With a 5-page window and one page per fling, two
   fast swipes land on index +2, whose events are at best just queried. §13 forbids "unexplained
   blank" frames; the design direction demands a loading page never read as empty. The window shift
   itself is a JS render that must land inside one fling (≤ 250 ms on Android), competing with the
   data query.
4. **A ±5-year range is a contract, not a buffer.** 522 weeks × ~390 pt ≈ 204 k pt; day mode 3652 ×
   390 ≈ 1.4 M pt. Within float and `int` scroll range, but every "Today", date pick, weekend
   toggle and geometry change becomes `scrollTo(index*width, animated:false)` with a window rebuild;
   D05's "settled page plus immediate neighbours" bound becomes five pages and needs an explicit
   decision update.
5. **Users may want multi-week travel.** §6.1 forbids a fling crossing pages. B makes rapid
   repeated swipes possible, which is what the owner asked for, but a fling that *looks* like it
   should travel three weeks will stop after one. That is a product choice already made, not a B
   defect; it just has to be restated when the swipe becomes fast.
6. **Effort versus payoff.** R01 §2 enumerates roughly twenty contract sites plus the 2310-line
   shell test; the zoom hook, focus restore and title announcement are keyed on `generation`. If
   the Android ~2 FPS turns out to be per-page `useAnimatedStyle` and grid cost (R01 §5) rather
   than the remount, B fixes iOS and leaves Android slow until R03's shared grid lands.
7. **iOS deceleration during a window shift.** The window shifts when the rounded index changes,
   i.e. mid-deceleration. Fabric mounts the new page while the native scroll animates; a layout
   that touches `contentContainerStyle.width` or the container's `translateX` at that instant can
   cause a visible hop. calendar-kit keeps `width` constant and only moves children; B must too.

## Kill criteria for B

Kill B (fall back to C) if any of these is observed on a release-profile build on the OnePlus 6
and the owner's iPhone:

- A second swipe started during settle either snaps back to the previous page, skips a page, or is
  dropped, in more than 1 of 20 attempts in either direction.
- A diagonal start (≈30° from horizontal) is captured by the vertical owner on Android more often
  than by the native `PagerView` today (compare against the current build, same device).
- Any frame during the window shift shows a page at the wrong x, an empty slot, or a hop of the
  committed page; or the shift takes more than one fling duration.
- Pinch does not win over a horizontal drag start (§9), or the focal time drifts during a pinch
  that begins mid-page (§7.2).
- Android paging on the OnePlus 6 stays below the display's deadline with the shared grid in place
  (R03): then the problem is page cost, not the pager, and B should not ship as the fix.

## What the 1–2 day spike must demonstrate

A throwaway screen in the app (not the renderer) with a horizontal `pagingEnabled` ScrollView,
±5 y range, 5 absolutely positioned pages keyed by index, each with the real per-page view count
from R01 §5 (49 hairlines + a dozen tiles), inside the current vertical ScrollView and under the
current pinch gesture:

1. 20 rapid same-direction swipes, each started before the previous settles, both directions, both
   platforms; count pages travelled = swipes.
2. Reversal mid-deceleration and a cancelled partial drag: no snap-back to a stale target.
3. Window shift mid-deceleration: screen recording shows no hop; `collapsable={false}` DEV tint
   proves no remount.
4. Diagonal starts and vertical scrolls from a horizontally moving page: one axis per gesture.
5. Pinch during a horizontal drag; pinch focal invariant.
6. `scrollTo` for Today across the full range, then immediate swipe.
7. Android frame timing (`adb shell dumpsys gfxinfo`) for paging with and without the shared grid.

## Ranked recommendation

1. **B**, gated on the spike and kill criteria above, with the shared grid (R03) in the same
   design because Android FPS is probably page cost, not pager cost.
2. **A's key change as a two-hour measurement first**, to attribute the Android ~2 FPS between
   remount and page cost (R01 open question). Not a ship candidate.
3. **C** as the documented fallback if B fails arbitration or Android snap behaviour, accepting
   non-native horizontal physics.
4. **E** only after a floor bump to iOS 17/18 or with an owned native module; not now.
5. **D**, **F**: dominated.

## Observed facts / inference / open questions

Observed: all file:line claims above; no device data was collected in this note.

Inference: that Android's ~2 FPS is mostly page cost (R01 §5 count), that `smoothScrollAndSnap`
reconciles a mid-animation second drag correctly, and that a 5-page window is enough for two
queued swipes.

Open: whether `useNestedScrollViewAndroid` is on in RN 0.85 by default; whether Fabric's
`contentContainerStyle.width` of 1.4 M pt (day mode, ±5 y) has any Yoga or Android `int` edge.

## Recommendations for design

- Treat the ±N-year range as a product decision and update D05 (five-page working set).
- Keep the content width constant per mode; shift only children.
- Define the "loading" page presentation before the first swipe test.
- Replace the `generation` key on zoom, focus and title with a committed page index.
- Ship the shared grid with B; measure Android with A's key change first.

## Questions for the owner

1. Is a fast fling that visibly wants to travel several weeks still required to stop after one
   (§6.1), now that repeated swipes will be fast?
2. Which range bound (years before/after today) is the product contract, given it replaces D05's
   three-page bound?
3. Is a non-native horizontal feel (C) acceptable as a fallback, or does B failing mean a floor bump
   for E?
