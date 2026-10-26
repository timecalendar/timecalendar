# Spec Delta

## MODIFIED Requirements

### Requirement: Empty states share screen and section composition

The app SHALL render every shared empty state through the shared status view with a `screen`,
`section` or `inline` presentation, a required localized title, an optional localized caption,
optional paired local light/dark artwork or a status symbol, and a caller-owned stable `testID`.
The screen presentation SHALL grow within its owner, center a bounded content group while it fits
and scroll once it does not; the section presentation SHALL be a centered block without its own
scroll container; the inline presentation SHALL remain content-sized and left-aligned. Every
presentation SHALL preserve title-then-caption source order, wrap under Dynamic Type, use theme
tokens, and add no animation.

#### Scenario: Full-screen empty state is centered

- **WHEN** a loaded root collection contains no entries and renders the `screen` presentation
- **THEN** its optional artwork, title, and caption form one centered group within the measured lane
- **AND** the state fills the content region without changing the screen's loading or error branches

#### Scenario: Full-screen empty state scrolls at large text

- **WHEN** the `screen` presentation's content is taller than the viewport
- **THEN** the content starts below the navigation header and scrolls to its last element

#### Scenario: Section empty state stays left-aligned

- **WHEN** a compact section such as Home renders the `inline` presentation
- **THEN** the state remains left-aligned and content-sized
- **AND** it receives no full-screen centering or mandatory artwork

#### Scenario: Empty state remains meaningful without artwork

- **WHEN** artwork is omitted, hidden at an accessibility text size, unavailable to accessibility, or not perceived
- **THEN** the localized title and optional caption convey the complete state
- **AND** their text scales and wraps without `allowFontScaling={false}`

### Requirement: Empty and status content adopts shared composition without semantic loss

Loaded empty Personal events and User calendars collections SHALL use the shared status view while
retaining their existing localized meaning and stable selectors. User calendars SHALL render no
empty state or live region until its asynchronous local read has settled. Loading,
search-no-results, not-found and retryable-error states in school selection, export guides,
calendar sources, event details and the timezone chooser SHALL render through the shared status
view with their own localized copy, inside the same `RootPage` frame and measured lane as populated
content. Cached-error notices MAY keep their notice surface. Existing Activity and Hidden events
illustrated empty-state meaning SHALL remain unchanged.

#### Scenario: Personal events uses a shared empty state

- **WHEN** the personal-events read returns no entries
- **THEN** a shared empty state renders in the standard lane with the existing localized meaning
- **AND** Add, row navigation, list ownership, and `personal-event-*` selectors remain unchanged

#### Scenario: User calendars does not flash empty while loading

- **WHEN** the user-calendars local read has not settled
- **THEN** neither the shared empty state nor an empty-state live region is mounted
- **AND** once the settled collection is empty, the shared centered title and caption render below the native header

#### Scenario: Specialized failures stay distinct from valid emptiness

- **WHEN** School search fails, event details is not found, or a collection exposes a retryable failure
- **THEN** the shared status view renders that state's own localized copy, glyph and recovery action in the shared frame
- **AND** it is not replaced by a collection's valid-empty copy or stripped of its live-region semantics
