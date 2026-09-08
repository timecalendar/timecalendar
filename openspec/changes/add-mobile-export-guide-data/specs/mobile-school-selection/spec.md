## MODIFIED Requirements

### Requirement: Schools and per-school groups are read from the server through TanStack Query behind a feature query layer
The app SHALL read the list of schools from `GET /schools` and per-school groups from the generated TanStack Query hooks over `customFetch`, only through `mobile/src/features/school-selection/data/`. Screens SHALL consume the feature barrel and SHALL NOT import generated API hooks or call `fetch` directly. `SchoolListItem` SHALL remain a minimal domain projection while carrying `intranetUrl` and a copied neutral `exportGuide` reference with raw `providerSlug`, `requireProgramme`, `requireConnect`, and exact `catalogueVersion`, so the later import journey can request the pinned server version without retaining a generated DTO or issuing another school request.

#### Scenario: School and group reads keep the generated seam
- **WHEN** school or group data is requested
- **THEN** the feature data layer wraps the corresponding generated hook over `customFetch`
- **AND** screens do not import generated hooks or call fetch directly

#### Scenario: School projection carries guide identity and gates
- **WHEN** `SchoolForList` is mapped to `SchoolListItem`
- **THEN** its nullable `intranetUrl` and all four `exportGuide` fields are copied exactly into domain values
- **AND** an unknown valid raw provider slug is preserved for later Generic resolution

#### Scenario: Generated DTO is not retained downstream
- **WHEN** onboarding stores the selected `SchoolListItem` in its ephemeral draft
- **THEN** later features can consume the domain export-guide reference without importing `SchoolForList` or issuing a second school query

