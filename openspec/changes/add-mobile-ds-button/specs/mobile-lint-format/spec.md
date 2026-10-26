# Spec Delta

## ADDED Requirements

### Requirement: Legacy React Native touchables and the RN Button are a lint error

Lint SHALL report an error for any named import of `Button`, `TouchableOpacity`,
`TouchableHighlight`, `TouchableWithoutFeedback` or `TouchableNativeFeedback` from `react-native`,
in every linted file, with a message that points to the shared button. `Pressable` SHALL stay
importable.

#### Scenario: A feature imports TouchableOpacity

- **WHEN** a file under `src/features/` imports `TouchableOpacity` from `react-native`
- **THEN** `npm run lint` fails with a message that names the shared button

#### Scenario: Pressable stays allowed

- **WHEN** a file imports `Pressable` from `react-native`
- **THEN** lint reports no error for that import

### Requirement: Text buttons built from a raw Pressable are a ratcheted lint error

Lint SHALL report an error for a React Native `Pressable` that declares the `button` or `link`
role and has a direct text child, in every source file except the shared button module, the
native-chrome seam, the calendar renderer and tests. Files that predate the shared button SHALL be
listed in one committed allowlist that lint skips. A test SHALL fail when an allowlisted file no
longer exists, when it no longer contains a violation, or when the list is longer than its pinned
ceiling, so the list can only shrink.

#### Scenario: A new screen hand-rolls a text button

- **WHEN** a file not on the allowlist renders `<Pressable accessibilityRole="button"><ThemedText>Save</ThemedText></Pressable>`
- **THEN** `npm run lint` fails with a message that points to the shared button

#### Scenario: A row that wraps its text in a layout view is not flagged

- **WHEN** a `Pressable` with the `button` role contains a `View` that contains the text
- **THEN** the rule reports nothing for it

#### Scenario: A migrated file leaves the allowlist

- **WHEN** a file on the allowlist is migrated and no longer contains a violation, but stays listed
- **THEN** the allowlist test fails and names the stale entry

#### Scenario: The allowlist cannot grow silently

- **WHEN** an entry is added to the allowlist without raising the pinned ceiling
- **THEN** the allowlist test fails
