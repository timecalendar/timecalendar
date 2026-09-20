# Investigation trail and diagnostics

## Report and hypothesis refinement

1. The owner reports that one horizontal week swipe works, but another quick
   swipe appears to do nothing until the first motion is completely finished.
   Native screens do not exhibit the same wait. The owner confirms iPhone and
   the React Native app, rather than Android, the website, or the Flutter app.
2. Source inspection identifies the three-page boundary, settlement only on
   `idle`, and a React pager key containing the renderer generation. Initial
   hypotheses are a boundary reached before the next window exists, a second
   gesture interrupted by pager replacement, or a gesture/geometry guard.
3. The installed iOS PagerView source uses SwiftUI `TabView` and a collection
   view delegate. It emits `settling` when deceleration begins and `idle` after
   deceleration, scrolling animation, or a drag without deceleration ends. The
   inspected delegate has no explicit disable-while-settling switch.
4. Temporary opt-in diagnostics record touches and discrete paging events.
   Logging each animation frame is deliberately avoided.
5. The owner supplies the trace preserved in part in
   [the evidence file](evidence/iphone-generation-3.jsonl). It shows a second
   native `dragging` event before `idle`, at the end of the existing page range.
   One forward revision commits after both gestures. This establishes the
   same-direction page-boundary failure.
6. The warnings in that trace lead to a separate render-time shared-value read
   in the zoom hook. Its initializer now uses the resolved input scale; the
   live pinch baseline is still read inside the pinch-start worklet.
7. Further inspection finds exactly-three-page assumptions in data planning,
   presentation models, and queries. The installed iPhone pager also uses
   `.id(props.children.count)`, making naive dynamic appending a potential native
   identity reset. More fixed pages cannot establish durable continuous paging.
8. The owner defers rebuilding and asks for this record plus removal of all
   temporary paging logs. Application source contains no diagnostic hooks from
   this investigation. The warning correction remains.

## What the temporary instrumentation measured

The logger was `traceCalendarPaging` in
[pager-page-scroll.ts](../../../mobile/src/features/calendar/renderer/pager-page-scroll.ts).
Its gate was `__DEV__ && process.env.EXPO_PUBLIC_CALENDAR_PAGING_DEBUG === "1"`.
It emitted a console prefix `[calendar-paging]` followed by JSON containing
`atMs: Math.round(performance.now())`, an event name, and the event fields.

The capture used `EXPO_PUBLIC_CALENDAR_PAGING_DEBUG=1 npm start` from `mobile/`
and a full app reload. This is the **former capture setup**, not a working
diagnostic command for current source. Reintroducing equivalent hooks would be
necessary for another instrumented capture.

| Location | Events | Fields and purpose |
| --- | --- | --- |
| Canvas full-day row | `touch-start`, `touch-end`, `touch-cancel` | Generation, geometry revision, native timestamp, rounded screen x/y, touch count. Establish that a second touch reaches the calendar. |
| Canvas effect keyed by generation and geometry | `pager-key-mounted`, `pager-key-unmounted` | Generation and geometry revision. Mark React effect setup/cleanup corresponding to pager key changes. |
| Coordinator, before page callback guards | `page-selected`, `page-state` | Incoming page/state plus an interaction snapshot. Show accepted native gestures and possible rejection conditions. |
| Coordinator transition entry points | `transition-request`, `transition-cancel`, `transition-settle` | Direction/source, recenter flag, or revision/destination page, plus the snapshot. Connect gestures to committed week changes. |
| Coordinator generation layout effect | `generation-reset` | Previous and next generation. Mark the JavaScript-side recenter/reset. |

The interaction snapshot contained `generation`, `currentGeneration`,
`geometryRevision`, `currentGeometryRevision`, `ownerGeometryRevision`,
`pagerState`, `selectedPage`, live header `position` and `offset`,
`pendingRevision`, `consumed`, `callbacksBlocked`, `pinchActive`, and `foreground`.
A diagnostic `pagerStateRef` remembered the last state passing the initial
guards. `page-state` logs contained that previous state plus `incomingState`.

Snapshot shared-value reads only ran with diagnostics enabled. Touch listeners
observed bubbling events without claiming the responder. No per-frame callback
logging, persistent log storage, network upload, calendar titles, event IDs, or
event content was included.

The removed implementation consists of the logger and flag, imports, snapshot
helper, diagnostic state ref and writes, transition/callback log calls, canvas
lifecycle effect, touch helper, and three touch listeners. No diagnostic package
or native patch is required or present.

## How the evidence establishes the cause

The decisive timestamps are from generation 3:

- `201420345`: first touch starts.
- `201420425`: the released swipe begins settling.
- `201420465`: page 2 is selected while still settling.
- `201420706`: a second touch starts.
- `201420709`: the native pager reports a new drag. Position is
  `1 + 0.9971590909090909`, almost exactly page 2.
