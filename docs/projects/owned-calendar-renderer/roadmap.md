---
kind: roadmap
status: approved
---

# Delivery roadmap

## Approval and scope

The product owner approved all architecture decisions and the sequential small-slice delivery
policy on 2026-09-12. This roadmap implements that approved policy. Epic grouping and ticket
details are the planning decomposition; every ticket is `planned`, not implemented or owner-QA
accepted. The owner’s next implementation acceptance applies to one tested slice at a time.

## Sequencing principles

Use one real Calendar surface and add one visible capability per ticket. The first shell removes
the vendor renderer coherently; early merges intentionally have an incomplete pre-launch timeline.
Each new brick preserves earlier accepted behavior, a buildable app and retained data/agenda/details
flows. Launch remains held until the full contract passes.

D04–D06 are approved. Their evidence is gathered within the relevant tickets. A successful brick
does not require an additional competing prototype. An observed failure calls for focused
investigation; changes to approved architecture/product boundaries require a recorded decision.

## Epic order and dependencies

1. [E01 — Move through an empty calendar week](./epics/E01-move-through-an-empty-week/README.md): T01–T04. An empty Calendar can be paged horizontally and scrolled through all hours, with dated week columns and the weekend preference.

2. [E02 — Control the calendar view on different screens](./epics/E02-control-the-calendar-view/README.md): T05–T08. The owner can choose day/week, zoom, rotate/resize and find the current time without losing the intended viewport.

3. [E03 — Read and open local classes](./epics/E03-read-and-open-local-classes/README.md): T09–T12. Ordinary local classes are readable, tappable and chronologically accessible, including short and overlapping events.

4. [E04 — Understand events that span dates and clock changes](./epics/E04-understand-spanning-events/README.md): T13–T16. Events spanning days, clock changes or all-day ranges convey their complete meaning and remain reachable.

5. [E05 — Keep one date and data context across Calendar](./epics/E05-keep-one-date-and-data-context/README.md): T17–T20. Calendar presents one correct date and complete local data context across direct navigation, agenda, environment and completed sync changes.

6. [E06 — Recover from failures without losing Calendar access](./epics/E06-recover-without-losing-the-calendar/README.md): T21–T23. Calendar stays usable through local read failures, renderer failures and event removal races.

7. [E07 — Accept the complete calendar on supported devices](./epics/E07-accept-the-complete-calendar/README.md): T24–T29. The complete calendar has accepted workload, readability, release performance, resource and human-device evidence, ready for wider launch checks.

## Ticket execution order

Execute the rows below in order. Stop after each ticket for the owner’s QA, feedback, acceptance
and merge. `depends-on` in ticket metadata lists only real technical prerequisites; this separate
serial policy also applies to technically independent work.

