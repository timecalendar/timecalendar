---
kind: ticket
id: T26
epic: E07
status: planned
traces-to: [P02, P05, P07, D02, D03, D04, D05, D08]
depends-on: [T25]
size: M
confidence: medium
---

# T26 — Accept fast entry and date navigation in release builds

## Outcome

Warm entry, mode changes, Today and far-date moves meet the accepted first-frame/usable-interaction budgets on reproducible local workloads.

## Scope

- Validate platform profiling tools, observer overhead and repetition/variance policy; version exact commands and content-free report/raw artifact retention.

- Collect release cold/warm navigation and gesture timings on the binding device/workload matrix; preserve 250 ms p95 first-correct/500 ms usable warm and one-second cold targets subject to the existing baseline-validation contract.

- Fix observed latency failures within the affected implementation boundary; establish reviewed regression thresholds from accepted measurements rather than guesses.

## Non-goals

Replacing physical timing evidence with development FPS, discarding slow app samples or weakening the product target without approval.

## Dependencies and delivery order

Technical prerequisites: T25. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: warm entry, mode changes, Today and far-date moves meet the accepted first-frame/usable-interaction budgets on reproducible local workloads.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Record at least the proposed 30 repetitions per interaction as the starting protocol, validate stability and increase sample count when needed; keep all valid samples.

- Report first presented correct frame separately from query/prepare time, active display deadlines, misses/stalls, p95/p99 and variance.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies release builds, reproducible scripts and an owner-readable pass/fail report with devices, fixture IDs, run counts and uncertainties.

- [ ] Try warm Calendar entry, day/week changes, Today and a far local date: each is immediately understandable without a wrong/partial frame.

- [ ] Swipe/scroll/pinch on the recorded physical devices: report visible stalls or unwanted movement.

- [ ] Review the timing report against each accepted target and confirm failures have been addressed.

- [ ] Verify device/build/fixture metadata and any measurement limits are explicit before acceptance.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/scripts`

- `mobile/src/test-support`

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data`

- `mobile/package.json`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: existing behavior is complete, but reproducible instrumentation requires calibration. Medium confidence; actual failing areas may require a newly split fix slice before this ticket can pass.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
