## ADDED Requirements

### Requirement: The Architecture Book records the bounded validated local-event contract

Current-state Architecture Book guidance SHALL describe the Calendar data seam's bounded three-page instant/civil-date reads, V1 timed/date-only validated domain, row-isolated rejection, shared visibility/hidden/cancelled filtering, complete page models, and aggregate-only diagnostic boundary. Calendar guidance SHALL describe ordinary timed-tile ownership, live-scale geometry, original-identity activation, committed-page accessibility, checklist summary, local-only page navigation, narrow localized date headers with a filled circular Today cue, the visually unlabeled midnight boundary, secondary hour labels, harmonized separator lines, and current-time semantics on the committed rule without a visible gutter chip. It SHALL remove the empty-event-window limitation while keeping T10–T16 and T19–T23 capabilities explicitly pending. Testing guidance SHALL name the focused query/domain/page/renderer/screen/no-network proof and distinguish host results from owner/device evidence. `CHANGELOG.md` SHALL record the current-state change.

#### Scenario: Data and storage guidance describes bounded validated reads

- **WHEN** the Architecture Book data/storage pages are read after T09
- **THEN** they describe separate timed/date-only range predicates, tagged validation before consumer operations, row isolation, and filters applied before presentation
- **AND** they state that stored rows, sync writes, and schema remain unchanged

#### Scenario: Calendar guidance describes the first populated tile

- **WHEN** the Calendar page is read after T09
- **THEN** it identifies the V1 three-page presentation, actual-time title/location tile, checklist summary, accessible composed label, and original-identity details activation
- **AND** it no longer describes the owned shell as having no event window or event tiles

#### Scenario: Calendar guidance describes the timeline visual hierarchy

- **WHEN** the Calendar rendering guidance is read after owner QA
- **THEN** it describes narrow localized weekday glyphs, larger date numbers, dark secondary dates, and the primary filled circular Today cue
- **AND** it records 01:00–23:00 visual gutter labels, shared separator-colored columns and major hours, subdued half-hours, and current-time semantics without a duplicate visible gutter label

#### Scenario: Deferred slices remain truthful

- **WHEN** the Calendar limitations are inspected
- **THEN** short-event rescue, overlap packing, full chronological dense navigation, spanning/DST/all-day presentation, atomic environment updates, and recovery remain assigned to their later slices
- **AND** no host check is presented as native assistive-technology or physical offline evidence

#### Scenario: Executable proof and changelog are linked

- **WHEN** testing guidance and Architecture Book history are inspected
- **THEN** they name the range/decoder/page/renderer/screen/repository-contract suites and local-green/CI gates for T09
- **AND** `CHANGELOG.md` records the reusable read/presentation contract without creating a duplicate documentation tree
