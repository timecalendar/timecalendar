## MODIFIED Requirements

### Requirement: Empty and status content adopts shared composition without semantic loss

Loaded empty Personal events and User calendars collections SHALL use the shared status view while
retaining their stable selectors. Personal events SHALL show a title and a caption. User calendars
SHALL render no empty state or live region until its asynchronous local read has settled. Loading,
search-no-results, not-found and retryable-error states in school selection, export guides,
calendar sources, event details and the timezone chooser SHALL render through the shared status
view with their own localized copy, inside the same `RootPage` frame and measured lane as populated
content. Cached-error notices MAY keep their notice surface. Existing Activity and Hidden events
illustrated empty-state meaning SHALL remain unchanged.

#### Scenario: Personal events uses a shared empty state

- **WHEN** the personal-events read returns no entries
- **THEN** a shared empty state renders in the standard lane with its localized title and caption
- **AND** the platform create action (iOS header item, Android floating action), row navigation, list ownership, and `personal-event-*` selectors remain available

#### Scenario: User calendars does not flash empty while loading

- **WHEN** the user-calendars local read has not settled
- **THEN** neither the shared empty state nor an empty-state live region is mounted
- **AND** once the settled collection is empty, the shared centered title and caption render below the native header

#### Scenario: Specialized failures stay distinct from valid emptiness

- **WHEN** School search fails, event details is not found, or a collection exposes a retryable failure
- **THEN** the shared status view renders that state's own localized copy, glyph and recovery action in the shared frame
- **AND** it is not replaced by a collection's valid-empty copy or stripped of its live-region semantics
