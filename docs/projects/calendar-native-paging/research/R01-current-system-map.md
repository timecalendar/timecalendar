# R01: Current system map (the "before" picture)

Scope: `mobile/src/features/calendar/{ui,renderer,data}` as of `c428f078`. All paths are relative to `mobile/src/features/calendar/` unless they start with `mobile/` or `docs/`. Legend for the target column: **gone** (disappears in a windowed ScrollView design), **changes** (the idea survives in a different shape), **keeps** (survives as it is).

## 1. End-to-end flow (observed)

```
CalendarScreen (ui/calendar-screen.tsx)
 ├─ useCalendarScreenController ── reducer over CalendarTransitionState (data/week-transition.ts)
 ├─ useCalendarEvents(agendaRange)            ← always runs, including in Day and Week (calendar-screen.tsx:95)
 ├─ useCalendarTimelinePresentation(anchor, generation) (data/timeline-presentation-hook.ts)
 │    └─ planCalendarThreePageRange → useCalendarEventsSnapshot → build ×2 (identity pass + checklist pass)
 ├─ useCalendarTitleFocus (ui/calendar-screen/use-calendar-title-focus.ts)
 └─ OwnedCalendarShell (renderer/owned-calendar-shell.tsx, forwardRef)
      ├─ useOwnedCalendarCoordinator (renderer/owned-calendar-coordinator.ts)
      │    ├─ useOwnedCalendarZoom (renderer/owned-calendar-zoom.ts): pinch, scroll handler, scrollRef
      │    ├─ usePagerPageScroll (renderer/pager-page-scroll.ts): header translateX from PagerView progress
      │    └─ replaceCalendarViewportGeometry (renderer/owned-calendar-resize.ts)
      ├─ OwnedCalendarDateHeader (renderer/owned-calendar-header.tsx): a 300% strip of 3 slots
      └─ GestureDetector(pinch) › OwnedCalendarCanvas (renderer/owned-calendar-canvas.tsx)
           └─ GestureDetector(Native) › Animated.ScrollView (vertical)
                └─ fullDayRow: gutter (23 hour labels) + GestureDetector(Native) › AnimatedPagerView
                     key=`${generation}:${geometryRevision}` (canvas.tsx:301), 3 × CalendarPageCanvas
```

**The paging lifecycle for a swipe:**
1. PagerView `dragging` (coordinator.ts:378-381) claims horizontal ownership. On iOS, RNGH's Native handler never reports `onBegin` around PagerView, so this callback is the only ownership signal (coordinator.ts:315-324).
2. `onPageScroll` runs as a worklet (pager-page-scroll.ts:66-85). It sets `position` and `offset`, which drive `headerStripStyle` (pager-page-scroll.ts:87-93).
3. `onPageSelected` records `selectedPageRef` only (coordinator.ts:363-369).
4. At `idle`, `settleSelectedPage` runs (coordinator.ts:383-394, 343-361). It calls `beginTransition` (coordinator.ts:326-341), which calls `onTransitionRequest({revision, direction, source})`, and then `onTransitionSettled(revision)` in the same JS tick. `consumedGenerationRef` blocks further input until React delivers a new generation.
5. The controller reducer applies `requestCalendarTransition` and then `settleCalendarTransition` (week-transition.ts:85-134), which sets `anchor ← destination`, `generation + 1` and `acceptedRevision`.
6. The screen re-renders. The hook replans 3 pages around the new anchor. Six live SQLite queries change key: timed and date-only for the timeline (sync/hooks.ts:36-84), personal, and the same three again for the agenda range. Retained events are reprojected meanwhile (timeline-presentation-hook.ts:49-62).
7. The canvas `key` changes, so **the whole PagerView and its 3 pages remount** (canvas.tsx:301). The coordinator's generation `useLayoutEffect` resets refs and calls `setPageWithoutAnimation(1)` (coordinator.ts:463-488). The zoom hook resets pinch state for the new generation (zoom.ts:285-300).
8. The shell's focus effect restores accessibility focus or announces the heading (shell.tsx:269-323 → `onContextSettled` → use-calendar-title-focus.ts:36-46).

