# 003 — Coverage: 90% on logic, 70% global floor, CI-enforced

> Origin: migration-approach §8, knob **K-3** (proto-ADR → real ADR at scaffold).

## Status

Accepted, **not yet enforced.** Coverage is reported from day one (the
`test-mobile` job runs `npm test -- --coverage`) but **no `coverageThreshold` is
set** — the gate is deliberately unwired until there is logic worth gating. Owned
by the first logic-bearing feature (Settings, [004](./004-phase-1-feature-order.md));
that feature's DoD sets the threshold. See the Architecture Book "K-3 deferral".

## Context

A coverage gate should put the high bar where bugs actually hide (domain logic),
not chase a vanity percentage across UI glue — and it must not be cargo-culted onto
a skeleton with no logic yet (philosophy §1: earn the gate, don't declare it).

## Decision

Per-path Jest `coverageThreshold`: **90% lines+branches** on domain/logic (hooks,
stores, `db`/Drizzle, mappers, utils); **70% global** floor; presentational
components covered by RNTL behavior tests but **exempt** from the 90% gate. CI
fails below threshold.

The threshold lands when the first logic-bearing feature does — until then coverage
is reported so the gate has a baseline to land on, but unset.

## Consequences

- The `definition-of-done.md` "Unit/component tests" axis records this as
  "reported, not yet gated" and names Settings as the feature that wires it.
- When set, lives in `mobile/jest.config`/`package.json` jest config (R-1: a CI
  gate, not prose).

## Revisit if

The 90% gate starts driving cargo-cult tests rather than catching real regressions
(loosen the path scope or the number, with rationale recorded here).
