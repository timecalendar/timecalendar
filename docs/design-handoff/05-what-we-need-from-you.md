# 5 — What we need from you

This document turns the context into a concrete ask. It's a starting point — if you'd structure
the deliverables differently, tell us; we value your judgment.

## The goal, restated

Design TimeCalendar's redesign as **two native experiences** — iOS and Android (Material 3) —
that keep the brand (pink, friendly, rounded, glanceable, French-first) while replacing the
current shared Material look with **platform-native patterns**. See
[04-material-to-native.md](./04-material-to-native.md) for the why and the pattern map.

## Suggested deliverables

### 1. Foundations (the new design system)
- **Color**: pink-led palette for light + dark, with native semantic roles (iOS system colors /
  Android M3 roles). Define how pink is used as accent vs. fill per platform.
- **Typography**: a decision on Poppins vs. platform system fonts (SF Pro / Roboto), and a type
  scale for each platform.
- **Shape, spacing, elevation**: corner radii, spacing rhythm, shadow/elevation treatment that
  reads native on each platform while keeping the soft/rounded feel.
- **Iconography**: SF Symbols (iOS) + Material Symbols (Android) selections for the app's icons.
- **Components**: the native control set — buttons, list rows, inputs, pickers, tabs/segments,
  switches, dialogs/sheets, the event card/tile, tags/chips, the color picker.

### 2. Key screens, designed for **both** platforms
Prioritize the daily-use and onboarding surfaces:
- **Home (today / what's next)** — the glanceable landing view.
- **Calendar** — week view **and** agenda/planning view, including the dense overlapping-events
  case and the "now" indicator. *(This is the hardest, highest-value surface.)*
- **Event details** — including the checklist interaction and the hide/edit/delete actions.
- **Add/edit personal event** — the form with native date/time/color pickers.
- **Onboarding + import flow** — welcome → school selection → import (assistant / QR / iCal URL).
- **Profile + Settings** — including theme, calendars management, hidden events.

For each, we'd love **iOS and Android variants** and **light + dark** where it matters.

### 3. Flows / prototype
- The **onboarding/import journey** end-to-end (it's the most complex and the highest-stakes for
  conversion).
- Key interactions: opening an event, adding a personal event, hiding an event, switching
  calendar views.

### 4. Brand refresh assets (if in scope for you)
- An updated **app icon** and **onboarding illustrations** in the new visual language (the
  current ones are listed in [03-design-system.md](./03-design-system.md)).

## Format & handoff
- Whatever you're fastest in (Figma preferred). Organize by platform, then by screen/flow.
- Please annotate **native-pattern choices** (e.g. "iOS large title here", "M3 FAB here") so
  engineering can map them to native components directly.
- Call out anything that should be a **shared component** vs. genuinely **platform-divergent**.

## Reference material in this pack
- [01 — Product overview](./01-product-overview.md): who/what/why and the vibe to keep.
- [02 — Screens & flows](./02-screens-and-flows.md): the full inventory and journeys.
- [03 — Current design system](./03-design-system.md): exact colors, type, tokens, components.
- [04 — Material → native](./04-material-to-native.md): the pattern-by-pattern map and constraints.

We can also walk you through the live app and share brand source files (logo, Poppins, the
illustrations).

## Open questions we'd like your take on
1. **Poppins or platform fonts?** Keep Poppins as a brand typeface, or adopt SF Pro / Roboto?
2. **How much pink?** Especially on iOS — accent-only, or some tinted surfaces?
3. **Calendar default view** — should the app open to Home or to the Calendar, and should the
   default calendar view be week or agenda? (Today it's a user setting.)
4. **Onboarding** — keep the 3-slide illustrated carousel, or a lighter native intro?
5. **Where, if anywhere, do iOS and Android genuinely need different *information architecture*** —
   not just different chrome? (E.g. the "add event" affordance, the import flow.)

## Constraints recap (full detail in doc 04)
- iOS + Android phones only; iOS 16.4+ / Android 7+; light + dark mode; French-first + 24h time;
  accessibility (Dynamic Type, 44pt/48dp targets, contrast, no color-only meaning); iOS-26
  Liquid Glass must degrade gracefully.