**Accessibility paging:** the `increment`/`decrement` actions on the ScrollView (canvas.tsx:238-261) call `requestAccessiblePage` (coordinator.ts:397-411). That calls `beginTransition` and then `pagerRef.setPage(1±1)`, or `setPageWithoutAnimation` under reduced motion, and the request settles through the same idle path.

**Non-swipe date changes:** `goToToday`, the `focusDate` param, and Day/Week switches dispatch `replace` or `view` (controller.ts:143-170). `replaceCalendarTransition` bumps both `generation` and `lastRequestRevision` and drops any pending transition (week-transition.ts:136-167). Each one remounts the pager. The `revisionFloor` prop (shell.tsx:58) keeps the coordinator's revisions above the replacement's.

## 2. Contracts that assume 3 pages, generations, idle commit, revisions, or PagerView

### data/

| file:line | Contract | Target |
|---|---|---|
| range-plan.ts:10,20-32,34 | `CalendarPageDirection = -1\|0\|1`, a fixed tuple of 3 pages, `DIRECTIONS` (the contract test pins the literal, contract.test.ts:246) | **changes**: the plan becomes per-page by index, or a window of N; the range becomes window-bounded |
| range-plan.ts:74-81 | Query range = page[0] → page[2] + 1 day/7 days | **changes**: query a window or a wider prefetch band |
| range-plan.ts:85-91 | `key` = mode:zone:weekday:weekends:anchor | **keeps** as a per-page key ingredient |
| timeline-presentation.ts:45-61 | `CalendarTimelinePageV1.direction`, `PresentationV1.pages` as a 3-tuple, `generation` field | **changes**: pages keyed by index or dayKey; `generation` stamp **gone** |
| timeline-presentation.ts:132-204 | Builds every page in a single pass, then freezes | **changes**: per-page memoisation so a window shift does not rebuild survivors |
| timeline-presentation-hook.ts:20-27,54 | `generation` input; retained key is `rangeKey:generation:revision` | **changes**: retained by range or window |
| timeline-presentation-hook.ts:59-62 | "Paging recenters immediately, so only event data may lag." The anchor-relative reprojection | **changes**: in a window, pages keep their dates and only data lags |
| week-transition.ts:6-26 | `CalendarTransitionSource`, `CalendarTransitionRequest`, `pagePosition`, `lastRequestRevision`, `generation`, `acceptedRevision`, `pending` | **gone** for gestures. A settled index maps straight to the anchor. `replace` survives as a "scroll to index" command |
| week-transition.ts:85-134 | Two-phase request → settle/cancel keyed by revision | **gone**: a single commit at settle |
| week-transition.ts:28-66 | `normalizeTimelineAnchor`, `shiftTimelineAnchor`, `timelineColumns` | **keeps**. They also need an `index ↔ anchor` mapping (DST-safe, built on `addDaysInZone`/`shiftWeekInZone`) |
| accessibility-projection.ts:48-50 | Projects only the page where `direction === 0` | **changes**: becomes "the committed index" |
| events.ts:96-155 | Range-keyed snapshot (6 live queries per commit, see §1) | **keeps** the seam. Re-keying on every settle is a perf question for the target |

### renderer/

