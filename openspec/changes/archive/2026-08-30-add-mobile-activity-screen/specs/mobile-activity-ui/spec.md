# mobile-activity-ui — delta

## ADDED Requirements

### Requirement: Activity is a thin route over a feature screen, reachable from Settings

The app SHALL expose Activity at `/activity` as a root Stack sibling of the tab group with a visible localized header, and the route file SHALL be a one-line re-export of the screen from the Activity feature's `ui` sub-barrel.

The Settings hub SHALL be the discovery point. No other entry point, notification-preference gate, hidden ritual, or feature flag SHALL control whether Activity is reachable.

The screen SHALL NOT import the database seam or the generated calendar-log client. It SHALL read Activity through the feature's own data sub-barrel, format dates through the shared display-only date seam, and navigate by building the public event-details URL string rather than importing a calendar-feature helper.

#### Scenario: The route is a thin re-export registered in the root Stack

- **WHEN** the route structure is inspected
- **THEN** `src/app/activity.tsx` is a single re-export of the Activity screen from the feature's `ui` sub-barrel
- **AND** the root Stack registers the screen with a visible header

#### Scenario: The screen reaches no seam directly

- **WHEN** the repository is linted
- **THEN** the Activity `ui` layer imports neither the database seam's Activity tables nor the generated calendar-log operation

### Requirement: Activity renders one server log as one group, newest first

The screen SHALL render cached Activity history newest first, with one server calendar-log row rendered as exactly one visual group, because one row represents one detected synchronization change.

A group's header SHALL show the change time and the calendar name. The items inside a group SHALL appear in the order new, then changed, then cancelled.

A log whose change payload contains no new, changed, or cancelled item SHALL render no group at all.

Group children SHALL be independent items of the virtualized list rather than a single composite view holding every child, so that a log carrying thousands of changed events does not mount them all at once. Production holds logs with thousands of changed events, so this is a rendering constraint, not a preference.

#### Scenario: Groups are ordered newest first

- **WHEN** the cache holds several logs with different change times
- **THEN** the groups render newest first
- **AND** each group's header shows that log's change time and calendar name

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

### Requirement: Each change kind has a distinct treatment that does not depend on color alone

New items SHALL use a positive treatment, changed items an informational treatment, and cancelled items a destructive treatment, each drawn from the shared theme tokens and each meeting the architecture book's documented contrast requirement in both schemes.

Every item SHALL additionally carry a translated text label naming its kind, so the distinction survives greyscale rendering, color vision deficiency, and a screen reader.

A changed item SHALL show only the meaningful differences available in the contract — at minimum a changed time and a changed location, and a changed title when present — and SHALL NOT list fields that did not change.

#### Scenario: Kind is conveyed by label as well as color

- **WHEN** any item renders
- **THEN** it carries a translated label naming its kind
- **AND** its treatment uses a shared theme token, not a locally defined color

#### Scenario: A changed item lists only what changed

- **WHEN** a changed item's previous and new versions differ only in location
- **THEN** the item shows the location difference
- **AND** the item shows no time difference

### Requirement: Activity renders loading, empty, populated, cached-failure, and empty-failure states

The screen SHALL render a loading state until the reactive cache read has settled, and thereafter one of: an empty state, a populated timeline, a cached-failure state, or an empty-failure state.

The empty state SHALL read exactly "No recent changes. Timetable updates will appear here." in English and "Aucune modification récente. Les changements d'emploi du temps apparaîtront ici." in French.

When a user-initiated refresh fails and cached rows exist, the screen SHALL keep every cached row and show a compact retryable message that the latest changes could not be checked. When it fails with no cached rows, the screen SHALL show a full retryable error state instead of the empty state.

A failure that no user initiated SHALL NOT alter the screen, because the screen renders stored history and a failed refresh stores nothing.

A refresh that is skipped because the device holds no calendars SHALL NOT be presented as a failure; it leaves the ordinary empty state.

Error text SHALL be announced to assistive technology as a live status.

#### Scenario: Every state renders in both locales

- **WHEN** the screen renders in French and in English for each of the loading, empty, populated, cached-failure, and empty-failure states
- **THEN** each state renders its localized copy
- **AND** the empty state renders the exact specified sentence for that locale

#### Scenario: A failed refresh keeps cached rows

- **WHEN** a pull-to-refresh fails while cached rows exist
- **THEN** every cached row is still rendered
- **AND** a compact retryable message reports that the latest changes could not be checked

#### Scenario: A failed refresh with an empty cache offers a full retry

- **WHEN** a pull-to-refresh fails while no cached row exists
- **THEN** the screen shows a retryable error state
- **AND** the empty-state sentence is not shown

#### Scenario: A device with no calendars sees the empty state

- **WHEN** a refresh resolves as skipped because the device holds no calendars
- **THEN** the screen shows the empty state
- **AND** no error message is shown

### Requirement: Pull-to-refresh reloads the newest page and reaching the end loads older history

Pull-to-refresh SHALL invoke the Activity data seam's forced newest-page refresh. Reaching the end of the list SHALL invoke the seam's older-page load when one may exist, and an inline footer SHALL offer a retry when an older-page load has failed.

