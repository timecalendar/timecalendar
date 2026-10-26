# Spec Delta

## ADDED Requirements

### Requirement: A side-by-side button pair stacks at accessibility text sizes

Two in-content buttons offered side by side SHALL be laid out by one shared button-row primitive
that takes a primary and a secondary button. Below the accessibility text-size threshold
(font scale 1.786, the iOS accessibility-medium multiplier; Android system scales 1.8 and 2.0)
the row SHALL place the secondary button on the leading side at its intrinsic width, at most half
the row, and the primary button on the trailing side filling the remaining width. At or above the
threshold the row SHALL stack both buttons vertically at full width with the primary button
first, so no label breaks mid-word. The layout SHALL follow a live text-size change without a
remount, and focus order SHALL follow the visual order. The button-row gallery fixture SHALL
include a pair and a long-strings story, and show which layout is active.

#### Scenario: Default text size lays the pair side by side

- **WHEN** the Connect footer renders at font scale 1.0
- **THEN** Back is on the leading side, Continue on the trailing side filling the rest of the row

#### Scenario: Accessibility text size stacks the pair

- **WHEN** the Connect footer renders at font scale 1.786 or higher on iOS, or 1.8 or higher on
  Android
- **THEN** Continue renders first and Back second, each at full width, and no label wraps
  mid-word

#### Scenario: The largest non-accessibility size stays a row

- **WHEN** the row renders at iOS font scale 1.353 or Android font scale 1.5
- **THEN** the buttons stay side by side

#### Scenario: Test IDs survive the layout change

- **WHEN** the row switches between side by side and stacked
- **THEN** each button keeps its `testID` and its press handler