| file:line | Contract | Target |
|---|---|---|
| pager-page-scroll.ts:12 | `CENTER_PAGE = 1` (pinned by contract.test.ts:172-173) | **gone** |
| pager-page-scroll.ts:27-48 | A custom `useEvent` bridge plus `createAnimatedComponent(PagerView)` | **gone**: `useAnimatedScrollHandler` on the horizontal ScrollView |
| pager-page-scroll.ts:50-100 | `position + offset` → header translateX; `contextKey` and `settledContextKey` guards against late events | **changes**: header translateX = −scrollX (plus window origin); guards **gone** |
| coordinator.ts:87,8-11 | `pagerRef: PagerView` and PagerView event types | **gone**: replaced by an animated ref to the horizontal ScrollView |
| coordinator.ts:89-102,110 | `geometryRevision` state + ref; 4 owner-epoch/revision shared values; `progressContextKey` | **gone** or reduced to a single width shared value |
| coordinator.ts:92-97 | `revisionRef`, `pendingRevisionRef`, `selectedPageRef`, `consumedGenerationRef`, `currentGenerationRef` | **gone** |
| coordinator.ts:219-229,315-324 | `nativePagerGesture`, `claimHorizontalOwnership` (the iOS workaround) | **changes**: a Native gesture on a real RN ScrollView reports `onBegin` on both platforms (the comment at coordinator.ts:315 implies this) |
| coordinator.ts:234-246 | Fallback 3-page plan when `presentation` is absent | **changes** |
| coordinator.ts:260-263 | `nowOnCommittedPage` = page `direction === 0` | **changes** to the committed index |
| coordinator.ts:265-279,343-411 | `cancelHorizontalTransition`, `beginTransition`, `settleSelectedPage`, `onPageSelected`, `onPageScrollStateChanged`, `requestAccessiblePage` | **gone** or rewritten. A11y paging becomes `scrollTo(x ± width)` |
| coordinator.ts:463-502 | Generation and showWeekends layout effects that recenter the pager | **gone**. showWeekends still re-lays out columns but has nothing to recenter |
| coordinator.ts:504-543 | AppState inactive cancels pending motion, recenters the pager, restores vertical | **changes**: re-snap to the nearest index, or keep the committed one. Vertical restore **keeps** |
| coordinator.ts:413-457 | Vertical settle (momentum end, end drag via rAF), `isEventActivationBlocked` | **keeps**. Activation blocking must also cover horizontal drag and momentum |
| canvas.tsx:298-341 | Native-gesture-wrapped `AnimatedPagerView`, `key=generation:geometryRevision`, `initialPage`, `offscreenPageLimit=1`, `overdrag=false` | **gone**: a horizontal ScrollView with `pagingEnabled`, pages placed at `index*width`, no remount |
| canvas.tsx:204-212,412-414,886-888 | `height` from `pixelsPerHour` on the row, gutter, pager, each page and each clock plane | **changes**: transform during pinch, real layout at the end (per the preamble) |
| canvas.tsx:416-423,560-566,898,515-516 | `direction !== 0` hides pages and tiles from a11y and skips `registerTarget` and projection | **changes** to "index ≠ committed index" |
| canvas.tsx:509-513 | One chooser `Modal` per page, with state checked against `chooser.page === page` | **changes**: lift a single chooser to the shell (one per window) |
| canvas.tsx:847-858 + calendar-focus-observer.types.ts:4-20 | The native focus observer carries `generation` | **changes**: `generation` needs replacing with the committed index or dropping. Native module props: `mobile/modules/calendar-focus-observer` |
| canvas.tsx:455-469 | DEV tint per page (page key + size) | **keeps**. It is useful for spotting remounts |
| header.tsx:63-140,158-165 | 3 slots inside a `left:-100%`, `width:300%` strip (pinned by contract.test.ts:183-184) | **changes**: a window of slots at `index*laneWidth` |
| header.tsx:68-71,89-92 | Only `direction === 0` headings register for focus | **changes** to the committed index |
| shell.tsx:57-62,86-103 | Props `generation`, `revisionFloor`, `acceptedTransitionRevision`, `transitionPending`; `FocusContext` | **gone** or simplified to `committedKey` |
| shell.tsx:88-95,152-157 | `CalendarPageTitleTarget.generation/revision` must match exactly | **changes**: key on `heading` and committed key |
| shell.tsx:236 | `presentation.pages[1].columns` | **changes** |
| shell.tsx:269-389 | Auto-restore per `generation:revision`; `restoreFocus` with an epoch; pending return | **keeps** the behaviour; the keying **changes** |
| zoom.ts:26-33,76,89,108,145,162,285-300 | `generation` stamped into settlements and pinch gates; the generation reset effect | **changes**: a date commit no longer has to invalidate a pinch, only a mode or geometry change does |
| zoom.ts:79-83,227-244 | `vertical/horizontalCallbacksBlocked`, `scrollRevision`, `geometryRevision`, `invalidateForGeometry` | **changes** and get smaller |
| resize.ts:17-26 | `rendererGeneration`, `geometryRevision` in the snapshot | `geometryRevision` **changes** (it no longer keys a remount). The pure math **keeps** |

