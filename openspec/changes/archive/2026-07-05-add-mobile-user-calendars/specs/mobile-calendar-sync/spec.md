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

The seam SHALL ALSO filter out events belonging to a calendar whose visibility is off (the
`mobile-user-calendars` capability): it reads `useUserCalendars()`, builds the set of ids
of calendars whose `visible` flag is true, and keeps a merged event iff it is a personal
event (`userCalendarId === undefined`, always shown) OR its `userCalendarId` is in that
visible set. This visibility filter applies to the merged list alongside the hidden-events
filter, before the range filter, still behind the unchanged seam signature and
`CalendarEvent` shape — so every view (timeline, agenda, home) honors calendar visibility
with no consumer change. Because a deleted calendar drops out of `useUserCalendars()`, its
id leaves the visible set and its events are excluded immediately, with no `calendar_events`
purge required.

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

#### Scenario: A hidden calendar's events are excluded by the seam
- **WHEN** a calendar's `visible` flag is false
- **THEN** `useCalendarEvents` excludes every event whose `userCalendarId` is that calendar's id
  from the merged result before the range filter
- **AND** every view (timeline, agenda, home) renders without those events, with no consumer change

#### Scenario: Personal events are always kept regardless of calendar visibility
- **WHEN** an event has no `userCalendarId` (a personal event)
- **THEN** `useCalendarEvents` always keeps it, independent of any calendar's visibility

#### Scenario: Toggling a calendar back to visible re-includes its events
- **WHEN** a previously-hidden calendar's `visible` flag is set back to true
- **THEN** `useCalendarEvents` includes its events again (the reactive read re-renders the views)

#### Scenario: A deleted calendar's events vanish without a purge
- **WHEN** a calendar is deleted (it leaves `useUserCalendars()`)
- **THEN** its id is absent from the visible set and its still-present `calendar_events` rows are
  excluded from `useCalendarEvents` immediately, with no `calendar_events` purge
