# Calendar

## Rendering

The day/week timeline uses `@howljs/calendar-kit` v2 through the owned calendar
renderer seam. Feature code must not import the package directly. The dependency is
patched with `patch-package`; installs fail when the pinned package no longer accepts
the patch. The renderer-neutral contract lives in `features/calendar/renderer`, while
the dependency, its event projection, theme mapping, tiles, event-window policy, and
packing workarounds live in `renderer/calendar-kit`. See
[ADR 033](./decisions/033-calendar-renderer-module-boundary.md) and
[ADR 032](./decisions/032-calendar-kit-vendor-patch-live-anchor.md).

The app owns pure calendar primitives for grouping, time-grid math, overlap layout,
day keys, and formatting. Home and agenda use these primitives without depending on
the timeline renderer. Calendar-kit's quarter event-window selection is an adapter
workaround, not a domain primitive.

The grid uses a quarter-quantized event feed with a two-month buffer and four pages per
side. Calendar-kit tracks the visible anchor during scrolling so fast flings do not show
an empty grid. Re-check this coupling and dense-calendar performance when changing the
renderer, patch, buffer, or page count.

All-day events use date-only renderer values derived from UTC day keys. Their stored end
is exclusive while calendar-kit's displayed end is inclusive, so projection subtracts
one millisecond before deriving the final day. Timed events retain date-time values.

## Event source

`CalendarEvent` is the UI domain type. The single event-source seam:

1. reads synced events and personal events;
2. maps both to `CalendarEvent`;
3. removes events from invisible calendars and the hidden-event store;
4. returns the unified collection to Home, Calendar, and event details.

Do not duplicate these filters in screens. Synced rows remain verbatim cache data;
formatting and all-day conversion are rendering projections.

## Sync and offline behavior

Sync sends durable user-calendar tokens to the generated batch endpoint and replaces
`calendar_events` in one synchronous SQLite transaction. A fetch failure keeps the
last good local rows and produces a recoverable UI state. A local transaction failure
is unexpected and is recorded through `@/firebase`.

SQLite live reads are coalesced to one whole-table read per macrotask. Repositories must
use synchronous Drizzle transaction callbacks with `.run()` executors because the Expo
SQLite synchronous driver does not await async callbacks.

Sync runs at startup, foreground/resume, manual refresh, source changes, and notification
receipt. `calendar_events` is disposable cache and is rebuilt from durable source tokens;
it is not a migration/import target.

## Surfaces

- Calendar offers day/week timeline and agenda modes, with platform-specific native chrome.
  The current week displays seven days; configurable five/seven-day weeks belong to the
  replacement renderer work.
- The calendar screen owns product orchestration and event loading. Its controller owns
  view/date state and one-shot focus navigation; header and status UI are separate components.
- Home shows today only, separating all-day and timed events. When today is empty it may
  summarize the next active day without substituting that day into today's timeline.
- Event details are shared by personal and synced events and include the event checklist.
- Personal events expose edit/delete actions; synced events expose hide/unhide behavior.
- A Home action may pass a one-shot `focusDate` to Calendar, which consumes it after use.

## Verification

Unit/component tests cover projection, grouping, routing, filtering, sync orchestration,
failure states, and the renderer seam. Real scrolling, dense-calendar performance, native
pickers, accessibility, all-day lanes, and background/foreground sync remain device checks.
