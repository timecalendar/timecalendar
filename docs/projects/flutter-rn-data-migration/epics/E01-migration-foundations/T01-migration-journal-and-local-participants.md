---
kind: ticket
id: T01
epic: E01
status: planned
traces-to: [P01, P02, P03, D01, D02, D04]
depends-on: []
size: M
confidence: high
---

# T01 — Add migration journal and local participants

## Outcome

React Native has durable singleton migration state, a report outbox, and validated storage for
startup-tab, weekend, and onboarding-suppression participants without changing startup behavior.

## Scope

Add normal Drizzle migrations and repositories for the journal/outbox; add typed MMKV accessors;
define terminal invariants, backend-bound reset behavior, and focused migration/read-back tests.

## Non-goals

No legacy reads, parser, import orchestration, report delivery, bootstrap gate, or UI.

## Definition of done

State transitions reject invalid terminal/retry shapes, migrations upgrade existing databases,
participant accessors preserve existing values, reset semantics match the technical contract, and
binding storage/startup guidance is updated.

## Acceptance and verification

Run migration repository and storage tests including restart simulation, then mobile TypeScript,
lint, and coverage gates for touched logic. Generate and commit Drizzle migrations.

## Likely work sites and reading

`mobile/src/db/`, `mobile/src/storage/`, environment reset seams, the technical specification, and
the Architecture Book storage, data, startup, testing, and definition-of-done chapters.

## Size and confidence drivers

M: crosses SQLite migration/repository and MMKV accessors, but all work sites and invariants are
already established. High confidence from current schema and reset source traces.

## QA and sensitive surfaces

SQLite migration and backend-bound local state are sensitive to data loss. No production database
or environment mutation belongs in this ticket.
