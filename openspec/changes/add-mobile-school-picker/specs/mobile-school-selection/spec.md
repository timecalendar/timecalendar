## MODIFIED Requirements

### Requirement: The selected school and group are persisted through the storage seam and read downstream
Selecting a school (and one or more groups within it) SHALL persist the selection through the
`@/storage` seam, via a typed, defensively-validated store under
`mobile/src/features/school-selection/` (the 90% coverage glob) mirroring the Settings preferences
shape. The store SHALL persist only the selection identity (the school id and the selected group
**value(s)** — a set of zero or more), not the full server DTOs. A read SHALL be total: an unset or
corrupt stored value SHALL read as "no selection" rather than throwing. A reactive hook SHALL expose
the current selection so consumers re-render when it changes. The onboarding-complete state SHALL be
derived from whether a selection exists; no separate completion flag SHALL be stored. The store API
and its identity-only, array-shaped `groupValues` contract SHALL be unchanged by this ship — it
already accepts the set of selected group values.

#### Scenario: A multi-group selection is persisted and reactively readable
- **WHEN** the user selects a school and one or more groups
- **THEN** the selection identity (the school id and the set of selected group values) is persisted through `@/storage`
- **AND** the reactive selection hook reflects the new selection

#### Scenario: A read of the selection is total
- **WHEN** the stored selection is unset or corrupt
- **THEN** the selection store reports "no selection"
- **AND** no error is thrown

#### Scenario: Onboarding-complete is derived from the selection
- **WHEN** a school (and any selected groups) is selected
- **THEN** onboarding-complete is derived as true from the persisted selection
- **AND** no separate completion flag is stored

## ADDED Requirements

### Requirement: The group-picker step is a multi-select tree committed by an explicit confirm action
The group-picker step SHALL allow the user to select **one or more** leaf groups within the chosen
school, rather than committing a single leaf immediately on tap. Each leaf node SHALL be a toggle: a
tap adds or removes that group's value from a pending selection set, and the node SHALL reflect its
selected/unselected state accessibly. Branch nodes SHALL continue to expand and collapse (they are
not selectable). The pending selection SHALL be committed only by an explicit primary "confirm"
action, which SHALL persist the school and the selected group value(s) through the selection store
(`selectSchool(schoolId)` then `selectGroup(values)`) in a single commit. Selecting nothing and
confirming SHALL be guarded (an accessible message, no empty-set commit). This mirrors the Flutter
wire format, whose `SetSchoolGroupDto.groups` is an array; the store already persists a set, so no
store schema change is required.

#### Scenario: A leaf toggles into and out of the pending selection
- **WHEN** the user taps a leaf group node
- **THEN** that group's value is added to the pending selection if absent, or removed if present
- **AND** the node reflects its selected/unselected state accessibly

#### Scenario: Branch nodes expand and collapse but are not selectable
- **WHEN** the user taps a branch (non-leaf) node
- **THEN** the branch expands or collapses to reveal or hide its children
- **AND** the branch does not toggle a selection

#### Scenario: Confirm commits the full set in one write
- **WHEN** the user has selected one or more leaves and activates the confirm action
- **THEN** the school and the set of selected group values are persisted through the selection store in a single commit
- **AND** the flow is completed

#### Scenario: Confirming an empty selection is guarded
- **WHEN** the user activates confirm with no leaf selected
- **THEN** an accessible guard message is shown
- **AND** no empty-set selection is committed

### Requirement: Completing the picker dismisses the whole onboarding stack
On a successful confirm-commit, the flow SHALL dismiss the entire `onboarding` nested Stack (via Expo
Router stack dismissal) back to its entry / the surface that opened it, rather than popping a single
screen. A completed selection SHALL NOT strand the user on the intermediate school-list step.

#### Scenario: Confirm dismisses the onboarding stack
- **WHEN** the user confirms a group selection successfully
- **THEN** the entire onboarding nested Stack is dismissed back to its entry / opener
- **AND** the user is not left on the intermediate school-list step

### Requirement: School search is accent-insensitive and matches name or code, behind a pure data-layer helper
The school-picker search SHALL reach functional parity with the Flutter `stringIncludes` matcher: it
SHALL normalize diacritics and ignore spacing/hyphenation, and SHALL match a school when the needle
matches either the school name **or** its code. The matching logic SHALL be a **pure helper in the
feature `data/` layer** (under the 90% logic coverage glob), unit-tested independently; the school
screen SHALL filter through it. The `code` field SHALL be projected into the `SchoolListItem` domain
shape from the generated `SchoolForList` (which already carries it); the projection SHALL stay minimal
(only what the screen renders plus what search needs). The screen SHALL remain presentational (no
search logic inline).

