# mobile-school-selection — delta

## MODIFIED Requirements

### Requirement: The query layer, persist config, store, and screens are verified by automated tests under the coverage gates
The unit-test suite SHALL cover, under the 90% logic gate: the feature query layer (the schools/groups
read hooks map the generated query states to the domain shape, mocked at the `customFetch` seam), the
persist configuration (its dehydrate predicate persists only the schools/groups queries; the buster
behavior), the selection store (round-trips the selection through `@/storage`; a total read on
unset/corrupt; the reactive hook reflects a change; onboarding-complete derives correctly), and the
pure search/normalize helper (accents, spacing, name-vs-code matching, no-match). It SHALL cover,
under the 70% floor, the school-picker screen: it renders rows from the read hook, handles
loading/error/empty states, retry triggers a refetch, the accent/code search filters through the pure
helper, **selecting a school seeds a `listed` import draft and pushes the programme step**, and "I
can't find my school" pushes the institution-name step. No test SHALL assert navigation from the
school list to the group step. The retained dormant group-picker screen's existing coverage SHALL
stay green unchanged. Server reads SHALL be mocked at the `customFetch` mutator seam (the established
testing posture). The configured coverage thresholds SHALL stay green without changing
`jest.config.js`.

#### Scenario: The query layer, store, and search helper are covered at the 90% gate
- **WHEN** the suite runs with coverage
- **THEN** `src/features/school-selection/**` meets the 90% lines+branches threshold
- **AND** that coverage includes the pure search/normalize helper

#### Scenario: Selecting a school navigates to the programme step
- **WHEN** the school-picker test selects a school
- **THEN** the test asserts that school is held as a `listed` import institution and the programme step is pushed
- **AND** no test asserts navigation to the group step

#### Scenario: The missing-school action is covered
- **WHEN** the school-picker test activates "I can't find my school"
- **THEN** the test asserts the institution-name step is pushed

#### Scenario: The coverage gate stays green without config changes
- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds still pass
- **AND** `jest.config.js` `coverageThreshold` is unchanged

### Requirement: A Maestro flow proves the live school-read round-trip, replacing the schools flow
The e2e suite SHALL include `mobile/.maestro/onboarding.yaml` that cold-launches the development-variant
app, deep-links to the onboarding school step, and asserts a seeded school renders from the live
`GET /schools` round-trip (app → generated client → `customFetch` → NestJS → Postgres, nothing mocked),
using a stable ASCII seeded fixture name. It SHALL then tap that seeded school and assert the
**programme step** opens, proving on-device that the school row enters the import journey rather than
the group step. It SHALL NOT drive the dormant group step. This flow SHALL replace the removed
`mobile/.maestro/schools.yaml` as the server-round-trip proof.

#### Scenario: The onboarding Maestro flow proves the live read
- **WHEN** the onboarding Maestro flow runs on iOS or Android
- **THEN** it deep-links to the school step and asserts a seeded school name renders from the live endpoint

#### Scenario: Tapping the seeded school opens the programme step
- **WHEN** the flow taps the seeded school row
- **THEN** it asserts the programme step is visible
- **AND** it makes no assertion about the group step

#### Scenario: The onboarding flow replaces the schools flow
- **WHEN** the e2e suite is enumerated
- **THEN** `mobile/.maestro/onboarding.yaml` exists and `mobile/.maestro/schools.yaml` does not

### Requirement: The Maestro flow is extended only where reliably driveable across both platforms
The e2e suite's `mobile/.maestro/onboarding.yaml` SHALL be extended only with assertions stable across
iOS and Android. The school search and the school → programme push are stable and are exercised;
everything below the programme step — the programme field, the native header Skip, Connect, and the
manual-import step — SHALL stay Jest-proven, and the camera and live-import steps SHALL NOT be driven
here at all (CI has no camera). The dormant group step SHALL NOT be driven: its leaf selectors are
fixture-dependent (group values vary by school) and nothing navigates to it, so an assertion there
would prove nothing about a shipped path. A flaky e2e step SHALL NOT be shipped.

#### Scenario: Only stable steps are added to the e2e flow
- **WHEN** the onboarding Maestro flow is extended
- **THEN** only assertions stable across both platforms are added
- **AND** the steps below the programme step are left to the Jest screen tests

#### Scenario: The dormant group step is not driven
- **WHEN** the onboarding Maestro flow is enumerated
- **THEN** it contains no group-step toggle, confirm, or navigation assertion

