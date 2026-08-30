# mobile-school-selection — delta

## MODIFIED Requirements

### Requirement: Schools and per-school groups are read from the server through TanStack Query behind a feature query layer
The app SHALL read the list of schools from the server's `GET /schools` endpoint and, for a chosen
school, its school groups from the per-school groups endpoint, using the committed generated TanStack
Query hooks over the single `customFetch` mutator. The query calls SHALL be reached only through a
feature query layer under `mobile/src/features/school-selection/data/` (the 90% coverage glob); the
presentational screens SHALL consume the feature barrel and SHALL NOT import the generated API hooks or
call `fetch` directly. No new network code SHALL be written (the generated client + `customFetch` stay
the only fetch path). The `SchoolListItem` domain projection SHALL additionally carry the school's
nullable `intranetUrl` from the generated `SchoolForList`, so the Connect step can render an
institution link from the already-fetched (and offline-persisted) school list without issuing a
second request. The projection SHALL stay minimal: only what the screens render plus what the import
journey needs.

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

#### Scenario: The projection carries the nullable intranet URL
- **WHEN** the schools query maps a `SchoolForList` into `SchoolListItem`
- **THEN** the projection includes `intranetUrl` as `string | null`
- **AND** the Connect step reads it from the import draft rather than issuing another query

### Requirement: The school-selection flow uses nested navigation as a route group of thin entrypoints
The school-selection flow SHALL live as a route group under `mobile/src/app/onboarding/` with its own
nested stack layout, registered as a `Stack` sibling of the `(tabs)` group in the root layout so it is
reachable. Each route SHALL be a thin entrypoint that only re-exports a presentational screen from a
feature `ui/` sublayer (keeping colocated tests out of the route tree). The flow SHALL be reachable
from Settings' calendar management via an accessible entry control and via the development deep links
`timecalendar-dev://onboarding` (welcome), `timecalendar-dev://onboarding/school` (school list) and
`timecalendar-dev://onboarding/groups?schoolId=<id>` (the retained group step). **Selecting a school
SHALL open the import journey's programme step with a `listed` import draft**, not the group step;
the group step remains registered and deep-linkable but is no longer reached from the school list.
The school list's "I can't find my school" action SHALL open the institution-name step of the import
journey rather than navigating straight to the iCal-URL route.

#### Scenario: The flow is a nested route group reachable as a Stack sibling
- **WHEN** the root layout declares its routes
- **THEN** `onboarding` is a `Stack` screen sibling of the `(tabs)` group
- **AND** it has a nested stack layout containing the school step and the import-journey steps

#### Scenario: Routes are thin entrypoints over feature screens
- **WHEN** an onboarding route and its colocated test are located
- **THEN** the screen lives in a feature `ui/` sublayer with its test beside it
- **AND** the route under `mobile/src/app/onboarding/` only re-exports the screen

#### Scenario: Selecting a school opens the programme step with a listed draft
- **WHEN** the user selects a school in the school step
- **THEN** the import draft holds that school as a `listed` institution
- **AND** the programme step is pushed

#### Scenario: The missing-school action opens the institution-name step
- **WHEN** the user activates "I can't find my school"
- **THEN** the institution-name step is pushed
- **AND** the iCal-URL route is not opened directly from the school list

#### Scenario: The flow is reachable from calendar management and via deep links
- **WHEN** the user activates the add-calendar entry from calendar management
- **THEN** the school step is shown
- **AND** the development deep links reach their corresponding steps

### Requirement: The selected school and group are persisted through the storage seam and read downstream
Selecting a school (and one or more groups within it) SHALL persist the selection through the
`@/storage` seam, via a typed, defensively-validated store under
`mobile/src/features/school-selection/` (the 90% coverage glob) mirroring the Settings preferences
shape. The store SHALL persist only the selection identity (the school id and the selected group
**value(s)** — a set of zero or more), not the full server DTOs. A read SHALL be total: an unset or
corrupt stored value SHALL read as "no selection" rather than throwing. A reactive hook SHALL expose
the current selection so consumers re-render when it changes. The onboarding-complete state SHALL be
derived from whether a selection exists; no separate completion flag SHALL be stored. **This
persisted selection SHALL NOT be a source of truth for calendar creation or for import failure
reporting** — those read the ephemeral import draft — and entering the unlisted institution path
SHALL clear it through the store's public clear operation, so no stale school identity can be
attributed to a later import. The store's API and its identity-only, array-shaped `groupValues`
contract SHALL be unchanged.

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

#### Scenario: Calendar creation never reads the persisted selection
- **WHEN** a calendar is created or an import failure is reported
- **THEN** the institution and programme values come from the ephemeral import draft
- **AND** the persisted school selection is not read for either purpose

#### Scenario: The unlisted path clears the persisted selection
- **WHEN** a school selection is persisted and the user completes the unlisted institution step
- **THEN** the persisted selection is cleared through the store's public clear operation
- **AND** a subsequent read reports "no selection"
