# Calendar

## Rendering

The T02 week surface is a feature-owned React Native shell under
`features/calendar/renderer`. It fills the Calendar content owner and presents the
native month/year title above a stable themed canvas, with no secondary date toolbar or arrow buttons. The
shell keeps exactly the previous, current, and next empty pages mounted. A horizontal
gesture or labelled screen-reader increment/decrement action requests one whole week; transient translation
stays on the UI thread, while one revisioned settle path commits the date, native title,
Agenda range, page generation, and accessibility announcement together.

The viewport is an `Animated.View` directly beneath `PanGestureHandler`, so Reanimated
registers the native worklet events on the touch owner. It exposes the committed localized
week date as an adjustable accessibility label with translated previous/next actions.
Development builds show centered preview labels, Monday date keys, measured viewport bounds,
and stable week tints. These are motion diagnostics, not permanent calendar chrome.
T04 places weekday/date labels in the Monday–Sunday columns beneath the native month title;
there is no additional single-date header or permanent paging toolbar.

Movement and state-change events each have their own Reanimated `useEvent` holder and
one event name. A holder is never shared across two native props: the installed
Reanimated implementation keys registration IDs by view tag, so sharing a holder can
overwrite IDs and leave stale callbacks registered after rebuild or unmount.

A requested transition survives owner rerenders: callback identity does not cancel motion.
The three pages occupy a horizontal strip at a controller-owned cumulative page position.
An accepted destination already rests at its next position before the controller commit;
the replacement generation moves the strip layout by the same amount while preserving the
native transform. The destination therefore remains at the same physical coordinate without
a post-commit wrong-week, blank, partial, or tint frame. New pans during an accepted settle
are ignored until that commit.
BEGAN records pan eligibility without cancelling animation. Only ACTIVE captures the drag
origin and interrupts snap-back, because iOS can emit BEGAN while resetting after release.
A drag interrupting snap-back starts from the current offset. Short releases, cancellations,
and failed gestures start snap-back directly on the UI runtime; returning to the committed
week does not depend on a queued JavaScript callback or its transition guards. Predominantly vertical
motion cancels paging. AppState inactivity/backgrounding cancels pending motion and
returns to the committed week; stale queued gesture work carries an invalidated motion
epoch and cannot restart paging after foregrounding.

This is an intentionally incomplete pre-launch milestone. Timeline events, all-day and
timed tiles, the 7:00–21:00 grid, current-time presentation, vertical scrolling, hour
labels, weekday columns, weekend filtering, day/week switching, pinch, and zoom are
absent until their numbered owned-renderer slices land. Paging remains bounded to one
adjacent empty week; there is no far-date pager. The blank shell never claims
that stored event data is empty: Agenda remains the route for reading and opening stored
events during this cut.

The app owns pure calendar primitives for grouping, time-grid math, overlap layout,
day keys, and formatting. Home and Agenda use the applicable primitives without
depending on the timeline renderer. The shell consumes a committed week anchor and
display zone for its three page identities; retained time-grid and overlap primitives do
not imply that the shell renders a grid or events.

Every displayed timed-event value and day boundary is computed in the effective display
zone ([ADR 035](./decisions/035-display-timezone-preference.md)). Consumers obtain the
zone from `useDisplayZone()` and pass it explicitly to formatters, day-key and bucketing
helpers, and time-grid math; helpers never read the zone implicitly. `CalendarScreen`
uses the same explicit zone for its selected-date heading and Agenda range. Launch weeks
start on Monday through an explicit first-weekday input, and whole-week shifts compose
civil day-key helpers rather than fixed-duration milliseconds. The shell has no event
window or now indicator. Deriving a displayed time or day from device-local `Date` fields
or `toLocaleString` is a defect. All-day events are
the exception: they stay on the floating UTC-day-key path and never shift with the
preference.

`CalendarScreen` owns one committed week anchor and resolves its localized heading in the
effective display zone. A valid one-shot `focusDate` and the retained Today action
normalize to the containing launch week and replace pending motion. Swipe and accessibility-action
requests carry monotonic revisions; duplicate, cancelled, and stale completions cannot
relabel the settled screen. Agenda reads the unchanged bounded seven-day event range and
keeps checklist progress, refresh/retry, synced and personal event activation, and unified
event-details navigation. The view selector offers only Week and Agenda until distinct
day/week behavior exists.

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

