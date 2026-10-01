---
kind: ticket
id: T04
epic: E02
status: planned
traces-to: [P01, P02, P04, D01, D02, D03, D04]
depends-on: [T03]
size: L
confidence: low
---

# T04 — Dev-only spike of windowed native ScrollView paging

## Outcome

A dev-only route renders the vertical ScrollView, gutter, shared hour-line layer and a windowed horizontal `Animated.ScrollView` of about 5 fixture pages. It has UI-thread header translation, UI-thread settlement, re-base at idle and transform pinch. The spike checklists run on both platforms.

## Scope

- Spike route outside the production Calendar.
- Android `snapToInterval` + `disableIntervalMomentum` versus `pagingEnabled` comparison.
- Enable `ANDROID_/IOS_SYNCHRONOUSLY_UPDATE_UI_PROPS`.
- Run R05 checks 1–2 on the current production build.
- Prototype the 3-slice tile with counter-scaled clipped text; check seams, sharpness and Android clipping on a scaled parent.

## Non-goals

- Data store, focus restoration, production wiring.

## Definition of done

- `evidence/E02-spike.md` records every checklist item, the harness numbers and the owner verdict.

## Acceptance and verification

- Device checklists from R02, R05 and R08.
- Harness against the P02 thresholds.

## Likely work sites and reading

- research/R02-horizontal-scrollview-mechanics.md (component sketch)
- research/R03-rendering-and-zoom-performance.md §2–§3
- research/R08-alternatives-and-adversarial-review.md (kill criteria)
- `mobile/src/features/calendar/renderer/owned-calendar-zoom.ts`
- `mobile/src/features/calendar/data/time-grid.ts`

## Size and confidence drivers

Low confidence by design: this ticket exists to retire the unknowns behind A1–A3.

## QA and sensitive surfaces

Diagonal starts, pinch during settle, iPad split view, TalkBack and VoiceOver.
