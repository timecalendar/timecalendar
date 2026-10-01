## Context

T05 leaves the real Calendar route with one native vertical `ScrollView`, one native three-page `PagerView`, a Reanimated header projection, and React state that receives only settled vertical offsets. The clock canvas is still compiled from module-level 60 px/hour constants. Calendar has no zoom commands, zoom preference, live vertical offset shared value, or measured timed-viewport geometry.

The approved renderer design requires T06 to retain those native motion owners and use the installed Gesture Handler/Reanimated stack. Pinch must win when a second finger arrives during vertical drag or momentum and during horizontal drag or settle. The live focal calculation cannot depend on the last offset reported to React, and automatic native insets must remain enabled. This is a gesture/accessibility change with device-only evidence, but it does not require native configuration or a new dependency.

## Goals / Non-Goals

**Goals:**

- Preserve the clock time under a live pinch focal point and under the usable viewport center for menu commands.
- Prove two-finger ownership against the accepted native vertical and horizontal paths before expanding the rest of zoom.
- Use one scale for every clock-plane coordinate and persist one validated Day/Week value.
- Keep frame-frequency scale, focal, and offset work on the UI thread; report only settled values to React.
- Expose localized, announced, bound-aware non-pinch controls and deterministic pure coverage.

**Non-Goals:**

- Populated-event density tuning or final zoom values, which remain T25 work.
- Event resizing, per-mode/per-orientation zoom, Agenda zoom, current-time positioning, or selectable dates.
- Replacing native scroll/pager physics, adding a compatibility renderer, or changing stored event facts.

## Decisions

## Decision: Gate the implementation on native arbitration inside the existing renderer

The Applier will first add the smallest real-route pinch composition around the existing native owners and exercise adding a second finger during vertical drag/momentum and horizontal drag/settle. Gesture Handler relationships and native-owner refs will make the two-finger pinch take ownership, cancel press recognition and prevent a pending page selection from committing. Starting, changing pointer count, cancellation, backgrounding, generation replacement, and ending all converge on one cancellation/settlement path. The pager/header is recentered when pinch cancels horizontal motion, and the vertical owner is placed at the focal-preserving offset without a release correction.

The exact Gesture Handler relationship is selected from this bounded experiment because host-level component tests cannot establish native recognizer precedence. The allowed repair remains inside this slice and retains the native owners. Replacing either native owner, adding a second renderer, or continuing feature expansion with a known release jump is not an allowed fallback.

Alternatives considered: custom vertical/horizontal motion is rejected because T03/T04 accepted native behavior; a separate native or canvas renderer contradicts the approved one-renderer boundary; deferring arbitration would make all later zoom work rest on an unproven integration.

## Decision: Define zoom as pixels per wall-clock hour with measured initial bounds

One finite `pixelsPerHour` value drives the full 00:00–24:00 canvas. The implementation starts with the bounded empty-grid candidates `min = 40`, `default = 60`, and `max = 120` px/hour, with menu commands moving by 10 px/hour and clamping inclusively. Pinch remains continuous inside the same bounds. These are initial T06 values: the Applier records the fabricated reference-hour experiment and the owner-tested result; T25 may revise all three against populated density without changing the storage or geometry contract.

The default deliberately retains the accepted T05 appearance. The 40 px minimum keeps half-hour divisions distinct while providing a useful condensed view; 120 px is a bounded two-times enlargement for readability without unbounded content. Absolute 10 px commands are deterministic, reversible, and reach both limits from the default.

Alternatives considered: discrete-only presets fail continuous pinch; multiplicative commands complicate exact repeated-command and limit behavior; per-mode values contradict the approved shared preference.

## Decision: Centralize focal and clamp math in the pure time-grid layer

Pure worklet-compatible helpers will own:

- finite scale validation and inclusive scale clamping;
- content height at a supplied scale;
- raw native offset bounds `[-topInset, contentHeight - viewportHeight + bottomInset]`;
- clock-coordinate capture from `rawOffset + focalY` at the old scale;
- the new raw offset `clockCoordinate * newScale - focalY`, clamped to the live native bounds;
- command anchoring at the measured usable viewport center between live top and bottom insets.

The helpers receive scale, raw offset, focal/center Y, viewport height, and native inset values explicitly. They do not read React, devices, localization, or storage. Property tests cover focal invariance when unclamped, bounded monotonic output, finite recovery, both edges, repeated commands, changing focal points, and viewport/content combinations.

Alternatives considered: using settled React offset is stale during drag/momentum; assuming zero inset breaks native chrome integration; translating the canvas without changing layout would desynchronize hit/layout coordinates and the ScrollView extent.

## Decision: Keep live geometry on Reanimated shared values and settle once

The renderer adds a feature-private zoom coordinator that owns shared values for scale, raw content offset, viewport height, native top/bottom insets, focal position, pinch baseline, and pinch-active state. A Reanimated scroll handler captures the native event continuously. The pinch worklet computes scale and offset, updates the canvas projection, and drives the existing `ScrollView` to the matching raw offset on the UI thread. Layout/inset changes are discrete measurements; no frame callback writes React state.

