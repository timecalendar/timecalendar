## MODIFIED Requirements

### Requirement: Activity renders one server log as one group, newest first

The screen SHALL render cached Activity history newest first, with one server calendar-log row rendered as exactly one visual group, because one row represents one detected synchronization change.

A group's header SHALL show the calendar name and the change time. It SHALL be the shared list section header: the calendar name in the platform section-title style (iOS footnote in the secondary label color, Android label in the action color), with the change time as a second line in the footnote style and the secondary label color on both platforms. The header SHALL be one heading element whose accessible name is the translated "{calendar}, changed {time}" phrase. Groups after the first SHALL be separated from the previous group by the same gap that separates list sections. The items inside a group SHALL appear in the order new, then changed, then cancelled.

A log whose change payload contains no new, changed, or cancelled item SHALL render no group at all.

Group children SHALL be independent items of the virtualized list rather than a single composite view holding every child, so that a log carrying thousands of changed events does not mount them all at once. Production holds logs with thousands of changed events, so this is a rendering constraint, not a preference.

#### Scenario: Groups are ordered newest first

- **WHEN** the cache holds several logs with different change times
- **THEN** the groups render newest first
- **AND** each group's header shows that log's change time and calendar name

#### Scenario: The group header uses the shared section-title style

- **WHEN** a group header renders on iOS and then on Android
- **THEN** the calendar name uses the same type step and color as a titled list section's title on that platform
- **AND** the change time renders below it in the footnote step and the secondary color
- **AND** the header is one heading named "{calendar}, changed {time}"

#### Scenario: Children follow the specified order

- **WHEN** a log carries new, changed, and cancelled items together
- **THEN** the new items render first, the changed items next, and the cancelled items last

#### Scenario: An empty change payload renders nothing

- **WHEN** a cached log carries no new, changed, or cancelled item
- **THEN** no group header and no item are rendered for it

#### Scenario: A large group renders without clipping

- **WHEN** a group carries a large number of changed items, and long calendar names, event titles, and locations
- **THEN** every rendered value wraps rather than clipping
- **AND** the group renders through the list's item virtualization rather than as one composite child view

### Requirement: Activity renders loading, empty, populated, cached-failure, and empty-failure states

The screen SHALL render a loading state until the reactive cache read has settled, and thereafter one of: an empty state, a populated timeline, a cached-failure state, or an empty-failure state.

The loading state SHALL be the shared `StatusView` loading state with the full-page presentation, the visible localized title "Loading recent changes" / "Chargement des modifications récentes", and the stable selector `activity-loading`. While an older page loads, the list footer SHALL be the shared `StatusView` loading state with the inline presentation, the visible localized title "Loading older changes", and the stable selector `activity-older-loading`. Both SHALL expose a busy progress indicator named by their title. The screen SHALL NOT render a spinner of its own.

The loaded empty branch SHALL use the shared `StatusView` (`kind="empty"`, `presentation="section"` as its list empty slot) with the locally bundled, theme-paired unDraw “Developer Activity” artwork and retain `activity-empty` as its stable selector. Its English title SHALL read exactly “No recent changes” and caption “Timetable updates will appear here.” Its French title SHALL read exactly “Aucune modification récente” and caption “Les changements d'emploi du temps apparaîtront ici.” The title and caption together preserve the existing localized sentence and SHALL be the complete accessible meaning without relying on the decorative image.

When a user-initiated refresh fails and cached rows exist, the screen SHALL keep every cached row and show a compact retryable message that the latest changes could not be checked. When it fails with no cached rows, the screen SHALL show a full retryable error state instead of the empty state.

A failure that no user initiated SHALL NOT alter the screen, because the screen renders stored history and a failed refresh stores nothing.

A refresh that is skipped because the device holds no calendars SHALL NOT be presented as a failure; it leaves the ordinary illustrated empty state.

Error text SHALL be announced to assistive technology as a live status.

#### Scenario: Every state renders in both locales

- **WHEN** the screen renders in French and in English for each of the loading, empty, populated, cached-failure, and empty-failure states
- **THEN** each state renders its localized copy
- **AND** the empty state renders the exact specified title and caption for that locale through the shared primitive

#### Scenario: The first load is the shared loading state

- **WHEN** the screen renders before the cache read has settled
- **THEN** `activity-loading` is a busy progress indicator named "Loading recent changes" with that text visible
- **AND** no list, empty state or error state is rendered

#### Scenario: Loading an older page shows the inline loading state

- **WHEN** the end of the list is reached and an older page is loading
- **THEN** the list footer shows `activity-older-loading`, a busy progress indicator named "Loading older changes"
- **AND** the footer is gone once the page has loaded

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
