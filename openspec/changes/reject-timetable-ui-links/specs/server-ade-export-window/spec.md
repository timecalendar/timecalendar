## MODIFIED Requirements

### Requirement: Recognition and transformation preserve unrelated URL behavior

The server SHALL validate the submitted calendar source before ADE renaming. Empty, relative,
malformed, and unsupported-scheme sources SHALL fail through the stable calendar-source validation
error before any renamer or fetcher runs. For an accepted absolute HTTP(S) source, the ADE renamer
SHALL preserve every non-window query value and the URL fragment. It SHALL be a no-op for non-ADE
paths, non-iCal ADE pages not rejected by the host-bound UI table, and incomplete explicit date
pairs without `nbWeeks`.

#### Scenario: Invalid source is rejected before ADE recognition

- **WHEN** a source is empty, relative, malformed, or uses a protocol not accepted by calendar
  source validation
- **THEN** it fails with the stable source-validation error before ADE renaming or outbound fetch

#### Scenario: Parameters around the date pair survive

- **WHEN** an eligible URL includes resources, project, credentials, additional parameters, and a
  fragment
- **THEN** their values and the fragment are unchanged after the date keys are canonicalized

#### Scenario: Parameter ordering does not affect recognition

- **WHEN** the date keys occur first, last, or in either order in the query
- **THEN** the same bounded pair is emitted

#### Scenario: A proven ADE web UI link is rejected before the renamer

- **WHEN** an ADE URL matches one of the configured exact portal or direct-planning UI host/path
  pairs
- **THEN** source validation rejects it before the ADE renamer or fetcher runs

#### Scenario: An unlisted HTTP ADE page remains a renamer no-op

- **WHEN** an accepted HTTP(S) ADE URL is neither a supported planning iCal endpoint nor a proven
  host-bound UI rule
- **THEN** the ADE renamer returns it unchanged and source validation does not invent a broader
  rejection rule

#### Scenario: A half-pair remains available to a school exception

- **WHEN** a URL contains only `firstDate` or only `lastDate` and no `nbWeeks`
- **THEN** generic normalization leaves it unchanged so a school-specific renamer can handle it
