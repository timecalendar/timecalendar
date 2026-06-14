# mobile-school-selection Specification

## Purpose
TBD - created by archiving change add-mobile-school-selection. Update Purpose after archive.
## Requirements
### Requirement: Schools and per-school groups are read from the server through TanStack Query behind a feature query layer
The app SHALL read the list of schools from the server's `GET /schools` endpoint and, for a chosen
school, its school groups from the per-school groups endpoint, using the committed generated TanStack
Query hooks over the single `customFetch` mutator. The query calls SHALL be reached only through a
feature query layer under `mobile/src/features/school-selection/data/` (the 90% coverage glob); the
presentational screens SHALL consume the feature barrel and SHALL NOT import the generated API hooks or
call `fetch` directly. No new network code SHALL be written (the generated client + `customFetch` stay
the only fetch path).

#### Scenario: The school list is read from the live endpoint
- **WHEN** the school-picker screen mounts
- **THEN** it reads the school list through the feature query layer's schools hook
- **AND** that hook wraps the generated `findSchools` query over `customFetch`

#### Scenario: A chosen school's groups are read from the live endpoint
- **WHEN** the group-picker screen mounts for a selected `schoolId`
- **THEN** it reads that school's groups through the feature query layer's groups hook
- **AND** that hook wraps the generated per-school `findSchoolGroups` query

#### Scenario: Screens reach the server only through the feature layer
- **WHEN** a presentational onboarding screen needs server data
- **THEN** it imports the read hooks from `@/features/school-selection`
- **AND** it does not import the generated API hooks or call `fetch` directly

### Requirement: The query cache is persisted offline through a sync persister backed by the MMKV storage seam
The app SHALL persist the schools and school-groups query cache to device storage so a cold launch
without network shows the last-fetched data. Persistence SHALL use a synchronous TanStack Query
persister whose storage is backed by the existing `@/storage` MMKV seam through a `Storage`-shaped
adapter exported from `mobile/src/storage/index.ts` (so `react-native-mmkv` stays imported only inside
`src/storage/**`). The root layout SHALL mount the persisting query-client provider in place of the
bare provider. The persisted set SHALL be limited to the schools/groups queries (not the whole cache),
SHALL carry a max-age and a cache-version buster, and SHALL be discarded when the buster changes.

#### Scenario: A cold launch offline shows the last-fetched data
- **WHEN** the app cold-launches with no network after a prior successful fetch
- **THEN** the persisted schools/groups cache is restored
- **AND** the onboarding screens render the last-fetched data rather than only an error

#### Scenario: The persister is backed by the storage seam, not the backend directly
- **WHEN** the query persister reads or writes the persisted cache
- **THEN** it uses a `Storage`-shaped adapter exported from `@/storage`
- **AND** `react-native-mmkv` is imported only inside `src/storage/**`

#### Scenario: Only the intended queries are persisted, and a buster discards stale caches
- **WHEN** the cache is dehydrated for persistence
- **THEN** only the schools and school-groups queries are written
- **AND** a persisted cache from an older buster version is discarded rather than rehydrated

### Requirement: The query client carries an explicit, justified read policy
The shared `QueryClient` SHALL define explicit query defaults (stale time, garbage-collection time, and
a bounded retry) rather than relying on the framework's stock defaults. The garbage-collection time
SHALL be at least the persister's max-age so an in-memory query is not collected before the persister
would restore it. The policy SHALL be set once on the client's default query options.

#### Scenario: The client sets explicit query defaults
- **WHEN** the query client is constructed
- **THEN** it sets a non-zero stale time, a garbage-collection time at least the persister max-age, and a bounded retry

#### Scenario: A failed read surfaces an error after the bounded retry
- **WHEN** a server read fails repeatedly up to the retry bound with no usable cache
- **THEN** the screen surfaces an error state with an accessible retry affordance

