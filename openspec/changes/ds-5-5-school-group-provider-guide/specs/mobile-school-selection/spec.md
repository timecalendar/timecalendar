## MODIFIED Requirements

### Requirement: The school-group step is retained dormant and is reached by nothing
The school-group step SHALL remain in the tree with its current behaviour while it exists, and SHALL
be reached by no shipped path. Concretely: `mobile/src/app/onboarding/groups.tsx` stays registered in
the onboarding `Stack` and resolvable at `timecalendar-dev://onboarding/groups?schoolId=<id>`; the
`school-group-picker-screen` component keeps its selectors, accessible names, roles, selected and
expanded states, translation keys, selection guard, commit and dismissal; and no screen, deep link
on a user path, or navigation call reaches the step from the school list or from any import-journey
step. Its presentation SHALL use the design-system list rows, sections and button, and its colocated
test SHALL change only where it asserts presentation. School groups SHALL NOT be implemented,
enabled, or extended, and the step SHALL NOT gain new behavior. Deleting the step, its screen, its
tests, its translation keys, and the last writer of the persisted school/group selection is a
deliberate separate cleanup, not part of any change that touches the import journey.

#### Scenario: The route is registered and dev-deep-linkable
- **WHEN** the onboarding Stack's routes are enumerated
- **THEN** `onboarding/groups` is registered
- **AND** `timecalendar-dev://onboarding/groups?schoolId=<id>` resolves to it

#### Scenario: No shipped path reaches the step
- **WHEN** the school list, the institution-name step, the programme step, Connect, or manual import is used
- **THEN** none of them navigates to the group step

#### Scenario: The retained implementation stays green and unchanged
- **WHEN** the mobile suite runs
- **THEN** the group-picker screen's colocated behaviour tests (toggle, expand without selecting,
  commit and dismiss, empty-confirm guard, loading, empty, error with retry, cached-error retention)
  pass with the same selectors and accessible names
- **AND** its translation keys keep FR/EN parity and its accessibility lint passes

#### Scenario: Presentation uses the design system
- **WHEN** the group step renders a tree with a branch and leaves
- **THEN** leaves and branches are design-system list rows inside list sections, a branch exposes
  the expanded state, a leaf exposes the selected state, and Confirm is the filled design-system
  button
- **AND** the screen file is on no ratchet allowlist and passes the migrated-screen contract

#### Scenario: The step gains no new behavior
- **WHEN** a change touches the import journey or the school list
- **THEN** it does not implement, enable, or extend school groups

## ADDED Requirements

### Requirement: School rows lead with the design-system thumbnail
Each school row SHALL lead with the design-system thumbnail at the medium size, showing the
school's dark logo in the dark scheme when present and its default logo otherwise, and the first
letter of the school name as the monogram when there is no logo or it fails to load. The row's
accessible name SHALL stay the bare school name.

#### Scenario: Logo and fallback
- **WHEN** one school has a logo URL and another has none
- **THEN** the first row shows the logo image and the second shows its monogram
- **AND WHEN** the first logo fails to load
- **THEN** that row shows its monogram

#### Scenario: Name stays bare
- **WHEN** a screen reader focuses a school row
- **THEN** it reads the school name and the row hint, and nothing from the logo
