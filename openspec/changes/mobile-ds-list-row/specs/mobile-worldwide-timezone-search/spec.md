# Spec Delta

## ADDED Requirements

### Requirement: Chooser rows mark the current zone with a check and a selected state

Each chooser result SHALL be a list row named by its city and its territory (or its identifier when
it has no territory), with its current offset (or the localized unavailable text) as its value. The
row for the active selection SHALL show a check and expose the selected state instead of a visible
"Selected" word. A runtime-unavailable result SHALL be a disabled row. Each result SHALL keep its
`timezone-result-<identifier>` test identifier.

#### Scenario: The active zone is checked

- **WHEN** the chooser lists the currently selected zone
- **THEN** its row shows a check, exposes the selected state, and shows no "Selected" text

#### Scenario: An unavailable zone is a disabled row

- **WHEN** a runtime-unavailable zone is listed
- **THEN** its row exposes the disabled state with the localized unavailable text as its value, and
  pressing it does nothing
