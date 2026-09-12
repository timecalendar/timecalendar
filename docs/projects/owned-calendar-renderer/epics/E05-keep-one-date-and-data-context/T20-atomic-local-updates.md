---
kind: ticket
id: T20
epic: E05
status: planned
traces-to: [P02, P03, P06, D01, D02, D05]
depends-on: [T19]
size: M
confidence: medium
---

# T20 — Apply completed local updates without a calendar refresh state

## Outcome

Completed sync, personal-event and visibility changes appear as coherent local updates while existing events remain available during background sync.

## Scope

- Publish validated filtered generations only after completed local updates; prevent mixed table-query revisions and stale prepared snapshots.

- Remove Calendar pull-to-refresh/routine syncing/stale indicators; preserve initial-sync ownership outside Calendar and legitimate empty local dates.

- Keep background-sync failure from clearing local content; urgent hidden/removed identities immediately stop being activatable.

## Non-goals

A new sync engine, altered stored-row serialization, renderer-owned networking or a manual refresh substitute.

## Dependencies and delivery order

Technical prerequisites: T19. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: completed sync, personal-event and visibility changes appear as coherent local updates while existing events remain available during background sync.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Inject transactional replacement plus interleaved hook completions, personal edits and filters; prove no partial replace/flash-empty snapshot.

- Verify offline navigation never calls sync and completed zero-event initial sync opens normally.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides a controlled fake/local-sync harness with before/after schedules and failure injection, plus a real offline test build. The owner never triggers a production sync experiment.

- [ ] Start a background replacement: the old complete schedule stays visible until the new complete one appears.

- [ ] Cause background-sync failure: local classes remain visible and no Calendar refresh spinner appears.

- [ ] Hide a calendar/edit a personal event: both visual and accessible content update coherently.

- [ ] Navigate offline through an empty date: see a real empty grid, not a loader/error.

- [ ] Confirm agenda has no pull-to-refresh and Calendar has no manual sync action.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/events.ts`

- `mobile/src/features/calendar/data/sync/hooks.ts`

- `mobile/src/features/calendar/data/sync/repository.ts`

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-status.tsx`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: write transaction guarantees exist, but coherent multi-query presentation must be proven. Medium confidence; isolate sync from local retry introduced next.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
