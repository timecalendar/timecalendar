---
kind: ticket
id: T06
epic: E02
status: planned
traces-to: [P02, P04, P05, D02, D04, D06]
depends-on: [T05]
size: M
confidence: medium
---

# T06 — Zoom the grid with pinch and accessible controls

## Outcome

Pinch and menu zoom change hour spacing without moving the clock time under the chosen focus point.

## Scope

- Add continuous focal-preserving pinch with two-finger precedence and proper cancellation of one-finger gestures/presses.

- Add zoom in/out/reset using viewport-center clock anchoring; announce/disable measured bounds and persist one shared day/week value.

- Choose initial min/default/max from bounded readability experiments, record owner-tested values in the slice, and revisit with populated density in T25.

- Start with a bounded native experiment: add the second finger during vertical drag/momentum
  and horizontal drag/settle on iOS/Android. Pinch must take ownership without a page commit,
  focal drift or release jump. If it fails, stop feature expansion, repair/review the integration
  in this slice and repeat owner QA; do not replace accepted native motion speculatively.
- Replace fixed 60 px/hour canvas constants with one dynamic scale for labels, grid lines,
  closing boundary and content height. Track live scale/offset/focal geometry off the React
  per-frame path; a last-settled pixel offset is insufficient during an active pinch.
- Measure the timed viewport and account for native automatic insets when converting focal and
  center positions to clock coordinates. Preserve the ScrollView's native chrome integration.
- Persist validated shared zoom through typed settings/storage keys, including corrupt/out-of-range
  recovery and backend-reset preservation. Evolve renderer inventory assertions as modules grow;
  retain native owner counts and absence of per-frame React state writes.

## Non-goals

Final populated-event density acceptance, event resizing or per-mode zoom settings.

## Dependencies and delivery order

Technical prerequisites: T05. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: pinch and menu zoom change hour spacing without moving the clock time under the chosen focus point.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Fully cover focal equation, boundary clamps, repeated zoom commands, finger-count changes and persistence with deterministic properties.

- Record native focal stability and pinch/horizontal/vertical arbitration; capture low-end timing when available.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides initial zoom values and a marked reference hour near the center. Try pinch plus menu actions on actual touch devices where available.

- [ ] Pinch around the reference hour: it stays under your fingers without a release jump.

- [ ] Try menu zoom in/out: the clock time at the viewport center stays stable.

- [ ] Reach each limit: the matching control disables and communicates the limit.

- [ ] Start scrolling then add a second finger: pinch wins without unintended week movement.

- [ ] Switch day/week and restart: zoom persists; reset returns to the agreed default.

- [ ] Repeat pinch after native vertical momentum and horizontal partial paging; confirm the dated header and grid stay aligned and no delayed week change occurs.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Baseline and regression checks

Use [E01 completion and implementation baseline](../../research/results/E01/completion.md).
Preserve native pager/header synchronization, three-page retention, one vertical scroll owner,
weekend preferences and Agenda/details access. Run affected screen/renderer/repository-contract
suites; update milestone-specific assertions only for this ticket's new behavior.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/time-grid.ts`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-view-menu.tsx`

- `mobile/src/features/settings/prefs`

- `mobile/src/storage`

- `mobile/src/features/calendar/data/week-transition.ts`

- `mobile/calendar-owned-shell.contract.test.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and fetched `origin/main` at
`d293988e9dbf64a592388c8796e816fe65f49e46` on 2026-09-14. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M with a single interaction outcome but native arbitration risk. Medium confidence; early focal recordings and owner testing resolve it before event-density tuning.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. This slice changes native or gesture/accessibility behavior; record actual iOS/Android device evidence and any explicit intermediate deferral to T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
