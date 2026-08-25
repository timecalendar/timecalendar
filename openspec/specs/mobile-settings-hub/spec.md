# mobile-settings-hub Specification

## Purpose
TBD - created by archiving change rework-mobile-settings-tab. Update Purpose after archive.
## Requirements
### Requirement: The third tab is Settings and has a canonical Settings route

The mobile app SHALL expose a stable three-tab hierarchy ordered Home, Calendar,
Settings. The Settings tab SHALL use the localized label “Settings” / “Réglages”,
a platform-native gear symbol, and the canonical `/settings` route. The former `/profile`
path SHALL temporarily redirect to `/settings`; no internal navigation SHALL target
`/profile`.

#### Scenario: Native tabs expose Settings in third position
- **WHEN** the tab layout renders
- **THEN** the triggers are ordered Home, Calendar, Settings
- **AND** Settings uses the translated label and platform gear symbol

#### Scenario: Legacy Profile route remains safe temporarily
- **WHEN** an existing caller opens `/profile`
- **THEN** it is redirected to `/settings`
- **AND** the Settings tab becomes selected

### Requirement: Settings is owned by a feature module behind a thin nested-tab route

The Settings screen SHALL live under `mobile/src/features/settings/ui/`, with non-visual
derivation logic under `mobile/src/features/settings/data/`. The `(tabs)/settings` route
SHALL be a nested Stack whose index is a thin re-export through the feature UI
barrel. The Stack SHALL show a compact localized Settings title and SHALL not
render an in-content marketing hero. The screen SHALL begin with its calendar
summary and named content sections below native navigation chrome.

#### Scenario: Route tree follows the feature boundary
- **WHEN** the Settings route files are inspected
- **THEN** the route index only re-exports the feature screen
- **AND** tested screen and selector code live outside `src/app/`

#### Scenario: Settings uses restrained page chrome
- **WHEN** the Settings tab opens
- **THEN** a compact localized Settings title is shown
- **AND** the product name, logo, and descriptive marketing copy are not repeated
- **AND** the calendar summary is the first meaningful content

### Requirement: Settings presents a grouped hierarchy of live destinations

The Settings screen SHALL be a scrollable, platform-appropriate grouped list. Its
initial release SHALL present the calendar summary followed by an Events section
containing Personal events and Hidden events, and a Preferences section containing
Appearance & language and Notifications. Each row SHALL navigate to its existing
route. It SHALL NOT render Activity, About, Feedback, disabled placeholders, or a
duplicate Calendars row until corresponding requirements introduce those live
destinations.

#### Scenario: Initial groups contain only working routes
- **WHEN** Settings renders in the initial release
- **THEN** Personal events, Hidden events, Appearance & language, and Notifications
  appear under their specified groups
- **AND** Activity, About, Feedback, and a duplicate Calendars row do not appear

#### Scenario: A row navigates through its entire touch target
- **WHEN** the user activates any destination row
- **THEN** the app navigates to that row's configured route
- **AND** the row provides platform-appropriate pressed feedback

### Requirement: Calendar summary derives from the full held-calendar collection

The calendar summary SHALL derive from the reactive `useUserCalendars()` collection
and its loaded state, SHALL persist no duplicate summary state, and SHALL count all
held calendars regardless of visibility. It SHALL NOT derive a school from calendar
array position or from the single-school onboarding selection. School identities
SHALL prefer non-empty `schoolId`; normalized `schoolName` SHALL be a fallback, and
calendars without school metadata SHALL not create school identities.

#### Scenario: Loading does not announce a false empty collection
- **WHEN** the user-calendar read has not resolved
- **THEN** the summary does not render or announce the zero-calendar state

#### Scenario: Empty collection offers the calendar front door
- **WHEN** the read resolves with no held calendars
- **THEN** the summary shows localized “Your calendars” and “Add your first calendar” copy
- **AND** activating it opens calendar management

#### Scenario: One school is named without depending on row order
- **WHEN** one or more calendars resolve to exactly one school identity
- **THEN** the summary uses that school's display name and a localized total-calendar count
- **AND** reordering those calendars does not change the result

#### Scenario: Multiple schools are summarized by count
- **WHEN** held calendars resolve to more than one school identity
- **THEN** the summary shows a localized school count and total-calendar count
- **AND** it does not arbitrarily select the first calendar's school

#### Scenario: Unknown school metadata remains truthful
- **WHEN** held calendars have neither a usable `schoolId` nor `schoolName`
- **THEN** the summary shows localized “Your calendars” and the total-calendar count
- **AND** it does not invent an unknown school identity

#### Scenario: Visibility does not remove configured calendars from the summary
- **WHEN** a held calendar is hidden from calendar rendering
- **THEN** it remains included in the summary's total calendar count and school derivation

### Requirement: Settings rows and summary are accessible and resilient to large text

Every Settings navigation row and the calendar summary SHALL be one reachable link with
a localized accessibility label, an appropriate hint, and a minimum 44pt iOS / 48dp
Android target. Decorative leading icons and disclosure glyphs SHALL be hidden from
assistive technology. Rows SHALL use minimum rather than fixed heights and SHALL
permit translated labels and dynamic type to wrap without clipping or overlapping
trailing content.

#### Scenario: Assistive technology encounters one target per destination
- **WHEN** VoiceOver or TalkBack focuses a Settings destination
- **THEN** it announces one localized link target rather than separate decorative icon,
  text, and chevron elements

#### Scenario: Large text remains operable
- **WHEN** the app uses an accessibility text size and a long localized label
- **THEN** the row grows to contain the label without clipping
- **AND** its full touch target remains operable

### Requirement: Settings behavior is covered by automated and on-device proofs

The pure summary selector SHALL be covered under the 90% logic threshold, including
loading, empty, ID/name aliasing, multiple schools, unknown metadata, hidden calendars,
and order independence. The presentational screen SHALL meet the 70% floor and test
group order, route wiring, localization, accessibility, and platform row branches.
The tab trigger and legacy redirect SHALL have automated coverage. A Maestro flow and
manual iOS/Android pass SHALL prove tab navigation, calendar-management and appearance
destinations, safe-area/tab behavior, screen-reader traversal, dark mode, large text,
and a multi-school fixture.

#### Scenario: Automated gates verify Settings
- **WHEN** the mobile typecheck, lint, and Jest coverage suite run
- **THEN** Settings passes all gates and the selector clears the 90% logic threshold

#### Scenario: Both platforms verify native behavior
- **WHEN** the Settings device checklist is completed on iOS and Android
- **THEN** tab/header behavior, interactions, accessibility, dark mode, and the
  multi-school summary are verified without dead destinations

