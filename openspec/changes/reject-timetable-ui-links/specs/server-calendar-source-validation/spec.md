## ADDED Requirements

### Requirement: Calendar sources are syntactically validated before fetch work

The server SHALL parse every calendar source at the shared fetch boundary before strategy
resolution, URL transformation, retry accounting, or fetcher invocation. It SHALL accept only
absolute `http:`, `https:`, and `webcal:` URLs. Empty, relative, malformed, and all other-scheme
values SHALL fail with HTTP 400 and the stable message `Unsupported calendar URL`, without
including any submitted URL bytes in the public error.

#### Scenario: Malformed source never reaches a fetcher

- **WHEN** calendar creation receives an empty, relative, malformed, or structurally invalid URL
- **THEN** it fails with the stable HTTP 400 error before any strategy fetcher or outbound request
  is invoked

#### Scenario: Unsupported scheme never reaches a fetcher

- **WHEN** calendar creation receives a syntactically valid URL using a scheme other than HTTP,
  HTTPS, or `webcal`
- **THEN** it fails with the same stable HTTP 400 error before any strategy fetcher or outbound
  request is invoked

#### Scenario: Webcal remains eligible for generic normalization

- **WHEN** a structurally valid `webcal` source is submitted
- **THEN** validation accepts it and the existing generic renamer converts it to HTTPS before the
  selected fetcher is invoked

### Requirement: Only proven host-bound timetable UI paths are rejected

The server SHALL reject a syntactically valid source as a timetable UI only when its parsed
hostname and pathname exactly match a configured proven pair. The initial rule set SHALL cover:

- `edt.univ-lyon1.fr` with `/` or `/jsp/standard/index.jsp`;
- `plannings.ube.fr` with `/` or `/jsp/standard/index.jsp`;
- `proseconsult.umontpellier.fr` with `/`, `/direct`, or `/direct/`;
- `planning.univ-rennes.fr` with `/`, `/jsp/standard/index.jsp`, `/direct`, or `/direct/`; and
- `edt.univ-tlse3.fr` with `/calendar`, `/calendar/`, or `/calendar/default.aspx`.

The comparison SHALL use the parsed exact hostname rather than substring or suffix matching. Query
parameters and fragments SHALL NOT make a listed UI path eligible. The same pathname on any other
host and any unlisted pathname on those hosts SHALL remain eligible for the existing fetch pipeline.

#### Scenario: Lyon 1 and UBE portal pages reject before fetch

- **WHEN** a source identifies a listed Lyon 1 or UBE ADE portal path, with or without query or
  fragment values
- **THEN** the server returns the stable unsupported-calendar error and no fetcher is invoked

#### Scenario: Montpellier direct UI rejects before fetch

- **WHEN** a source identifies the Montpellier root or `/direct/` timetable UI, including an
  encrypted `data` query
- **THEN** the server returns the stable unsupported-calendar error and no fetcher is invoked

#### Scenario: Rennes portal and direct UI reject before fetch

- **WHEN** a source identifies a listed Rennes portal or `/direct/` timetable UI path
- **THEN** the server returns the stable unsupported-calendar error and no fetcher is invoked

#### Scenario: Toulouse 3 Celcat calendar UI rejects before fetch

- **WHEN** a source identifies the Toulouse 3 `/calendar` UI landing/default page
- **THEN** the server returns the stable unsupported-calendar error and no fetcher is invoked

#### Scenario: A lookalike host is not classified as a known university

- **WHEN** an otherwise-listed path is submitted on a parent, subdomain, or suffix-planted hostname
  that is not an exact configured host
- **THEN** source validation does not reject it as one of the configured timetable UIs

#### Scenario: An ambiguous path on another host stays eligible

- **WHEN** an unrelated HTTP(S) provider uses `/calendar`, `/direct/`, or `/` as a real feed path
- **THEN** the source continues through the existing strategy, transformation, and fetch pipeline

### Requirement: Valid ADE and Celcat exports preserve the existing pipeline

Source validation SHALL NOT reject a recognized ADE planning iCal export or a non-UI Celcat export,
including exports served on a hostname that also has a rejected UI rule. Accepted sources SHALL
retain existing `webcal` conversion, bounded ADE date-window normalization, school-specific
renamers and fetchers, retry and minimum-sync-interval policies, parsing, and cancelled-event
filtering.

#### Scenario: ADE export on a portal host remains accepted

- **WHEN** a listed ADE origin receives
  `/jsp/custom/modules/plannings/anonymous_cal.jsp` or `direct_cal.jsp` with `calType=ical` and a
  supported date window
- **THEN** the URL reaches existing ADE normalization and the selected fetcher with all non-window
  source values preserved

#### Scenario: Celcat export on the Toulouse origin remains accepted

- **WHEN** a source on `edt.univ-tlse3.fr` uses a non-UI Celcat export pathname
- **THEN** it reaches the selected fetcher and parser rather than being rejected because the same
  origin also serves `/calendar`

### Requirement: Rejected creation preserves failure recording and empty-feed policy

A pre-fetch validation failure during new-calendar creation SHALL use the existing failed-fetch
flow: no `Calendar` or `CalendarContent` SHALL be created, and exactly one `calendar_failure` SHALL
store the full original submitted source plus the serialized stable error. Existing-calendar syncs
SHALL retain their existing no-new-failure-row behavior. An accepted feed whose parsed event list is
empty SHALL continue to fail through the existing `No events found` gate.

#### Scenario: Rejected new source is recorded with its original bytes

- **WHEN** a new calendar uses a listed timetable UI source
- **THEN** creation makes no outbound request, creates no calendar/content, and writes one
  `calendar_failure` whose URL equals the full submitted source

#### Scenario: Existing rejected source follows failed-sync persistence policy

- **WHEN** an already-stored calendar becomes due and its source now matches a rejection rule
- **THEN** no outbound request occurs and the existing failed-sync behavior preserves last-known
  content without creating a new-calendar failure row

#### Scenario: Eventless valid feed still fails

- **WHEN** an accepted source is fetched and parsed successfully but produces zero actual events
- **THEN** creation fails with `No events found` and does not create an empty calendar

### Requirement: Toulouse 3 uses the existing Celcat export guide

The server's persisted school provider mapping for code `univtoulouse3` SHALL be `celcat`. A
committed data migration SHALL change only that school when its prior provider is `generic` or the
legacy `univtoulouse3` value, SHALL preserve every unrelated school and every unexpected newer
Toulouse 3 value, and SHALL provide a guarded rollback to `generic` only while the row still has
`celcat`. The catalogue schema, Celcat guide content, public school DTO shape, and live feature flag
SHALL remain unchanged.

#### Scenario: Existing generic Toulouse 3 row is corrected

- **WHEN** the migration runs with a Toulouse 3 school whose provider is `generic`
- **THEN** that row references `celcat` and all unrelated school rows are byte-for-byte unchanged

#### Scenario: Legacy Toulouse 3 provider is corrected

- **WHEN** the migration runs with a Toulouse 3 school whose provider is `univtoulouse3`
- **THEN** that row references `celcat` without changing its identity or other fields

#### Scenario: Unexpected newer provider is preserved

- **WHEN** the Toulouse 3 row has a provider other than the two recognized prior values
- **THEN** the migration leaves it unchanged rather than overwriting a newer operator decision

#### Scenario: Guarded rollback restores generic

- **WHEN** the migration is rolled back while the Toulouse 3 provider remains `celcat`
- **THEN** only that row returns to `generic`; a value changed after migration remains untouched
