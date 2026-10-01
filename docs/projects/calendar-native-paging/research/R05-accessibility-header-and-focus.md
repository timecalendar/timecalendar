# R05 — Accessibility, date header and focus restoration with a windowed horizontal ScrollView

Scope: how VoiceOver/TalkBack paging, the date header strip and focus restoration should work once
PagerView is replaced by a native `pagingEnabled` horizontal ScrollView with a keyed page window.
Paths are relative to `mobile/src/features/calendar/` unless they start with `docs/`, `mobile/` or
`node_modules/` (= `mobile/node_modules/`).

## 1. Current contract (observed)

**Binding product rules.** `docs/projects/owned-calendar-renderer/product.md`:
- §6.1 (:351-354): while a finger holds, the title and selected date stay on the old page. On
  settle, the page, title, selected date, accessibility context and event content update together.
- §6.4 (:390-392): Today and deep links animate unless reduced motion asks for a direct settle. When
  focus leaves an event, it goes to the destination date heading and the date is announced once.
- §12.1 (:639-648): paging has a non-swipe alternative that VoiceOver, TalkBack, Voice Control and
  Switch Control can operate. Reduced motion makes Today and deep-link moves settle directly.
- §12.2 (:655-668): one chronological representation and no duplicate focus tree. Paging announces
  the settled context once and never announces intermediate gesture state. Focus survives recycling
  by stable identity, otherwise it goes to the date heading.
- D06 (`decisions/D06-chronological-accessibility.md:29-35`) and ADR 061
  (`docs/mobile/architecture-book/decisions/061-*.md:17-24`) add three rules. One native event tree
  is tied to the visual targets. The conflict overlay is excluded from the tree. Every visible tile
  is the only semantic button for its identity. Native AT verification is still **pending**
  (061:5, 31-33; `docs/mobile/architecture-book/calendar.md:140`). `research/results/E01/completion.md`
  records no VoiceOver/TalkBack evidence.

**Renderer.**
- The vertical `Animated.ScrollView` is the paging control. It has `accessible`,
  `accessibilityRole="adjustable"`, `accessibilityLabel={heading}`, mode-specific
  decrement/increment actions, and it calls `onAccessiblePageRequest(±1)`
  (`renderer/owned-calendar-canvas.tsx:235-261`). Those actions call `requestAccessiblePage`. It
  starts a revisioned transition and runs `setPage`, or `setPageWithoutAnimation` under reduced
  motion (`renderer/owned-calendar-coordinator.ts:397-411`).
- PagerView is `accessible={false}` (canvas:314). Neighbour pages use
  `accessibilityElementsHidden` + `no-hide-descendants` when `direction !== 0` (canvas:419-423).
  Tiles are accessible only on the committed page (canvas:560, 813-815). The conflict overlay is
  hidden (canvas:576-580).
- Each committed tile is wrapped in `CalendarFocusObserverView` (canvas:846-862). On iOS it listens
  for `UIAccessibility.elementFocusedNotification` and matches its single subview
  (`mobile/modules/calendar-focus-observer/ios/CalendarFocusObserverView.swift:17-63`). On Android
  it intercepts `TYPE_VIEW_ACCESSIBILITY_FOCUSED` in `requestSendAccessibilityEvent`
  (`.../android/.../CalendarFocusObserverView.kt:20-33`). The event carries
  `{identity, dateKey, generation}`.
- Header (`renderer/owned-calendar-header.tsx`): a `300%` strip of 3 slots (:58-62, 158-165) is
  translated by `(1 − (position+offset))·laneWidth` (`renderer/pager-page-scroll.ts:87-93`). Only
  the centre slot is exposed. Its cells are `header`-role elements registered as focus fallbacks
  (:89-101). Each cell has a narrow weekday `ThemedText` with `adjustsFontSizeToFit` (:104-115).
  That makes 3×7 = **21** auto-fitting texts in week mode.

**Shell focus logic** (`renderer/owned-calendar-shell.tsx`):
- `requestRestoredFocus` (:105-174) uses this order: the remembered event if it is still mounted,
  then the remembered date heading, then the page title. It returns `"waiting"` while a target that
  should exist is not mounted yet. It scrolls a surviving event into view (:163-164) and focuses
  after a `requestAnimationFrame` (:165-173).
