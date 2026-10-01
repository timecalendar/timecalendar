---
kind: ticket
id: T10
epic: E04
status: planned
traces-to: [P05, D01, D02, D07]
depends-on: [T08]
size: M
confidence: high
---

# T10 — Record the new paging owner in specs and the Architecture Book

## Outcome

OpenSpec, the Architecture Book and the owned-renderer project describe the windowed native ScrollView as the paging owner.

## Scope

- MODIFIED/REMOVED deltas in `openspec/specs/mobile-calendar-timeline/spec.md`.
- New Architecture Book ADR; amend ADRs 033 and 061; update `calendar.md`, `storage.md`, `CHANGELOG.md`.
- Superseded notes on owned-renderer D04 (PagerView clause), D05, `design.md` and T05–T08.

## Non-goals

- Rewriting history in superseded docs.

## Definition of done

- OpenSpec validation passes; no doc still prescribes the three-page pager for the calendar.

## Acceptance and verification

- `grep -ri "three-page\|PagerView" docs/mobile openspec/specs` only returns onboarding.

## Likely work sites and reading

- research/R07-governance-and-verification.md §1
- `docs/mobile/architecture-book/calendar.md`
- `docs/mobile/architecture-book/decisions/033-calendar-renderer-module-boundary.md`
- `docs/mobile/architecture-book/decisions/061-calendar-conflict-pointer-and-assistive-targets.md`

## Size and confidence drivers

Fully mapped by R07.

## QA and sensitive surfaces

None.
