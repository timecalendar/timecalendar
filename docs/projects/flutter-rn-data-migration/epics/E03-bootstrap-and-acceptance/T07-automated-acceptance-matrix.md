---
kind: ticket
id: T07
epic: E03
status: planned
traces-to: [P01, P02, P03, D01, D02, D04]
depends-on: [T06]
size: M
confidence: high
---

# T07 — Gate the complete automated acceptance matrix

## Outcome

One deterministic release gate proves every source version, participant, malformed/retry/collision
path, resource boundary, report behavior, and privacy invariant against the integrated importer.

## Scope

Complete synthetic compact/large fixture builders, cross-seam integration suites, crash injection,
resource/privacy assertions, server E2E coverage, coverage gating, and CI wiring needed to run them.

## Non-goals

No real user data, physical-device substitution, store credentials, deployment, or rollout decision.

## Definition of done

The matrix in technical specification section 14.1 and the migration QA playbook is executable on
the release head; every regression fails deterministically; artifacts contain no private content.

## Acceptance and verification

Run the complete mobile verification set and server lint/unit/E2E suites, validate generated
contracts/migrations are current, and inspect test/report artifacts for forbidden values.

## Likely work sites and reading

Mobile migration tests/fixtures, server report E2E tests, CI workflows if required, the technical
fixture matrix, QA playbook, and Architecture Book testing/definition-of-done chapters.

## Size and confidence drivers

M: broad test surface but implementation contracts are already fixed. High confidence because the
expected matrix and observables are explicit.

## QA and sensitive surfaces

CI, crash artifacts, telemetry payloads, database migrations, and synthetic token/content fixtures
are sensitive. Use conspicuously synthetic values and assert absence from output.
