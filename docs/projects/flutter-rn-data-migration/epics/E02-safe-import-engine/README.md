---
kind: epic
id: E02
status: approved
traces-to: [P01, P02, P03, D01, D02, D04]
depends-on: [E01]
---

# E02 — Import valid data safely

## Outcome

Synthetic legacy sources converge into SQLite/MMKV once, retain valid siblings, preserve existing
React Native state, and produce a bounded terminal report after any interruption.

## Demonstration

A fixture containing all supported versions, malformed siblings, a truncated tail, conflicts, and
an injected process kill is replayed until terminal; valid values appear exactly once, React Native
values remain unchanged, and the private report contains only allowed diagnostics.

## Definition of done

The bounded parser and import engine implement every normative source, validation, collision,
journal, preference, and report-outbox rule with coverage-gated tests.

## In scope

Streaming replay, historical transforms, validators, deterministic duplicate selection, import-safe
repositories, MMKV participants, journal recovery, and outbox creation.

## Out of scope

Root bootstrap gating, UI, source deletion, report delivery scheduling, signed-device work, and
rollout.

## Risks and boundaries

Malformed/adversarial files and mixed SQLite/MMKV atomicity are correctness risks; raw input must
never enter diagnostics.

## Tickets

- [T04 — Replay and validate bounded Sembast input](T04-bounded-sembast-replay.md)
- [T05 — Converge the idempotent import engine](T05-idempotent-import-engine.md)
