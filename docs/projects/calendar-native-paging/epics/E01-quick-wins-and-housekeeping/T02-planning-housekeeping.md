---
kind: ticket
id: T02
epic: E01
status: done
traces-to: [P05, D08]
depends-on: []
size: S
confidence: medium
---

# T02 — Archive merged calendar changes and fix stale pointers

## Outcome

Main OpenSpec specs include the zoom and local-event deltas, owned-renderer ticket statuses match merged PRs, and `.claude/rules/mobile.md` points at existing docs.

## Scope

- Archive `zoom-owned-calendar-grid` and `render-local-timed-calendar-events` after verifying implementation.
- Set owned-renderer T05–T12 statuses from merged PRs #414–#428.
- Point `.claude/rules/mobile.md` at Principles 1–5 and `CHANGELOG.md`.

## Non-goals

- No code changes.

## Definition of done

- OpenSpec validation passes.
- Docs-only PR merged.

## Acceptance and verification

- The repository OpenSpec validation command.
- `grep "40 px/hour" openspec/specs/mobile-calendar-timeline/spec.md` finds the zoom requirement.

## Likely work sites and reading

- `openspec/changes/zoom-owned-calendar-grid/`
- `openspec/changes/render-local-timed-calendar-events/`
- `docs/projects/owned-calendar-renderer/epics/E02-control-the-calendar-view/`
- `.claude/rules/mobile.md`
- research/R07-governance-and-verification.md §1

## Size and confidence drivers

Medium confidence: an unarchived change may be partly unimplemented.

## QA and sensitive surfaces

None.