### ui/

| file:line | Contract | Target |
|---|---|---|
| controller.ts:31-36,70-129 | Reducer actions `request`/`settle`/`cancel`/`replace`/`view` | **changes** to `commit(anchor)`, `replace(date)` and `view` |
| controller.ts:202-205 | Exposes `rendererGeneration`, `transitionRevision`, `acceptedTransitionRevision`, `transitionPending` | **gone** |
| calendar-screen.tsx:122-135 | The probe builds its own 3-page presentation | **changes** |
| calendar-screen.tsx:247-255 | Wiring for generation, revisions and transition callbacks | **gone**. An `onDateCommitted(anchor)` callback replaces it |
| calendar-screen-header.tsx:24-26,85-136 | `generation` and `acceptedRevision` flow into the title target | **changes** |
| use-calendar-title-focus.ts:7-46 | Gated on `transitionPending`, `presentationGeneration === generation` and `acceptedRevision` | **changes**: gate on the committed key; announce once per commit |

## 3. The renderer boundary (ADR 033) and what the screen depends on

ADR 033 (`docs/mobile/architecture-book/decisions/033-calendar-renderer-module-boundary.md`) requires a renderer-neutral facade in domain terms and states that the "private props expose week transitions and settled vertical offsets… without promising a public API". The facade (`renderer/index.ts:1-6`) exports `OwnedCalendarShell`, `OwnedCalendarShellHandle`, `CalendarPageTitleTarget` and `OwnedCalendarProbeDiagnostic`. Only `features/calendar/ui` and `test-support/calendar-dense-week.test.ts` consume renderer or presentation symbols.

**Props** (shell.tsx:43-73), grouped:
- Context: `heading`, `mode`, `anchor`, `displayZone`, `locale`, `firstWeekday`, `showWeekends`, `currentDate`, `uses24HourClock`. These **keep**.
- Viewport: `initialVerticalOffset`, `initialPixelsPerHour`, `onVerticalOffsetSettled`, `onZoomSettled`. These **keep**.
- Transition machinery: `generation`, `revisionFloor`, `acceptedTransitionRevision`, `transitionPending`, `onTransitionRequest`, `onTransitionSettled`, `onTransitionCancelled`. These are **gone**; `onDateCommitted(anchor)` replaces them.
- Focus and a11y: `pageTitleTarget`, `onContextSettled`, `presentationReady`, `routeFocused`. These **keep** with re-keying.
- Data and actions: `presentation`, `onEventPress`, `onProbeDiagnostic`. `presentation` **changes** to a per-page source or window.

**Handle** (shell.tsx:75-78): `requestZoom(in|out|reset)` and `restoreFocus()`. Both **keep**.

**Screen dependencies:**

| Capability | Today's path | Remount? |
|---|---|---|
| Today | `goToToday` → `replace` (controller.ts:143-156); `canGoToToday` compares normalized day keys | yes (generation) |
| Day/Week switch | `setView` → `view` action → `replaceCalendarTransition({mode})` (controller.ts:103-115,167-170) | yes. A mode change legitimately rebuilds the index space |
| Agenda | Unmounts the shell entirely (calendar-screen.tsx:206-227). Offset and zoom live in the controller (controller.ts:69,64) | the shell remounts on return |
| focusDate | One-shot param → `replace`, then `setParams(undefined)` (controller.ts:158-165) | yes |
| Zoom menu | `calendarShellRef.requestZoom` (calendar-screen.tsx:151-161); announcement on `source==="command"` (257-269) | no |
| Focus restoration | `useIsFocused` rising edge → `restoreFocus()` (calendar-screen.tsx:87-93) | no |
| Event press | Tile `Pressable` → `onEventPress(uid)`, gated by `isEventActivationBlocked` (shell.tsx:390-394, canvas.tsx:568) → `router.push(eventRoute(uid))` | no |
| Conflict chooser | Hidden `Pressable` overlay per conflict component (canvas.tsx:573-599) → per-page `Modal` (604-650) | no |
| Weekend toggle | `showWeekends` prop. No generation change, but the pager is recentered (coordinator.ts:490-502) | no (re-layout) |
| Resize / rotation / inset | `geometryRevision` (coordinator.ts:112-161) | yes (canvas key) |

