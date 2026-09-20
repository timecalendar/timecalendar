## ADDED Requirements

### Requirement: Local rendering reads are bounded by separate instant and civil-date ranges

The calendar data seam SHALL derive one bounded three-page local range and issue reactive SQLite predicates for timed intersections, personal timed intersections, and date-only civil-range intersections separately. Timed positive intervals SHALL use half-open intersection (`startsAt < range.to` and `endsAt > range.from`); date-only rows SHALL use their UTC-encoded floating civil start and exclusive end against a civil-day envelope. The reads SHALL select no row outside the required envelope, SHALL use no arbitrary result cap, and SHALL not change stored facts or start a network request.

#### Scenario: Timed intersection includes long coverage at either boundary

- **WHEN** a timed row starts before the envelope but ends inside it, or starts inside it and ends after it
- **THEN** the local query returns the row because its interval intersects the half-open instant range
- **AND** a row ending exactly at `from` or starting exactly at `to` is excluded

#### Scenario: Date-only read uses floating civil keys

- **WHEN** a date-only row's stored UTC fields represent a civil-date range intersecting the three-page day envelope
- **THEN** the date-only query returns it by civil start/exclusive-end semantics
- **AND** it is not shifted or excluded by the current display-zone offset

#### Scenario: Personal rows are range scoped

- **WHEN** personal events exist both inside and outside the instant envelope
- **THEN** the personal repository returns only intersecting rows
- **AND** it does not read the entire personal-events table first

### Requirement: Local rows decode independently into a tagged V1 calendar domain

Every local row presented to calendar consumers SHALL decode independently into a `version: 1` discriminated timed or date-only event carrying stable source kind and UID. Stored `allDay` SHALL choose the tag; midnight and duration SHALL not infer it. Required timestamps, interval ordering, identity, colors, optional strings, teachers, tags, fields, and date-only civil bounds SHALL be narrowed before any formatter, sorter, tag mapper, or page builder reads them. One malformed row SHALL yield an allowlisted aggregate rejection reason and SHALL NOT throw, discard valid siblings, mutate storage, or expose raw row content.

#### Scenario: Valid timed and date-only rows receive distinct tags

- **WHEN** one valid `allDay = false` row and one valid `allDay = true` row decode
- **THEN** the result contains one timed interval with instant endpoints and one date-only interval with civil start/exclusive-end keys
- **AND** both carry their original source kind and UID under schema version 1

#### Scenario: Malformed tag element cannot throw the list

- **WHEN** a stored tags array contains a non-object, missing name, or otherwise unusable element
- **THEN** that optional element is omitted or the row is rejected according to the closed validation rule
- **AND** every valid sibling row still decodes and reaches the applicable consumer

#### Scenario: Invalid required fields reject one row

- **WHEN** a row has an invalid start/end, non-positive required range, invalid date-only range, or unusable identity
- **THEN** it is excluded with one allowlisted rejection count
- **AND** no exception, UID, title, location, timestamp, source token, calendar id, or query value reaches diagnostics

#### Scenario: Offset-changing timed interval is explicit but deferred

- **WHEN** a valid timed interval crosses a display-zone offset transition
- **THEN** the tagged domain preserves its original instant identity and endpoints
- **AND** the T09 page projection classifies it as unsupported rather than drawing misleading endpoint-subtraction geometry

### Requirement: Calendar presentation filters precede visual and semantic models

The shared event-source seam SHALL remove exactly cancelled synced events, hidden UID/name matches, and events whose user calendar is absent or invisible before constructing Home, Agenda, timeline visual models, timeline semantic models, or checklist UID sets. Personal events SHALL remain independent of user-calendar visibility. A filtered event SHALL not become activatable through a stale presentation.

#### Scenario: Cancelled synced event is absent everywhere

- **WHEN** a synced row's validated cancellation field is exactly true
- **THEN** Home, Agenda, timeline tiles, timeline accessibility traversal, and checklist summary input all exclude it

#### Scenario: Hidden and invisible-source filters stay shared

- **WHEN** a UID/name is hidden or its owning user calendar is invisible/deleted
- **THEN** the event is removed once at the calendar data seam before all consumer projections
- **AND** screens and the renderer do not duplicate the filter

