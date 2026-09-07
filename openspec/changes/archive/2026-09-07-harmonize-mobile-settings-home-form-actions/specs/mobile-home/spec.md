## ADDED Requirements

### Requirement: Home empty sections share semantic copy rhythm
When Home has neither an upcoming event nor an event today, the Up next title/caption pair and Today title/caption pair SHALL use the shared section empty-state hierarchy: subtitle title, secondary caption, one semantic title-to-caption gap, a polite state announcement, and section-level left alignment. The Up next action SHALL retain its platform minimum target and existing Calendar navigation. Non-empty scrollers, finished-today copy, next-day summary, all-day items, and timeline behavior SHALL remain unchanged.

#### Scenario: No upcoming event uses the shared section state
- **WHEN** Home has no event today and no next active day in range
- **THEN** the localized Up next title and nothing-coming-up caption render through the shared section state with left alignment
- **AND** the existing See all action remains operable

#### Scenario: No event today uses the same hierarchy
- **WHEN** Home has no all-day or timed event today
- **THEN** the localized Today title and open-day caption use the same shared typography, gap, secondary color, announcement semantics, and left alignment as the Up next empty pair

#### Scenario: Populated sections retain scheduling behavior
- **WHEN** Home has upcoming, all-day, timed, finished-today, or next-active-day content
- **THEN** its existing cards, timeline geometry, checklist progress, routes, labels, and selectors remain unchanged
