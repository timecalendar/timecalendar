# Spec Delta

## ADDED Requirements

### Requirement: Android list rows expose their name, value, hint and role to TalkBack

On Android, a native list row SHALL expose to the accessibility tree one description made of its
accessible name (the caller's accessible name, else its label, else its label and subtitle), then
its value, then its hint, with absent parts skipped. A navigation or action row SHALL expose the
button role. A value row SHALL expose the description and no role. The row's own child texts SHALL
NOT be announced separately. The row SHALL keep its test identifier and remain activatable. The
iOS row SHALL be unchanged.

#### Scenario: An action row reaches TalkBack with its hint

- **WHEN** an Android action row renders with an accessible name, a value and a hint
- **THEN** its accessibility node carries the button role and the description "name, value, hint"

#### Scenario: A navigation row without an explicit name

- **WHEN** an Android navigation row renders with a label and a subtitle and no accessible name
- **THEN** its description starts with "label, subtitle" and it carries the button role

#### Scenario: A value row has no role

- **WHEN** an Android value row renders
- **THEN** its node carries the description and no button role

#### Scenario: The hint reaches the native node on a device

- **WHEN** the Android native end-to-end journey opens the calendar list
- **THEN** the seeded calendar row is found by its test identifier with its hint in its
  accessibility text

### Requirement: The list seam's geometry has one source

The native list seam's Android segment geometry (side inset, segment gap, outer and inner corner
radii) SHALL come from the same shared list geometry the design-layer list row uses, so a change to
one is a change to both.

#### Scenario: Geometry is shared

- **WHEN** the shared outer corner radius changes
- **THEN** both the native list seam's Android rows and the design-layer grouped rows render with
  the new radius
