## ADDED Requirements

### Requirement: T09 publishes one complete bounded V1 timeline presentation

The Calendar data seam SHALL publish a `version: 1` presentation containing exactly the previous, committed, and next Day or Week pages for the settled renderer generation. Each page SHALL contain its ordered civil-date columns and every supported event tile belonging to those columns. Page identities and generation SHALL follow the committed anchor synchronously with pager recentering. Until its required local reads resolve, a replacement range SHALL project the last complete event snapshot onto the requested dates without relabeling old events as a new date. Dates outside the retained snapshot SHALL have empty tiles until the read completes. Replacement event data SHALL preserve the requested page identities, and stale completions SHALL be discarded. Superseded page models and query results SHALL be released; no unbounded page cache or permanent full-event JavaScript index SHALL be introduced.

#### Scenario: Swiping does not replay the previous week while a local read is pending

- **WHEN** a swipe settles on either adjacent week and the replacement local read is still pending
- **THEN** that week is immediately the centre page with its already-loaded event tiles
- **AND** resolving the read updates tiles without changing page identities or replaying the swipe

#### Scenario: Settled Week owns three complete populated pages

- **WHEN** a committed Week and its immediate neighbours contain valid ordinary local classes
- **THEN** the V1 presentation contains exactly three page models with the matching ordered display-zone columns and classes
- **AND** every tile belongs to the page/date computed from its interval rather than a recycled pager slot

#### Scenario: Out-of-order completion cannot publish a mixed generation

- **WHEN** a newer anchor or local-data generation supersedes a still-resolving range
- **THEN** the stale completion is discarded and cannot overwrite the newer request
- **AND** retained events remain on their actual dates within the requested pages until one complete replacement snapshot publishes

#### Scenario: Repeated local paging stays bounded

- **WHEN** the student settles many adjacent pages
- **THEN** the renderer retains only the previous, current, and next page plus at most the resolving replacement generation
- **AND** released page event payloads do not accumulate with session length

### Requirement: T09 renders ordinary local timed classes at their clock coordinates

For T09, each supported event SHALL be a positive-duration timed interval contained within one display-zone civil date and not crossing a timezone-offset transition. Its tile SHALL use the validated start/end minute inputs and the live Calendar pixels-per-hour scale to occupy its actual vertical clock range. The tile SHALL show its title, SHALL show location when present, SHALL use a safe event-derived surface color, and SHALL show checklist summary progress when one exists. Title and location SHALL use the same compact text size and line height, with hierarchy expressed through weight. Neither text SHALL impose a line limit or ellipsis; native word/character wrapping SHALL continue until the rounded event surface clips content at its actual time boundary. Each full-column tile SHALL begin flush with its left day boundary, leave two native layout units before the next vertical separator, and use a two-unit corner radius. Tile planning, sorting, formatting, and checklist aggregation SHALL execute only when the complete local presentation changes; a gesture frame SHALL perform only worklet-safe pixel projection from the already validated minute inputs.

#### Scenario: One-hour class appears at the right time

- **WHEN** a valid class named `Maths` with room `B12` spans 10:00–11:00 on one visible display-zone date
- **THEN** its tile begins at the 10:00 grid coordinate, ends at the 11:00 coordinate, and visibly contains `Maths` and `B12`
- **AND** a zoom change keeps both endpoints aligned with the same clock grid without re-reading or re-sorting events per frame

#### Scenario: Ordinary personal event uses the same geometry

- **WHEN** a valid positive-duration personal event falls on a visible date
- **THEN** it receives the same timed-tile geometry and presentation model as a synced class
- **AND** its original `personal` identity remains attached to activation

#### Scenario: Narrow event content wraps without ellipses

- **WHEN** an ordinary event has a title or location wider than its Day or Week column
- **THEN** both fields use the same compact text size and wrap across native word or character boundaries without an ellipsis
- **AND** the rounded tile starts flush with its left day boundary, retains two layout units before the next separator, and clips only at its actual vertical time boundary

#### Scenario: Deferred event shapes are not misdrawn

- **WHEN** a local event is date-only, zero-duration, cross-midnight, or crosses a timezone-offset transition
- **THEN** T09 emits no ordinary timed tile for that event
- **AND** it does not fabricate a positive height, reinterpret midnight as all-day, or corrupt the valid sibling tiles

#### Scenario: Overlap and short-event follow-ups remain explicit

