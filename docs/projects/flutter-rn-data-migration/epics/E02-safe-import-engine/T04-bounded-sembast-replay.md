---
kind: ticket
id: T04
epic: E02
status: planned
traces-to: [P01, P02, P03, D01, D04]
depends-on: [T03]
size: M
confidence: medium
---

# T04 — Replay and validate bounded Sembast input

## Outcome

Chunked legacy bytes become deterministic validated candidates and bounded diagnostics for every
supported Sembast version without retaining the full file or private rejected content.

## Scope

Implement strict UTF-8/JSONL replay, tombstones and last-write-wins, v1–v3 transforms, truncation
recovery, per-entity validation, duplicate selection, limits, and synthetic fixture builders.

## Non-goals

No target writes, journal transitions, native implementation changes, UI, or production fixtures.

## Definition of done

All stores, versions, malformed forms, duplicate rules, and resource boundaries produce the exact
candidate/counter/error result in the technical contract with bounded memory and no raw diagnostics.

## Acceptance and verification

Run parser tests immediately below/at/above each cap, large streaming benchmarks under Hermes-
compatible JavaScript, privacy assertions, TypeScript, lint, and coverage. Record evidence used to
tune engineering limits.

## Likely work sites and reading

New mobile migration parser/validator modules, T03's TypeScript seam, Flutter database migrations
and models, technical specification sections 2, 4, 6, and 14, and Architecture Book testing rules.

## Size and confidence drivers

M: pure logic with extensive cases and one real-volume uncertainty. Medium confidence rises after
representative sizes and low-end measurements; limits remain bounded and testable meanwhile.

## QA and sensitive surfaces

Adversarial input, memory exhaustion, tokens, and user-authored text are sensitive. Fixtures must be
synthetic and logs/errors content-free.
