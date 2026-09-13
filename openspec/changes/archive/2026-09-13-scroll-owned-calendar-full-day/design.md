## Context

T02 left the real Calendar route with one feature-owned, three-page empty week strip. Its single legacy `PanGestureHandler` drives horizontal translation on the UI runtime, while a revisioned screen/controller path commits the selected week, native heading, Agenda range, page generation, and accessibility announcement once. Predominantly vertical motion currently fails or snaps that gesture back; the pages have no clock geometry.

T03 adds vertical time navigation without weakening those accepted contracts. D02 keeps committed date presentation revision-coherent. Owner device evidence showed that the first custom D04 implementation had non-native vertical settlement, unstable transformed hairlines, indistinguishable development pages, and an incorrect iOS tab-bar boundary. D04 explicitly requires comparing native scroll/pager motion when owned gesture motion fails acceptance. The repository already ships `react-native-pager-view` 8.0.1 under ADR 036, so the repair uses React Native's native `ScrollView` for vertical motion and the installed native pager for horizontal motion without adding a dependency. Expo SDK 56 Localization exposes the device clock choice as `getCalendars()`/`useCalendars()` `uses24hourClock`, which is nullable only on platforms where the preference is unavailable.

The retained time-grid helpers still default to the older 07:00–21:00 window for Home and future consumers. T03 must add an explicit full-day renderer contract without changing those defaults. Current-time positioning, weekday columns, event tiles, zoom, and day mode remain later slices.

## Goals / Non-Goals

**Goals:**

- Make every minute of one 00:00–24:00 wall-clock day reachable through a bounded vertical viewport.
- Draw major and minor clock lines beside one left gutter whose labels share the exact same vertical geometry.
- Keep the gutter horizontally fixed, the native date heading vertically fixed, and the vertical clock position stable across week paging, retained tab/view changes, rerenders, and layout clamps.
- Let the platform's orthogonal scroll and pager recognizers choose exactly one axis, retain native ownership through reversal, and prevent a moving gesture from activating a press.
- Format hour labels from an explicit nullable device 12/24-hour preference while preserving a deterministic 24-hour fallback.
- Preserve T02's three-page bound, revision/cancellation behavior, one-week controls, settled semantics, reduced-motion behavior, and retained Agenda/details flows.
- Produce focused automated proof plus revision-bound, content-free native and owner evidence.

**Non-Goals:**

- Event or all-day tiles, weekday/date columns, weekend hiding, distinct day mode, pinch/zoom, current-time indicator or initial-now positioning, arbitrary dates, orientation acceptance, or final performance budgets.
- Changing stored event facts, Agenda presentation, range-query behavior, the display-timezone contract, a public renderer API, or Calendar navigation/chrome ownership.
- A second renderer, new dependency, fallback, compatibility layer, or speculative gesture abstraction for later pinch/all-day work.
- API/generated-client, database migration, native/store configuration, deployment/CI workflow, or legacy Flutter changes.

## Decision: Add explicit full-day geometry without changing shared partial-window defaults

Keep `GRID_START_MINUTE`, `GRID_END_MINUTE`, and every defaulted helper behavior intact. Add named full-day bounds (`0` and `1440`) and pure T03 helpers that derive content height, major hour boundaries, minor half-hour boundaries, minute positions, maximum scroll extent, and clamped offsets from explicit inputs. The 24:00 boundary closes the geometry but is not rendered as a duplicate 00:00 label; labels cover the 24 hour starts from 00:00 through 23:00. All line and label positions come from the same minute-to-pixel function.

The renderer starts at the deterministic top-of-day position for this slice. It does not infer an initial offset from events or the clock; current-time positioning remains owned by its later ticket. Introduced pure branches and arithmetic receive 100% statement and branch coverage plus boundary, monotonicity, and clamp properties.

Alternatives considered:

- Change the existing defaults to 00:00–24:00: rejected because Home and future callers currently depend on the explicitly documented Flutter-parity 07:00–21:00 defaults.
- Represent the day as 24 fixed-height components with independent placement math: rejected because duplicated line/gutter calculations can drift and make alignment unprovable.
- Include a visible `24:00`/`12 AM` terminal label: rejected because it duplicates the next day's 00:00 label while adding no reachable time.