## 4. Test surface

| Suite | Size | Coupling to the paging mechanism |
|---|---|---|
| `renderer/owned-calendar-shell.test.tsx` | 2310 lines, 58 `it` blocks | 117 references to pager, page-selected, scroll state, `setPageWithoutAnimation`, `deferNextTransition` or generation |
| `ui/calendar-screen.test.tsx` | 1407 lines | Mostly drives paging through a11y `increment`, which survives. About 10 tests touch the pager directly |
| `renderer/owned-calendar-zoom.test.ts` | 13 | generation-replacement cases |
| `renderer/owned-calendar-resize.test.ts` | 4 | pure math |
| `data/week-transition.test.ts`, `range-plan.test.ts`, `timeline-presentation(-hook).test.*` | — | the 3-page/generation types |
| `mobile/calendar-owned-shell.contract.test.ts` | 419 lines | Source-text assertions |
| `mobile/jest/setup-pager-view.ts` | — | Suite-wide PagerView mock. It emits `settling` → `selected` → `idle` synchronously on `setPage`; `deferNextTransition` stands in for an async native settle |

**Behaviour worth keeping (rewrite selectors only)**, in `owned-calendar-shell.test.tsx`:
- 198: one scroll owner.
- 224, 338, 408, 478, 959: tile placement, tile rendering and UID routing.
- 521, 619, 705, 753, 805: focus restore. The "obsolete generation" and "revision replacement" cases at 753 and 805 need re-keying.
- 862: conflict chooser.
- 1057: activation is blocked during movement.
- 1129, 1148, 1173, 1204: the now indicator.
- 1231, 1258: fresh-open seek runs exactly once.
- 1295, 1367, 1394: header and gutter visuals.
- 1425, 1453, 1467: Day page columns, unit labels, weekend redistribution.
- 1535: pinned header.
- 1715, 1733, 1768: surfaces and a single scale.
- 2005, 2024: vertical settle.
- 2163, 2226, 2243, 2279: resize and zoom.
- 2298: reduced-motion a11y paging.
- **1922**: "a week's development tint stable when it becomes center". This is the existing no-remount oracle and the target should strengthen it.

**Implementation detail to delete or rewrite**, in `owned-calendar-shell.test.tsx`:
- 1490: page progress mapped to translateX. It becomes offset/width.
- 1525: native page-scroll bridge.
- 1547: "accepted destination generation centered exactly once".
- 1598: snap-back recenter. Keep the behaviour "no commit" and rewrite the test.
- 1621, 1658, 1675, 1698: cancel and recenter on inactive, weekend, generation or lane width changes.
- 1794: settles only after idle. Keep the behaviour "commit at settle".
- 1818: ignores a second a11y action while pending. The policy needs a decision.
- 1839, 1868, 1896, 1947: duplicate idle events, late scroll events, a replaced pager's events. These guards are gone.
- 1982: "uses the pager for the a11y action".
- 2070: per-owner epoch gating.
- 2251: invalidate pinch on generation replacement. Narrow it to mode and geometry changes.

