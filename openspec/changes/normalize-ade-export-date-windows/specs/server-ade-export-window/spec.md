## ADDED Requirements

### Requirement: Recognized ADE iCal date windows are normalized at fetch time

The server SHALL recognize HTTP(S) ADE planning iCal export endpoints carrying
`calType=ical` and SHALL replace their date window when they contain both `firstDate` and
`lastDate`, or when they contain `nbWeeks`. The transformed URL SHALL be used only for the
upstream fetch; the stored source URL SHALL remain unchanged.

#### Scenario: An expired explicit pair is repaired on creation

- **WHEN** a calendar is created from a recognized ADE iCal URL whose explicit
  `firstDate`/`lastDate` pair is in the past
- **THEN** the creation fetch uses the current bounded window and the calendar retains the
  original URL as its stored source

#### Scenario: The window is recomputed on every eligible sync

- **WHEN** the same stored ADE calendar is fetched again on a later UTC date
- **THEN** the sync derives a new pair from that later date rather than reusing the pair from
  creation or mutating the stored source

#### Scenario: A narrow explicit pair is widened

- **WHEN** a recognized ADE iCal URL carries both dates for a range narrower than the policy
- **THEN** both values are replaced by the current bounded window

#### Scenario: An nbWeeks export uses the same policy

- **WHEN** a recognized ADE iCal URL carries `nbWeeks`
- **THEN** `nbWeeks` is removed and one canonical `firstDate`/`lastDate` pair is emitted from
  the current bounded-window policy

### Requirement: The ADE export window is bounded and deterministic

The server SHALL derive `firstDate` as 12 calendar months before the current UTC date and
`lastDate` as 12 calendar months after it, format them as `yyyy-MM-dd`, and clamp calendar
arithmetic to valid target-month dates. The inclusive range SHALL contain no more than 731
dates.

#### Scenario: An ordinary date uses symmetric calendar bounds

- **WHEN** normalization runs on 2026-08-25 UTC
- **THEN** it emits `firstDate=2025-08-25` and `lastDate=2027-08-25`

#### Scenario: Leap-day arithmetic stays valid

- **WHEN** normalization runs on 2028-02-29 UTC
- **THEN** it emits valid clamped dates for February in the adjacent non-leap years rather
  than rolling into March

#### Scenario: The old unbounded range is not emitted

- **WHEN** an ADE `nbWeeks` URL is normalized
- **THEN** the server does not emit the legacy 2000-01-01–2038-01-01 range

### Requirement: Recognition and transformation preserve unrelated URL behavior

The renamer SHALL preserve every non-window query value and the URL fragment. It SHALL be a
no-op for invalid URLs, non-ADE paths, non-iCal ADE pages, and incomplete explicit date pairs
without `nbWeeks`.

#### Scenario: Parameters around the date pair survive

- **WHEN** an eligible URL includes resources, project, credentials, additional parameters,
  and a fragment
- **THEN** their values and the fragment are unchanged after the date keys are canonicalized

#### Scenario: Parameter ordering does not affect recognition

- **WHEN** the date keys occur first, last, or in either order in the query
- **THEN** the same bounded pair is emitted

#### Scenario: An ADE web UI link is not accepted by the renamer

- **WHEN** an ADE URL does not identify a supported planning iCal endpoint with
  `calType=ical`
- **THEN** the renamer returns it unchanged

#### Scenario: A half-pair remains available to a school exception

- **WHEN** a URL contains only `firstDate` or only `lastDate` and no `nbWeeks`
- **THEN** generic normalization leaves it unchanged so a school-specific renamer can handle
  it

### Requirement: Generic normalization composes with school strategies

The bounded ADE renamer SHALL run through the existing generic-renamer inheritance contract.
A matching school strategy SHALL retain its configured opt-out, fetcher, URL renamers, and
event pipes. When no strategy matches, the generic strategy SHALL be applied exactly once
before the existing non-generic fallback renamers.

#### Scenario: A school opting out of generic renamers is unchanged

- **WHEN** an ADE calendar resolves to a strategy with
  `inheritGenericUrlRenamers: false`
- **THEN** the generic bounded-window renamer is not applied

#### Scenario: A school project rewrite still runs

- **WHEN** an eligible ADE URL resolves to a school with a project-specific renamer
- **THEN** the date window is normalized and the school-specific project rewrite still
  produces its expected value

#### Scenario: An unmatched calendar does not apply generic twice

- **WHEN** no school strategy matches an eligible ADE calendar
- **THEN** a single UTC date sample produces one generic normalization before the existing
  fallback school renamers run