## Decision: Use one native vertical scroll owner around a pinned gutter and native pager

Lay out one fixed-width gutter beside a three-page native `PagerView` inside one full-day row owned by a vertical React Native `ScrollView`. The gutter participates in the same native vertical content movement as the page grids but remains outside horizontal paging. The screen-owned native month/year heading remains above this viewport and therefore never participates in vertical motion. Grid lines use filled physical-hairline views and remain static within scroll content rather than sitting on a vertically transformed layer; the rendered content extends one hairline beyond the semantic 1440-point day so the closing boundary remains drawable at its exact coordinate.

The scroll owner uses `contentInsetAdjustmentBehavior="automatic"` and stays on the first native descendant chain beneath Expo NativeTabs so iOS accounts for the Stack and Liquid Glass tab bar. Android retains NativeTabs' existing bottom safe-area owner. React Native scroll events do not expose UIKit's computed `adjustedContentInset`, so the renderer persists the native raw settled `contentOffset.y` rather than incorrectly reconstructing a logical offset from `contentInset`. Week anchor/generation replacements do not reset it. The renderer reports only gesture-terminal candidates and final momentum settlements to the controller, never frame-frequency values. Remount restores that raw offset once and lets the native ScrollView clamp it against its current adjusted geometry. Backgrounding or unmounting during transient motion preserves the prior committed position.

Alternatives considered:

- Put the gutter inside each horizontal page: rejected because it would slide horizontally and triple the visible/semantic gutter.
- Use separate native vertical scroll views for gutter and grid: rejected because event ordering can visibly desynchronize labels from lines.
- Store every vertical frame in the controller: rejected because D04 keeps frame-frequency gesture work off the React/JS render path.

## Decision: Use native PagerView settlement and platform gesture arbitration

Render exactly three direct non-collapsible pager children for previous, current, and next week, with the native pager initially centered at index 1. Direct manipulation and programmatic accessibility actions use the same pager. A page is committed only after the pager is idle at index 0 or 2. The revisioned controller settles that destination once, then the pager remounts for the new generation centered at index 1. The destination edge page and replacement center page use identical production pixels and the same stable development tint/label so the handoff is visually atomic.

The outer vertical ScrollView and inner horizontal PagerView delegate orthogonal recognition, deceleration, overscroll, and responder cancellation to UIKit and Android native components. Observable acceptance requires one axis to own each gesture, no simultaneous X/Y slide, no week request from vertical movement, no vertical jump from horizontal paging, and stable ownership through reversal; it does not prescribe the removed dominance-ratio algorithm. Background, unmount, superseding navigation, and generation replacement cancel pending page revisions and ignore obsolete native events. Two-finger behavior remains reserved for T06.

Native ScrollView/PagerView responder behavior cancels a press when scrolling or paging wins. T03 has no event target to open, so device evidence owns the current cancellation claim and a representative interactive descendant must be rechecked when event tiles arrive.

Alternatives considered:

- Keep the custom horizontal/vertical PanGestureHandler state machine: rejected after owner evidence showed non-native vertical settlement and rendering/inset defects.
- Pair a native vertical ScrollView with the custom horizontal pan: rejected because static activation/failure thresholds do not reproduce platform scroll ownership and a parent handler can cancel the native scroll.
- Nest horizontal and vertical native ScrollViews: viable, but rejected because width-based centering, settle detection, and callback suppression duplicate selection behavior already supplied by the installed PagerView.

## Decision: Pass device clock preference into a pure hour-label formatter

Read the first device calendar's `uses24hourClock` through Expo Localization at the Calendar screen seam and pass it explicitly into the renderer. Keep language/locale and device clock preference separate: changing the in-app language does not rewrite the operating system's 12/24-hour choice. A pure `formatHourLabel(hour, locale, uses24HourClock)` (or equivalently scoped helper) renders 24-hour labels when true, 12-hour labels when false, and the existing 24-hour brand convention when null. It accepts only normalized hour starts and never reads device globals itself.

Use the reactive Expo hook where the installed SDK exposes it so supported Android setting changes can rerender; iOS lifecycle behavior is verified according to Expo's documented runtime limitation. Tests stub true, false, and null explicitly and do not depend on the host locale.