Sync runs at startup, manual refresh, source changes, and notification receipt.
`calendar_events` is disposable cache and is rebuilt from durable source tokens; it is not a
migration/import target.

> **Correction (TIM-399).** This sentence also listed _foreground/resume_. It is not true and
> was not made true here: `AppState` is wired in exactly two places in `mobile/src` —
> `src/updates/ota-update-runtime.tsx` and `src/features/activity/data/lifecycle.ts` — and
> neither triggers a calendar sync. TIM-399 added the second of those for **Activity only**;
> read nothing into it about the calendar. A calendar foreground sync remains unimplemented.

**A successful sync fires a forced Activity refresh (TIM-399, ADR
[049](./decisions/049-activity-trigger-edges-and-failure-isolation.md)).** It is placed
immediately after the event write commits — the spec's trigger is "after event storage
succeeds" — and **before** the name-convergence block, which is a separate failure domain
whose throw must not suppress it. The call is unawaited, so `isSyncing` is not held open on an
unrelated request, and it is neither `catch`-wrapped nor inspected: `refreshNewestPage` never
rejects, so **an Activity failure structurally cannot change the sync's result**. A
`{ status: "failed" }` outcome is not a sync failure and never reaches `isError`. Neither
non-success path reaches the call: the zero-token branch returns before it, and a `replaceAll`
throw returns from its own catch.

The server normalizes recognized ADE iCal export URLs immediately before each upstream
fetch. Explicit `firstDate`/`lastDate` pairs and `nbWeeks` links use a rolling UTC window
from 12 calendar months before through 12 calendar months after the fetch date. Because a
successful sync replaces the cached upstream content, events older than that retained year
can disappear. The normalized URL is ephemeral: the original source URL remains stored so
creation and every later eligible sync recompute the window instead of persisting dates that
can expire. The enforcing boundary is
[`AdeExportWindowRenamer`](../../../server/src/modules/fetch/renamers/ade-export-window-renamer.ts),
with recognition and sync-cadence coverage beside the renamer and in the fetch/calendar-sync
service tests.

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

- Calendar offers the T02 owned Week shell and Agenda, with platform-specific native chrome.
  Week paging has one three-page working set, reduced-motion settlement, hidden neighbour
  semantics, and accessible previous/next alternatives. Day/week switching and visible
  weekday columns belong to later renderer slices.
- The calendar screen owns product orchestration and event loading. Its controller owns
  view/selected-date state and one-shot focus selection; header and Agenda status UI are
  separate components.
- Home shows today only, separating all-day and timed events. When today is empty it may
  summarize the next active day without substituting that day into today's timeline.
- Event details are shared by personal and synced events and include the event checklist.
  The route-facing screen owns only route/read/locale inputs and explicit loading,
  not-found, and resolved outcomes. Feature-internal calendar UI modules own status
  presentation, the single resolved-event hide/unhide-or-edit action boundary, and rich
  content/checklist composition; they do not widen the calendar feature barrel.
- Home upcoming/all-day/timed summaries and Agenda rows
  hide zero-item progress and share the explicit completed/total indicator. The visual
  primitive is excluded from accessibility; each owning event label announces the
  localized completed-of-total phrase once.
- Personal events expose edit/delete actions; synced events expose hide/unhide behavior.
- A Home action may pass a one-shot `focusDate` to Calendar, which consumes it after use.

## Verification

Unit/component tests cover display-zone week arithmetic, revision/cancellation semantics,
three-page gesture and control behavior, atomic settled screen context, Calendar remount
and selection, Agenda grouping/routing, filtering, sync orchestration, failure states, and
the repository cutover contract. Native held-drag feel, fling continuity, assistive
technology, platform chrome, and physical-device presentation remain recorded owner
checks; later scrolling, dense-calendar, and all-day-lane behavior is not claimed by T02.