## REMOVED Requirements

### Requirement: The group-picker step is a multi-select tree committed by an explicit confirm action

**Reason**: The behavior is no longer reachable. [TIM-391](/TIM/issues/TIM-391)
([#323](https://github.com/timecalendar/timecalendar/pull/323)) rerouted the school row to the import
journey's programme step, so no navigation reaches the group step; the canonical spec
(`docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`) puts group
selection, group discovery, and group-based iCal generation out of scope, and no production school
exposes configured groups. Keeping this as a live requirement asserts a shipped capability that a
student cannot reach.

**Migration**: The implementation is **not** deleted. Its retained, dormant state — route registered,
deep-linkable, screen and tests unchanged, reached by nothing — is carried by the new requirement
"The school-group step is retained dormant and is reached by nothing" below, which also names its
deletion as a separate cleanup.

### Requirement: Completing the picker dismisses the whole onboarding stack

**Reason**: Nothing completes the picker on a shipped path. The stack dismissal it describes is the
tail of the removed group-selection journey; the import journey ends at QR or iCal-URL creation, whose
own exit behavior is specified in `mobile-import-journey` and `mobile-qr-scan`.

**Migration**: `router.dismissTo` in `school-group-picker-screen.tsx` still runs when the step is
opened by its dev deep link. That retained behavior is covered by the dormancy requirement below.

### Requirement: New picker UI strings are fully localized (FR + EN)

**Reason**: Scoped entirely to the group step's confirm action, per-leaf selected-state copy, and
empty-selection guard — strings on a surface no shipped path reaches.

**Migration**: The keys and their FR/EN parity still exist and still pass the typed-parity check.
The dormancy requirement below requires them to stay unchanged while the step exists, and the
repository-wide localization requirements ("Onboarding UI strings are fully localized (FR + EN)")
continue to apply to every onboarding surface.

### Requirement: Every new interactive picker control is accessible

**Reason**: Scoped entirely to the group step's toggleable leaves, confirm action, and guard control
— an accessibility contract for controls on a surface no shipped path reaches.

**Migration**: The contracts still hold in code and the accessibility lint still covers the file. The
dormancy requirement below requires them to stay unchanged, and "Every interactive onboarding control
is accessible" continues to cover every reachable onboarding control.

### Requirement: The completed picker behavior is verified by automated tests under the coverage gates

**Reason**: The requirement bundles live coverage (the pure accent/code search helper) with coverage
of the removed group behavior, so it cannot be corrected without splitting it.

**Migration**: The search-helper coverage moves into "The query layer, persist config, store, and
screens are verified by automated tests under the coverage gates" above, which also fixes its false
"navigates to the group step" scenario. The group-picker screen test file is retained unchanged and
its green state is required by the dormancy requirement below.

## ADDED Requirements

### Requirement: The school-group step is retained dormant and is reached by nothing
The school-group step SHALL remain in the tree in exactly its current form while it exists, and SHALL
be reached by no shipped path. Concretely: `mobile/src/app/onboarding/groups.tsx` stays registered in
the onboarding `Stack` and resolvable at `timecalendar-dev://onboarding/groups?schoolId=<id>`; the
`school-group-picker-screen` component, its colocated test, its translation keys, and its
accessibility contracts stay unchanged and green; and no screen, deep link on a user path, or
navigation call reaches the step from the school list or from any import-journey step. School groups
SHALL NOT be implemented, enabled, or extended, and the step SHALL NOT gain new behavior. Deleting the
step, its screen, its tests, its translation keys, and the last writer of the persisted school/group
selection is a deliberate separate cleanup, not part of any change that touches the import journey.

#### Scenario: The route is registered and dev-deep-linkable
- **WHEN** the onboarding Stack's routes are enumerated
- **THEN** `onboarding/groups` is registered
- **AND** `timecalendar-dev://onboarding/groups?schoolId=<id>` resolves to it

#### Scenario: No shipped path reaches the step
- **WHEN** the school list, the institution-name step, the programme step, Connect, or manual import is used
- **THEN** none of them navigates to the group step

#### Scenario: The retained implementation stays green and unchanged
- **WHEN** the mobile suite runs
- **THEN** the group-picker screen's colocated test passes unchanged
- **AND** its translation keys keep FR/EN parity and its accessibility lint passes

#### Scenario: The step gains no new behavior
- **WHEN** a change touches the import journey or the school list
- **THEN** it does not implement, enable, or extend school groups