#### Scenario: Search ignores diacritics and matches name or code
- **WHEN** the user types a needle that matches a school's name or code after diacritic/spacing normalization
- **THEN** that school appears in the filtered list
- **AND** the match works regardless of accents, spaces, or hyphens

#### Scenario: The matcher is a pure tested data-layer helper
- **WHEN** the search matcher is located
- **THEN** it is a pure function in the feature `data/` layer covered by the 90% logic gate
- **AND** the school screen filters through it rather than matching inline

### Requirement: The completed picker behavior is verified by automated tests under the coverage gates
The unit-test suite SHALL cover, under the 90% logic gate, the pure search/normalize helper (accents,
spacing, name-vs-code matching, no-match). Under the 70% floor, the group-picker screen test SHALL be
extended to assert: a leaf toggles selected state, a branch expands/collapses without selecting,
confirm commits the full selected set (`selectSchool` + `selectGroup` with the set, mocked) and
dismisses the stack (mocked Expo Router dismissal), and confirming an empty selection is guarded; the
school-picker screen test SHALL assert the accent/code search filters through the helper. The
configured coverage thresholds SHALL stay green with no change to `mobile/jest.config.js`.

#### Scenario: The search helper is unit-tested under the 90% gate
- **WHEN** the unit suite runs with coverage
- **THEN** the pure search/normalize helper is covered under the 90% logic gate

#### Scenario: The group screen test covers multi-select, confirm, dismissal, and the empty guard
- **WHEN** the group-picker screen test runs
- **THEN** it asserts leaf toggle, branch expand/collapse, a full-set confirm-commit, stack dismissal, and the empty-selection guard

#### Scenario: The coverage gate stays green without config changes
- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds still pass
- **AND** `mobile/jest.config.js` `coverageThreshold` is unchanged

### Requirement: New picker UI strings are fully localized (FR + EN)
Every new user-facing string introduced by the completed picker SHALL be a translation key with
complete FR and EN catalog entries — the group-step confirm action and its accessibility label, the
per-leaf selected/unselected accessibility state copy, and the empty-selection guard message. The
existing group-node label SHALL be re-authored for the toggle semantics. Localization SHALL be
enforced by the no-hardcoded-strings lint rule and by `tsc`-typed bidirectional FR/EN parity.

#### Scenario: No hardcoded user-facing string in the new picker UI
- **WHEN** the group step renders the confirm action, a leaf's selected-state copy, or the empty guard
- **THEN** that string comes from a translation key
- **AND** the no-hardcoded-strings lint rule passes

#### Scenario: FR and EN catalogs stay in parity for the new keys
- **WHEN** a new picker key is added to one catalog
- **THEN** the same key exists in the other catalog
- **AND** `tsc` fails if a key is missing or extra in either direction

### Requirement: Every new interactive picker control is accessible
Every new or changed interactive control SHALL declare an accessibility role and a meaningful
translated accessibility label, expose its selected state where applicable, and provide a touch target
of at least 44pt (iOS) / 48dp (Android): each toggleable leaf node (with an accessible
selected/unselected state), the confirm action, and any guard control. The accessibility-lint rules
SHALL pass with zero warnings. No text SHALL disable font scaling.

#### Scenario: A toggleable leaf exposes its selected state accessibly
- **WHEN** a leaf group node renders
- **THEN** it declares an accessibility role and a translated label
- **AND** it exposes whether it is currently selected

#### Scenario: The confirm action is accessible
- **WHEN** the confirm action renders
- **THEN** it declares an accessibility role and a translated label
- **AND** it provides a ≥44pt/48dp touch target

### Requirement: The Maestro flow is extended only where reliably driveable across both platforms
The e2e suite's `mobile/.maestro/onboarding.yaml` SHALL be extended only with assertions stable across
iOS and Android. The school search and the school→group push are stable and MAY be exercised; driving
the multi-select group toggle/confirm SHALL NOT be added when its leaf selectors are fixture-dependent
(group values vary by school) — that behavior stays proven by the Jest screen tests. A flaky e2e step
SHALL NOT be shipped; if no group step is reliably driveable, the flow stays at the live-school-read
assertion it already proves.

#### Scenario: Only stable steps are added to the e2e flow
- **WHEN** the onboarding Maestro flow is extended
- **THEN** only assertions stable across both platforms are added
- **AND** fixture-dependent multi-select group toggle/confirm steps are left to the Jest screen tests
