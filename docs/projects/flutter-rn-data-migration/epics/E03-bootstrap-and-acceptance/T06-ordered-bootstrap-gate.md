---
kind: ticket
id: T06
epic: E03
status: planned
traces-to: [P01, P02, P03, D01, D02, D04]
depends-on: [T05]
size: M
confidence: medium
---

# T06 — Integrate the ordered bootstrap gate

## Outcome

Every launch follows database readiness, environment recovery, eligibility/discovery/import, and
terminalization before changelog, onboarding, sync, tabs, and push consumers mount; report delivery
can continue later without reopening migration.

## Scope

Add the root readiness coordinator, retain native splash, wire fresh/upgrade/settled/reset routes,
start the report outbox worker after terminalization, and encode ordering in architecture guidance
and focused integration tests.

## Non-goals

No migration progress/error UI, user timeout, manual retry, source deletion, signed build, or rollout.

## Definition of done

All startup variants reach the expected route; no downstream side effect occurs early; a handled
failure opens React Native; imported calendars suppress onboarding; offline reports retry later
without touching terminal state.

## Acceptance and verification

Run startup integration tests with ordered side-effect assertions and suspended promises, report
offline/reconnect tests, TypeScript, lint, coverage, and relevant Architecture Book rule checks.

## Likely work sites and reading

`mobile/src/app/_layout.tsx`, splash and environment seams, onboarding/changelog/sync/push roots,
migration/report modules, technical specification sections 7–12, and startup/testing guidance.

## Size and confidence drivers

M: one coordinator crosses several consumers with established seams. Medium confidence until tests
prove no eager module or provider bypasses the gate.

## QA and sensitive surfaces

Startup, environment ownership, push registration, and migration state are sensitive. Tests mock at
documented seams and never expose tokens or rely on network interception.
