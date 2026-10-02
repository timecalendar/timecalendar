---
kind: decision
id: D01
status: approved
traces-to: [P01, P02, P03]
supersedes: [owned-calendar-renderer/D04 (PagerView clause only)]
---

# D01 — A windowed native horizontal ScrollView owns paging

## Context and evidence

- **The PagerView edge can't be removed.** With 3 pages and an idle-only commit, a second swipe
  has nowhere to go (`investigations/2026-09-21-calendar-rapid-swipes/01-findings.md`). Widening
  the pager resets the SwiftUI `TabView`, which uses `.id(children.count)`
  (`react-native-pager-view/ios/PagerView.swift:12-21`). See R08 §A.
- **Android horizontal drags start at a disadvantage.** `NestedScrollableHost` halves horizontal
  movement before the slop test (R08 §A).
- **A nested native horizontal ScrollView can own paging on RN 0.85.3 Fabric** (R02):
  - **iOS:** paging is UIKit `pagingEnabled`, with one page per fling and a native mid-deceleration
    grab (`RCTScrollViewComponentView.mm:356`).
  - **Android:** RN's snapping code in `ReactHorizontalScrollView.java` also lands exactly one page.
  - **Gesture Handler:** its `Gesture.Native` mirrors a real UIScrollView
    (`RNNativeViewHandler.mm:101-112`), so the coordinator's iOS workaround disappears.
- **calendar-kit v2.5.6 is a working precedent.** It uses a bounded range, absolutely positioned
  pages keyed by index, and a constant content width. Its weakness is calling JS on every frame
  (R08 §B).

## Options considered

- **A. Keep PagerView without the generation key.** It cannot fix iOS.
- **B. Windowed native horizontal `Animated.ScrollView`** (proposed).
- **C. Owned Reanimated + Gesture Handler slot pager.** Non-native physics, and gesture arbitration
  by thresholds.
- **D. FlatList, FlashList or LegendList with paging.** The window is managed on the JS thread.
- **E. @expo/ui or a native module.** It needs iOS 17 or later, or a second native codebase.

## Proposed choice

**Structure.** One RN `Animated.ScrollView` with `horizontal` sits inside the existing vertical
ScrollView, beside the fixed hour gutter.

**Content and pages.**
- The content width is constant per mode and geometry (see D02).
- About 5 pages are mounted, each absolutely positioned at `index × pageWidth` and keyed by page
  identity. Ordinary paging never remounts the scroll owner or the pages still in the window.
- `pageWidth` is pixel-aligned, and the horizontal view's own width equals `pageWidth`.

**Gestures.** Use RN `Animated.ScrollView` rather than the Gesture Handler `ScrollView`, whose
`disallowInterruption` would block the pinch. It is composed with
`Gesture.Native().simultaneousWithExternalGesture(pinch)`.

**Android physics.** Use `snapToInterval` + `disableIntervalMomentum`. Fall back to `pagingEnabled`
if the spike prefers its feel (see D03).

`react-native-pager-view` leaves the calendar and stays installed for onboarding (ADR 036).

## Tradeoffs and consequences

- Native physics, native interruptibility and native screen-reader scrolling come for free.
- The bounded content requires the re-base policy in D02.
- Android arbitrates the nested scroll views on equal touch slop. If diagonal starts misfire, this
  is the kill criterion in `product.md`.
- About 60 contract sites change (R01 §2), and the shell test and contract test are rewritten.
- The owned-renderer D04 PagerView clause and T03's "PagerView only" contract test are superseded.
  D04's other clauses (owned RN views, Reanimated header projection, Gesture Handler pinch) remain.

## Approval

Owner (Samuel Prak) approved explicitly in the Claude Code planning session, 2026-10-01 (round-1 answers).

On 2026-10-02 around 16:17 UTC, after the Android rate-0.5 trial still missed rapid
chain landings, the owner authorized a **bounded native paging prototype** for the
Calendar pager in the Android perf app. The prototype may instrument and then test
React Native 0.85.3 horizontal ScrollView snap policy. It does not authorize a
different pager architecture, a native module, a production dependency patch, or
release acceptance. Any policy candidate must keep the visual offset continuous,
at most one unresolved page, immediate reversal, native gesture arbitration, and
one-page-per-fling behavior, then pass the exact-device gates in P01.