#### Scenario: Personal event ignores source visibility

- **WHEN** a valid personal event intersects the requested range
- **THEN** it remains eligible regardless of the user-calendar set
- **AND** hidden UID/name and validation rules still apply

### Requirement: Invalid-row diagnostics are aggregate and revision scoped

A completed local snapshot containing rejected rows SHALL emit at most one content-free diagnostic per allowlisted reason for that snapshot revision. Diagnostics SHALL contain only a static calendar-read context, reason code, and aggregate count. Re-rendering the same snapshot SHALL not emit duplicates, and a fully valid or merely filtered snapshot SHALL emit none.

#### Scenario: Rejected rows produce bounded content-free evidence

- **WHEN** one snapshot rejects multiple rows for the same allowlisted reason
- **THEN** one diagnostic records that reason and aggregate count
- **AND** it contains no raw exception, event content, identity, timestamp, calendar identity, or query value

#### Scenario: Filtering is not reported as corruption

- **WHEN** valid rows are removed only because they are cancelled, hidden, unsupported by T09 presentation, or owned by an invisible source
- **THEN** no malformed-row diagnostic is emitted

## MODIFIED Requirements

### Requirement: The events-source seam sources synced events without a consumer change

The app SHALL retain `useCalendarEvents(range)` as the shared Home/Agenda source while implementing it through bounded synced and personal local queries plus the validated V1 tagged projection. Existing consumers SHALL receive the presentation fields and timed/date-only semantics they require without learning about SQLite rows, and event details SHALL keep its separate rich by-UID read. The dense-week fixture SHALL remain absent from the default runtime merge.

The seam SHALL filter hidden events by UID or name, cancelled synced events, and events owned by an absent or invisible user calendar before any consumer projection. Personal events SHALL remain visible independent of calendar visibility. Because a deleted calendar leaves the visible source set, its cached rows SHALL disappear immediately without a `calendar_events` purge. The seam SHALL isolate malformed rows individually and SHALL never require a storage rewrite to admit the tagged rendering model.

#### Scenario: Calendar consumers read validated synced and personal events

- **WHEN** valid synced and personal rows intersect a consumer's requested range
- **THEN** `useCalendarEvents(range)` returns their validated V1 presentation values without exposing storage rows
- **AND** Home and Agenda retain their current source behavior while the timeline can build page models from the same domain

#### Scenario: The fixture is dev/test-only

- **WHEN** the app runs normally outside an explicit fabricated seed
- **THEN** `useCalendarEvents` does not include the dense-week fixture in its result

#### Scenario: Hidden events are excluded by the seam

- **WHEN** the hidden set contains an event's UID or title
- **THEN** the seam excludes that event and any required same-title matches before Home, Agenda, or timeline projection
- **AND** no consumer duplicates the hidden-event filter

#### Scenario: Cancelled events are excluded by the seam

- **WHEN** a synced event's validated cancellation field is exactly true
- **THEN** the seam excludes it before every visual, semantic, checklist, and activation projection

#### Scenario: A hidden calendar's events are excluded by the seam

- **WHEN** a calendar's visible flag is false
- **THEN** the seam excludes every event whose source calendar identity matches it
- **AND** the cached rows remain intact for a later visibility restore

#### Scenario: Personal events are always kept regardless of calendar visibility

- **WHEN** a valid event has personal source identity
- **THEN** it remains eligible independent of the user-calendar visibility set
- **AND** the ordinary validation and hidden-event rules still apply

#### Scenario: Toggling a calendar back to visible re-includes its events

- **WHEN** a previously invisible calendar becomes visible
- **THEN** the reactive bounded read/projection includes its valid in-range events again

#### Scenario: A deleted calendar's events vanish without a purge

- **WHEN** a calendar is deleted and leaves the visible source set
- **THEN** its still-cached rows are excluded immediately from every calendar consumer
- **AND** no `calendar_events` purge is required

#### Scenario: One malformed row cannot fail valid siblings

- **WHEN** a requested local range contains both malformed and valid stored rows
- **THEN** the seam returns the valid projections and rejects the bad rows with aggregate-only reasons
- **AND** no whole-list exception reaches Home, Agenda, or the timeline
