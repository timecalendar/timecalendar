# Calendar

## Rendering

The T06 day/week surface is a feature-owned React Native shell under
`features/calendar/renderer`. It fills the Calendar content owner and presents the
native month/year title above a stable themed canvas, with no secondary date toolbar or arrow buttons. The
shell keeps exactly the previous, current, and next empty pages mounted in the installed
native `PagerView`. Day pages draw one dated column and advance by one display-zone civil date,
including Saturday and Sunday when Show weekends is off. Week pages draw five or seven
equal-width dated columns and advance by one complete Monday-first civil week over the complete
00:00–24:00 major-hour and half-hour grid beside one horizontally pinned hour
gutter. The gutter labels and pager share one full-day row inside a native vertical
`ScrollView`, so UIKit and Android provide drag recognition, deceleration, bounce, and
settlement while the screen-owned native heading stays outside the scroll content. A horizontal
page or labelled screen-reader increment/decrement action requests one day or week according to
the committed mode; one revisioned idle-settle path commits the date, native title,
Agenda range, page generation, and accessibility announcement together.

The vertical ScrollView remains on the first native descendant chain and uses automatic
content-inset adjustment, allowing iOS NativeTabs to account for the Liquid Glass tab bar.
One complete timed-viewport width/height/inset measurement feeds a feature-private pure resize
snapshot and monotonic geometry revision. Header lane, pager, canvas, and vertical bounds replace
atomically. Replacement preserves selected date, explicit mode, scale, and the inset-aware clock
coordinate at the usable center, clamping only at 00:00/24:00. It cancels old pager, header,
queued scroll, native-owner, and pinch work before restoring without animation. Live raw offset
and automatic top/bottom insets also feed the Reanimated zoom coordinator. A two-finger pinch updates one bounded 40–120
pixels-per-hour scale and a focal-preserving raw offset on the UI thread; React receives only the
settled scale/offset. After pinch takes ownership, callbacks from the interrupted scroll and pager
epochs stay gated through settlement; each native owner reopens only when a new drag begins, so
queued offset, selection, and idle events cannot replace the focal result or dated header.
Calendar tab reselect-to-top is disabled. The ScrollView
exposes the committed localized day or week date context as an adjustable accessibility label
with mode-specific translated previous/next actions.
One clipped three-slot weekday/date strip remains pinned above vertical motion beneath the native
month title. Its fixed spacer matches the hour gutter, and its previous/current/next slots reuse the
same ordered column records as the three clock pages. A feature-private page-scroll hook wraps the
installed pager with Reanimated `createAnimatedComponent` and attaches its callable `useHandler` /
`useEvent` seam. Native `position` and `offset` write shared values whose `useAnimatedStyle`
projection drives the strip across the measured content lane on the UI thread, so there is no
React Native `Animated`, per-frame React state, second pager, responder, timer, or animation owner.
Only the centered committed slot is accessible; moving
neighbours stay hidden until accepted idle settlement rebuilds the centered generation. Snap-back,
AppState inactivity, generation replacement, and preference or geometry-revision replacement recenter
both surfaces without committing a destination. Monday is an explicit launch input; the pure
display-zone transition model advances Day by one civil date and Week by one Monday-first civil
week. Week presentation removes Saturday/Sunday by weekday identity when the persisted Show
weekends preference is off, while Day still advances through them. Agenda retains its seven-day
range. Today is identified in the effective display zone and has both a
typography/outlined-shape cue and localized semantics. One controller-owned clock in
`features/calendar/data/clock.ts` drives that cue, the Today action, and the timeline's current-time
presentation. It refreshes at the next displayed minute only while the route is focused and the app
is active, recomputes immediately on focus or foreground return, and clears its pending timeout on
blur, background, and unmount. The renderer receives the resulting `Date` value and remains
timer-free. There is no additional single-date header or permanent paging toolbar.

On the first complete timed-viewport measurement of a mount, `NOW_VIEWPORT_FRACTION` places the
effective-zone current minute 30% down the usable automatic-inset viewport. The raw offset clamps
against explicit 00:00–24:00 bounds at the settled scale. Later clock ticks, foreground returns,
geometry revisions, zoom settlements, and accepted date or mode transitions preserve the mounted
viewport instead of seeking again. Each page containing today's column draws a rule with a filled
leading cap, and the committed centre page adds an accessible typographic time chip in the gutter;
pages without today, including a hidden weekend, show neither. The live indicator coordinate follows
the UI-thread scale while its minute changes only at displayed precision. The renderer passes explicit
full-day bounds to `nowIndicatorPosition`; the shared helper's 07:00–21:00 defaults remain unchanged
for Home and other consumers. Neither clock ticks nor midnight rollover announce or start continuous
idle animation.

The renderer keeps a bounded composition boundary in `owned-calendar-shell`, one
`owned-calendar-coordinator` hook for pager/scroll refs and cancellation/settlement lifecycle, one
`owned-calendar-zoom` hook for live scale/offset/inset geometry, and passive
`owned-calendar-header` plus `owned-calendar-canvas` presentation units. The clock grid
remains inside the canvas unit. These feature-private views receive complete page models and
handlers; they do not import screen orchestration, storage, navigation, or event data. Ordinary
models and closures rely on the enabled React Compiler rather than manual memoization.

Pager selection is recorded independently from pager state and commits only when the native
pager reports idle at an edge. The accepted generation remounts the same three direct,
non-collapsible children around the new anchor, centered again at page 1. Development builds
give each day or week page a stable date label and contrasting tint so movement and the
edge-to-center handoff remain inspectable; production omits those diagnostics. AppState inactivity
cancels pending work and recenters on the committed timeline anchor. The grid uses filled physical-hairline
views in static scroll content, with one extra hairline of render height so the exact 24:00
closing boundary is not clipped.

