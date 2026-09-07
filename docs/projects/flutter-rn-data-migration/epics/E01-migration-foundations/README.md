---
kind: epic
id: E01
status: approved
traces-to: [P01, P03, D01, D04]
depends-on: []
---

# E01 — Establish migration foundations

## Outcome

Mobile can discover legacy sources and persist retryable migration state, while the server exposes
a privacy-bounded idempotent outcome contract.

## Demonstration

Contract tests exercise the journal/outbox schema, read typed legacy preferences and chunked source
bytes through platform seams, and accept the same bounded report id exactly once while offline
client delivery remains retryable.

## Definition of done

The three foundation contracts are generated, tested, documented in binding architecture guidance,
and usable without mounting migration consumers or changing production state.

## In scope

Drizzle journal/outbox migrations, new settings accessors, first-party report API/table, native
source bridge, generated client update, and seam-level tests.

## Out of scope

Sembast replay, entity import, root bootstrap integration, store submission, and rollout.

## Risks and boundaries

Native identity/configuration, database migrations, API contracts, and report privacy are sensitive
surfaces. A production deployment or store build remains a separate act.

## Tickets

- [T01 — Add migration journal and local participants](T01-migration-journal-and-local-participants.md)
- [T02 — Add the private migration-report contract](T02-private-migration-report-contract.md)
- [T03 — Read legacy sources through a bounded native bridge](T03-native-legacy-source-bridge.md)
