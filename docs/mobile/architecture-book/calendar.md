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

Every rendered event time and day boundary is computed in the effective display
zone ([ADR 035](./decisions/035-display-timezone-preference.md)): the zone from
`useDisplayZone()` is threaded explicitly into the formatters, the day-key and
bucketing helpers, the now-indicator math, the quarter event window, and the
renderer's `timeZone` prop — never read internally by a helper. Deriving a
rendered time or day from device-local `Date` fields or `toLocaleString` is a
defect; the zone-parameterized seams are the only path. All-day events are the
exception: they stay on the floating UTC-day-key path and never shift with the
preference.

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

Each successful batch also carries a server-owned, URL-free source-health object.
After event replacement succeeds, mobile fully replaces one rebuildable MMKV health
snapshot keyed by calendar ID; request or SQLite failure preserves both previous
snapshots. Missing, malformed, and future codes decode to `unknown`. Health is
advisory only: it never filters events or mutates durable calendar identity.

A stale source keeps its last-good events visible and adds a compact Calendar warning
plus reason-specific recovery controls in calendar management. Recovery starts the
existing add-calendar flow and never rewrites or removes the old source. The existing
explicit confirm-gated delete remains the only removal path. See
[ADR 043](./decisions/043-preserve-content-and-advise-source-recovery.md).

SQLite live reads are coalesced to one whole-table read per macrotask. Repositories must
use synchronous Drizzle transaction callbacks with `.run()` executors because the Expo
SQLite synchronous driver does not await async callbacks.

Sync runs at startup, foreground/resume, manual refresh, source changes, and notification
receipt. `calendar_events` is disposable cache and is rebuilt from durable source tokens;
it is not a migration/import target.

Server sync telemetry is owned by the
[server observability runbook](../../server/observability.md), not by the mobile sync
seam. Calendar URLs and tokens must never become telemetry dimensions. The server uses
only its reviewed finite upstream classifier; this boundary changes neither the mobile
API nor local sync behavior. Unexpected mobile-local failures continue to use the
privacy-safe `@/firebase` seam.

The server gives batch sync a ten-second work budget inside the client's 15-second
request timeout. Disconnect and deadline cancellation propagate to upstream iCalendar
requests; at most three due calendars run concurrently, queued work does not start after
cancellation, and every started operation settles before the batch returns. Retry-enabled
sources make at most two attempts inside a shared nine-second fetch budget (seven seconds
maximum per attempt). Failed, cancelled, or unstarted calendars retain last-known content
in the unchanged response shape.

Due-calendar selection is oldest-first and metadata-only: it loads the school relation
but not stored event JSON. A successful fetch loads previous content exactly once under
the existing persistence lock for atomic diff/log writes; final response hydration remains
separate. The binding contract and regression scenarios live in the
[server calendar sync policy](../../../openspec/specs/server-calendar-sync-policy/spec.md).

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
