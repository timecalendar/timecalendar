# Spec Delta

## ADDED Requirements

### Requirement: Ad-hoc status UI is a ratcheted lint error

Lint SHALL report an error for importing React Native's `ActivityIndicator`, and for a list's
`ListEmptyComponent` that renders anything other than the shared status view (looking through
conditional and logical expressions; `null` passes), in every source file except the design layer,
the native-chrome seam, the calendar renderer and tests. Files not yet migrated SHALL be listed in
one committed allowlist that lint skips. A test SHALL fail when an allowlisted file no longer
exists, when it no longer contains a violation, when it is listed twice, or when the list is longer
than its pinned ceiling, so the list can only shrink.

#### Scenario: A new screen hand-rolls a spinner

- **WHEN** a feature file not on the allowlist imports `ActivityIndicator` from `react-native`
- **THEN** `npm run lint` fails with a message that points to the shared status view

#### Scenario: A list renders a plain-text empty slot

- **WHEN** a feature file not on the allowlist passes `ListEmptyComponent={<ThemedText>…</ThemedText>}`
- **THEN** `npm run lint` fails

#### Scenario: A conditional empty slot of status views passes

- **WHEN** `ListEmptyComponent` is `isLoading ? <StatusView kind="loading" … /> : <StatusView kind="empty" … />`
- **THEN** the rule reports nothing

#### Scenario: A migrated file leaves the allowlist

- **WHEN** an allowlisted file is migrated and no longer contains a violation, but stays listed
- **THEN** the allowlist test fails and names the stale entry

### Requirement: Web-only described-by relations are a lint error

Lint SHALL report an error for an `aria-describedby` JSX attribute in every source file, tests
included, with a message that points to folding the description into the field's accessibility
hint, because React Native forwards no described-by relation to iOS or Android views.

#### Scenario: A field links its error by id

- **WHEN** a file renders `<TextInput aria-describedby="email-error" />`
- **THEN** `npm run lint` fails
