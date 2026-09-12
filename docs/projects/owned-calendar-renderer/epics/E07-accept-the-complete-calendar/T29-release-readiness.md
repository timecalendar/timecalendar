---
kind: ticket
id: T29
epic: E07
status: planned
# prettier-ignore
traces-to: [P01, P02, P03, P04, P05, P06, P07, P08, D01, D02, D03, D04, D05, D06, D07, D08]
depends-on: [T28]
size: M
confidence: high
---

# T29 — Prove the owned calendar is ready for wider launch checks

## Outcome

The repository and release evidence agree that the complete owned calendar is ready to enter the wider React Native launch gates.

## Scope

- Audit absence of calendar-kit/adapter/patch/fallback/compatibility machinery and unused exclusive setup; preserve unrelated tools/users.

- Run the complete applicable type/lint/format/coverage/property/React Doctor/boundary/native-contract checks and the three durable Maestro journeys.

- Reconcile scoped Architecture Book/ADR/current OpenSpec and Phase 04/10 status with the implemented system, retaining archived history and fingerprint/data-fidelity constraints.

- Publish evidence index, approved settings/budgets, dependency license/security/maintainer dossier, residual-risk disposition and launch hold/recovery instructions.

## Non-goals

Automatic store submission, deployment, tracker materialization, blanket bug waivers or shipping a vendor rollback build.

## Dependencies and delivery order

Technical prerequisites: T28. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: the repository and release evidence agree that the complete owned calendar is ready to enter the wider React Native launch gates.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Require zero unresolved product-gate failures and explicitly reviewed residuals; inspect React Doctor output rather than relying on its nonblocking broad-script exit status.

- Verify evidence artifacts remain accessible and checksum-addressed, source/build fingerprints agree, and signed upgrade/parity checks are handed to the broader release process.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent supplies the final content-free evidence index and candidate build with all prior ticket acceptances linked; this review does not submit the app to a store.

- [ ] Open the final candidate and repeat the core flow: find class/room, change date/mode, zoom, expand all-day and open details.

- [ ] Review that every ticket has owner acceptance and that required device/performance results belong to the current compatible build.

- [ ] Confirm documented scope and known limitations match the app; no unfinished capability is presented as launch-ready.

- [ ] Accept Calendar’s readiness for wider parity/cutover checks, or identify the exact unresolved issue.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `docs/mobile/architecture-book`

- `docs/react-native-migration`

- `openspec/specs/mobile-calendar-timeline/spec.md`

- `openspec/specs/mobile-calendar-agenda/spec.md`

- `mobile/package.json`

- `mobile/jest.config.js`

- `mobile/eslint.config.js`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M across evidence/docs/checks with no new feature expected. High confidence in audit mechanics; this ticket cannot pass if earlier required evidence is missing or has been invalidated by code changes.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
