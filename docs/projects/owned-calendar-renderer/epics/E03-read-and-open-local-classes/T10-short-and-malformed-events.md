---
kind: ticket
id: T10
epic: E03
status: planned
traces-to: [P01, P03, P04, D01, D04, D06, D08]
depends-on: [T09]
size: M
confidence: medium
---

# T10 — Read tiny events and survive malformed content

## Outcome

Zero-duration and very short events remain identifiable and tappable, while malformed events do not erase valid classes.

## Scope

- Render zero-duration timed markers with correct point membership and minimum platform hit targets; handle very short single-column events.

- Use localized missing-title fallback, omit bad optional fields, and apply a deterministic contrast-safe foreground/background policy to imported colors.

- Skip invalid required dates/reversed ranges per event and report allowlisted reason/count metadata only; keep persisted rows untouched.

- Keep full event meaning in labels/details when visual title/location truncate.

## Non-goals

Overlap density disambiguation, global visual sign-off, or provider/recurrence rewriting.

## Dependencies and delivery order

Technical prerequisites: T09. Their accepted contracts are used by the scope above.

Execution follows the [roadmap](../../roadmap.md) and [one-brick protocol](../../delivery.md).
All earlier scheduled slices must be accepted and merged before this implementation starts;
that owner review gate is separate from technical dependencies.

## Definition of done

The owner can demonstrate: zero-duration and very short events remain identifiable and tappable, while malformed events do not erase valid classes.

The scoped behavior and checklist below pass, prior accepted slices still work, relevant agent
checks pass, and explicit owner acceptance plus the merged revision are recorded before moving on.
There is no claim that unimplemented product-wide capabilities are complete.

## Acceptance and verification

- Test point-at-range boundaries, reversed/missing/invalid dates, malformed tag/teacher arrays and optional content normalization.

- Verify color/contrast math deterministically under the product baseline; privacy tests reject raw event/error payloads in diagnostics.

- Test hit-area size and press cancellation, with human short-event targeting on the test build.

- Follow the common checks in delivery.md, run every edited test suite, and include exact commands/results in the handoff. Keep privacy-safe evidence tied to the tested revision.

## Owner QA checklist

**Preparation:** Agent seeds a zero-duration 12:00 marker, a two-minute event, a missing-title event, a long title/location, arbitrary colors and invalid rows alongside Maths.

- [ ] Tap the noon marker and short event reliably; the intended details open.

- [ ] Read the missing-title tile in English/French: see the specified fallback.

- [ ] At small widths, title has priority; full time/title/room remain available in details and accessible labels.

- [ ] Valid Maths remains visible despite broken rows; malformed optional fields do not crash Calendar.

- [ ] Try light/dark and increased contrast: event text is readable across the supplied colors.

- [ ] Repeat the previously accepted interaction(s) touched by this slice; record regressions before acceptance.

## Likely work sites and reading

- `mobile/src/features/calendar/data`

- `mobile/src/features/calendar/renderer`

- `mobile/src/features/calendar/data/format.ts`

- `mobile/src/theme`

- [Approved design](../../design.md), relevant D records in [the decision index](../../decisions/README.md), and product sections cited by this scope.

Existing work sites were checked against local `main` and `origin/main` at
`ca09257e1daa5d4794a80bbcf776c17be7ccaf90` on 2026-09-12. New owned modules/tests belong under
the listed existing directories; follow prerequisite outputs rather than reviving deleted vendor
files. Revalidate paths against current code before implementation.

## Size and confidence drivers

M due to hit targets, validation and visual contrast affecting the same tile. Medium confidence until actual native targeting and contrast fixtures are checked; dense overlaps remain a separate slice.

## QA and sensitive surfaces

Use fabricated data and content-free diagnostics only. The handoff identifies the owner device and any missing cross-platform evidence; final device acceptance is owned by T28.

Follow the ticket scope and approved data/renderer boundary. Do not introduce a compatibility
renderer, change stored event facts, or weaken a final product gate to make this slice pass.

## Execution evidence

Not started. Agent checks and owner QA have not run. No owner acceptance or merge is recorded.