| Order | Testable brick                                                                                                                           | Epic | Confidence |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------- |
| T01   | [Open the owned Calendar shell](./epics/E01-move-through-an-empty-week/T01-owned-calendar-shell.md)                                      | E01  | high       |
| T02   | [Swipe one empty week at a time](./epics/E01-move-through-an-empty-week/T02-horizontal-week-paging.md)                                   | E01  | medium     |
| T03   | [Scroll all 24 hours beside the hour gutter](./epics/E01-move-through-an-empty-week/T03-vertical-hours-scroll.md)                        | E01  | medium     |
| T04   | [Read seven dated columns and hide weekends](./epics/E01-move-through-an-empty-week/T04-weekday-columns.md)                              | E01  | high       |
| T05   | [Switch between day and week without losing position](./epics/E02-control-the-calendar-view/T05-day-week-mode.md)                        | E02  | high       |
| T06   | [Zoom the grid with pinch and accessible controls](./epics/E02-control-the-calendar-view/T06-zoom.md)                                    | E02  | medium     |
| T07   | [Use the calendar in landscape and resized windows](./epics/E02-control-the-calendar-view/T07-resizable-native-calendar.md)              | E02  | medium     |
| T08   | [Find the current time when opening Calendar](./epics/E02-control-the-calendar-view/T08-current-time.md)                                 | E02  | high       |
| T09   | [Read and open a local timed class](./epics/E03-read-and-open-local-classes/T09-local-timed-event.md)                                    | E03  | medium     |
| T10   | [Read tiny events and survive malformed content](./epics/E03-read-and-open-local-classes/T10-short-and-malformed-events.md)              | E03  | medium     |
| T11   | [Read simultaneous classes side by side](./epics/E03-read-and-open-local-classes/T11-overlap-columns.md)                                 | E03  | medium     |
| T12   | [Navigate the populated calendar accessibly](./epics/E03-read-and-open-local-classes/T12-chronological-event-navigation.md)              | E03  | low        |
| T13   | [Follow a timed event across midnight](./epics/E04-understand-spanning-events/T13-cross-midnight-events.md)                              | E04  | high       |
| T14   | [Read classes through daylight-saving clock changes](./epics/E04-understand-spanning-events/T14-dst-events.md)                           | E04  | low        |
| T15   | [Read single-day and spanning all-day events](./epics/E04-understand-spanning-events/T15-all-day-lane.md)                                | E04  | medium     |
| T16   | [Expand and scroll crowded all-day events](./epics/E04-understand-spanning-events/T16-all-day-overflow.md)                               | E04  | medium     |
| T17   | [Go to Today or a linked date without losing context](./epics/E05-keep-one-date-and-data-context/T17-today-and-direct-date.md)           | E05  | medium     |
| T18   | [Carry the active date through agenda](./epics/E05-keep-one-date-and-data-context/T18-agenda-date-context.md)                            | E05  | medium     |
| T19   | [Keep complete context when display settings change](./epics/E05-keep-one-date-and-data-context/T19-atomic-environment-change.md)        | E05  | medium     |
| T20   | [Apply completed local updates without a calendar refresh state](./epics/E05-keep-one-date-and-data-context/T20-atomic-local-updates.md) | E05  | medium     |
| T21   | [Retry a failed local read without losing valid events](./epics/E06-recover-without-losing-the-calendar/T21-local-read-recovery.md)      | E06  | medium     |
| T22   | [Keep an accessible schedule if the timeline fails](./epics/E06-recover-without-losing-the-calendar/T22-renderer-failure-recovery.md)    | E06  | medium     |
| T23   | [Handle an event disappearing during use](./epics/E06-recover-without-losing-the-calendar/T23-removed-event-focus.md)                    | E06  | medium     |
| T24   | [Inspect realistic fabricated workload sizes](./epics/E07-accept-the-complete-calendar/T24-representative-fixtures.md)                   | E07  | low        |
| T25   | [Accept readability, zoom and dense-event presentation](./epics/E07-accept-the-complete-calendar/T25-readability-and-density.md)         | E07  | medium     |
| T26   | [Accept fast entry and date navigation in release builds](./epics/E07-accept-the-complete-calendar/T26-interaction-latency.md)           | E07  | medium     |
| T27   | [Keep a long calendar session bounded](./epics/E07-accept-the-complete-calendar/T27-bounded-long-session.md)                             | E07  | medium     |
| T28   | [Complete the human device and accessibility matrix](./epics/E07-accept-the-complete-calendar/T28-human-device-acceptance.md)            | E07  | medium     |
| T29   | [Prove the owned calendar is ready for wider launch checks](./epics/E07-accept-the-complete-calendar/T29-release-readiness.md)           | E07  | high       |

## Parallel work

No parallel implementation of subsequent tickets. Read-only investigation and test preparation may
continue while awaiting owner feedback, but cannot silently build the next capability. The owner
requested this sequencing to keep feedback cheap and causally clear.

## Evidence as the bricks land

- D04 motion: T02 horizontal, T03 vertical/axis lock, T06 pinch, T07 windows, T16 all-day arbitration; T26 confirms release timing.

- D05 bounded work: T02 page generations, T09 local event ranges, T11 dense clusters, T16 all-day nodes, T17 far jumps, T20 atomic updates; T24/T26/T27 establish supported workload and resource evidence.

- D06 accessibility: controls from T01/T02/T06, event labels from T09/T10, full chronological traversal in T12, all-day focus in T16, environment/removal/recovery in T19/T22/T23; T28 closes the full human matrix.

- DST and interval correctness: T13/T14; importer date-only coverage: T15. These are explicit low-confidence/edge-case outcomes, not hidden engine work.

## Rollout gates

Follow [the delivery protocol](./delivery.md): agent checks → owner checklist → feedback/fixes →
explicit acceptance → merge → next brick. Unanswered QA remains open. An implementation session
handles Git/build/release operations within its authorization; this planning package creates files
only and performs none of those mutations.

All required release/device/accessibility evidence remains mandatory. Only explicit owner review
can defer an intermediate device check to a named later ticket, and T28 must close it. T29 verifies
Calendar readiness for the wider parity/signed-upgrade/cutover process; it does not deploy the app.

## Replanning notes

This is an ordered starting decomposition, not a promise that no ticket will split. Agents may
revise ticket size/order below the approved product, architecture and epic outcomes when evidence
changes. Preserve stable IDs, allocate unused IDs for added slices, update every reference and
rerun readiness. Do not turn a failing slice into an accepted one by pushing its defect downstream.

Current source was inspected at local `main` and local `origin/main`, both
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90`, on 2026-09-12. No remote fetch was performed. Revalidate
against the actual default-branch revision before execution; never revive deleted adapter paths
simply because an earlier inventory listed them.
