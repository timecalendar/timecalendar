## Why

The owned Day/Week calendar still renders at one fixed hour spacing, so students cannot enlarge or condense the schedule while preserving the clock context they are inspecting. T06 is the next accepted renderer slice after T05 and must add zoom without regressing the native vertical and horizontal motion already accepted.

## What Changes

- Add continuous two-finger pinch zoom whose focal clock time remains stationary, including explicit precedence over active vertical scrolling and horizontal paging.
- Add localized zoom-in, zoom-out, and reset menu actions that preserve the viewport-center clock time, announce the settled result, and disable at measured limits.
- Drive gutter labels, major/minor grid lines, the 24:00 boundary, pager pages, and scroll content height from one shared dynamic hour scale.
- Persist one validated per-installation zoom value shared by Day and Week, recover missing, corrupt, non-finite, and out-of-range values to the measured default, and preserve it through backend reset.
- Extend deterministic and repository-contract coverage for focal math, clamps, repeated commands, finger-count changes, native-owner arbitration, persistence, and the single-renderer/no-per-frame-React-state invariants.
- Record the initial measured minimum/default/maximum values, exact build evidence, and the complete owner checklist before acceptance; defer populated-event density tuning to T25.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-calendar-timeline`: Day/Week gains focal-preserving pinch and accessible menu zoom on the existing owned native scroll/pager renderer.
- `mobile-settings-prefs`: Settings gains a validated, reactive, shared Day/Week zoom preference and total recovery behavior.
- `mobile-storage`: The zoom key becomes a classified environment-independent MMKV value preserved by backend reset.

## Impact

- Affects `mobile/src/features/calendar/renderer`, pure time-grid/zoom helpers in `mobile/src/features/calendar/data`, Calendar screen/controller and platform menu composition, Settings preference seams, localized resources, `@/storage` key classification, focused tests, and `mobile/calendar-owned-shell.contract.test.ts`.
- Uses the installed Gesture Handler, Reanimated/Worklets, native `ScrollView`, and native `PagerView`; it adds no dependency and no second renderer or motion owner.
- Changes no OpenAPI/generated client, server schema/migration, native/store configuration, deployment/CI workflow, or legacy Flutter surface.
- Native iOS/Android gesture arbitration, automatic-inset focal stability, accessibility announcements, and device feel require revision-bound device evidence and owner acceptance in this ticket.
