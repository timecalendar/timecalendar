---
kind: ticket
id: T01
epic: E01
status: planned
traces-to: [P01, P08, D02, D03, D04, D07]
depends-on: []
size: M
confidence: high
---

# T01 — Open the owned Calendar shell

## Outcome

Calendar opens an owned, labelled day/week surface while the existing agenda and event-details flows remain usable.

## Scope

- Replace the vendor facade with a minimal owned surface on the real Calendar screen; show an accessible date heading and stable empty canvas.

- Remove calendar-kit dependency/lock entries, adapter, patch and exclusive mock/lint/coverage allowances coherently; preserve unrelated dependency users.

- Remove obsolete ref/callback coupling at the screen boundary; keep only controls that currently function and preserve existing agenda access.

- Document the milestone’s intentionally absent timeline events/scrolling; preserve stored data and update current renderer docs without claiming launch completion.

## Non-goals

Paging, vertical scrolling, event tiles, new settings, zoom, native orientation changes and a public renderer API.

## Dependencies and delivery order

No technical prerequisite ticket. This is the first owned-renderer slice.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: calendar opens an owned, labelled day/week surface while the existing agenda and event-details flows remain usable.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Verify Calendar mount/unmount, agenda access and retained details routes; no vendor imports, fallback, duplicate renderer or silent no-op controls remain.

- Run affected screen/facade/config tests and dependency/install checks; preserve existing three Maestro journeys rather than disabling them.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent provides a test build with a labelled Calendar surface and a fabricated local event visible through the existing agenda. Start with a fresh test installation.

- [ ] Open Calendar: a clear date heading and owned canvas appear without a crash.

- [ ] Switch to agenda, open the fabricated event, then return: existing event access still works.

- [ ] Leave Calendar for another tab and return several times: the app remains usable.

- [ ] Confirm the handoff clearly lists the timeline capabilities still absent at this milestone.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/ui/calendar-screen.tsx`

- `mobile/src/features/calendar/ui/calendar-screen/use-calendar-screen-controller.ts`

- `mobile/package.json`

- `mobile/eslint.config.js`

- `mobile/jest.config.js`

- `mobile/.maestro/helpers/open-calendar-agenda.yaml`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M because deletion touches installation, mocks and facade consumers; the visible result stays deliberately tiny. Source sites and existing agenda helper are known.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
