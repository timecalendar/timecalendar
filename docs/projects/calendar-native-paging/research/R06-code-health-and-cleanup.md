# R06: Code health and cleanup the rebuild should absorb

Scope: `mobile/src/features/calendar/{renderer,ui,data}`. Paths below are relative to `mobile/` unless they start with `docs/`. Line numbers are at `c428f078`.

## 1. Tooling baseline (observed)

| Check | Result |
| --- | --- |
| `npx eslint src/features/calendar` | exit 0, **zero** warnings |
| `npx tsc --noEmit -p .` | exit 0, zero errors |
| eslint React rules | `eslint-config-expo` extends `plugin:react-hooks/recommended` (`node_modules/eslint-config-expo/utils/react.js:4`). With `eslint-plugin-react-hooks@7.1.1` that turns on the compiler-derived rules: `refs`, `immutability`, `purity`, `set-state-in-render`, `set-state-in-effect`, `use-memo`, `preserve-manual-memoization`, `static-components`, `globals`, `error-boundaries`, `config`, `gating` (all error); `incompatible-library`, `unsupported-syntax` (warn). I printed them with `eslint --print-config`. |
| Compiler at build time | `app.config.ts:202` `experiments.reactCompiler: true`. `babel.config.js` is plain `babel-preset-expo`, which injects `babel-plugin-react-compiler@1.0.0` with `target: '19'` and `panicThreshold: 'NONE'` in production (`node_modules/babel-preset-expo/build/configs/expo.js:158-171`). |

### 1.1 React Compiler: what actually compiles (observed)

`react-compiler-healthcheck` is not installed, so I ran the **build-time** compiler (`babel-plugin-react-compiler@1.0.0`) over every non-test file in the feature, using a `logger` (script: scratchpad `r06-compile.js`). Results:

- **53 functions compile.** Among them: `OwnedCalendarCanvas` (102 memo slots), `CalendarTiles` (58), `TimedCalendarTile` (75), `CalendarGrid`, `OwnedCalendarDateHeader`, `CalendarScreen` (106), `useOwnedCalendarCoordinator`, `useOwnedCalendarZoom` (73), `usePagerPageScroll`, `useCalendarScreenController`, and all data hooks.
- **One bail-out: `OwnedCalendarShell`** (`renderer/owned-calendar-shell.tsx:179`), with the error "Cannot access refs during render" reported three times:
  - `:194` `const targets = useRef(new Map()).current`
  - `:195` `const headings = useRef(new Map()).current`
  - `:308-323`, the effect deps array that carries those ref-derived values

  With `panicThreshold: NONE` the compiler skips the function silently and the shell ships unmemoized.
