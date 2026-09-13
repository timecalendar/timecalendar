## Context

T02 left the real Calendar route with one feature-owned, three-page empty week strip. Its single legacy `PanGestureHandler` drives horizontal translation on the UI runtime, while a revisioned screen/controller path commits the selected week, native heading, Agenda range, page generation, and accessibility announcement once. Predominantly vertical motion currently fails or snaps that gesture back; the pages have no clock geometry.

T03 adds vertical time navigation without weakening those accepted contracts. D02 keeps committed date presentation revision-coherent. D04 keeps the owned React Native view plus the installed Gesture Handler 2.31, Reanimated 4.3, and Worklets 0.8 stack, with geometry and semantic planning off the per-frame path. Expo SDK 56 Localization exposes the device clock choice as `getCalendars()`/`useCalendars()` `uses24hourClock`, which is nullable only on platforms where the preference is unavailable. Reanimated 4 supports UI-thread scroll event handling and synchronous offset commands, while Gesture Handler supports activation/failure offsets and responder cancellation; implementation must revalidate behavior on both native platforms rather than infer feel from Jest.

The retained time-grid helpers still default to the older 07:00–21:00 window for Home and future consumers. T03 must add an explicit full-day renderer contract without changing those defaults. Current-time positioning, weekday columns, event tiles, zoom, and day mode remain later slices.

## Goals / Non-Goals

**Goals:**

- Make every minute of one 00:00–24:00 wall-clock day reachable through a bounded vertical viewport.
- Draw major and minor clock lines beside one left gutter whose labels share the exact same vertical geometry.
- Keep the gutter horizontally fixed, the native date heading vertically fixed, and the vertical clock position stable across week paging, retained tab/view changes, rerenders, and layout clamps.
- Choose exactly one axis after one-finger movement exceeds tap tolerance, retain that choice through reversal, and prevent a moving gesture from activating a press.
- Format hour labels from an explicit nullable device 12/24-hour preference while preserving a deterministic 24-hour fallback.
- Preserve T02's three-page bound, revision/cancellation behavior, one-week controls, settled semantics, reduced-motion behavior, and retained Agenda/details flows.
- Produce focused automated proof plus revision-bound, content-free native and owner evidence.

**Non-Goals:**

- Event or all-day tiles, weekday/date columns, weekend hiding, distinct day mode, pinch/zoom, current-time indicator or initial-now positioning, arbitrary dates, orientation acceptance, or final performance budgets.
- Changing stored event facts, Agenda presentation, range-query behavior, the display-timezone contract, a public renderer API, or Calendar navigation/chrome ownership.
- A second renderer, native pager/scroll comparator, new dependency, fallback, compatibility layer, or speculative gesture abstraction for later pinch/all-day work.
- API/generated-client, database migration, native/store configuration, deployment/CI workflow, or legacy Flutter changes.

## Decision: Add explicit full-day geometry without changing shared partial-window defaults

Keep `GRID_START_MINUTE`, `GRID_END_MINUTE`, and every defaulted helper behavior intact. Add named full-day bounds (`0` and `1440`) and pure T03 helpers that derive content height, major hour boundaries, minor half-hour boundaries, minute positions, maximum scroll extent, and clamped offsets from explicit inputs. The 24:00 boundary closes the geometry but is not rendered as a duplicate 00:00 label; labels cover the 24 hour starts from 00:00 through 23:00. All line and label positions come from the same minute-to-pixel function.

The renderer starts at the deterministic top-of-day position for this slice. It does not infer an initial offset from events or the clock; current-time positioning remains owned by its later ticket. Introduced pure branches and arithmetic receive 100% statement and branch coverage plus boundary, monotonicity, and clamp properties.

Alternatives considered:

- Change the existing defaults to 00:00–24:00: rejected because Home and future callers currently depend on the explicitly documented Flutter-parity 07:00–21:00 defaults.
- Represent the day as 24 fixed-height components with independent placement math: rejected because duplicated line/gutter calculations can drift and make alignment unprovable.
- Include a visible `24:00`/`12 AM` terminal label: rejected because it duplicates the next day's 00:00 label while adding no reachable time.

