---
kind: ticket
id: T12
epic: E06
status: planned
traces-to: [P04, D06]
depends-on: []
size: M
confidence: medium
---

# T12 — Adjustable paging control outside the scroll views

## Outcome

A plain adjustable View in the header gutter corner pages through `scrollTo(committed ± 1)` with an in-flight guard; no ScrollView is accessible; Android hides the horizontal ScrollView from accessibility; VoiceOver three-finger horizontal paging is disabled.

## Scope

- Control, labels and exposure keyed on the committed index.

## Non-goals

- Focus restoration.

## Definition of done

- Exactly one announcement per settle (tests and device).

## Acceptance and verification

- Jest exposure tests; R05 device checklist.

## Likely work sites and reading

- `mobile/src/features/calendar/renderer/owned-calendar-header.tsx`
- `mobile/src/features/calendar/renderer/owned-calendar-canvas.tsx:235-261`
- research/R05-accessibility-header-and-focus.md §2–§3

## Size and confidence drivers

Depends on unverified platform behaviour.

## QA and sensitive surfaces

VoiceOver and TalkBack, increment while settling.