Loading another page SHALL NOT block, blank, or replace already cached content: the rendered rows come from the cache, and an in-flight page only adds to them.

The screen SHALL NOT issue an older-page load when the chain is already complete, when one is already in flight, or when no cached row is rendered.

A rejected stored cursor SHALL NOT be presented as an error, because the chain resets and every cached row is retained.

#### Scenario: Pull-to-refresh calls the forced refresh

- **WHEN** the user pulls to refresh
- **THEN** the newest-page refresh is invoked in its forced form exactly once

#### Scenario: Reaching the end loads the next older page

- **WHEN** the list reaches its end while older history may exist
- **THEN** the older-page load is invoked
- **AND** the already rendered rows remain visible throughout

#### Scenario: The footer retry retries only the older page

- **WHEN** an older-page load has failed and the user activates the inline retry
- **THEN** the older-page load is invoked again
- **AND** the newest-page refresh is not invoked

#### Scenario: A completed chain stops asking

- **WHEN** the older-page chain is marked complete
- **THEN** reaching the end of the list issues no further older-page load

### Requirement: New and changed items open current event details; cancelled items are inert

Activating a new item SHALL navigate to the event-details route for that item's event identifier, and activating a changed item SHALL navigate using the new version's identifier.

A cancelled item SHALL NOT be pressable and SHALL NOT expose an interactive accessibility role, because the current event no longer exists.

Navigation SHALL use the public event-details URL. The screen SHALL NOT construct, cache, or render a second event model from the historical payload, and an event that has since disappeared SHALL land on the existing not-found state.

#### Scenario: A new item opens its event

- **WHEN** the user activates a new item
- **THEN** the app navigates to the event-details route carrying that item's identifier

#### Scenario: A changed item opens the new version

- **WHEN** the user activates a changed item whose previous and new versions carry different identifiers
- **THEN** the app navigates to the event-details route carrying the new version's identifier

#### Scenario: A cancelled item does nothing

- **WHEN** the user attempts to activate a cancelled item
- **THEN** no navigation occurs
- **AND** the item exposes no interactive accessibility role

### Requirement: Settings shows an Activity entry with a live unread badge

The Settings Events section SHALL contain an Activity row that navigates to `/activity` through its entire touch target, and the row SHALL be present whenever the app can hold calendars, independently of notification preferences and of how many calendars are held.

The row SHALL carry a trailing unread badge showing the exact count from one through ninety-nine, then "99+" for any greater count, and SHALL show no badge when the count is zero.

The badge SHALL be part of the row's single accessible name rather than a separately focusable element, so the row announces its label and its unread count together and remains one touch target meeting the platform minimum.

The badge value SHALL derive reactively from stored Activity state, so it updates without the student leaving and re-entering Settings.

#### Scenario: The row routes through its full touch target

- **WHEN** the user activates the Activity row anywhere across its width
- **THEN** the app navigates to `/activity`

#### Scenario: The badge renders counts, the cap, and nothing at zero

- **WHEN** the stored unread count is one, ninety-nine, one hundred, and zero in turn
- **THEN** the badge renders "1", "99", "99+", and no badge respectively

#### Scenario: The row survives having no calendars

- **WHEN** Settings renders on a device holding no calendars
- **THEN** the Activity row is present
- **AND** activating it opens the ordinary empty state

### Requirement: Opening Activity clears the locally known unread count

Opening the Activity screen SHALL set the locally known unread count to zero, and SHALL advance the stored read watermark only through server-issued time already present in the cache.

While the screen remains open, a stored unread count that becomes non-zero SHALL be cleared again, so a refresh completing while the student is looking at the timeline does not leave a badge for content they are viewing.

The screen SHALL NOT write a device-clock value as the read watermark under any circumstance, including when it opens with no network.

#### Scenario: Opening clears the badge

- **WHEN** Activity opens while a non-zero unread count is stored
- **THEN** the stored unread count becomes zero

#### Scenario: A refresh landing while the screen is open does not re-badge it

- **WHEN** a stored unread count becomes non-zero while the Activity screen is open
- **THEN** it is cleared again without the student acting

#### Scenario: An offline open advances only through cached server time

- **WHEN** Activity opens with no network
- **THEN** the unread count is zero
- **AND** the read watermark is a server-issued timestamp from the cache or the previously stored watermark, never a device-clock value

### Requirement: Activity meets the accessibility contract for its content and its states

The screen SHALL expose its group headers as headings, SHALL give every interactive item a translated accessible name describing the change it opens, and SHALL announce state and error text as a live status.

Every interactive element SHALL meet the platform's minimum touch target, and SHALL NOT disable font scaling.

Every user-facing string SHALL exist in French and English with typed key parity, including accessibility labels and hints.

Long calendar names, event titles, and locations SHALL wrap rather than clip at large font scales.

#### Scenario: Group headers are headings

- **WHEN** the timeline renders
- **THEN** each group header resolves to a heading in the accessibility tree

#### Scenario: An error is announced

- **WHEN** a cached-failure or empty-failure message appears
- **THEN** it is exposed as a live status to assistive technology

#### Scenario: Copy exists in both catalogs

- **WHEN** the translation catalogs are type-checked
- **THEN** every Activity key exists in both the French and the English catalog