## Decision: Share one vertical offset between a pinned gutter and horizontally paged grid lane

Lay out one fixed-width gutter beside a clipped timed-lane viewport. The gutter is outside the three-page horizontal strip, so week translation never moves it. Each empty week page renders the same full-height major/minor grid inside the horizontal strip. One UI-runtime vertical offset translates the gutter label/line coordinate plane and the page grid planes together. The screen-owned native month/year heading remains above this viewport and therefore never participates in vertical translation.

The offset is clamped to `0...max(contentHeight - viewportHeight, 0)`. Week anchor/generation replacements do not reset it. The renderer reports only a settled/clamped offset to the controller—never frame-frequency scroll values—so switching to Agenda and back or retaining the Calendar tab restores the timeline position without putting per-frame work in React state. Layout changes cancel active motion and clamp the current offset; they do not manufacture an out-of-range jump. App backgrounding cancels transient motion and preserves the last valid position.

Alternatives considered:

- Put the gutter inside each horizontal page: rejected because it would slide horizontally and triple the visible/semantic gutter.
- Use separate native vertical scroll views for gutter and grid: rejected because event ordering can visibly desynchronize labels from lines.
- Store every vertical frame in the controller: rejected because D04 keeps frame-frequency gesture work off the React/JS render path.

## Decision: Extend the existing gesture owner with a deterministic one-axis state machine

Retain one one-finger pan owner around the full timed surface rather than nesting competing horizontal and vertical recognizers. At begin, capture the current horizontal and vertical origins and mark the axis undecided. Movement below tap tolerance changes neither axis nor press eligibility. Once displacement passes tolerance with a dominant component, lock to `horizontal` or `vertical`; an exact/near diagonal remains undecided until dominance is clear. A chosen axis cannot change during reversal.

Horizontal lock continues T02's one-neighbour clamp and revisioned settle path while leaving the vertical offset untouched. Vertical lock cancels horizontal snap-back work, updates only the clamped vertical offset on the UI runtime, and settles bounded inertial motion without requesting a week. Cancellation, failure, layout, background, and unmount return each active transform to its last valid committed/resting value and invalidate obsolete callbacks. Explicit single-pointer configuration leaves two-finger ownership for T06.

Pan activation keeps Gesture Handler's native responder cancellation explicit, and the same pure interaction transition marks press eligibility false after movement exceeds tolerance. T03 has no event target to open; the state/handler contract is nevertheless exercised now so future tiles cannot reinterpret a completed scroll/page movement as a tap. Component tests prove the configured native cancellation boundary without inventing an event tile.

Alternatives considered:

- Nest a native `ScrollView` inside the existing horizontal handler: rejected for this slice because native recognizer competition does not by itself prove one immutable axis, diagonal behavior, or reversal without a settle jump.
- Compose simultaneous horizontal and vertical recognizers: rejected because both may activate and violates the no-two-axis-slide contract.
- Switch to the new Gesture API while adding T03: rejected as unrelated migration risk; the installed legacy handler already owns the accepted T02 worklet registration and supports the needed activation/cancellation inputs.

## Decision: Pass device clock preference into a pure hour-label formatter

Read the first device calendar's `uses24hourClock` through Expo Localization at the Calendar screen seam and pass it explicitly into the renderer. Keep language/locale and device clock preference separate: changing the in-app language does not rewrite the operating system's 12/24-hour choice. A pure `formatHourLabel(hour, locale, uses24HourClock)` (or equivalently scoped helper) renders 24-hour labels when true, 12-hour labels when false, and the existing 24-hour brand convention when null. It accepts only normalized hour starts and never reads device globals itself.

Use the reactive Expo hook where the installed SDK exposes it so supported Android setting changes can rerender; iOS lifecycle behavior is verified according to Expo's documented runtime limitation. Tests stub true, false, and null explicitly and do not depend on the host locale.

Alternatives considered:

- Infer clock style from the active app language: rejected because the device preference is independently configurable.
- Call Expo Localization from `format.ts`: rejected because it would make the formatter impure and platform-dependent.
- Change every existing event-time formatter in T03: rejected because this ticket owns hour-gutter labels, not a product-wide time-format migration.