### Requirement: The school-selection flow uses nested navigation as a route group of thin entrypoints
The school-selection flow SHALL be a nested-navigation flow: a school-picker step and a group-picker
step within the chosen school. It SHALL live as a route group under `mobile/src/app/onboarding/` with
its own nested stack layout, registered as a `Stack` sibling of the `(tabs)` group in the root layout so
it is reachable. Each route SHALL be a thin entrypoint that only re-exports a presentational screen
from `mobile/src/components/onboarding/` (keeping colocated tests out of the route tree). The flow SHALL
be reachable from the Profile tab via an accessible entry control and via the development deep links
`timecalendar-dev://onboarding` (school list) and `timecalendar-dev://onboarding/groups?schoolId=<id>`
(the nested step). Selecting a school SHALL navigate to the group step for that school.

#### Scenario: The flow is a nested route group reachable as a Stack sibling
- **WHEN** the root layout declares its routes
- **THEN** `onboarding` is a `Stack` screen sibling of the `(tabs)` group
- **AND** it has a nested stack layout with a school step and a group step

#### Scenario: Routes are thin entrypoints over components
- **WHEN** an onboarding route and its colocated test are located
- **THEN** the screen lives in `mobile/src/components/onboarding/` with its test beside it
- **AND** the route under `mobile/src/app/onboarding/` only re-exports the screen

#### Scenario: Selecting a school opens the nested group step
- **WHEN** the user selects a school in the school step
- **THEN** the group step for that school's id is pushed onto the nested stack

#### Scenario: The flow is reachable from Profile and via deep links
- **WHEN** the user activates the school-selection entry on the Profile tab
- **THEN** the school step is shown
- **AND** the development deep links `timecalendar-dev://onboarding` and `.../onboarding/groups?schoolId=<id>` reach the corresponding steps

### Requirement: The selected school and group are persisted through the storage seam and read downstream
Selecting a school (and a group within it) SHALL persist the selection through the `@/storage` seam,
via a typed, defensively-validated store under `mobile/src/features/school-selection/` (the 90%
coverage glob) mirroring the Settings preferences shape. The store SHALL persist only the selection
identity (the school id and the selected group value(s)), not the full server DTOs. A read SHALL be
total: an unset or corrupt stored value SHALL read as "no selection" rather than throwing. A reactive
hook SHALL expose the current selection so consumers re-render when it changes. The onboarding-complete
state SHALL be derived from whether a selection exists; no separate completion flag SHALL be stored.

#### Scenario: A selection is persisted and reactively readable
- **WHEN** the user selects a school and a group
- **THEN** the selection identity is persisted through `@/storage`
- **AND** the reactive selection hook reflects the new selection

#### Scenario: A read of the selection is total
- **WHEN** the stored selection is unset or corrupt
- **THEN** the selection store reports "no selection"
- **AND** no error is thrown

#### Scenario: Onboarding-complete is derived from the selection
- **WHEN** a school (and any required group) is selected
- **THEN** onboarding-complete is derived as true from the persisted selection
- **AND** no separate completion flag is stored

### Requirement: The throwaway schools harness surface is removed and replaced by the onboarding flow
The scaffold's throwaway schools harness surface SHALL be removed: the schools screen component, its
test, its thin route, its root-layout `Stack` registration, its now-orphaned i18n keys, and its Maestro
flow. The real onboarding flow and its Maestro flow SHALL become the live server-round-trip surface in
its place. The golden-path reference document SHALL be updated so its "closest references" point at the
onboarding screens, their tests, and the onboarding Maestro flow rather than the removed schools
surface.

#### Scenario: The schools harness files are removed
- **WHEN** the change lands
- **THEN** the schools screen, its test, its route, its `Stack` registration, its i18n keys, and `.maestro/schools.yaml` no longer exist

#### Scenario: The onboarding flow is the live round-trip surface
- **WHEN** a live server-round-trip reference surface is needed
- **THEN** the onboarding flow and `mobile/.maestro/onboarding.yaml` serve that role
- **AND** the golden-path document references the onboarding screens/tests/flow

### Requirement: The onboarding screens handle loading, error, and offline states accessibly
The school-picker and group-picker screens SHALL render accessible loading, error, and empty states:
status text SHALL carry a polite live region and an appropriate status role, and the error state SHALL
offer an accessible retry that refetches. When the persisted cache is available offline, the screens
SHALL render the cached data rather than only an error. No text SHALL disable font scaling.

#### Scenario: Loading and error states are accessible
- **WHEN** a read is loading or has failed
- **THEN** the status is announced via a polite live region with a status role
- **AND** the error state offers an accessible retry that refetches

