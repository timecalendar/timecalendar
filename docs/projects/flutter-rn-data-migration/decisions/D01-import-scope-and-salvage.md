---
kind: decision
id: D01
status: approved
traces-to: [P01, P02]
supersedes: []
---

# D01 — Import scope and best-effort salvage

## Context and evidence

Only locally owned data is irreplaceable. Server caches can re-sync, while broad preference parity
adds risk without protecting ownership. Sembast can contain malformed historical siblings or a
truncated final write.

## Options considered

- Import only durable data, import the approved continuity settings, or import every preference.
- Fail the entire source, recover only a complete prefix, or preserve every valid sibling/store.

## Proposed choice

Import calendars/tokens, personal events, checklist items, hidden events, changelog state, theme,
notification-enabled state, startup tab, and weekend visibility. Imported calendars suppress
onboarding. Drop caches and all unlisted preferences. Preserve each valid record/preference
independently, recover a complete JSONL prefix, skip invalid siblings, and copy accepted personal
event colours exactly.

## Tradeoffs and consequences

Students retain the highest-value state without inheriting stale caches or obsolete presentation
choices. Partial recovery accepts that malformed items can be lost, so the engine must count and
report every omission without showing a warning or storing rejected content.

## Approval

Approved by the TimeCalendar board owner in the human-only TIM-436 decision round answered
2026-09-07; exact personal-event colour copying was reaffirmed in the same-day continuation comment.
