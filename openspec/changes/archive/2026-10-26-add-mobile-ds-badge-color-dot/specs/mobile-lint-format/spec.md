# Spec Delta

## ADDED Requirements

### Requirement: Raw event-color fills are a ratcheted lint error

Lint SHALL report an error for a `backgroundColor` or `borderColor` style value read directly from
a `color` member of a data object (such as an event's or a tag's color) in every React component
source file except the design layer, the theme module, the calendar renderer and tests. A value
read from the theme SHALL NOT be reported. Files not yet migrated SHALL be listed in one committed
allowlist that lint skips, each annotated with the slice that migrates it. A test SHALL fail when an
allowlisted file no longer exists, when it no longer contains a violation, when it is listed twice,
or when the list is longer than its pinned ceiling of one, so the list can only shrink.

#### Scenario: A new screen fills a view with an event color

- **WHEN** a feature file not on the allowlist styles a view with `backgroundColor: event.color`
- **THEN** `npm run lint` fails with a message that points to the shared color dot

#### Scenario: A theme color passes

- **WHEN** a feature file styles a view with `backgroundColor: theme.backgroundElement`
- **THEN** the rule reports nothing

#### Scenario: A data object key passes

- **WHEN** a data mapper writes `{ color: row.color }`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file no longer fills a view with a raw event color but stays listed
- **THEN** the allowlist test fails and names the stale entry