**`calendar-screen.test.tsx`:** keep 386, 420-557, 602-702, 751-945, 995 and 1176-1407. They are product behaviour: Today/clock roll, routing, local-only paging, Day/Week/Agenda offset retention, focusDate, title and announcement. Rewrite:
- 306: pending-read retention during a swipe. Keep the behaviour.
- 704: a stale partial drag after a mode switch.
- 1043: deferred settle.
- 1071: "pages past the initial three slots". Keep the behaviour and add window-edge crossing.
- 1111: iOS inactivity.
- 1150: superseded by Today.
- 946, at line 989: asserts 3 page nodes.

**Contract test (`mobile/calendar-owned-shell.contract.test.ts`)**:
- **Rewrite** these blocks, which pin the mechanism:
  - 79-94 compiles `react-native-pager-view`.
  - 116-150: renderer file inventory incl. `pager-page-scroll.ts` plus the `react-native-pager-view` dependency.
  - 152-211: `createAnimatedComponent(PagerView)`, `CENTER_PAGE = 1`, `initialPage`, `300%`/`-100%`, `<AnimatedPagerView ref=` count 1.
  - 246: `DIRECTIONS = [-1, 0, 1]`.
  - 277-312: `page.direction === 0` regexes and `<Pressable` count = 4.
- **Keep** the bans as written: `runOnJS`, RN `Animated`, `useCallback`, `useMemo` in motion files, timers outside `clock.ts`, `withRepeat`, rAF loops, vendor absence, the presentation and identity seams, and the focus-observer native contract (46-77).
- Watch the `useMemo` ban at 199 and 261: per-page memoisation (§2) has to rely on the React Compiler, a per-page component, or a pure cache, never `useMemo`.

**Maestro:** none of the 3 journeys touches the timeline. All of them go through `helpers/open-calendar-agenda.yaml` (`mobile/.maestro/*`, pinned by contract.test.ts:403-418). There is **no E2E coverage of swiping**. Device validation of paging is manual, through the dev-only accessibility probe (`mobile/src/test-support/owned-calendar/accessibility-probe.md`, `mobile/scripts/accessibility-probe.sh`).

## 5. View tree budget (hand count from source; inference)

The counts below are host views React creates. Fabric may flatten the layout-only containers (`dayColumns`, `tileColumns`, `tileColumn`). A hidden `Modal` renders null (`node_modules/react-native/Libraries/Modal/Modal.js:283-288`). "uAS" means `useAnimatedStyle` instances. In every one of them, `pixelsPerHour` drives a **layout prop** (`top` or `height`), so a pinch frame re-lays out all of them.

**Shared, mounted once:** ScrollView and its content (2), fullDayRow (1), gutter (1), labels container (1), and 23 hour labels × (Animated.View + Text) (46), plus PagerView with its native page wrappers. That is about 52 views and **26 uAS**: row, gutter, pager, and the 23 labels.

**Per week page (7 columns):**
- Page Animated.View: 1 view, 1 uAS.
- Clock plane: 1 view, 1 uAS.
- `dayColumns`: 1 view, plus 7 column Views.
- 49 grid lines (24 minor, 25 major; time-grid.ts:85-94): 49 views, **49 uAS**.
- `tileColumns`, plus 7 tile columns: 8 views.
- Now indicator, on the today column only: +3 views, +1 uAS.
- DEV preview: +3 views.

That gives about **67 views and 51 uAS per empty page**. A Day page has about 55 views.

**Per event tile** (canvas.tsx:684-868):
- Anchor Animated.View: uAS.
- FocusObserver: native view, committed page only.
- Pressable.
- Visual Animated.View: uAS.
- Title Text.
- Location Text: only if the event is at least 40 px tall at the settled scale.
- Checklist indicator: 2–3 views when progress exists.

That is about **5–6 views and 2 uAS per tile**. Each overlap cluster adds one conflict `Pressable`.

**Header:** 4 container views + 3 slots × (1 + 7 × 4) = about 91 views and 1 uAS. Each cell also runs `formatDayHeaderParts` and `formatNarrowWeekday` on every render (header.tsx:75-84).

