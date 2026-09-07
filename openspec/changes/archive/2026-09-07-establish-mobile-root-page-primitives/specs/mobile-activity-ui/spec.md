## MODIFIED Requirements

### Requirement: Activity renders loading, empty, populated, cached-failure, and empty-failure states

The screen SHALL render a loading state until the reactive cache read has settled, and thereafter one of: an empty state, a populated timeline, a cached-failure state, or an empty-failure state.

The loaded empty branch SHALL use the shared full-screen `EmptyState` with the locally bundled, theme-paired unDraw “Developer Activity” artwork and retain `activity-empty` as its stable selector. Its English title SHALL read exactly “No recent changes” and caption “Timetable updates will appear here.” Its French title SHALL read exactly “Aucune modification récente” and caption “Les changements d'emploi du temps apparaîtront ici.” The title and caption together preserve the existing localized sentence and SHALL be the complete accessible meaning without relying on the decorative image.

When a user-initiated refresh fails and cached rows exist, the screen SHALL keep every cached row and show a compact retryable message that the latest changes could not be checked. When it fails with no cached rows, the screen SHALL show a full retryable error state instead of the empty state.

A failure that no user initiated SHALL NOT alter the screen, because the screen renders stored history and a failed refresh stores nothing.

A refresh that is skipped because the device holds no calendars SHALL NOT be presented as a failure; it leaves the ordinary illustrated empty state.

Error text SHALL be announced to assistive technology as a live status.

#### Scenario: Every state renders in both locales

- **WHEN** the screen renders in French and in English for each of the loading, empty, populated, cached-failure, and empty-failure states
- **THEN** each state renders its localized copy
- **AND** the empty state renders the exact specified title and caption for that locale through the shared primitive

#### Scenario: A failed refresh keeps cached rows

- **WHEN** a pull-to-refresh fails while cached rows exist
- **THEN** every cached row is still rendered
- **AND** a compact retryable message reports that the latest changes could not be checked

#### Scenario: A failed refresh with an empty cache offers a full retry

- **WHEN** a pull-to-refresh fails while no cached row exists
- **THEN** the screen shows a retryable error state
- **AND** the empty-state title, caption, and artwork are not shown

#### Scenario: A device with no calendars sees the empty state

- **WHEN** a refresh resolves as skipped because the device holds no calendars
- **THEN** the screen shows the shared illustrated empty state with `activity-empty`
- **AND** no error message is shown

#### Scenario: Activity list behavior survives empty-state adoption

- **WHEN** Activity has cached rows or later receives rows after being empty
- **THEN** the existing SectionList, pull-to-refresh, row selectors, pagination footer, and navigation behavior remain unchanged
- **AND** no empty-state element remains mounted with the populated list
