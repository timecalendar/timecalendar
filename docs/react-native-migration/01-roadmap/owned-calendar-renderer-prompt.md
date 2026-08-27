# Owned React Native calendar renderer implementation prompt

> **Status: historical, unapproved implementation prompt. Do not implement from this file.** Product scope discovery now lives in [`../03-owned-calendar-renderer/README.md`](../03-owned-calendar-renderer/README.md). Every proposed feature, threshold, API, and technology below remains unconfirmed unless it is later recorded as an explicit product-owner decision.

The historical prompt is reproduced below for audit. Do not execute it.

## Prompt

You are working in `/Users/samuelprak/Projects/Perso/timecalendar`.

Design, implement, benchmark, and integrate an owned React Native calendar timeline renderer that replaces `@howljs/calendar-kit`. This is not a visual-only rewrite. The current dependency has produced incorrect dates during mode changes, blank intermediate screens, multi-second rebuilds, excessive mounting work, and profiler crashes. Preserve the product behavior and renderer-independent domain logic, but do not port library-specific workarounds.

Performance with 1,000 or more events and complete accessibility support are non-negotiable acceptance requirements. Pinch zoom is required and must match the focal-point-preserving behavior of the existing Flutter calendar.

### Read before designing

Read the relevant files completely before changing code, including:

- `mobile/AGENTS.md` and the repository-level instructions.
- `docs/react-native-migration/`, especially the calendar roadmap and performance backlog.
- `docs/mobile/architecture-book/calendar.md`, `accessibility.md`, `testing.md`, `theming.md`, and the Definition of Done.
- Calendar ADRs 019, 020, 021, and 032.
- `mobile/src/features/calendar/ui/calendar-screen.tsx`, its controller/header/status components, and its tests.
- `mobile/src/features/calendar/renderer/index.ts`, the renderer contract, and every file under the current `renderer/calendar-kit/` adapter.
- The agenda components, time-grid, overlap-layout, and calendar event source.
- The Flutter week/day renderer, synchronized scroll controller, snapping physics, zoom settings, and zoom persistence. Start with `app/lib/modules/calendar/widgets/week_view/week_view_layout.dart`.
- Current dependencies, runtime configuration, Git status, and uncommitted changes.

Preserve unrelated working-tree changes. When documentation and implementation disagree, treat current product behavior as the oracle, record the discrepancy, and update the relevant documentation.

### Required product behavior

The renderer supports:

- Day, week, and the existing separate agenda view.
- Runtime day/week switching without remounting the expensive renderer tree.
- Preservation of the visible local date, vertical offset, zoom, and relevant selection during a mode switch.
- Horizontally paged navigation with native-feeling gestures and snapping.
- A vertically scrollable time grid, currently approximately 07:00 to 21:00.
- A fixed hours column synchronized with the event canvas.
- Five-day or seven-day weeks, driven by product settings.
- Timed, overlapping, multi-day, and all-day events.
- A dedicated all-day lane and current-time indicator.
- Event press, Today, and programmatic date navigation.
- French and English localization, light/dark app tokens, Dynamic Type, reduced motion, and correct iOS/Android bottom insets.
- Pinch-to-zoom with persisted zoom level and accessible zoom controls.

### Module boundary

Replace the implementation behind the existing internal module at `mobile/src/features/calendar/renderer/`. Do not publish a general-purpose package yet. Preserve or deliberately refine its small renderer-neutral API so extraction remains possible after a second consumer exists.

The calendar screen owns product orchestration, navigation, menus, and event loading. The renderer owns page virtualization, gestures, synchronized scrolling, zoom, event geometry, visible-item rendering, and timeline accessibility.

Continue using renderer-independent primitives such as `CalendarEvent`, `layoutOverlaps`, time-grid calculations, and `useCalendarEvents` where correct. Do not expose Reanimated or gesture implementation details to the feature screen.

A starting contract is:

```ts
type CalendarTimelineMode = "day" | "week";

type CalendarTimelineProps = {
  mode: CalendarTimelineMode;
  anchorDate: Date;
  events: CalendarEvent[];
  startMinute: number;
  endMinute: number;
  showWeekends: boolean;
  bottomInset: number;
  initialPixelsPerHour?: number;
  onVisibleDateChange?: (date: Date) => void;
  onSettledDateChange?: (date: Date) => void;
  onZoomEnd?: (pixelsPerHour: number) => void;
  onPressEvent: (event: CalendarEvent) => void;
};

type CalendarTimelineHandle = {
  goToDate(date: Date, options?: { animated?: boolean }): void;
  goToToday(options?: { animated?: boolean }): void;
  scrollToMinute(minute: number, options?: { animated?: boolean }): void;
  getVisibleDate(): Date;
};
```

