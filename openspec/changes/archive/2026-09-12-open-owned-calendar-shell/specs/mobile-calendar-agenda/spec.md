## MODIFIED Requirements

### Requirement: Agenda is a third in-place view mode of the calendar screen

The calendar screen SHALL keep the agenda/planning view reachable in place beside the T01 owned Calendar shell. Selecting Agenda SHALL render the existing day-grouped list over its bounded multi-day range from the unchanged events-source seam. Until T05 implements meaningful day/week switching, the selector SHALL offer only working shell and Agenda choices and SHALL NOT expose a Day choice that renders the same static shell.

#### Scenario: Working view choices remain

- **WHEN** the Calendar screen renders at the T01 milestone
- **THEN** its view selector offers the owned Calendar shell and Agenda with translated accessible labels and selected state
- **AND** every offered choice renders a distinct working surface

#### Scenario: Selecting Agenda renders the retained list

- **WHEN** Agenda is selected
- **THEN** the existing day-grouped agenda list replaces the owned shell for a bounded multi-day window

#### Scenario: Agenda reads the unchanged events-source seam

- **WHEN** Agenda computes its events
- **THEN** it reads through `useCalendarEvents(range)` with no change to the hook signature, `CalendarEvent` shape, stored facts, or source filtering

#### Scenario: Agenda remains on the Calendar route

- **WHEN** Agenda is reached
- **THEN** it remains a view mode of the existing `/calendar` route and no new route is added

#### Scenario: Later day/week switching is not prebuilt

- **WHEN** the T01 selector is inspected
- **THEN** it contains no hidden or enabled Day/Week switching implementation reserved for T05
