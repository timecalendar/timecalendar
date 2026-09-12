---
kind: ticket
id: T24
epic: E07
status: planned
traces-to: [P01, P05, P08, D05, D08]
depends-on: [T23]
size: M
confidence: low
---

# T24 — Inspect realistic fabricated workload sizes

## Outcome

The owner can inspect reproducible ordinary, dense and supported-worst fabricated schedules whose workload assumptions are explicit.

## Scope

- Execute the already specified aggregate-only/cohort-suppressed workload research through authorized access or an authorized operator; do not extract event content or identifiers.

- Combine production count/horizon/overlap/all-day shapes with opt-in client source-count evidence; preserve unavailable/user-frequency evidence as unknown.

- Version deterministic fabricated fixture seeds/catalogue and run instructions; retain 1,000 events as stress-only unless separately supported.

- Produce an owner-readable workload report and populate the completed calendar with the resulting fixtures.

## Non-goals

Pretending invented sizes are production percentiles, collecting personal calendars or secretly expanding supported workload limits.

## Dependencies and delivery order

Technical prerequisites: T23. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the owner can inspect reproducible ordinary, dense and supported-worst fabricated schedules whose workload assumptions are explicit.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Verify seed reproducibility, aggregate privacy/suppression and finite edge-case coverage from product 16.2.

- Record the access outcome; if aggregate access remains blocked, request a concrete operator action or explicit reviewed synthetic assumption instead of guessing.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent prepares labelled fixture builds and a plain-language table of counts, overlaps, all-day spans and their evidence sources; the owner is not asked to run SQL or supply event data.

- [ ] Open each named fixture and compare its visible shape with the report.

- [ ] Confirm fixture labels distinguish measured aggregate shapes from assumptions and stress-only cases.

- [ ] Reload a fixture: it reproduces the same event identities/layout.

- [ ] Review unknown evidence and any proposed assumption explicitly before it becomes an acceptance workload.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `docs/projects/owned-calendar-renderer/research/discovery-scope-and-evidence.md`

- `mobile/src/test-support`

- `mobile/scripts`

- `server/src/modules/calendar/models/calendar-event.model.ts`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M, low confidence because historical production access is blocked and client source counts require opt-in evidence. Resolve access/assumptions here before accepting final numeric performance claims.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
