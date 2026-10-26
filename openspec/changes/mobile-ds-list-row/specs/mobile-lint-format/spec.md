# Spec Delta

## ADDED Requirements

### Requirement: Hand-drawn hairline separators are a ratcheted lint error

Lint SHALL report an error for a style property `borderBottomWidth`, `borderTopWidth` or `height`
whose value is `StyleSheet.hairlineWidth`, in every source file except the design layer, the theme
module, the calendar renderer and tests. Files not yet migrated SHALL be listed in one committed
allowlist that lint skips. A test SHALL fail when an allowlisted file no longer exists, when it no
longer contains a violation, when it is listed twice, or when the list is longer than its pinned
ceiling, so the list can only shrink. A hairline `borderWidth` (an outline ring) SHALL NOT be
reported.

#### Scenario: A new screen draws its own row separator

- **WHEN** a feature file not on the allowlist styles a row with `borderBottomWidth:
  StyleSheet.hairlineWidth`
- **THEN** `npm run lint` fails with a message that points to the shared separator

#### Scenario: A hairline ring passes

- **WHEN** a feature file styles a logo with `borderWidth: StyleSheet.hairlineWidth`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file no longer draws a hairline separator but stays listed
- **THEN** the allowlist test fails and names the stale entry