- **WHEN** positive timed events are unusually short or overlap on one date
- **THEN** T09 preserves their validated identity and actual-time inputs without claiming minimum-readable-height or overlap-column behavior
- **AND** deterministic ordering is stable for the later T10/T11 presentation rules

### Requirement: T09 exposes one accessible committed-page event target per tile

The renderer SHALL expose supported tiles on the committed centre page as chronological accessible buttons while keeping adjacent pages and decorative grid/current-time nodes out of the accessibility tree. Each tile SHALL expose exactly one localized label containing its full title, formatted time range, optional location, and optional checklist progress exactly once, plus the existing view-details hint. Child title/location/progress visuals SHALL not become duplicate nodes. Visually off-viewport tiles in the bounded committed page SHALL remain mounted and reachable; hidden, cancelled, invalid, unsupported, and invisible-source events SHALL expose no visual or semantic target.

#### Scenario: Screen reader hears the normal tile once

- **WHEN** assistive technology reaches the 10:00–11:00 `Maths` tile in room `B12`
- **THEN** it encounters one button whose label contains the title, full time range, and room once
- **AND** the tile's child text and checklist visual do not repeat those phrases as separate nodes

#### Scenario: Neighbour pages do not duplicate semantics

- **WHEN** the three-page working set contains a recycled copy of a date while paging is unsettled
- **THEN** only the committed centre page's event targets participate in accessibility traversal
- **AND** settlement exposes the destination targets only after the complete presentation commits

#### Scenario: Filtered rows are absent from both representations

- **WHEN** an event is hidden, cancelled, malformed, unsupported by T09, or owned by an invisible source
- **THEN** no tile, accessible button, activation handler, or checklist UID entry is produced for it

### Requirement: T09 activates original identity without changing gesture ownership

Every supported tile SHALL activate the original event UID supplied by the validated data model; page direction, date segment, list position, React key, and recycled slot SHALL never replace that identity. A tile press SHALL be cancelled by vertical scroll, horizontal paging, or pinch ownership according to the existing native gesture hierarchy. Event rendering SHALL add no second pager, vertical scroll owner, responder-based gesture engine, compatibility renderer, network request, or continuous animation loop.

#### Scenario: Tile activation uses the source event

- **WHEN** the student taps a settled synced or personal timed tile
- **THEN** the renderer emits that tile's original UID to the screen-owned activation callback
- **AND** the exact same identity reaches the unified event-details route

#### Scenario: Movement does not accidentally activate a tile

- **WHEN** a touch beginning on a tile becomes a vertical scroll, horizontal page, or pinch
- **THEN** native movement ownership cancels the pending press
- **AND** no event route is pushed during that gesture

#### Scenario: Page navigation remains local offline

- **WHEN** the student pages away from and back to a populated date while offline
- **THEN** only bounded local queries and presentation replacement occur
- **AND** no sync, generated API call, network loader, or event write is started by navigation

### Requirement: T09 proof is range, identity, accessibility, and revision bound

Deterministic proof SHALL cover range planning and half-open boundaries, V1 model completeness, stale-completion rejection, page retention, same-day support classification, stable chronological ordering, actual-time tile geometry across bounded zoom, visible/semantic filtering, composed accessible labels, checklist integration, original-identity activation, press cancellation, and zero network calls on page navigation. Introduced pure range/domain/page logic SHALL have 100% statement and branch coverage. The implementation handoff SHALL record exact commands and results plus initial fabricated row/preparation/retention measurements without claiming representative p50/p95 data. Host automation SHALL NOT claim native assistive-technology, offline device, appearance, or gesture-feel results; the complete canonical owner checklist SHALL remain bound to the exact tested revision and build.

#### Scenario: Ordinary fabricated range is measured without overclaiming

- **WHEN** the T09 fixture populates the previous/current/next pages with ordinary local rows
- **THEN** evidence records queried rows, accepted/rejected counts, page/event retention, and deterministic preparation timing for that fixture
- **AND** it does not describe the sample as representative workload percentiles

#### Scenario: Host evidence remains honest

- **WHEN** local non-device verification completes
- **THEN** it reports pure, repository, hook, component, and screen results only
- **AND** screen-reader quality, physical offline behavior, native gesture cancellation, and appearance remain pending owner/device verdicts

#### Scenario: Owner acceptance identifies the exact result

- **WHEN** T09 is presented for owner acceptance
- **THEN** the handoff names the exact tested commit/PR head, build, fabricated seed/reset steps, command outcomes, and every canonical checklist row
- **AND** feedback is resolved on the same issue and explicit human acceptance precedes Reviewer merge
