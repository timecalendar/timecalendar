# Spec Delta

## ADDED Requirements

### Requirement: Raw text inputs are a ratcheted lint error

Lint SHALL report an error for a value import of React Native's `TextInput` (aliases included) in
every source file except the design layer and tests; a type-only import SHALL pass. Files not yet
migrated SHALL be listed in one committed allowlist that lint skips. A test SHALL fail when an
allowlisted file no longer exists, when it no longer contains a violation, when it is listed twice,
or when the list is longer than its pinned ceiling, so the list can only shrink.

#### Scenario: A new screen renders a raw input

- **WHEN** a feature file not on the allowlist imports `TextInput` from `react-native`
- **THEN** `npm run lint` fails with a message that points to the shared text field

#### Scenario: A ref type import passes

- **WHEN** a feature file writes `import type { TextInput } from "react-native"`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file is migrated and no longer imports `TextInput`, but stays listed
- **THEN** the allowlist test fails and names the stale entry