- **Lint does not catch it.** The `react-hooks/refs` rule is on, yet eslint passes. I reproduced this with a minimal `Linter` run: plugin 7.1.1 bundles a newer compiler that accepts the pattern, while the runtime plugin (1.0.0, the npm `latest`) rejects it. **Green lint does not mean compiled.**
- **Confirmed fix:** I replaced the two lines with `const [targets] = useState(() => new Map())` in a scratch copy, and the shell then compiled with 161 memo slots. The more idiomatic fix keeps the ref object and reads `.current` only inside handlers and effects ([react.dev useRef pitfall](https://react.dev/reference/react/useRef#referencing-a-value-with-a-ref)).

**Consequence (inference, to be confirmed by R03's profiler):** the shell hands a new `onEventPress`, `rememberTarget`, `registerTarget` and `registerHeading` closure to the canvas and header on every render (`shell.tsx:248-268,390-394,407-410`). Every compiled child below it therefore misses its cache. All three pages' tiles, conflict planners and header `Intl` formatting re-run whenever `CalendarScreen` re-renders. That happens on each swipe (request, settle, title target), each vertical settle (`setVerticalOffset`, `ui/calendar-screen/use-calendar-screen-controller.ts:180-182`), each zoom settle and each minute tick.

## 2. Smell inventory

Legend for **Fate**: **D** = the windowed-ScrollView rebuild deletes it outright; **C** = it needs a deliberate cleanup during the rebuild; **S** = a separate cleanup, outside the rebuild's path.

### 2.1 Defensive generation/revision machinery (the core of the over-engineering)

| # | Where | What | Fate / risk |
| --- | --- | --- | --- |
| G1 | `renderer/owned-calendar-coordinator.ts:89-110` | 17 refs plus 4 shared values: `geometryRevision` exists as state, ref and **three** shared values (`verticalOwnerGeometryRevision`, `horizontalOwnerGeometryRevision`, plus `zoom.geometryRevision`). It also has `verticalOwnerEpoch`/`horizontalOwnerEpoch`, `consumedGenerationRef`, `currentGenerationRef`, `handledPinchSequenceRef`, `settledZoomSequenceRef` and `movementOwnedRef`. | **D**. They exist because the pager remounts per `${generation}:${geometryRevision}` (`owned-calendar-canvas.tsx:301`), so late events from a dead native instance must be filtered out. Pages keyed by index on one live ScrollView cannot send stale events. Risk: low once the remount is gone. |
| G2 | `owned-calendar-zoom.ts:59-83` | 22 shared values. `pinchGeneration`, `pinchGeometryRevision`, `pinchSequence`, `pinchInterruptionSequence`, `scrollRevision`, `verticalCallbacksBlocked` and `horizontalCallbacksBlocked` all police a pinch that writes `scrollTo` on every frame (`:138,177-183`), which feeds back into `onScroll`. | **D/C**. A transform-only pinch with commit-at-end has no per-frame `scrollTo`, so there is no feedback loop and no callbacks to block. Keep `pinchActive`, the baseline scale/offset/focal and the viewport insets. Keep the `focalPreservingRawOffset` math (see keepers). |
| G3 | `coordinator.ts:208-229,318-324` | `Gesture.Native()` owners whose `onBegin` worklets compare epochs and close over the React `geometryRevision`. `claimHorizontalOwnership` duplicates `nativePagerGesture.onBegin` because RNGH never reports `onBegin` around PagerView on iOS (`:315-317`). | **D**. A horizontal `ScrollView` is an RN ScrollView, so RNGH `Gesture.Native()` mirrors its state on both platforms. One `simultaneousWithExternalGesture` or `blocksExternalGesture` relation with the pinch replaces the epochs. |
| G4 | `coordinator.ts:326-411`, `data/week-transition.ts:85-134`, `ui/calendar-screen/use-calendar-screen-controller.ts:70-129` | A two-phase transition protocol: request (revision++) → pending → settle/cancel → `generation+1`. Its revision floor (`revisionFloor`) is threaded through four layers. | **D**. Commit at scroll settle becomes a single `setAnchor(indexToDate(i))`. Keep `normalizeTimelineAnchor`, `shiftTimelineAnchor` and `timelineColumns` (`week-transition.ts:28-66`). Risk: medium. `calendar-screen.test.tsx` and the a11y title flow read `acceptedTransitionRevision` (see A1). |
| G5 | `renderer/pager-page-scroll.ts:27-46,60-64,95-100` + `canvas.tsx:307-311` | A hand-rolled Reanimated `useHandler`/`useEvent` bridge for PagerView, `activeContextKey`/`settledContextKey` to keep the header from snapping back, and the file's only production `as unknown as` cast. | **D**. `useAnimatedScrollHandler` on `Animated.ScrollView` is first-class. The header reads `scrollX` directly. |
| G6 | `coordinator.ts:463-502` | Two `useLayoutEffect`s that react to a `generation`/`showWeekends` prop change by imperatively resetting refs, shared values and `pager.setPageWithoutAnimation`. This is the ["adjusting state on prop change" via effect](https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes) anti-pattern. | **D**. A `showWeekends` toggle becomes a geometry change. Re-centre with `scrollTo({x: index*width})` in the layout handler. |
| G7 | `coordinator.ts:504-543` | An AppState listener that cancels transitions, recentres the pager and `scrollTo`s the committed offset. Its cleanup partly duplicates the generation effect. | **C**. Keep a background reset only if product law needs it (native ScrollViews survive backgrounding). Otherwise delete. |
| G8 | `coordinator.ts:234-246` | Builds a fallback empty presentation when `presentation` is missing. This duplicates `useCalendarTimelinePresentation`, and the screen always passes one (`calendar-screen.tsx:270`). | **D**. |

### 2.2 Non-idiomatic React (effects, refs, forwardRef)

| # | Where | What and why it is wrong | Fate / risk |
| --- | --- | --- | --- |
| R1 | `shell.tsx:194-195` | Ref `.current` read during render. This is the compiler bail-out in §1.1. | **C**: 2-line fix, worth doing **before** the rebuild as a free win. Risk: very low. |
| R2 | `shell.tsx:176-179,395-398` | `forwardRef` + `useImperativeHandle` with no deps (the handle is recreated on every render). React 19 makes [`ref` a plain prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop), and `forwardRef` is slated for deprecation. | **C**. The new shell takes `ref` as a prop. Risk: low. |
| R3 | `shell.tsx:205-230`, `:359-362`; `coordinator.ts:94,459-461` | The "latest ref" pattern: props are mirrored into refs from (layout) effects so that callbacks can read fresh values. React 19.2 ships [`useEffectEvent`](https://react.dev/reference/react/useEffectEvent) as stable (`exports.useEffectEvent` is present in `node_modules/react/cjs/react.production.js:498`). It is the sanctioned replacement, and `eslint-plugin-react-hooks@7` understands it. | **C**. Risk: low. |
| R4 | `shell.tsx:269-382` | Focus restoration in **three** places: an auto effect (`:269`), an imperative `restoreFocus` (`:324`), and a "pending return" effect that replays `restoreFocus` when props change (`:363`). That last one passes an event through an effect, the [chain-of-effects smell](https://react.dev/learn/you-might-not-need-an-effect#chains-of-computations). `requestRestoredFocus` is called twice with near-identical 14-field argument objects. | **C**. Hand this to R05. The a11y contract is product law, but one "on settle, focus X" path is enough. Risk: **high**, because this is the area most likely to regress VoiceOver/TalkBack. |
| R5 | `ui/calendar-screen/calendar-screen-header.tsx:104-136` + `use-calendar-title-focus.ts:26-53` | A child `useLayoutEffect` pushes a **host node** into parent state (`setPageTitleTarget`). The whole `CalendarScreen` re-renders just to forward a ref, and the generation/revision stamps travel with it. | **C** (with R4). A plain shared ref (or ref-as-prop) is enough. Risk: medium. |
| R6 | `ui/calendar-screen.tsx:87-93` | A `wasFocused` ref plus an effect to detect focus edges. `useFocusEffect` (already used in `data/clock.ts:65`) is the idiom. | **S**. Risk: low. |
| R7 | `canvas.tsx:809-812`, `owned-calendar-header.tsx:89-92`, `shell.tsx:407-410` | Inline callback refs. A new function each render makes React [detach with `null` and re-attach](https://react.dev/reference/react-dom/components/common#ref-callback) on every commit, so `registerTarget`/`registerHeading` churn delete+set for every tile and header cell on every render. | **C**. Use React 19 ref-callback cleanup returns with stable callbacks. This only works once R1 is fixed. Risk: low. |
| R8 | `use-calendar-screen-controller.ts:69,180-182` | The vertical offset is **React state** that only seeds the next mount (`initialVerticalOffset`). Every vertical scroll settle re-renders the screen and, through R1, the whole renderer. | **C**. Use a ref or MMKV write. The new design keeps the vertical ScrollView mounted, so it is only needed for remount/restore. Risk: low. |
| R9 | `zoom.ts:285-335` | A layout effect with 16 deps (13 are stable shared values, listed as noise). It diff-checks previous props in a ref (`appliedInputs`) to decide whether to replay a zoom. | **D** under commit-at-end pinch. Seed with `useSharedValue(initial)` and apply external commands (`requestZoom`) imperatively. |
| R10 | `data/timeline-presentation-hook.ts:49-57` | setState during render to retain the previous events. This is the [sanctioned pattern](https://react.dev/reference/react/useState#storing-information-from-previous-renders), not a bug. | **S/keep**. R04 owns whether a windowed data source replaces it (e.g. query `placeholderData`). |
| R11 | `data/clock.ts:37` | `useState(() => () => …)` used as a stable-callback hack. | **S**, nice-to-have. The compiler memoizes `useCallback`-free code anyway. |

### 2.3 Duplicated computation and per-frame cost

| # | Where | What | Fate |
| --- | --- | --- | --- |
| P1 | `canvas.tsx:204-212,412-414,886-888` | The same `renderHeight(pixelsPerHour)` runs in **8** animated styles (full-day row, gutter, pager, plus a page and a clock per page ×3), each animating `height`, a **layout** prop, on every pinch frame. | **D**. Transform pinch plus a one-shot commit. |
| P2 | `canvas.tsx:924-942` + `:286-295` | Every page draws 49 grid lines (25 major + 24 minor, `data/time-grid.ts:85-94`), each with its own `useAnimatedStyle` on `top`. That is 147 line worklets across 3 pages, plus 23 hour labels. | **D**. Draw the shared hour-grid layer once (owner's candidate). |
| P3 | `canvas.tsx:730-758` | `interactionStyle` and `visualStyle` each recompute `liveEventVisualGeometry` and the interaction geometry: twice per tile per frame. | **D/C**. One style plus a scale transform. |
| P4 | `canvas.tsx:829-839` | **Every accessible center-page tile gets an `onLayout` in production.** It is attached when `projectionIndex >= 0`, whether or not a probe is listening (`onProbeDiagnostic?.()`). The tiles animate `top`/`height`, so (inference) Fabric emits a layout event per tile per pinch frame to JS. | **C**, should-do even before the rebuild: gate on `onProbeDiagnostic !== undefined`. Risk: very low. |
| P5 | `data/timeline-presentation-hook.ts:64-83` | `buildCalendarTimelinePresentation` runs **twice** per render: once to derive uids for checklist progress, then again with progress. A third build is G8, a fourth is the probe build (`calendar-screen.tsx:122-135`). | **C**. Fetch progress by the event uids before projecting, or split the projection from decoration (R04). |
| P6 | `owned-calendar-header.tsx:74-86` | `formatDayHeaderParts` + `formatNarrowWeekday` (`Intl`) run per column per render. Under a ±5-year window this has to be per page and memoized. | **C**. |
| P7 | `canvas.tsx:514-538` | `projectCalendarAccessibilityEntries` + `planTargetConflicts` are recomputed per page render. They are pure and their inputs only change on data/zoom commit. | **C**. Move them into the presentation builder (`data/`, 90%-gated). |
| P8 | `canvas.tsx:514,728` | `Platform.OS` is read per page and per tile to derive `"ios"\|"android"` and 44/48. It is cheap but belongs in a module constant (`Platform.select`). | **C**, trivial. |
| P9 | `canvas.tsx:509-513,604-650` | A `Modal` chooser is mounted **per page** (3 Modals). `eventLabel` is computed twice per chooser row (`:628,:636`). | **C**. Use one chooser at shell level. |

### 2.4 Casts, dev overlays and oversized modules

- **Casts (production):** `canvas.tsx:308` (PagerView event bridge) is deleted by the rebuild (**D**). `data/range-plan.ts:73` and `data/timeline-presentation.ts:196` exist only because `Array.map` loses the 3-tuple type of `pages`. A window of N pages is a plain `readonly Page[]`, so both go (**D**). `data/event-color.ts:40` (RGB tuple `map`) is benign (**S**). Test casts are acceptable.
- **Dev-only overlay:** `canvas.tsx:455-469` puts a `__DEV__` label with the page key and size on **every** page. It drags in the `calendar.weekPagingSize` i18n key (`src/i18n/locales/{en,fr}.json:393`) that nothing else uses, and it pollutes dev-build perf traces and screenshots. **D**: delete it along with the key. `owned-calendar-shell.test.tsx:1922` ("development tint") tests leftover page identity, not the overlay.
- **Accessibility probe plumbing:** `calendar-screen.tsx:52-56,120-135,241-245,271-276` runs `onProbeDiagnostic` through shell → canvas → page → tiles → tile. It is gated by `isDevVariant()` and used by E2E. **C**: keep the capability but inject it through one context or a seam, not five prop layers.
- **Oversized:** `owned-calendar-canvas.tsx` is 1098 lines with 7 components, `coordinator.ts` 573, `shell.tsx` 467 (more than half of it focus restoration), and `owned-calendar-shell.test.tsx` 2310. The target split is `CalendarPager` (horizontal ScrollView + window), `CalendarPage`, `TimedTile`, `HourGrid`, `DateHeader`, `EventChooser`, plus a `useCalendarFocusRestore` hook.

## 3. Keepers (observed: pure, tested, independent of paging)

- `data/time-grid.ts`: 20 `"worklet"` functions (`resolvePixelsPerHour`, `focalPreservingRawOffset`, `nowAnchoredRawOffset`, `usableViewportCenterY`, `fullDayContentHeight`, `minuteToPixel`). They are tested in `time-grid.test.ts`, including a "UI-thread (worklet) contract" block (`:432-443`). This is exactly what a transform pinch needs.
- `data/overlap-layout.ts`, `target-conflicts.ts`, `accessibility-projection.ts`, `timed-support.ts`, `event-decoder.ts`, `event-color.ts`, `day-key.ts`, `week.ts`, `format.ts`, `agenda.ts`, and their tests. All are pure and paging-agnostic.
- `data/timeline-presentation.ts` (immutable builder) and `data/range-plan.ts`: keep the logic and generalise it from a 3-tuple to `pageAt(index)`/`pagesFor(range)`. Their tests port with small changes.
- `data/week-transition.ts:28-66` (anchor normalise/shift/columns) and its table tests. The request/settle/cancel half goes (G4).
- `renderer/owned-calendar-resize.ts`: the clock-anchor-preserving resize math (`:58-105`) stays valid for rotation and split view. The `geometryRevision` counter (`:103`) goes, and so do 3 tests that are mostly about it.
- `renderer/calendar-focus-observer*`: the native a11y focus seam. Keep it.
- `owned-calendar-shell.test.tsx`: roughly the first 1500 lines are **behaviour** tests (tile placement, compact text, conflict chooser, point/min-target, now indicator, header alignment, dark mode, hour labels, 1/5/7 columns, hairline, one-scale drive) and should be ported. The tests from `:1547` on (generation replacement, stale pager events, epochs, geometry-revision rejection, "replaced pager" header) test the machinery and are deleted with it. Two of them must be **re-expressed**, because they encode product law (§6.1 "one swipe settles only one page"): `:1598` "recenters a native snap-back without committing a transition" and `:2005` / `:2024`, the vertical settle semantics.
- `calendar-owned-shell.contract.test.ts` (419 lines) grep-asserts the source code: `createAnimatedComponent(PagerView)`, exactly one `<AnimatedPagerView ref=`, and no `runOnJS`/`useState` in zoom (`:152-210`). It **must be rewritten** with the rebuild. Its intent (one vertical owner, no per-frame JS, no timers) carries over; its strings do not.

## 4. Book rules that bind the cleanup (observed)

- **Boundaries** (`docs/mobile/architecture-book/lint-format.md:44-90`): `renderer/` and `ui/` are feature sublayers. B-1 means only `data/` may touch `@/db`/generated API, so a windowed data source stays in `data/`. B-2 means `renderer/` must import `@/features/calendar/data`, never `@/features/calendar`. The `../` ban means sibling imports use `./` or `@/`. B-3/B-4 and the chrome seam don't apply. Lint enforces all of these, so the rebuild cannot drift silently.
- **Coverage** (`jest.config.js:113-131`, `testing.md:41`): `src/features/*/!(ui|renderer)/**` is gated at **90% lines and branches per glob**, and everything else at a 70% global floor. **`renderer/` and `ui/` are exempt from the 90% gate.** So any new pure window math (index↔date, window slice, settle→anchor) should live in `data/`, where it is 90%-gated and worklet-testable. The gate only runs with `npm test -- --coverage`, as CI does.
- **R-1** (prose only for what lint can't encode): the compiler bail-out in §1.1 is something lint *currently cannot* catch. A CI check that runs `babel-plugin-react-compiler` with a logger over `renderer/` and fails on `CompileError` would encode "the renderer is compiled".

## 5. Ranked list

**Must-do with the rebuild**
1. Delete G1–G6 and G8: the generation/revision/epoch/sequence machinery, the pager bridge, and prop-change reset effects.
2. Transform pinch: delete P1, P2, P3 and R9, and keep the `time-grid.ts` worklets.
3. Get the shell compiled (R1), drop `forwardRef` (R2), and replace latest-refs with `useEffectEvent` (R3).
4. Rewrite `calendar-owned-shell.contract.test.ts`. Port the behaviour half of `owned-calendar-shell.test.tsx` and re-express its §6.1 settle tests.
5. Delete the `__DEV__` page overlay and its i18n key. Drop the 3-tuple casts.
6. Put the window/index math in `data/` (90% gate).

**Should-do (alongside, or before as quick wins)**
1. R1 and P4 as a pre-rebuild hotfix: two tiny diffs that may measurably help the current Android lag (needs R03 to confirm).
2. R8 (vertical offset out of React state), R7 (stable ref callbacks), P5–P7 (move projection/conflict work into the builder), P9 (one chooser).
3. R4/R5 consolidated into one focus-restore path, with R05 owning the semantics.
4. A CI compiler-bailout check (§4).

**Nice-to-have**
R6 (`useFocusEffect`), R11, P8, the `event-color.ts:40` cast, and probe plumbing through context.

## Recommendations for design

- Treat "every renderer component compiles" as an acceptance criterion and verify it with the build-time compiler, not lint.
- Make product law (§6.1 one page per swipe, commit at settle) the **only** reason for state in the pager. If a guard can't name the race it prevents on a single, never-remounted ScrollView, don't port it.
- Pinch: shared values plus transforms during the gesture, a single React commit at the end. Use `time-grid.ts` as-is.
- New pure modules go in `data/`. Renderer components stay thin. Use `useEffectEvent` instead of latest-refs, and `ref` as a prop.
- Land the R1 + P4 fixes first, as a separate small PR, to get a clean "before" perf baseline for the rebuild.

## Questions for the owner

1. Should R1 + P4 ship now as a pre-rebuild PR (it may soften the Android lag and gives a fair baseline), or should everything fold into the rebuild?
2. Do you accept a CI step that fails on React Compiler bail-outs in `renderer/` (encoding R-1), given that lint can't see them?
3. Does the background/AppState reset (G7) encode product intent, or was it only there to protect pager remounts? If only the latter, it goes.