- `201420761`: the second touch ends after moving left from x=191 to x=31.
- `201420762`: the pager is at page 2 and reports idle.
- `201420763`: one transition commits, revision 4, direction +1.
- `201420908`: generation 4 resets.
- `201420947` / `201420975`: old/new pager-key effect cleanup/setup is logged.

The three available indices are 0, 1, and 2. Both swipes occur before replacement
of generation 3. At the second drag, callbacks are unblocked, pinch is inactive,
generation and geometry agree, and the generation is not consumed. There is no
page 3 for that drag to reach.

This trace rules out a failure to recognize the second native drag and the
logged guards as the cause of this attempt. Pager replacement happens after
the second finger lifts; a remount-interrupted touch remains a possible issue
in other sequences, not an observed cause here.

The remaining owner logs contain these exact transition markers:

| Revision | Settled at | Generation reset at | Mount effect at | Reset delay | Mount-effect delay |
| --- | --- | --- | --- | --- | --- |
| 4 | 201420763 | 201420908 | 201420975 | 145 ms | 212 ms |
| 5 | 201421551 | 201421696 | 201421743 | 145 ms | 192 ms |
| 6 | 201422384 | 201422529 | 201422570 | 145 ms | 186 ms |
| 7 | 201423463 | 201423637 | 201423678 | 174 ms | 215 ms |

These timings are transcription of the supplied log, not a benchmark. Console
overhead, cross-runtime shared-value reads, and React scheduling can affect them.
The effect markers do not measure native frame readiness. Header progress is a
projection of pager progress and can be frozen or blocked by guards; it is not
an independent native offset measurement. Native and JavaScript timestamps use
different clocks and must not be directly subtracted.

A JavaScript `touch-cancel` alone would not prove a lost gesture: native gesture
ownership can cancel that delivery normally. No such inference is needed here.

## Reanimated warning

The owner logs repeatedly contain:

> [Reanimated] Reading from `value` during component render.

In [owned-calendar-zoom.ts](../../../mobile/src/features/calendar/renderer/owned-calendar-zoom.ts),
the problematic initializer was `useSharedValue(pixelsPerHour.get())`. JavaScript
evaluates the argument during each render even when the hook already has state.
The current initializer is `useSharedValue(resolvePixelsPerHour(initialPixelsPerHour))`.
The pinch-start worklet still captures the live scale. This removes the identified
render-time read. Device verification of warning disappearance is unrecorded;
the native paging boundary does not depend on the warning.

## Verification record

Commands run from `mobile/` during the investigation:

- `npm test -- --runInBand src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/ui/calendar-screen.test.tsx src/features/calendar/data/week-transition.test.ts calendar-owned-shell.contract.test.ts`: 4 suites, 114 tests passed with diagnostics disabled.
- `npx tsc --noEmit`: passed with the instrumentation present.
- Targeted ESLint on canvas, coordinator, and pager-page-scroll: passed.
- `EXPO_PUBLIC_CALENDAR_PAGING_DEBUG=1 npm test -- --runInBand --no-cache src/features/calendar/renderer/owned-calendar-shell.test.tsx -t 'settles native page'`: 2 tests passed; 53 unselected tests skipped. Logger output was observed. This does not simulate native touch acceptance.
- `npm test -- --runInBand src/features/calendar/renderer/owned-calendar-zoom.test.ts src/features/calendar/renderer/owned-calendar-shell.test.tsx`: 2 suites, 67 tests passed with the warning correction.
- Targeted ESLint on the zoom hook: passed.

Documentation/log-removal verification on 2026-09-21:

- `npm test -- --runInBand src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/renderer/owned-calendar-zoom.test.ts src/features/calendar/ui/calendar-screen.test.tsx src/features/calendar/data/week-transition.test.ts calendar-owned-shell.contract.test.ts`: 5 suites, 129 tests passed.
- Targeted ESLint on canvas, coordinator, pager-page-scroll, and zoom, with
  `--max-warnings 0`: passed.
- All local Markdown links in this folder resolve. All 14 evidence JSONL
  records parse; they contain two native drag starts and one transition commit.
- Source scan confirms that the temporary logger, environment flag handling,
  touch helper, and diagnostic state ref are absent from `mobile/src`.
- `git diff --check`: passed.
- A TypeScript check reported TS2379 at `calendar-screen.test.tsx:709` for an
  `AnimatedRef<ScrollView>` mock return type. That test is outside this cleanup's
  edits, and the shared workspace has concurrent calendar changes. A subsequent
  `npx tsc --noEmit` check passed after the test's mock typing changed outside
  this task; no TypeScript repair is attributed to the diagnostic cleanup.

The existing tests document the current idle-settlement behavior, duplicate
callback protection, and pending accessibility-action suppression. Passing
them is not proof of continuous native paging. There is no whole-repository
test run, release-build performance result, or Android device result here.