Refine this contract after the audit. Use existing theme, localization, navigation, and settings providers.

### Current adapter inventory

Treat `renderer/calendar-kit/` as temporary compatibility code. Its vendor imports, `EventItem` projection, inclusive all-day end conversion, calendar-kit theme shape, event tiles, four-page packing radius, quarter-quantized event window, and immediate-versus-settled callback translation are library-specific. Preserve their product outcomes, but do not copy those mechanisms into the owned renderer.

The `renderer/index.ts` facade and `renderer/types.ts` contract are the integration point. The calendar screen must continue to work only with `CalendarEvent`, dates, renderer modes, and the neutral imperative handle. Keep agenda rendering, synchronization, route handling, focus-date consumption, native header controls, empty/error UI, and event loading outside the timeline implementation.

The current screen displays a seven-day week. Treat that running behavior as the present oracle; add the requested persisted five/seven-day choice as owned-renderer product work rather than silently changing the default during extraction.

### Horizontal virtualization

The logical date range is unbounded while the mounted tree remains bounded:

- Keep the visible page and only a small overscan, normally one or two pages per side.
- Recycle pages or safely recenter the paging coordinate before native limits.
- Never create an item for every date in the supported range.
- Never mount a hidden second calendar or cache duplicate complete trees.
- Page keys must not retain obsolete pages indefinitely.
- A day/week geometry change is atomic around the currently visible date.
- Never show a fallback date, unrelated month, empty frame, or black/white transition.

Use local calendar-day arithmetic. Do not navigate by adding fixed 24-hour millisecond durations because daylight-saving days are not always 24 hours.

### Vertical scrolling and pinch zoom

Use one authoritative vertical offset shared by the fixed hours column and event grid. Keep frame-frequency scroll and gesture work on the UI thread. Do not update React state on each frame.

Port the Flutter focal-point invariant. At pinch start capture the hour height, scroll offset, and focal point relative to the timeline viewport. During scaling preserve the minute under the fingers. The Flutter relationship is equivalent to:

```text
contentY = focalY + previousScrollOffset
nextOffset = previousScrollOffset + contentY * scale - contentY
```

Validate the React Native coordinate spaces rather than copying this mechanically.

- Clamp zoom to useful minimum and maximum hour heights.
- Keep the focal time visually stable.
- Persist only the settled zoom level through the app settings seam.
- Do not rerender all events on each zoom frame.
- Provide localized zoom-in, zoom-out, and reset actions for users who cannot pinch.
- Respect reduced motion for optional animations.

### Event indexing and virtualization

The renderer handles at least 1,000 loaded events without mounting 1,000 event components.

- Normalize and index events only when inputs change.
- Index by every local day on which an event renders.
- Query only mounted pages and their overscan.
- Compute overlap geometry per required day/page and cache it on stable inputs.
- Invalidate only affected dates where practical.
- Keep event props, callbacks, and keys stable.
- Do not copy the full event collection into every page.
- Do not deep-compare an entire store for each subscriber.
- Native node count must depend on visible content, not the loaded collection or date range.

Benchmark 1,000 events across a quarter, a dense week, more than 100 events on one day, a large overlap cluster, back-to-back events, multi-day timed events, all-day spans, clipped events, and hidden calendars.

Preserve deterministic overlap packing and the rule that back-to-back events do not overlap.

### Date and event semantics

- All-day values represent floating calendar dates even though their boundaries use UTC midnight.
- All-day `endsAt` is exclusive; derive the last covered day safely from `endsAt - 1 ms`.
- Safely handle zero-duration and invalid ranges.
- Never infer all-day status from duration.
- A timed event lasting 24 hours or more remains timed.
- Clip timed multi-day segments to each displayed day and the visible time grid.
- Keep all-day layout separate from timed overlap calculations.

Centralize these rules in pure, thoroughly tested utilities.

### Accessibility architecture

Support VoiceOver, TalkBack, Switch Control, Dynamic Type, reduced motion, and high-contrast usage.