`CalendarScreen` passes `useCalendars()[0].uses24hourClock` into pure gutter formatting.
`true` produces 24-hour labels, `false` produces 12-hour day periods, and `null` retains
the deterministic 24-hour convention. The controller retains only settled, clamped clock
offsets, so accepted day/week revisions and Day/Week/Agenda switches preserve the visible time
without reporting frame-frequency values to React. Gutter labels, minor and major lines, the
24:00 closing boundary, columns, all three pages and scroll extent derive from the same scale.
Day and Week share the validated environment-independent zoom preference; Agenda neither changes
nor resets it. Their native platform menu offers 10-pixel Zoom in/out and Reset commands, anchors
them at the live usable viewport center, disables them at 40/120/60, and announces one settled
percentage.

This is an intentionally incomplete pre-launch milestone. Timeline events, all-day and
timed tiles, and populated-event density tuning remain pending until their numbered owned-renderer
slices land.
Shared time-grid helpers still default to 07:00–21:00; only the owned shell opts into
explicit full-day bounds. Paging remains bounded to one adjacent empty day or week according to
the committed mode; there is no far-date pager. The blank shell never claims
that stored event data is empty: Agenda remains the route for reading and opening stored
events during this cut.

The app owns pure calendar primitives for grouping, time-grid math, overlap layout,
day keys, and formatting. Home and Agenda use the applicable primitives without
depending on the timeline renderer. The shell consumes a committed timeline mode, civil anchor,
and display zone for its three page identities; retained time-grid and overlap primitives do
not imply that the shell renders a grid or events.

Every displayed timed-event value and day boundary is computed in the effective display
zone ([ADR 035](./decisions/035-display-timezone-preference.md)). Consumers obtain the
zone from `useDisplayZone()` and pass it explicitly to formatters, day-key and bucketing
helpers, and time-grid math; helpers never read the zone implicitly. `CalendarScreen`
uses the same explicit zone for its selected-date heading and Agenda range. Launch weeks
start on Monday through an explicit first-weekday input, and whole-week shifts compose
civil day-key helpers rather than fixed-duration milliseconds. The shell has no event
window. Deriving a displayed time or day from device-local `Date` fields
or `toLocaleString` is a defect. All-day events are
the exception: they stay on the floating UTC-day-key path and never shift with the
preference.

`CalendarScreen` owns one committed timeline mode and civil anchor and resolves its localized
heading in the effective display zone. Day→Week selects the containing Monday-first week;
Week→Day selects its first date. The validated Day/Week/Agenda choice persists per installation,
survives backend reset, and defaults to Week when missing or corrupt; selected date and clock
offset remain fresh-process state. A valid one-shot `focusDate` and the retained Today action
normalize to the target day or containing launch week and replace pending motion. Swipe and accessibility-action
requests carry monotonic revisions; duplicate, cancelled, and stale completions cannot
relabel the settled screen. Agenda reads the unchanged bounded seven-day event range and
keeps checklist progress, refresh/retry, synced and personal event activation, and unified
event-details navigation. Agenda retains the settled timeline anchor without claiming active-section
transfer before T18. Complete Today/direct-date intent remains T17.

Every geometry helper the renderer reaches for on the UI thread lives in
`features/calendar/data/time-grid.ts` and carries the `"worklet"` directive, transitively:
a worklet that calls a plain JS function throws at runtime, and a `useAnimatedStyle`
computing a top offset from `minuteToPixel` is exactly that shape. Neither `tsc` (the
directive is a string) nor Jest (the Reanimated mocks evaluate on the JS thread) can see
the fault, so a device is the only place it surfaces. Two gates stand in for the device:
`local/no-js-call-in-worklet` rejects a UI-thread call to a helper that is not blessed
worklet-safe, and time-grid's "UI-thread (worklet) contract" suite asserts Babel stamped
`__workletHash` on every export but `nowIndicatorPosition`, which is Intl-bound and pinned
JS-thread-only. New UI-thread math belongs in that module with the directive; anything a
worklet calls must itself be a worklet.

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

- Calendar offers the T06 owned Day/Week shell and Agenda, with platform-specific native chrome.
  Day and Week share one full-day native vertical scroll surface, a horizontally pinned gutter, native
  pager arbitration, a three-page working set, reduced-motion settlement, hidden neighbour/grid
  semantics, accessible previous/next alternatives, and one pinned localized five/seven-date
  header aligned with every clock page. Day has one column; Week has five or seven, and both use
  bounded shared zoom with accessible native menu commands. A fresh mount opens around the current
  display-zone minute and shows the shaped column rule plus accessible gutter time chip; events and
  selectable dates belong to later renderer slices.
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

Unit/component tests cover display-zone day/week civil arithmetic, mode persistence and corrupt
recovery, revision/cancellation semantics, one/five/seven-column geometry, three-page native pager
and control behavior, native scroll settlement/restoration, atomic settled screen context,
Calendar remount and selection, Agenda grouping/routing, filtering, sync orchestration, failure
states, the lifecycle-scoped minute clock, fresh-open full-day clamps, indicator visibility, and the
repository cutover contract. `calendar-owned-shell.contract.test.ts` pins the clock as the calendar's
only timer owner, keeps the renderer timer-free, and rejects repeating animation work. Native held-drag mode switching, pinch
arbitration/focal stability, visible-hour continuity, preference restart, weekend traversal,
assistive technology, platform chrome, and physical-device presentation remain recorded owner
checks and are not claimed by host automation. Dense-calendar and all-day-lane behavior remain
outside this empty-shell milestone.
