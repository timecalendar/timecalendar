# Spec Delta

## ADDED Requirements

### Requirement: The theme layer owns the event appearance resolver

The theme layer SHALL export the event appearance resolver: from a stored event color, a color scheme
and an increased-contrast flag it SHALL return an opaque surface, a foreground with at least 4.5:1
against that surface, an accent with at least 3:1 against the scheme canvas, an outline, the
normalized source color and the policy flag, with a fallback color for invalid input. The calendar
presenters and the design layer SHALL both use this one resolver, so the week grid and every event
tile draw the same colors for the same event. The increased-contrast signal SHALL be a shared hook,
on for Android's high-text-contrast setting and off where the platform offers no supported signal.

#### Scenario: Grid and Home agree

- **WHEN** the same event appears in the week grid and on a Home card in the dark scheme
- **THEN** both draw the same resolved surface and accent colors

#### Scenario: Resolver outputs are stable

- **WHEN** the resolver receives `#1e88e5` in the light scheme with the normal policy
- **THEN** it returns surface `#B0D5F6`, foreground `#000000` and accent `#1E88E5`

### Requirement: Event tiles are the exception to the no-rail rule

A colored leading rail or stripe SHALL NOT be drawn on generic cards. An event tile SHALL draw its
event's resolved accent as a leading stripe, because the stripe is part of the event's color. A
stripe SHALL be drawn only through the event surface primitive (or by the week-grid renderer), never
from a raw event color in feature UI, which the raw event-color lint rule enforces.

#### Scenario: A feature card draws a raw-color stripe

- **WHEN** a feature component styles a view with `borderLeftColor: event.color`
- **THEN** lint fails and points to the event surface
