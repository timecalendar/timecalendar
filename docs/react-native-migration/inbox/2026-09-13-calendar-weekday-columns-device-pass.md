# (HUMAN: owner device verification) T04 dated Calendar columns

## Current delivery status

E01 is completed and merged, confirmed by the owner on 2026-09-14 and by Paperclip
TIM-544/TIM-545–TIM-548. See [completion evidence](../../projects/owned-calendar-renderer/research/results/E01/completion.md).
The worksheet below preserves the recorded test target and observations; pending fields remain
unrecorded evidence, not a claim that the completed epic is blocked or that every device check
passed. T28 reconciles required matrix evidence.

**For:** the human owner performing the ticket-specific iOS/Android layout, persistence, and assistive-technology checks.

## Testable build target

Reviewed renderer revision: `96e3e2d25ea4913d40ea54249d10d88e91b40518`.

Use the exact pull-request head supplied with this checklist for the installed build. Revisions after
the reviewed renderer revision contain delivery evidence and the final OpenSpec archive only; they do
not change the renderer under test.

Automated checks from `mobile/` passed at that reviewed renderer revision: 177 suites and 1,695 tests
with coverage, TypeScript, zero-warning lint, focused renderer and repository-contract coverage,
scoped formatting, React Doctor, repository contracts, and strict OpenSpec validation. Host
automation verifies civil-date identity, five/seven structure, persistence semantics, seven-day
Agenda/page ranges, native-owner inventory, synchronized header/pager progress, cancellation, and
retained transition behavior. It does not claim native readability, alignment, gesture feel,
restart behavior, contrast, or screen-reader results.

## Build and fabricated fixture

- Install dependencies with `npm ci` from `mobile/`, then run `npm run ios` or
  `npm run android` with a supported device attached.
- Fully reload the development build, open Settings > Calendar, and locate Show weekends.
- Launch `timecalendar-dev://calendar?focusDate=2026-09-14`. The owned empty Week surface is the
  fabricated column fixture and must begin Monday 14 September 2026.
- Use only fabricated synced/personal events for retained Agenda/details checks, including one
  event on Saturday 19 September 2026.
- To check reset preservation, select an available test backend, change Show weekends, perform the
  normal environment switch/reset, and return to Calendar. Do not use production or personal data.

## Environment record

- iOS device / OS / physical or simulator: pending owner entry; unavailable on this host.
- Android device / OS / physical or emulator: pending owner entry; unavailable on this host.
- Installed build kind and exact revision: pending owner entry.
- French/English language and Dynamic Type/font-scale settings: pending owner entry.
- VoiceOver/TalkBack and reduced-motion settings: pending owner entry.

Unavailable native checks remain pending here and for T28; Jest and host diagnostics are not
substitutes for device observations.

## Owner checklist

### Focused iOS renderer retest

- [ ] Hold a horizontal drag between weeks and confirm each dated header stays aligned with its clock column throughout the gesture.
- [ ] Fling to the adjacent week and confirm the dated header and clock grid travel together and settle on the same week.
- [ ] Complete a slow snap to the adjacent week and confirm the destination recenters once without a duplicate announcement.
- [ ] Cancel a partial drag so it snaps back and confirm the original header/grid recenter without changing or announcing the committed week.

Record the iOS device, OS, physical-or-simulator status, build kind, and exact pull-request head used
for these four observations. Repeat at both five and seven visible columns.

### Complete T04 checklist

- [ ] With Show weekends on, read Monday 14 through Sunday 20 in order; swipe once and confirm the next complete seven-day week.
- [ ] Turn Show weekends off: only Monday through Friday remain, redistribute evenly, and stay aligned with all vertical clock columns.
- [ ] Vertically scroll and horizontally page at narrow phone and portrait-tablet widths: the committed header stays pinned and every boundary remains aligned.
- [ ] Confirm Today uses an outlined/typographic cue in addition to color and exposes localized Today meaning without acting like a button.
- [ ] Check French and English labels at narrow width, including the week beginning 27 April 2026 that crosses into May.
- [ ] Restart the app with weekends hidden; confirm five columns remain. Turn the switch on, restart again, and confirm Saturday/Sunday return.
- [ ] Switch backend through the supported test control and confirm the weekend preference survives while backend-bound data resets.
- [ ] With weekends hidden, open Agenda: Saturday's fabricated event remains; return to Week and confirm the settled vertical clock position remains.
- [ ] Repeat with reduced motion and confirm each page advances seven civil dates without an announcement caused by the weekend switch.
- [ ] With VoiceOver and TalkBack, verify one adjustable committed-week context, chronological visible-date labels, one Today meaning, hidden decorative/neighbour grids, and one announcement per accepted week only.
- [ ] Repeat the accepted T01–T03 interactions: Today, labelled previous/next week actions, vertical drag/fling, Week → Agenda → details → return, Add, and device clock-format behavior.

## Results and gate

- Checklist results / observations: pending owner entry.
- Focused retest build and revision after any finding: pending if required.
- Acceptance source and date: pending an explicit owner statement accepting the exact tested pull-request head; no reply is not acceptance.
- Reviewer verdict and merged revision: pending after owner acceptance.

The next slice follows the completion record above and the canonical delivery protocol.
