# Spec Delta

## ADDED Requirements

### Requirement: Hand-built header actions are a ratcheted lint error

Lint SHALL report an error, outside the native-chrome seam and tests, for an object property named
`headerRight`, `headerLeft`, `unstable_headerRightItems` or `unstable_headerLeftItems`, and for a
`Stack.Toolbar` element whose `placement` is not the literal `"bottom"`. Files that keep a custom
header element until a later slice SHALL be listed in one committed allowlist that lint skips. A
test SHALL fail when an allowlisted file no longer exists, when it no longer contains a violation,
or when the list is longer than its pinned ceiling.

#### Scenario: A screen hand-rolls a header button

- **WHEN** a feature file sets `headerRight: () => <Pressable … />` in its screen options
- **THEN** `npm run lint` fails with a message that points to `useHeaderActions`

#### Scenario: The bottom toolbar is allowed

- **WHEN** the timezone chooser renders `<Stack.Toolbar placement="bottom">` with the search slot
- **THEN** the rule reports nothing for it

#### Scenario: The allowlist cannot grow silently

- **WHEN** an entry is added to the header-action allowlist without raising the pinned ceiling
- **THEN** the allowlist test fails
