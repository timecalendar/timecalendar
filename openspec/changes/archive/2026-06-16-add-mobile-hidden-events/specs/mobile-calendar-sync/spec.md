## MODIFIED Requirements

### Requirement: The events-source seam sources synced events without a consumer change

The app SHALL swap `useCalendarEvents(range)` to source synced `calendar_events` rows
(reactively) merged with the personal-events read, range-filtered, behind the existing
seam signature and the unchanged `CalendarEvent` domain shape. No calendar view consumer
(timeline screen, agenda list) SHALL require a change. The dense-week fixture SHALL no
longer be part of the default runtime merge. The seam SHALL ADDITIONALLY filter out hidden
events (the `mobile-hidden-events` capability): it reads the hidden set and excludes any
merged event whose uid is in `uidHiddenEvents` OR whose title is in `namedHiddenEvents`,
applied to the merged list before the range filter — still behind the unchanged seam
signature and `CalendarEvent` shape, so no view consumer changes.

#### Scenario: The calendar renders synced events through the unchanged seam
- **WHEN** synced events exist and a view reads `useCalendarEvents(range)`
- **THEN** it returns the synced events (mapped to `CalendarEvent`) merged with personal
  events, filtered to the range
- **AND** the timeline screen and agenda list render them with no source-related change to
  their code

#### Scenario: The fixture is dev/test-only
- **WHEN** the app runs normally (not a test or dev seed)
- **THEN** `useCalendarEvents` does not include the dense-week fixture in its result

#### Scenario: Hidden events are excluded by the seam
- **WHEN** the hidden set contains an event's uid or title
- **THEN** `useCalendarEvents` excludes that event (and all same-titled events for a name match) from
  the merged result before the range filter
- **AND** every view (timeline, agenda, home) renders without it, with no consumer change