- The title is accepted only when `generation`, `revision`, `contextHeading` and the label all match
  (:152-159). This is pinned by `owned-calendar-shell.test.tsx:619-702`.
- Seven props are mirrored into refs in a `useLayoutEffect` (:197-230), so the RAF callback can
  check `isCurrent()`. `restoreFocus` (:324-358) is exposed imperatively (:395-398) and kept fresh
  through `restoreFocusRef` + `useLayoutEffect` (:359-362). A third effect retries a pending return
  (:363-382).
- "Exactly one announcement per settle":
  - The auto effect calls `onContextSettled(revision, titleFocused)` once per `generation:revision`
    (:278-306).
  - `ui/calendar-screen/use-calendar-title-focus.ts:36-46` dedupes by revision. It announces
    `heading` only when the title did not take focus.
  - This is pinned by `ui/calendar-screen.test.tsx:946-993` (one announcement) and `:995-1035` (title
    focus, no announcement).
- Route return: `ui/calendar-screen.tsx:88-93` calls `restoreFocus()` on the `isFocused`
  false→true edge (test `ui/calendar-screen.test.tsx:462-516`).
- Other tests that pin behaviour:
  - shell `:521-617`: a surviving event, then the date heading, then nothing on an unrelated date,
    then the event again after a mode switch.
  - `:705-750`: an offscreen target is scrolled to `minute/60·pph − 96`.
  - `:752-805`: stale identity, date or generation, route blur, pending transition or incomplete
    presentation are never remembered.
  - `:807-860`: a pending frame is cancelled on blur, transition start or revision change.
  - `:1818-1838`: a second action is ignored while a page is pending.
  - `:2298-2309`: reduced motion settles directly.

## 2. Platform behaviour and a latent defect in the current contract

### 2.1 Observed in RN 0.85.3 sources

