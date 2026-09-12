---
kind: ticket
id: T27
epic: E07
status: planned
traces-to: [P05, P07, D03, D04, D05, D08]
depends-on: [T26]
size: M
confidence: medium
---

# T27 — Keep a long calendar session bounded

## Outcome

A 30-minute paging/zooming/mode-switch session returns to a stable resource range and leaves no unnecessary idle work.

## Scope

- Measure retained pages/revisions/cache/events/visual and semantic nodes separately, including dense all-day content and far jumps.

- Record steady/peak/post-warm-up memory, idle CPU, battery/thermal context and release tooling versions; stop timers/motion on background/unmount.

- Set reviewed numeric resource/growth tolerances from the measured baseline and repair leaks or persistent idle work before acceptance.

## Non-goals

Using a fixed page count as proof of total memory bounds, arbitrary truncation of events or an unmeasured battery claim.

## Dependencies and delivery order

Technical prerequisites: T26. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: a 30-minute paging/zooming/mode-switch session returns to a stable resource range and leaves no unnecessary idle work.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Run the deterministic 30-minute sequence and return to the identical fixture/date/zoom; retain raw traces and checksums.

- Reject monotonic/unbounded growth, accumulated pending generations and continuous idle render loops; test cleanup and cache invariants automatically.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent runs the release stress sequence on the agreed binding devices and provides a graph/table of retained work before, during and after the same-view return.

- [ ] Use Calendar near the beginning and end of the run: movement and event activation remain usable.

- [ ] Return to the starting view: content and focus are correct and the report shows bounded recovery.

- [ ] Background/leave Calendar: no unexplained continuing motion/work remains in the trace.

- [ ] Review memory/node/idle limits and any thermal/battery observations without treating them as unsupported guarantees.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data`

- `mobile/scripts`

- `mobile/src/test-support`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M: finite measurement and resource repair, with medium confidence until real allocation traces exist. Split a substantial discovered leak fix rather than hide it inside an oversized report ticket.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