## Decision: Preserve one settled date context and focused evidence boundaries

Vertical movement never creates a date revision, changes the native title, or announces a week. A horizontal settle still changes the controller-owned week context once and leaves the vertical offset unchanged. Existing increment/decrement week actions remain on the single adjustable Calendar canvas; neighbour pages and decorative grid/gutter nodes stay out of the accessibility tree so the date context is not duplicated. Hour labels are visual clock landmarks, while the canvas remains the operable semantic surface for this empty milestone.

Pure tests cover geometry, clamps, formatting input, and axis/press state. Renderer tests cover aligned transforms, horizontal gutter pinning, vertical heading pinning by ownership, top/bottom reachability, axis selection, reversal, cancellation, inertial clamps, page-from-midday continuity, layout/background handling, reduced motion, and stable three-page semantics. Screen tests cover explicit clock input and restoration across Week/Agenda plus retained paging/Today/Agenda/details behavior. The repository contract continues to reject vendor/fallback/alternate renderer paths and pins the intended helper inventory and three Maestro journeys.

Implementation records exact commands and a revision-bound testable build. Content-free native evidence covers iOS and Android vertical feel, diagonal/reversal arbitration, fast horizontal paging from a scrolled position, press cancellation boundary, label alignment, device clock toggling, and retained controls. Unavailable device axes stay explicitly pending in the T03 `(HUMAN: owner device verification)` inbox note and T28 where the owner accepts a deferral; Jest never claims native feel or assistive-technology behavior.

## Risks / Trade-offs

- **Legacy handler activation differs subtly by platform** → Keep axis choice in one deterministic state machine, assert configuration, and require real iOS/Android diagonal/reversal evidence before owner acceptance.
- **Inertial vertical motion can finish after a page/layout/lifecycle change** → Cancel animation, version transient motion, clamp synchronously, and discard obsolete completion callbacks.
- **Controller persistence can lag an unmount during active motion** → Publish the current clamped offset on terminal/lifecycle boundaries and restore only that validated value; test rapid Week/Agenda and background transitions.
- **Gutter and grid can differ by subpixel rounding** → Generate both from the same minute/pixel values and shared transform, then assert exact positions and inspect real rendered alignment.
- **A full 1,440-pixel surface triples grid nodes across neighbours** → Keep the grid decorative, bounded to the existing three pages, and record node/frame observations; final dense-event/resource budgets remain T26/T27.
- **Nullable web clock preference cannot follow an unavailable device setting** → Use the declared 24-hour fallback and prove native true/false paths; do not guess from language.
- **T03 could absorb future timeline behavior** → Keep pages empty and exclude columns, events, current time, zoom, day mode, and alternate motion implementations.

## Migration Plan

1. Add and fully test explicit full-day geometry, scroll clamps, hour-label formatting input, and pure axis/press transitions while preserving old time-grid defaults.
2. Restructure the owned page presentation into one fixed gutter and one three-page timed lane driven by the shared vertical offset.
3. Extend the current pan worklet path with immutable axis locking, bounded vertical motion, cancellation, and settled-offset reporting while preserving T02 paging revisions.
4. Wire the device clock preference and retained settled offset through the Calendar screen/controller; keep Agenda and event facts unchanged.
5. Update focused tests, repository contracts, Architecture Book current-state guidance/changelog, and the revision-bound T03 owner-evidence note.
6. Run local-green, strict OpenSpec, native/harness checks, update the same draft PR, and pause on the ticket-specific owner QA and human review gate.

Rollback is a source/build rollback to the accepted T02 revision. There is no persisted-data, server-contract, dependency, or native-binary migration and no alternate renderer remains dormant.

## Open Questions

None. The canonical T03 ticket, approved D02/D04 boundaries, T02 implementation, and Expo SDK 56 APIs resolve the proposal boundary. If native evidence shows the single-handler approach cannot meet axis lock, inertia, or continuity on either platform, stop and return the measured failure to the Founding Engineer before introducing a native scroll/pager comparator or changing an approved decision.