- **iOS: an accessible ScrollView is a leaf.** Fabric maps `accessible` to
  `isAccessibilityElement` on the component view
  (`node_modules/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm:350,1425-1431`).
  In UIKit, a view whose `isAccessibilityElement` is true hides its subviews from assistive tech
  ([isAccessibilityElement](https://developer.apple.com/documentation/objectivec/nsobject-swift.class/isaccessibilityelement)).
  - The adjustable ScrollView (canvas:235) contains every event tile.
  - **Inference:** on a device, VoiceOver probably cannot reach any event tile. The tiles become
    reachable only once the ScrollView is no longer accessible.
  - Jest cannot see this because RNTL resolves roles on the React tree.
- **Android: ScrollView drops custom actions.** `ReactScrollView` and `ReactHorizontalScrollView`
  install their own `ReactScrollViewAccessibilityDelegate` in the constructor
  (`.../views/scroll/ReactScrollView.java:151`, `ReactHorizontalScrollView.java:149`). That delegate
  sets the role and collection info only. It neither publishes `accessibilityActions` nor
  dispatches `AccessibilityActionEvent` (`ReactScrollViewAccessibilityDelegate.kt:39-134`).
  `ReactAccessibilityDelegate.setDelegate` refuses to replace an existing delegate
  (`.../uimanager/ReactAccessibilityDelegate.kt:592-608`). That class is the one that maps
  increment/decrement to `ACTION_SCROLL_FORWARD/BACKWARD` and emits the JS event (:220-263,
  566-568).
  - **Inference:** on Android, TalkBack's adjust gesture on the canvas scrolls the vertical
    ScrollView natively, or does nothing. It does not page.
- RN documents `accessibilityActions` for any accessible component
  ([RN accessibility actions](https://reactnative.dev/docs/accessibility#accessibility-actions)). It
  says nothing about these ScrollView-specific gaps.
- **Conclusion: the adjustable control must not live on any ScrollView**, vertical or horizontal.
  This holds whatever the paging engine.

### 2.2 VoiceOver and a paging UIScrollView

- **Three-finger swipe.** It calls `accessibilityScroll(_:)` on the nearest scrollable ancestor of
  the focused element
  ([accessibilityScroll](https://developer.apple.com/documentation/objectivec/nsobject-swift.class/accessibilityscroll(_:))).
  For a paging `UIScrollView` this moves one page and speaks a scroll status, by default
  "Page X of Y". The status can be customised only through
  [`accessibilityScrollStatus(for:)`](https://developer.apple.com/documentation/uikit/uiscrollviewaccessibilitydelegate/1621055-accessibilityscrollstatus)
  or a `.pageScrolled` post
  ([PageScrolled](https://developer.apple.com/documentation/accessibility/accessibilitynotification/pagescrolled)).
  Flutter documents this as the native baseline
  ([flutter#189285](https://github.com/flutter/flutter/issues/189285)). RN implements neither.
  - **Inference:** with ±5 years of pages, VoiceOver would say something like "Page 1827 of 3653".
    That is meaningless, and a second utterance competes with our settle announcement.
- **Settle events.** The animated scroll ends in `scrollViewDidEndScrollingAnimation` →
  `_handleFinishedScrolling` → `onMomentumScrollEnd` (`RCTScrollViewComponentView.mm:834-837,
  862-873`). A non-animated `scrollTo` emits the same event (:1029-1031). So a three-finger page, an
  animated `scrollTo` and a reduced-motion `scrollTo` all reach one settle path (R02 should
  confirm).
- **Empty pages break the chain.** Three-finger paging needs focus inside the scroll view. On an
  empty page there is no element inside it after settle, so focus falls back to a heading outside it
  and three-finger paging stops. **Three-finger paging can therefore only be an extra; it cannot
  satisfy §12.1.**
- **View culling.** Fabric disables ScrollView view culling while VoiceOver or Switch Control runs
  (`RCTScrollViewComponentView.mm:613-633, 656-667`). The window stays small on its own, so this
  matters little.

### 2.3 TalkBack and a horizontal ScrollView

- **Two-finger swipe.** This is a touch passthrough, so native paging and settle apply as for touch
  ([TalkBack gestures](https://support.google.com/accessibility/android/answer/6151827)).
- **TalkBack scroll actions.** A scrollable node exposes `ACTION_SCROLL_FORWARD/BACKWARD`
  ([AccessibilityAction](https://developer.android.com/reference/android/view/accessibility/AccessibilityNodeInfo.AccessibilityAction)),
  and TalkBack auto-scrolls the nearest scrollable ancestor during linear navigation. Framework
  `HorizontalScrollView` handles these actions with its own smooth scroll. RN emits
  momentum-end only from its post-touch runnable (`ReactHorizontalScrollView.java:1167-1220`) or
  its animator (`ReactScrollViewHelper.kt:451-482`).
  - **Inference:** a TalkBack scroll or auto-scroll may stop off a page boundary or never produce a
    settle. Traversing past the last event could also page the calendar unexpectedly.
- **Mitigation.** Set `importantForAccessibility="no"` on the horizontal ScrollView, and not
  `no-hide-descendants`. That removes the scrollable node and keeps its children
  ([importantForAccessibility](https://developer.android.com/reference/android/view/View#attr_android:importantForAccessibility),
  [RN](https://reactnative.dev/docs/accessibility#importantforaccessibility-android)). Touch paging
  is unaffected. The vertical ScrollView stays scrollable, so vertical auto-scroll still reveals
  off-viewport events (D06).

### 2.4 Hiding non-centre pages

Exposure must change only when the **committed** index changes. It must not follow the live
offset or the window shift, so there is no per-crossing churn and no intermediate announcement.

| Element | Props |
| --- | --- |
| Page at the committed index | `accessible={false}`, normal descendants |
| Every other window page | `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` (the current props) |

Hiding page subviews does not touch `accessibilityScroll` (it belongs to the scroll view) or the
Android scroll actions (they belong to the scroll node). So hiding pages does not break native paging.

**When focus leaves the window:**
- A gesture page keeps a focused event mounted but hidden at commit.
- A multi-page jump can unmount it.
- In both cases the platform picks some fallback element. Within one frame the shell's settle
  effect then moves focus deterministically: the surviving identity, else the date heading, else the
  title. This is today's chain (§1), and it now runs on every commit where focus memory exists.

## 3. Decision: where the adjustable control lives

Move `adjustable` + increment/decrement off the ScrollView onto a **plain `View` leaf outside both
scroll views**. Use the header's top-left gutter corner (`owned-calendar-header.tsx:48-53`, 52 pt ×
≥56 pt, which already meets 44/48).

| Property | Value |
| --- | --- |
| Label | `heading` |
| Role | `adjustable` |
| Actions | Mode-specific previous/next labels, as today |
| Handler | `scrollRef.scrollTo({x: (committed±1)·width, animated: !reduceMotion})` |

- It is a plain View, so RN's `ReactAccessibilityDelegate` handles actions on Android and
  `accessibilityIncrement/Decrement` handle them on iOS (`RCTViewComponentView.mm:1568-1580`).
- Reading order becomes: native title → adjustable context → committed date headings → events.
- Ignore actions while a scroll is in flight (keep `:1818` with an `isMoving` flag instead of the
  revision).
- `scrollTo(index±1)` replaces `beginTransition`/`setPage`. Settle commits through the same
  momentum-end path as a swipe, so "same path as swipe" from the openspec spec still holds.

Rejected alternatives:
- Keep the adjustable on the vertical ScrollView: hides events on iOS and loses the actions on
  Android (§2.1).
- Put it on the horizontal ScrollView: same two defects.
- Make the whole date row adjustable: on iOS that hides the date headings, which are the focus
  fallback targets (§6.4/§12.2).
- Rely only on three-finger swipe: empty pages break it (§2.2), and it does not cover TalkBack.

## 4. Header strip on the horizontal offset

Design: one header component with the **same keyed window** as the pages.
- Each slot is `position:absolute; left: index·laneWidth; width: laneWidth` with `key={index}`.
- The strip's `translateX = −scrollX`. `scrollX` is the shared value written by
  `useAnimatedScrollHandler` on the horizontal ScrollView.
- No rebasing. A base-relative origin would mix a React-committed base with a UI-thread offset and
  cause one-frame jumps.
- Precision: absolute offsets reach about 3653 × 400 ≈ 1.5 M px. Float32 resolution is then about
  0.125 px, which is acceptable.
- Lane width: the header lane and the page lane both equal the screen width minus `HOURS_COLUMN_WIDTH`
  (header:153-157), so one `laneWidth` serves both. The header has to be measured in the same layout
  pass as the pages (R02/R03).
- Removed: `usePagerPageScroll`, `contextKey`/`settledContextKey` and `settleHeaderProgress`
  (`pager-page-scroll.ts:50-108`). The native offset is authoritative, so a late event cannot
  "move an accepted header" (tests `shell.test:1840-1895` become obsolete).
- **Title/month rule (§6.1).** The strip moves visually with the finger. That is allowed and is
  today's behaviour. The native month title (`calendar-header-title`), the adjustable label, the
  `header`-role exposure of the committed slot and `heading` all derive from the committed anchor
  set by `onDateCommitted`. They therefore change in **one React commit** at settle and never
  during a hold. Only the committed slot's cells call `registerHeading`.
- **Reduced motion.** The strip follows the native offset, so it inherits whatever the ScrollView
  does, and an `animated:false` jump moves it in one frame. It needs no separate motion owner.
- **`adjustsFontSizeToFit` cost.**
  - The cost is mount-time: iterative text measurement per text. Steady-state frames do not pay it.
  - With keyed slots, a crossing mounts only the entering slot's 7 cells. Today a generation
    remount re-mounts all 21. With a 5-slot window the total rises to 35, but each mounts once.
  - The narrow weekday glyph only shrinks at extreme font scales. Measure one weekday text per
    `(laneWidth, fontScale, mode)` with `onTextLayout`, then pass the fixed `fontSize` to every cell
    and drop `adjustsFontSizeToFit`.
  - Keep `allowFontScaling` on (`accessibility.md:59`).
  - In week mode the weekday row is identical on every page. A static weekday row that does not
    slide would be cheaper, but it changes the visual design, so it is an owner question.

## 5. Reduced motion, Today and accessibility paging

- **Defect (observed).** The coordinator uses Reanimated's `useReducedMotion`
  (`coordinator.ts:12,86`), which is **fixed at app start**
  (`node_modules/react-native-reanimated/src/hook/useReducedMotion.ts:4-18`: "changing the …
  setting doesn't cause your components to rerender"). This breaks the book's requirement for a
  live preference (`accessibility.md:63`). Use a live hook such as the onboarding one
  (`features/onboarding/ui/use-reduced-motion.ts`), moved to a shared location once a second owner
  needs it (`accessibility.md:68`).
- **Accessibility ±1 page:** `scrollTo({x, animated: !reduceMotion})`.
- **Today and deep links.** Today currently does `replace` with no animation
  (`ui/calendar-screen/use-calendar-screen-controller.ts:143-145`), which is a §6.4 gap.
  - Never animate across many pages. Each crossing would shift the window and run per-crossing JS.
  - Distance 1: animated `scrollTo` unless reduced motion.
  - Distance > 1: non-animated jump to `target ∓ 1`, which recentres the window, then an animated
    one-page `scrollTo(target)`. Under reduced motion, use a single `animated:false` jump.
  - Either way, one settle produces one commit and one announcement.
- Paging gestures stay native physics. Reduced motion does not disable swiping, matching platform
  convention.

## 6. Simpler focus-restoration design

The toolchain supports `useEffectEvent`:
- React 19.2.3 exports it (`node_modules/react/cjs/react.development.js:1227`), and the Fabric
  renderer implements it.
- `babel-plugin-react-compiler` 1.0.0 models it as hook kind `useEffectEvent` with a frozen return.
- `eslint-plugin-react-hooks` 7.1.1 is the version `eslint-config-expo` 56 actually loads. Its
  `exhaustive-deps` knows `useEffectEvent` and rejects it as a dependency. Its recommended set also
  includes the compiler rules (`refs`, `set-state-in-effect`, and others).
- Constraint ([react.dev](https://react.dev/reference/react/useEffectEvent)): effect events may be
  called only from effects or callbacks created in them. They must never be passed to other
  components or hooks, which includes `useImperativeHandle`.

Proposed design:
1. **Drop the imperative `restoreFocus`.**
   - The shell already receives `routeFocused`. It counts route returns itself with a `visit` ref,
     incremented in an effect on the false→true edge.
   - `calendar-screen.tsx:88-93` and `restoreFocusRef` go away. `requestZoom` remains on the handle.
2. **One request key.**
   - `requestKey = ${committedKey}:${visit}`, where `committedKey` is the committed day/week key
     plus the mode. It replaces `generation:revision:returnEpoch`.
   - `ready = routeFocused && presentationReady && presentation.committedKey === committedKey && !isMoving`.
3. **One effect plus one effect event:**
   ```ts
   const restore = useEffectEvent((key: string) => { /* reads latest targets, headings, title, heading, pph */ })
   useEffect(() => {
     if (!ready || handled.current === requestKey) return
     const frame = requestAnimationFrame(() => restore(requestKey))
     return () => cancelAnimationFrame(frame)
   }, [ready, requestKey, pageTitleTarget, currentColumns])
   ```
   - `restore` reruns the current `requestRestoredFocus` chain. It returns early when `"waiting"`;
     the effect runs again when `pageTitleTarget`/`currentColumns` change, and that replaces
     `pendingReturn`.
   - It marks `handled` on success and calls `onContextSettled(committedKey, titleFocused)` once.
   - Because it reads the latest committed values, it re-checks `ready` and `key === requestKey`.
     That replaces `isCurrent()`, `focusContext`, `titleContext` and `activeGeneration`. It also
     closes the gap where a RAF could fire before a passive cleanup.
   - The effect cleanup replaces `returnFrame` and the manual cancel in `useLayoutEffect` (:218-221).
4. **`rememberTarget`** stays a plain handler, which the compiler keeps fresh. It accepts a focus only
   when `ready`, the observer's `pageKey === committedKey`, and the target is registered for that
   date. The focus observer's `generation` prop becomes `pageKey: string`, a native prop rename on
   both platforms.
5. **The title target** keys on `{committedKey, heading}` instead of `generation/revision`.
   `use-calendar-title-focus` dedupes on `committedKey`.

Tests whose **behaviour stays the same** (only their drivers change):
- `:521`, `:619` and `:752` are re-keyed.
- `:705` and `:807` drive `routeFocused` false→true instead of `ref.restoreFocus()`.
- `:1818` uses the in-flight guard.
- `calendar-screen.test:946/995/462` find the adjustable by its new `testID` instead of
  `owned-calendar-canvas`.

## 7. Accessibility acceptance checks

**Device spike** (physical iPhone + Pixel/OnePlus; preview build):
1. iOS, **current build**: can VoiceOver swipe reach any event tile inside the adjustable canvas?
   This confirms or refutes §2.1.
2. Android, **current build**: does TalkBack's adjust gesture on the canvas page the calendar?
   Same purpose.
3. Spike, adjustable corner element:
   - Increment and decrement each move exactly one page on both platforms.
   - Exactly one utterance names the destination, with no stale label read first. If iOS re-reads
     the old label, test `announceForAccessibilityWithOptions(…, {queue:true})`.
4. iOS three-finger swipe on a page with events:
   - Moves one page and settles through `onMomentumScrollEnd`.
   - Record what VoiceOver says ("Page X of Y"?) and whether it collides with our announcement.
5. Android with the horizontal ScrollView set to `importantForAccessibility="no"`:
   - Swiping past the last event never pages horizontally.
   - Vertical auto-scroll still reveals 23:00 events.
   - Two-finger swipe pages and settles.
6. Neighbour pages are never reachable by swipe or explore-by-touch, during a hold or after settle.
7. Focus on an event, page with the adjustable control, then page with a gesture. Focus lands on the
   destination heading or title within one frame, with one announcement.
8. Toggle Reduce Motion while the app is running. The next accessibility page, Today and deep link
   go direct (needs the live hook).
9. Largest Dynamic Type and font scale: header cells stay legible with the measured `fontSize`, and
   the adjustable element stays ≥ 44/48.

**Implementation (Jest + lint)**:
- Exactly one `adjustable` in the tree, and it is not a ScrollView. Its label equals `heading`.
  Increment and decrement call `scrollTo` with `committed±1` and `animated` = `!reduceMotion`.
- Only the committed page's tiles and only the committed header slot are exposed. Exposure does not
  change on window shifts or live offset.
- Exactly one `announceForAccessibility` per commit, and zero when the title took focus. Nothing on
  window shift, snap-back, vertical scroll or zoom gesture. Keep the zoom-command announcement.
- Ports of the focus tests in §6, with no `restoreFocus` on the handle.
- The horizontal ScrollView has `importantForAccessibility="no"` on Android.
- `useEffectEvent` passes `eslint` (`react-hooks/*`) and the compiler without bailouts. Check with
  `npx react-compiler-healthcheck` or by looking for compiler bailout output.
- The header strip style uses no React state per frame; assert the `useAnimatedScrollHandler`
  wiring.

## Open questions (non-blocking)

- Can the iOS "Page X of Y" status be silenced or replaced without a native override? A small
  `accessibilityScrollStatus` hook could be added to the existing `calendar-focus-observer` Expo
  module. Decide after spike check 4.
- Does a TalkBack `ACTION_SCROLL_*` on a nested horizontal scroll still reach the node through the
  vertical parent when it has `importantForAccessibility="no"`? Spike check 5.

## Recommendations for design

1. Move the adjustable context and its paging actions to a plain-View leaf in the header gutter
   corner, and make no ScrollView `accessible`. This fixes two probable defects that exist whatever
   the paging engine (§2.1). Each fix is only a probable defect from reading the source until spike
   checks 1–2 confirm it.
2. Accessibility paging is `scrollTo(committed±1)`, which shares the swipe's native settle path. Add
   an in-flight guard and use a **live** reduced-motion preference.
3. Exposure (pages, header slot, title, heading, label) is keyed on the committed index only. One
   React commit flips all of them at settle.
4. Header strip: keyed window slots at `index·laneWidth`, `translateX = −scrollX` on the UI thread,
   one measured weekday `fontSize`.
5. On Android, take the horizontal ScrollView out of the accessibility tree
   (`importantForAccessibility="no"`). On iOS, keep three-finger paging as an extra, subject to
   spike check 4.
6. Today and deep links: one animated page at distance 1; a jump plus a one-page animation beyond
   that; a direct jump under reduced motion.
7. Rewrite shell focus as one effect plus `useEffectEvent`, keyed by `committedKey:visit`. Drop the
   imperative `restoreFocus`, the mirrored refs and `restoreFocusRef`, and rename the observer's
   `generation` to `pageKey`.

## Questions for the owner

1. Is the header's top-left corner an acceptable home for the single adjustable "date context"
   element? The alternative is to merge the date row into one adjustable element, which loses the
   per-date heading focus targets that §6.4 names.
2. In week mode, may the weekday-letter row stay static while only the date numbers slide? It is
   cheaper but visually different from today.
3. If VoiceOver's native "Page X of Y" cannot be suppressed without native code, choose one: ship it
   alongside our announcement; add a small native scroll-status override; or disable three-finger
   horizontal paging so the adjustable control is the only accessible pager.