| Scenario | Views per page | uAS per page | Whole mounted tree (3 pages + shared + header) |
|---|---|---|---|
| Empty week | ~67 | ~51 | ~345 views, ~180 uAS |
| 20 events on the page | ~180 | ~91 | ~690 views if all 3 pages hold 20 (~460 if only centre does), ~300 uAS |

**Every commit remounts all 3 pages and their uAS** (canvas.tsx:301). A window of 5 keyed by index would mount about 1.7× the pages, but only the pages entering the window mount. The design should share a single grid layer across pages: it removes 49 grid lines and 49 uAS from each page.

## 6. Other users of `react-native-pager-view`

- `mobile/src/features/onboarding/ui/welcome-pager.tsx:3-26` and `welcome-screen.tsx:6` (ADR 036, `docs/mobile/architecture-book/runtime.md:32`). **The dependency stays.**
- `mobile/package.json:45` (`8.0.1`).
- `mobile/jest/setup-pager-view.ts`, registered at `mobile/jest.config.js:50-53`. Onboarding's test uses it too (`welcome-screen.test.tsx:23`).
- The calendar's references to remove: canvas.tsx:15-19, coordinator.ts:8-11, pager-page-scroll.ts:2, shell.test.tsx:77, calendar-screen.test.tsx:165, and contract.test.ts:88 and :140. The `:140` assertion must stay true as long as onboarding uses the package, so move it to an onboarding-owned assertion or drop it.
- The calendar's prose rules that cite PagerView: `docs/mobile/architecture-book/calendar.md:9-53, 81-89, 125` and `testing.md:49`. Update them, with a changelog entry, when the design lands.

## Observed facts / inference / open questions

**Observed.** These are §1–§4 and §6, verified line by line.
- Commit happens only at native `idle`, followed by a remount keyed on generation.
- Input is blocked between idle and React's re-render (`consumedGenerationRef`, coordinator.ts:333,347,366,376). This plausibly explains why iOS cannot take rapid repeated swipes.
- The pinch writes layout props on roughly 180–300 animated styles per frame.

**Inference.**
- The view and uAS counts in §5 are a hand count, not an instrumented one.
- Re-keying 6 live queries on every commit (sync/hooks.ts:59,84) plausibly adds to the Android settle cost.
- The agenda query runs while the agenda is not visible (calendar-screen.tsx:95-137).

**Open questions.**
- Does Fabric flatten `dayColumns`, `tileColumns` and `tileColumn`? Device profiling would answer it.
- How much of Android's ~2 FPS comes from the remount, how much from per-page uAS work, and how much from 3 × 49 grid lines? This needs a trace.

## Recommendations for design

1. Shrink the shell API to context + viewport + `onDateCommitted(anchor)` + focus props, and delete the transition machinery. ADR 033 permits this ("without promising a public API"), but write a short ADR addendum.
2. Introduce a pure `index ↔ anchor` mapping in `data/` (DST-safe, reusing `shiftTimelineAnchor`). Make `range-plan` and `timeline-presentation` produce per-page results that are memoised per key and can be built for any window.
3. Replace `direction === 0` everywhere with "committed key". This covers a11y hiding, `registerTarget`, projection, header heading registration and now-indicator exposure (§2 tables).
4. Lift the conflict chooser `Modal` and the hour grid to shell level, so there is one of each.
5. Turn shell test 1922 (the stable DEV tint) into the remount oracle, and add a "swipe 3 times before React commits" test. Rewrite the contract test's mechanism blocks and keep its bans.
6. Remove the calendar-level `react-native-pager-view` assertions, keep the package for onboarding, and leave the Jest mock in place.
7. Add one Maestro or device step that swipes the timeline. Today, nothing on device covers paging except the manual probe.

## Questions for the owner

1. Should a11y `increment` while a page is still settling queue a second page (iOS rapid paging), or be ignored as test 1818 does today?
2. Should the agenda-range event query keep running while Day or Week is visible (calendar-screen.tsx:95), or be scoped to Agenda?
3. Should a showWeekends toggle or a rotation keep the committed date with no motion, given that the remount on geometry change goes away?
