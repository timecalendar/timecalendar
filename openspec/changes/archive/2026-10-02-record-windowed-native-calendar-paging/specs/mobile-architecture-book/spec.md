## ADDED Requirements

### Requirement: The Architecture Book records windowed native ScrollView paging

The Architecture Book SHALL record the windowed native horizontal ScrollView as the Calendar's paging owner in one ADR listed in the decisions index, and SHALL point ADRs 019, 033 and 061 at it. `calendar.md` SHALL describe the absolute page index, the re-based content window, the mounted pages, UI-thread settlement, the controller's single committed date, the window store and the per-page presentation. `storage.md` and `data.md` SHALL describe the window store as the timeline's read path, with range live queries kept for Agenda and Home. `CHANGELOG.md` SHALL record the change. `react-native-pager-view` SHALL remain documented for onboarding only.

#### Scenario: Paging guidance names one current owner

- **WHEN** the Architecture Book is searched for the Calendar's paging owner
- **THEN** it finds the windowed native horizontal ScrollView ADR and the matching `calendar.md` guidance
- **AND** PagerView appears only as the onboarding pager or in dated historical records

#### Scenario: Storage guidance names the timeline read path

- **WHEN** `storage.md` is read
- **THEN** it describes the Calendar window store's chunked, sequence-guarded reads as the timeline's read path
- **AND** it describes range live queries only for Agenda and Home

## MODIFIED Requirements

### Requirement: The Architecture Book records the bounded validated local-event contract

Current-state Architecture Book guidance SHALL describe the Calendar data seam's bounded chunk-window and range reads, V1 timed/date-only validated domain, row-isolated rejection, shared visibility/hidden/cancelled filtering, complete page models, and aggregate-only diagnostic boundary. Calendar guidance SHALL describe ordinary timed-tile ownership, live-scale geometry, original-identity activation, committed-page accessibility, checklist summary, local-only page navigation, narrow localized date headers with a filled circular Today cue, the visually unlabeled midnight boundary, secondary hour labels, harmonized separator lines, and current-time semantics on the committed rule without a visible gutter chip. It SHALL remove the empty-event-window limitation while keeping T10–T16 and T19–T23 capabilities explicitly pending. Testing guidance SHALL name the focused query/domain/page/renderer/screen/no-network proof and distinguish host results from owner/device evidence. `CHANGELOG.md` SHALL record the current-state change.

#### Scenario: Data and storage guidance describes bounded validated reads

- **WHEN** the Architecture Book data/storage pages are read after T09
- **THEN** they describe separate timed/date-only range predicates, tagged validation before consumer operations, row isolation, and filters applied before presentation
- **AND** they state that stored rows, sync writes, and schema remain unchanged

#### Scenario: Calendar guidance describes the first populated tile

- **WHEN** the Calendar page is read after T09
- **THEN** it identifies the frozen per-page V1 presentation, actual-time title/location tile, checklist summary, accessible composed label, and original-identity details activation
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