#### Scenario: Offline renders the cached data
- **WHEN** the screen mounts offline with a restored cache
- **THEN** it renders the cached schools/groups
- **AND** it does not show only an error

### Requirement: Onboarding UI strings are fully localized (FR + EN)
Every user-facing string on the onboarding screens SHALL be a translation key with complete FR and EN
catalog entries — covering titles, the Profile entry control, list/empty/loading/error states, the
retry action, group labels, and accessibility labels. Localization SHALL be enforced by the no-hardcoded-strings
lint rule and by `tsc`-typed bidirectional FR/EN parity (a missing or extra key in either catalog fails
the typecheck).

#### Scenario: No hardcoded user-facing string in the onboarding UI
- **WHEN** an onboarding screen renders text or an accessibility label
- **THEN** that string comes from a translation key
- **AND** the no-hardcoded-strings lint rule passes

#### Scenario: FR and EN catalogs are complete and in parity
- **WHEN** an onboarding key is added to one catalog
- **THEN** the same key exists in the other catalog
- **AND** `tsc` fails if a key is missing or extra in either direction

### Requirement: Every interactive onboarding control is accessible
Every interactive control SHALL declare an accessibility role and a meaningful translated accessibility
label and provide a touch target of at least 44pt (iOS) / 48dp (Android): the Profile entry control,
each selectable school row, each selectable/expandable group node, and the retry action. The
accessibility-lint rules SHALL pass.

#### Scenario: Interactive controls declare role and label
- **WHEN** an interactive onboarding control renders
- **THEN** it declares an accessibility role and a translated accessibility label

#### Scenario: Accessibility lint passes
- **WHEN** the lint suite runs over the new UI
- **THEN** the accessibility-lint rules pass with zero warnings

### Requirement: The query layer, persist config, store, and screens are verified by automated tests under the coverage gates
The unit-test suite SHALL cover, under the 90% logic gate: the feature query layer (the schools/groups
read hooks map the generated query states to the domain shape, mocked at the `customFetch` seam), the
persist configuration (its dehydrate predicate persists only the schools/groups queries; the buster
behavior), and the selection store (round-trips the selection through `@/storage`; a total read on
unset/corrupt; the reactive hook reflects a change; onboarding-complete derives correctly). It SHALL
cover, under the 70% floor: the school-picker screen (renders rows from the read hook, loading/error/
empty states, retry triggers refetch, selecting a school navigates to the group step) and the
group-picker screen (renders the group tree, selecting a group persists it). Server reads SHALL be
mocked at the `customFetch` mutator seam (the established testing posture). The configured coverage
thresholds SHALL stay green without changing `jest.config.js`.

#### Scenario: The query layer and store are covered at the 90% gate
- **WHEN** the suite runs with coverage
- **THEN** `src/features/school-selection/**` meets the 90% lines+branches threshold

#### Scenario: Selecting a school navigates to the group step
- **WHEN** the school-picker test selects a school
- **THEN** the test asserts navigation to the group step with that school's id

#### Scenario: The coverage gate stays green without config changes
- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds still pass
- **AND** `jest.config.js` `coverageThreshold` is unchanged

### Requirement: A Maestro flow proves the live school-read round-trip, replacing the schools flow
The e2e suite SHALL include `mobile/.maestro/onboarding.yaml` that cold-launches the development-variant
app, deep-links to the onboarding school step, and asserts a seeded school renders from the live
`GET /schools` round-trip (app → generated client → `customFetch` → NestJS → Postgres, nothing mocked),
using a stable ASCII seeded fixture name. It MAY additionally select the school and assert the nested
group step opens (a second live read). This flow SHALL replace the removed `mobile/.maestro/schools.yaml`
as the server-round-trip proof.

#### Scenario: The onboarding Maestro flow proves the live read
- **WHEN** the onboarding Maestro flow runs on iOS or Android
- **THEN** it deep-links to the school step and asserts a seeded school name renders from the live endpoint

#### Scenario: The onboarding flow replaces the schools flow
- **WHEN** the e2e suite is enumerated
- **THEN** `mobile/.maestro/onboarding.yaml` exists and `mobile/.maestro/schools.yaml` does not