On a successful pinch end or menu command, one JS settlement persists the clamped scale and updates the controller's settled offset. Cancellation restores or commits through the same coherent geometry snapshot, so no end-frame jump is introduced. Day/Week changes consume the same settled zoom; Agenda neither edits nor resets it.

Alternatives considered: React state per gesture frame violates the renderer contract and risks tearing; persisting every frame amplifies native storage writes; CSS-like transforms alone leave content size and scroll bounds stale.

## Decision: Render every clock primitive from the same dynamic scale

`OwnedCalendarCanvas` receives the settled/current zoom contract rather than reading storage. Gutter labels, half-hour lines, hour lines, the 24:00 closing boundary, day-column height, pager height, page height, clock plane, and scroll content extent all use scale-derived coordinates. The three pages share one scale and update together. The existing extra hairline render height remains a presentation-only addition after the calculated 24:00 boundary.

The controller/screen owns preference orchestration and passes the complete value into the renderer, preserving the renderer-neutral feature boundary. Renderer inventory checks evolve to allow the bounded zoom modules by explicit identity while continuing to assert one vertical owner, one pager, three direct pages, automatic insets, no alternate renderer, and no per-frame React-state/run-on-JS path.

## Decision: Persist a total, environment-independent shared preference

Settings owns `settings.calendarZoomPixelsPerHour` as a numeric MMKV key. Imperative get/set and a reactive hook validate `number`, finiteness, and inclusive measured bounds. Missing, corrupt, `NaN`, infinite, and out-of-range reads resolve to 60 without throwing; writes accept only the typed/clamped domain value. The key is explicitly classified environment-independent and therefore survives backend reset, while reinstall may remove it.

Storage remains presentation-agnostic: it provides number access/reactivity and classification, while Settings owns zoom validation. Day and Week read one hook; there is no renderer import of MMKV.

Alternatives considered: storing a percentage obscures the actual geometry contract; storing a separate Day/Week value contradicts product scope; making zoom backend-bound would reset a device preference when switching data sources.

## Decision: Put non-pinch commands in the existing platform Calendar menu

The screen-owned platform menu adds Zoom in, Zoom out, and Reset actions after the Day/Week/Agenda selection. Commands are available for Day and Week, preserve the live usable viewport-center clock coordinate, and settle through the same coordinator. Zoom in/out report disabled state at their inclusive bounds; Reset is disabled at the default. Successful commands and limit attempts expose localized accessibility state, and a settled zoom is announced once as a rounded percentage relative to 60 px/hour. Pinch settlement does not emit frame-frequency announcements.

The renderer exposes domain callbacks/state needed by the screen-owned menu rather than owning platform chrome. Controls retain the existing iOS 44 pt and Android 48 dp target posture.

Alternatives considered: overlay buttons consume dense canvas space; renderer-owned menus violate the screen/renderer boundary; pinch-only operation is inaccessible.

## Risks / Trade-offs

- [Native recognizers may not yield cleanly when the second finger arrives] → make arbitration the first bounded real-route experiment, record both platforms, repair the relationship in T06, and do not replace accepted native motion speculatively.
- [Automatic inset values differ by platform/event timing] → consume live native event insets and measured viewport bounds, cover zero/non-zero inset math, and verify the reference hour on iOS and Android.
- [Continuous layout resizing may be expensive] → keep calculations on the UI thread, reuse the three mounted pages, avoid event work, and capture low-end timing when available; T25 retains populated-density acceptance.
- [A gesture may end at a clamp where perfect focal invariance is impossible] → define invariance before clamping and deterministic nearest-bound behavior after clamping; test and announce the bound.
- [Persistence can contain legacy/corrupt numeric values] → total Settings parsing returns the default and storage reset classification is contract-tested.
- [Host automation cannot prove native feel or assistive announcements] → tie content-free iOS/Android evidence and the full canonical owner checklist to the exact tested revision; do not claim unavailable device execution.

## Migration Plan

1. Land the pure zoom domain and total preference/classification tests.
2. Prove the bounded native arbitration experiment on the real T05 shell; if it fails, repair within this slice before adding remaining presentation/commands.
3. Wire dynamic scale, live inset-aware geometry, and menu controls through the real Calendar screen.
4. Update localized copy, Architecture Book current-state pages/changelog, renderer inventory assertions, and focused coverage/property tests.
5. Run edited suites, renderer/screen/repository-contract tests, TypeScript, lint, scoped formatting, coverage, and changed-code React Doctor. Record exact results and the tested revision/build.
6. Supply the canonical owner checklist with the 40/60/120 values and marked reference hour. Address feedback on this branch, then retain the explicit owner-acceptance gate before Reviewer merge.

Rollback is a source rollback to the accepted T05 revision. The added MMKV key is harmless to the prior reader and no data/schema migration is involved.

## Open Questions

- Whether the initial 40/60/120 px/hour values remain the preferred populated-calendar values is intentionally deferred to T25; T06 must still record its empty-grid owner result.
- Physical-device model/OS availability is established at evidence time. The current host cannot supply emulator/simulator evidence, and any permitted intermediate deferral must be explicit and point to T28.
