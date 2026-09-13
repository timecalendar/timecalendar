## Why

The owned Calendar can page one empty week horizontally, but it still has no clock surface and cannot reach times outside its initial blank viewport. T03 adds the next owner-testable slice: a complete 24-hour grid that scrolls vertically while preserving the accepted one-week paging behavior.

## What Changes

- Add an explicit 00:00–24:00 geometry contract for the owned renderer, with major hour lines, minor half-hour lines, and bounded minute-to-pixel and vertical-offset arithmetic.
- Render the full-day grid beside a left hour gutter; move both from one authoritative vertical offset while keeping the gutter outside horizontal week translation and the screen-owned date heading above vertical motion.
- Replace the horizontal-only gesture decision with deterministic one-finger axis locking so vertical scrolling and horizontal week paging cannot move together; keep the chosen axis through reversals and cancel press eligibility once movement wins.
- Preserve the visible clock position when the committed week changes, including swipes and accessibility actions, while retaining T02 revision, cancellation, page-bounding, and announcement guarantees.
- Read the device's 12/24-hour clock preference through the installed Expo 56 localization seam and pass an explicit nullable preference into pure hour-label formatting, with the existing 24-hour brand convention as the unavailable-platform fallback.
- Add focused pure, state, renderer, screen, repository-contract, and device-evidence requirements for geometry, clamps, alignment, gesture arbitration, press cancellation, retained flows, and native feel.
- Update current Calendar Architecture Book guidance and its changelog for the T03 contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Extend the T02 empty paged week with a complete vertically scrollable day, pinned horizontal gutter/date-heading behavior, explicit device hour-cycle labels, and one-axis gesture arbitration while later event, column, zoom, and current-time capabilities remain absent.

## Impact

- Affected runtime modules: `mobile/src/features/calendar/renderer/owned-calendar-shell.tsx`, focused feature-private renderer helpers as earned by the implementation, `mobile/src/features/calendar/ui/calendar-screen.tsx`, and pure Calendar helpers under `mobile/src/features/calendar/data/time-grid.ts` and `mobile/src/features/calendar/data/format.ts`.
- Affected tests and harnesses: Calendar data/renderer/screen suites, `mobile/calendar-owned-shell.contract.test.ts`, existing localization mocks only where the explicit device clock input needs coverage, and the established Maestro selector/harness contracts.
- Affected documentation: `docs/mobile/architecture-book/calendar.md`, its changelog, and a T03 owner-device evidence note.
- Existing Expo Localization, Gesture Handler, Reanimated, and Worklets dependencies are sufficient. No API contract, generated client, database schema, native/store configuration, deployment/CI configuration, or legacy Flutter change is expected.
