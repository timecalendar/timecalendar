---
kind: ticket
id: T21
epic: E06
status: planned
traces-to: [P03, P04, P06, D01, D02, D08]
depends-on: [T20]
size: M
confidence: medium
---

# T21 — Retry a failed local read without losing valid events

## Outcome

A local-store read failure has an accessible retry while the last valid schedule stays available where possible.

## Scope

- Distinguish local success/known-empty/error at the data seam and retain the last valid model when safe.

- Expose an accessible local retry that re-reads storage without initiating network sync.

- Handle cold failure without falsely claiming an empty schedule and keep privacy-safe reason-only diagnostics.

## Non-goals

Retrying network sync from Calendar, logging raw rows/exceptions or swallowing failure as empty success.

## Dependencies and delivery order

Technical prerequisites: T20. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a local-store read failure has an accessible retry while the last valid schedule stays available where possible.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Inject initial read failure, warm read failure, retry success and repeated retry races; assert status and unchanged valid content.

- Verify retry is local-only and error metadata contains no event content/identifiers.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies deterministic local-read failure/recovery controls in the test harness and a populated last-valid snapshot.

- [ ] Trigger a warm read failure: existing valid events stay visible with a clear accessible problem/retry control.

- [ ] Retry successfully: the current correct schedule returns without a network refresh.

- [ ] Start without a valid cache and fail the read: the screen explains failure instead of saying there are no events.

- [ ] Use a screen reader to find and activate retry.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data/events.ts`

- `mobile/src/features/calendar/ui/calendar-screen/calendar-screen-status.tsx`

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- `mobile/src/db`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: error lifecycle crosses the data/screen boundary but reuses the accepted committed snapshot. Medium confidence until failure injection confirms no empty-state confusion.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
