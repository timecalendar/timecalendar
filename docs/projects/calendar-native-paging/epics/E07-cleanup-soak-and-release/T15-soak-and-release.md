---
kind: ticket
id: T15
epic: E07
status: planned
traces-to: [P03, P06, D08]
depends-on: [T14]
size: M
confidence: medium
---

# T15 — Soak run and preview release with evidence

## Outcome

A 500-crossing soak and a 30-minute mixed stress run stay within ±50 views with a stable heap, and a preview build is published only after the release evidence file covers its revision.

## Scope

- Soak scripts in `mobile/perf/`.
- Release checklist entry in `docs/mobile/releases/`.

## Non-goals

- Production promotion.

## Definition of done

- Evidence file and preview build.

## Acceptance and verification

- Harness soak output; owner install.

## Likely work sites and reading

- `mobile/perf/`
- `docs/mobile/releases/`
- `mobile/EAS.md`

## Size and confidence drivers

The iOS release route (TestFlight) depends on owner credentials.

## QA and sensitive surfaces

Full Calendar regression on both platforms.
