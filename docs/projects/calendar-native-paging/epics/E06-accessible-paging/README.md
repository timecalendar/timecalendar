---
kind: epic
id: E06
status: planned
traces-to: [P04, D06, D03]
depends-on: [E04]
---

# E06 — Accessible paging and focus

## Outcome

VoiceOver and TalkBack users page with one adjustable control, reach every event and hear one announcement per settle; Today honours the live reduced-motion preference; focus restoration is one effect.

## Demonstration

Owner VoiceOver and TalkBack pass using the R05 checklist.

## Definition of done

- `evidence/E06-accessibility.md` with the owner verdict.

## In scope

- Adjustable control relocation, Android exclusion of the horizontal ScrollView, VoiceOver three-finger paging disabled, exposure keyed on the committed index.
- Live reduced motion and Today motion policy.
- Focus restoration with `useEffectEvent`.

## Out of scope

- New accessibility features.

## Risks and boundaries

Several platform behaviours rest on knowledge rather than documentation (R05).

## Tickets

- T12 — Adjustable paging control outside the scroll views (`T12-adjustable-paging-control.md`)
- T13 — Live reduced motion, Today motion and focus restoration (`T13-reduced-motion-and-focus.md`)