Alternatives considered:

- Infer clock style from the active app language: rejected because the device preference is independently configurable.
- Call Expo Localization from `format.ts`: rejected because it would make the formatter impure and platform-dependent.
- Change every existing event-time formatter in T03: rejected because this ticket owns hour-gutter labels, not a product-wide time-format migration.

## Decision: Preserve one settled date context and focused evidence boundaries

Vertical movement never creates a date revision, changes the native title, or announces a week. A horizontal settle still changes the controller-owned week context once and leaves the vertical offset unchanged. Existing increment/decrement week actions remain on the single adjustable Calendar canvas; neighbour pages and decorative grid/gutter nodes stay out of the accessibility tree so the date context is not duplicated. Hour labels are visual clock landmarks, while the canvas remains the operable semantic surface for this empty milestone.

Pure tests cover geometry, inset normalization, and formatting input. Renderer tests cover the first-descendant scroll contract, native inset policy, filled-line geometry, horizontal gutter pinning, vertical heading ownership, native scroll settlement ordering, pager idle settlement, cancellation, reduced motion, page-from-midday continuity, and stable three-page semantics. Screen tests cover explicit clock input and restoration across Week/Agenda plus retained paging/Today/Agenda/details behavior. The repository contract permits only the approved native ScrollView and installed PagerView motion path, continues to reject vendor/fallback/duplicate renderers, and pins the three Maestro journeys.

Implementation records exact commands and a revision-bound testable build. Content-free native evidence covers iOS and Android vertical feel, diagonal/reversal arbitration, fast horizontal paging from a scrolled position, press cancellation boundary, label alignment, device clock toggling, and retained controls. Unavailable device axes stay explicitly pending in the T03 `(HUMAN: owner device verification)` inbox note and T28 where the owner accepts a deferral; Jest never claims native feel or assistive-technology behavior.

## Risks / Trade-offs

- **Native orthogonal recognizers differ subtly by platform** → Require real iOS/Android diagonal/reversal evidence before owner acceptance.
- **Pager selection may arrive before native idle** → Record the selected edge, commit only on idle, and reject obsolete generation events.
- **Automatic adjusted insets are not exposed in scroll events** → Persist the settled native raw offset and let the native ScrollView clamp it on restoration; verify the Stack-owned top inset remains zero on-device.
- **Controller persistence can lag an unmount during active motion** → Preserve the prior committed offset during transient motion and test rapid Week/Agenda and background transitions.
- **Hairline borders can disappear on transformed subpixels** → Use filled physical-hairline views in native scroll content and keep the closing boundary inside the rendered extent.
- **A full 1,440-pixel surface triples grid nodes across neighbours** → Keep the grid decorative, bounded to the existing three pages, and record node/frame observations; final dense-event/resource budgets remain T26/T27.
- **Nullable web clock preference cannot follow an unavailable device setting** → Use the declared 24-hour fallback and prove native true/false paths; do not guess from language.
- **T03 could absorb future timeline behavior** → Keep pages empty and exclude columns, events, current time, zoom, day mode, and alternate motion implementations.

## Migration Plan

1. Preserve the tested full-day geometry and hour-label formatting while replacing synthetic offset math with native raw-offset retention.
2. Replace vertical transforms with one first-descendant native ScrollView containing the fixed gutter and native three-page pager.
3. Replace custom gesture settlement with PagerView idle commits and native vertical scroll settlement while preserving T02 revisions and cancellations.
4. Restore stable development page diagnostics, filled physical-hairline grid rendering, device clock preference, and retained native offset ownership.
5. Update focused tests, repository contracts, Architecture Book current-state guidance/changelog, and the revision-bound T03 owner-evidence note.
6. Run local-green, strict OpenSpec, native/harness checks, update the same draft PR, and pause on the ticket-specific owner QA and human review gate.

Rollback is a source/build rollback to the accepted T02 revision. There is no persisted-data, server-contract, dependency, or native-binary migration and no alternate renderer remains dormant.

## Open Questions

The selected native comparator still requires owner-device proof for orthogonal arbitration and visually atomic pager remounting. If either fails, stop and return the measured behavior before introducing synchronization or compatibility paths.
