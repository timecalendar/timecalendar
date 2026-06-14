# 003 — Coverage: 90% on logic, 70% global floor, CI-enforced

> Origin: migration-approach §8, knob **K-3** (proto-ADR → real ADR at scaffold).

## Status

Accepted. **⚠️ Revisit clause fulfilled, not fired against (2026-06-14):** the gate
is now **enforced**. The `add-mobile-settings-prefs` change (TIM-130) — Settings'
data layer, the first logic-bearing feature, which ADR 004 named as this gate's
owner — wired the `coverageThreshold` in `mobile/jest.config.js` exactly as designed
below, on a **green** baseline (the change added the supporting tests so the gate
lands passing, not failing). See the Architecture Book "Settings preferences" (the
now-enforced gate) and "K-3 deferral" (the prior reported-not-gated era).

*(Prior status, for the record: "Accepted, not yet enforced — coverage reported from
day one so the gate has a baseline to land on, but no `coverageThreshold` set, owned
by the first logic-bearing feature.")*

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

- The `definition-of-done.md` "Unit/component tests" axis records this gate; it is
  now **enforced** (no longer "reported, not yet gated").
- Encoded in `mobile/jest.config.js`'s `coverageThreshold` (R-1: a CI gate, not
  prose): a 70% `global` floor (lines+branches) + per-glob 90% (lines+branches) on
  the logic paths `src/{features,hooks,storage,db,i18n,firebase,theme}/**`.
- **Jest glob semantics, recorded so a future editor isn't surprised:** a
  `coverageThreshold` glob key *removes* its matched files from the `global` pool, so
  `global` measures the **remainder** (the presentational `src/components/**` and the
  chrome wrappers), not the whole tree. The remainder clears 70% comfortably.
- **Exclusions from coverage collection, each with a recorded reason in
  `jest.config.js`** (never a silent skip — the DoD no-third-state rule): type-only
  `*.d.ts`; and the **E2E-covered-not-unit-covered** paths the Architecture Book
  "Testing" section already designates — `src/app/**` (route entrypoints, proven by
  the Maestro launch) and `src/api/{mutator,config}` (the `customFetch` seam component
  tests *mock*, exercised end-to-end by the Maestro round-trip, never run under Jest).
- TIM-130 added the supporting tests (`use-app-ready`, the `use-color-scheme` C1 seam,
  the `use-theme` unspecified branch, the `migrate` non-Error branch) so the gate
  lands **green**, not red — the whole point of "report first so the gate has a
  baseline."

## Revisit if

The 90% gate starts driving cargo-cult tests rather than catching real regressions
(loosen the path scope or the number, with rationale recorded here).
