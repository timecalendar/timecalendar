---
kind: ticket
id: T02
epic: E01
status: planned
traces-to: [P03, D04]
depends-on: []
size: M
confidence: medium
---

# T02 — Add the private migration-report contract

## Outcome

The server durably accepts one bounded terminal migration report per id and exposes no private
source content through the API, metrics, or logs.

## Scope

Add the server table/migration, authenticated write-only idempotent endpoint, validation, access
controls, bounded rate limits, retention configuration, OpenAPI contract, generated mobile client,
and integration/privacy tests.

## Non-goals

No mobile outbox worker, dashboard rollout decision, source parsing, or live deployment.

## Definition of done

Duplicate report ids acknowledge without duplication; allowed fields round-trip; forbidden and
oversized payloads fail safely; storage access is least-privilege; generated clients match OpenAPI.

## Acceptance and verification

Run server lint/unit/E2E tests for the HTTP and database paths, regenerate OpenAPI and the mobile
client, then run targeted mobile generated-contract checks. Inspect logs and persisted fixtures for
forbidden source values.

## Likely work sites and reading

`server/src/migrations/`, server module/controller/service conventions, `openapi/openapi.json`,
`mobile/src/api/generated/`, log sanitization guidance, and D04.

## Size and confidence drivers

M: known NestJS/Postgres/OpenAPI path with one privacy-sensitive contract. Medium confidence until
payload size, retention, and authorization are reconciled with current server conventions.

## QA and sensitive surfaces

HTTP, database migration, identifiers, telemetry, and generated public contracts are sensitive.
Tests use synthetic ids and content only; deployment is separate.
