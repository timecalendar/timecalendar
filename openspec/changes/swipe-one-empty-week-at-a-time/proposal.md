## Why

The owned Calendar shell is stable but cannot move beyond its initially selected date. T02 adds the first bounded, testable motion slice: one gesture or accessible action advances exactly one complete launch week while keeping the visible date context coherent.

## What Changes

- Add horizontal paging to the empty owned Calendar shell with the existing Gesture Handler, Reanimated, and Worklets stack.
- Normalize the week surface to an explicit Monday-first launch policy and shift weeks with display-zone-aware calendar arithmetic rather than fixed durations.
- Keep the settled date and headings unchanged while a drag is held, then commit the destination page, date, headings, and accessibility context once after settle.
- Bound mounted work to the current week, its two immediate neighbours, and at most one pending replacement generation; invalidate interrupted and stale completions.
- Add translated, platform-sized previous/next week actions that use the same revisioned transition path as swipes and announce only an accepted settled week.
- Add focused unit, component, repository-contract, and native evidence requirements for one-page flings, cancellation/reversal, repeated delivery, retained-page stability, and month/year/DST boundaries.
- Update current Calendar architecture guidance and the Architecture Book changelog for the T02 contract.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Extend the T01 empty owned shell with bounded, atomic, accessible one-week paging while keeping later grid, event, scrolling, mode, weekend, and zoom capabilities absent.

## Impact

- Affected runtime modules: `mobile/src/features/calendar/renderer`, `mobile/src/features/calendar/ui/calendar-screen.tsx`, `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`, and pure week arithmetic under `mobile/src/features/calendar/data`.
- Affected tests and harnesses: focused Calendar data/renderer/screen suites, `mobile/jest/setup-reanimated.ts` only if the supported package mock needs a narrow observable wrapper, and the owned-renderer repository contract.
- Affected documentation: `docs/mobile/architecture-book/calendar.md`, its changelog, and a T02 owner-device evidence note.
- Existing dependencies are sufficient; no API contract, generated client, database schema, native/store configuration, deployment/CI configuration, or legacy Flutter change is expected.
