## ADDED Requirements

### Requirement: T10 admits timed points with exact bounded membership

The Calendar event domain SHALL accept a timed event whose end instant equals its start instant as a point without rewriting either instant. A point SHALL intersect a half-open range exactly when its instant is greater than or equal to the range start and less than the range end. Positive timed intervals SHALL retain half-open intersection, reversed timed ranges SHALL be rejected per row, and date-only ranges SHALL still require a strictly later exclusive end.

#### Scenario: Point belongs at the lower range boundary

- **WHEN** a zero-duration event occurs exactly at a retained range's lower boundary
- **THEN** the bounded local read and timeline presentation include it once
- **AND** the same point is absent from the preceding range whose exclusive upper boundary equals that instant

#### Scenario: Point is excluded at the upper range boundary

- **WHEN** a zero-duration event occurs exactly at the retained range's exclusive upper boundary
- **THEN** it is absent from that range
- **AND** it becomes eligible at the next range's inclusive lower boundary

#### Scenario: Interval and reversed-range semantics remain distinct

- **WHEN** one event has positive duration and another ends before it starts
- **THEN** the positive event uses the existing half-open intersection rule
- **AND** the reversed event is rejected without changing either stored row

### Requirement: T10 separates faithful event visuals from platform-minimum targets

The owned timeline SHALL render a zero-duration event as a fixed 4dp instant marker centered on its clock coordinate and SHALL render a positive event at its exact minute-derived visual height. The single interactive wrapper associated with either visual SHALL be at least 44pt high on iOS and 48dp high on Android, SHALL remain within the 00:00–24:00 clock plane, and SHALL retain the full single-column event width. The wrapper SHALL preserve original-UID activation and native movement/pinch press cancellation without introducing another gesture owner.

#### Scenario: Noon point has marker and minimum target

- **WHEN** a zero-duration event occurs at 12:00 on iOS or Android
- **THEN** its visual marker is centered at the 12:00 coordinate without invented duration
- **AND** its interactive wrapper is respectively at least 44pt or 48dp and opens that event's original identity

#### Scenario: Two-minute visual remains duration-faithful

- **WHEN** a two-minute event is rendered at any supported zoom
- **THEN** its visual height equals two minutes at the live pixels-per-hour scale
- **AND** its interactive wrapper meets the platform minimum without stretching the visual block

#### Scenario: Movement cancels a tiny-event press

- **WHEN** a touch beginning in a point or short-event target becomes vertical scrolling, horizontal paging, or pinch ownership
- **THEN** the pending press is cancelled by the existing native gesture hierarchy
- **AND** no details route opens

#### Scenario: Day-edge target remains bounded

- **WHEN** a point is placed at 00:00 or immediately before the 24:00 boundary
- **THEN** its interaction geometry clamps inside the clock plane
- **AND** its visual coordinate and half-open day membership remain unchanged

### Requirement: T10 resolves readable event colors deterministically

Calendar event appearance SHALL be produced by one pure resolver from an untrusted source color, active light/dark scheme, and increased-contrast input. It SHALL normalize valid `#RRGGBB` values, replace invalid values with the neutral fallback, return opaque source/accent/surface/foreground/outline colors, provide at least 4.5:1 foreground-to-surface contrast, and provide an event-boundary cue of at least 3:1 against the canvas. The same inputs SHALL always produce the same output and no resolved color SHALL depend on the host locale or platform globals.

#### Scenario: Arbitrary source colors remain readable in both schemes

- **WHEN** black, white, saturated, mid-tone, mixed-case, and neutral imported colors are resolved for light and dark schemes
- **THEN** every foreground/surface pair meets or exceeds 4.5:1
- **AND** every event retains a normalized source-derived accent whose boundary treatment meets or exceeds 3:1 against the canvas

#### Scenario: Invalid color uses neutral policy

- **WHEN** the source color is missing, malformed, or not six-digit hex
- **THEN** the resolver uses the neutral fallback as its normalized source
- **AND** it still returns contrast-safe light/dark appearance without mutating persisted color

#### Scenario: Increased contrast strengthens the boundary

- **WHEN** the same event is resolved with increased contrast enabled
- **THEN** its wash uses the documented increased-contrast composition and its foreground outline distinguishes the geometry without color alone
- **AND** title/accessibility content and original identity are unchanged

### Requirement: T10 keeps complete meaning when visual content is constrained

Every T10 timeline target SHALL expose one localized button name containing the resolved title or localized fallback, full formatted time, and location when present, plus the existing concise details hint. The visual block SHALL prioritize title; location and checklist visuals SHALL appear only when their complete line budget fits. Point markers MAY omit visual text, but constrained geometry SHALL never remove content from the accessible name or event-details destination. Child visual content SHALL remain excluded from the accessibility tree.

#### Scenario: Missing title is localized

- **WHEN** a missing or whitespace-only title is presented in English or French
- **THEN** the visual/accessibility presentation uses respectively `(No title)` or `(Sans titre)`
- **AND** the raw row remains unchanged

#### Scenario: Title wins at constrained size

- **WHEN** a long title and long location are presented in a narrow or very short tile
- **THEN** visual title content is retained before location or checklist content
- **AND** the button name and details view retain the full title, time, and location

#### Scenario: One semantic target carries the complete event

- **WHEN** assistive technology reaches a normal, two-minute, or point event on the committed page
- **THEN** it encounters one button with complete localized meaning and original-identity activation
- **AND** child text, marker visuals, neighbour pages, and expanded hit geometry add no duplicate semantic node

### Requirement: T10 proof is fixture-, privacy-, and revision-bound

Deterministic proof SHALL use fabricated fixtures containing a noon point, a two-minute event, missing and long text, arbitrary colors, invalid required rows, malformed optional arrays/content, and a valid Maths sibling. Pure point/range/color/presentation logic SHALL achieve 100% statement and branch coverage. Component proof SHALL cover visual versus interaction geometry, platform minimums, text priority, accessible labels, activation, and press cancellation. Handoff evidence SHALL identify exact commands and tested head and SHALL NOT claim physical-device accessibility, target feel, increased-contrast rendering, or global visual acceptance.

#### Scenario: Fabricated malformed siblings do not erase Maths

- **WHEN** the complete T10 fixture is decoded and rendered
- **THEN** valid Maths, the noon point, and the two-minute event retain distinct identities and targets
- **AND** every invalid required row or malformed optional value is handled according to its own rule

#### Scenario: Host evidence remains bounded

- **WHEN** all focused and local-green checks pass on the development host
- **THEN** the handoff records their exact commands, outcomes, and tested commit
- **AND** final native device/accessibility acceptance remains assigned to T28