- Give every interactive control localized roles, labels, states, and useful hints.
- Event labels include title, date, start/end time or all-day state, and location where present.
- Traversal follows logical date/time order, not recycled native mount order.
- Recycled and offscreen pages expose no stale accessibility elements.
- Create semantic nodes only for visible or intentionally nearby events.
- Announce the settled date without announcing every swipe offset.
- Provide accessible zoom controls in addition to pinch.
- Preserve full event semantics when narrow visual tiles hide text.
- Meet 44-point iOS and 48-dp Android target guidance where feasible.
- Avoid nested touchables and never disable font scaling.
- Preserve an accessible agenda/list representation for dense schedules.
- Use WCAG AA application token pairs and never communicate state through color alone.

A canvas renderer is acceptable only with a synchronized, virtualized native semantic layer. Accessibility cannot be traded for fewer views.

### Technology decision

Start with React Native, Reanimated, Gesture Handler, Hermes, and the New Architecture already in the app. Prefer bounded React Native views and UI-thread transforms unless measurements show they cannot meet the target.

Do not add Skia or another native renderer by assumption. A time-boxed comparison must measure frame performance, memory, native build and Expo impact, accessibility complexity, text, hit testing, and maintenance. Record evidence in an ADR before adding a major dependency.

### Performance acceptance

Establish a baseline first and measure release-like builds on real devices, including a representative low-end Android device.

- No empty, black, white, or wrong-date frame during mode changes.
- Immediate visual response; target usable interaction within 250 ms on the supported low-end Android device.
- No mode-change loader hiding renderer initialization.
- Mounted pages remain bounded, normally at five or fewer.
- Mounted event nodes depend only on the visible window and overscan.
- Vertical scrolling, paging, and pinch zoom run at the device refresh rate.
- No JS state updates or full-tree commits for every gesture frame.
- Memory and native node counts remain stable after repeated paging and mode switching.
- Profiling marks remain lightweight and bounded.

Measure mode request, geometry update, event query/indexing, overlap layout, first correct visible page, first interactive frame, and settled page. Use Reassure where valuable, but prioritize release builds and real-device frame and memory data.

### Regression constraints

Do not reintroduce:

- Dynamic geometry with stale pager coordinates.
- Uncontrolled fallback dates or `scrollToNow` overriding explicit navigation.
- Trailing-debounce-only visible dates for event loading.
- Fixed layout delays or arbitrary loading timeouts.
- Full renderer remounts on day/week changes.
- Two mounted calendar trees, offscreen cache trees, or duplicated event arrays.
- Whole-store deep comparisons for every subscriber.
- Event prop/state churn on every scroll frame.
- Trees proportional to total dates or total loaded events.
- Page-buffer increases as the primary performance solution.

### Delivery sequence

1. Audit responsibilities, working-tree state, behavior, and baseline measurements.
2. Write an ADR for the owned renderer and technology choice.
3. Implement tested pure date, page, event-index, clipping, layout, and zoom geometry.
4. Build a static accessible single-day timeline.
5. Add bounded horizontal recycling and programmatic navigation.
6. Add atomic day/week geometry switching.
7. Add focal-point-preserving pinch zoom and accessible controls.
8. Complete all-day, multi-day, localization, theming, and accessibility behavior.
9. Profile and harden against dense real-device datasets.
10. Replace the calendar-kit adapter behind the existing renderer facade, optionally using a development flag. Never mount both engines simultaneously.
11. After parity and device acceptance, remove calendar-kit, its patch-package patch, obsolete workarounds, and library-specific instrumentation.

Do not remove the old renderer until the replacement passes the agreed device matrix.

### Tests and deliverables

Test DST transitions, local day/week anchors, week starts, five/seven-day modes, mode retention, rapid switching, overlaps, back-to-back events, multi-day clipping, exclusive all-day ends, zero-duration ranges, zoom focal preservation and clamps, page recycling, indexing invalidation, semantic labels/order, and bounded nodes with 1,000 events.

Run the repository-prescribed typecheck, lint, unit, coverage, and mobile end-to-end checks. Manually verify recent iOS and Android devices, low-end Android, VoiceOver, TalkBack, large text, reduced motion, light/dark themes, and French/English.

Deliver the architecture plan, renderer, pure engine, tests, ADR, before/after device measurements, node/memory observations, accessibility results, migration checklist, and remaining risks. Do not declare completion from simulator or unit-test results alone.
