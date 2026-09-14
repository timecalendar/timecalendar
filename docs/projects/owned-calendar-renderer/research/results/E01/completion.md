# E01 completion and E02 implementation baseline

## Completion

The owner confirmed “Epic 1 is done!” on 2026-09-14 in the E02 readiness conversation,
then authorized the document refresh and E02 dispatch. Paperclip E01 TIM-544 and its
children TIM-545 through TIM-548 are all done, verified read-only on 2026-09-14.

| Ticket | Paperclip | Merged PR                                                     | Main revision |
| ------ | --------- | ------------------------------------------------------------- | ------------- |
| T01    | TIM-545   | [#409](https://github.com/timecalendar/timecalendar/pull/409) | `5a71aeca`    |
| T02    | TIM-546   | [#410](https://github.com/timecalendar/timecalendar/pull/410) | `ffc2bd88`    |
| T03    | TIM-547   | [#412](https://github.com/timecalendar/timecalendar/pull/412) | `516b609b`    |
| T04    | TIM-548   | [#413](https://github.com/timecalendar/timecalendar/pull/413) | `d293988e`    |

T02 evidence correction is merged in PR #411 at `f800ae68`. The current baseline is
`d293988e9dbf64a592388c8796e816fe65f49e46`; local main and fetched origin/main match.
Completion is supported by the owner statement, board state and merged code. It does not
supply missing device identities, exact tested builds or individual checklist observations.
The existing device-pass documents remain evidence worksheets, not a full physical-device pass.
T28 must reconcile their unrecorded cases against the binding final matrix; no blanket
intermediate deferral or release acceptance is inferred.

## Accepted implementation contract

- One native vertical ScrollView owns the full 00:00–24:00 grid and hour gutter.
- One native PagerView owns three pages and one-page settlement; a revisioned week reducer
  owns committed date/heading and rejects stale completions.
- The dated header follows the pager continuously through Reanimated's native event bridge.
  The native month/year title and accessibility context change only on accepted settlement.
- iOS automatic scroll insets keep content reachable beneath native chrome. Settled raw native
  offsets are retained in process; they are not a zoom-independent clock coordinate.
- Show weekends is installation-scoped through typed settings/storage. It filters only week
  columns, preserving seven-day stepping and Agenda dates.
- The canvas uses 60 px/hour and the controller supports week/agenda only. Day mode,
  persisted mode/zoom, pinch, resizable native policy and current-time positioning are pending.

The T03 archived design records the native-motion choice and owner-observed reasons:
[full-day design](../../../../../../openspec/changes/archive/2026-09-13-scroll-owned-calendar-full-day/design.md).

## Readiness verification

On 2026-09-14, from `mobile/`, this command passed 6 suites and 102 tests at the baseline:

```sh
npm test -- --runInBand --runTestsByPath src/features/calendar/renderer/owned-calendar-shell.test.tsx src/features/calendar/ui/calendar-screen.test.tsx src/features/calendar/data/week-transition.test.ts src/features/calendar/data/week.test.ts src/features/calendar/data/time-grid.test.ts calendar-owned-shell.contract.test.ts
```

This is host regression evidence. No new physical-device, release-performance or native-build
check ran during the readiness review. E02 retains T05 → T06 → T07 → T08 with owner QA and
acceptance before each merge and before the next implementation starts.
