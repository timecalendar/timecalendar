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
Settings SHALL render through the project-owned native settings chrome contract. iOS SHALL use one SwiftUI Form with native Sections and Android SHALL use one Material list with native section and row composition. The hub SHALL preserve the ordered Calendars summary, Events, Preferences, App, Support, and capability-gated Environment groups; the existing Activity, Personal events, Hidden events, Appearance & language, Time zone, Notifications, About, and Feedback destinations; the unread Activity badge; and the Show weekends preference. No destination SHALL become dead, reordered across its established group, or silently converted from navigation to a plain action.

#### Scenario: Hub uses one platform-native scroll owner
- **WHEN** Settings renders on iOS or Android
- **THEN** the native Form or Material list owns scrolling and content insets
- **AND** no React Native ScrollView or nested native list also owns the page scroll

#### Scenario: Existing destinations and live state survive composition
- **WHEN** Settings renders with calendars, an unread activity count, a weekend preference, and a non-production environment capability
- **THEN** the established destinations remain in their established groups
- **AND** the calendar summary, badge, switch state, and environment row reflect their live sources

#### Scenario: Production capability still hides environment controls
- **WHEN** the backend-environment capability is production
- **THEN** the Environment section and control do not render

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
Every Settings row SHALL expose exactly one semantic row target or one noninteractive value. Navigation rows SHALL activate across the full row and alone display a navigation disclosure; action rows SHALL activate without a disclosure; value rows SHALL expose their value without claiming interactivity; switch rows SHALL toggle once from either the row or control activation path; and selection rows SHALL expose selected state. Native geometry SHALL retain platform minimum targets, translated labels and supporting values SHALL grow without clipping, and decorative icons/disclosures SHALL not become separate assistive-technology targets.

#### Scenario: Whole navigation and action rows activate correctly
- **WHEN** the user activates empty space within a navigation or action row
- **THEN** the row performs its route or action exactly once
- **AND** only the navigation row presents a disclosure affordance

#### Scenario: Value and switch rows retain distinct semantics
- **WHEN** assistive technology focuses a value row and a switch row
- **THEN** the value row announces its current value without a link or button action
- **AND** the switch row announces checked state and changes state once per activation

#### Scenario: Large localized content remains operable
- **WHEN** the app uses an accessibility text size and a long translated label
- **THEN** the native row grows without clipping or overlapping trailing content
- **AND** its whole minimum-size target remains operable

### Requirement: Settings behavior is covered by automated and on-device proofs
Automated tests SHALL cover native host/section/row contracts, group order, all hub routes, calendar-summary loading and empty states, unread badge, weekend switch, environment gating, localized normal-case section labels, and compatibility action/value/navigation consumers in About and Environment. Tests SHALL verify both platform branches and one-scroll-owner structure without claiming rendered native fidelity. The project owner SHALL perform device acceptance on iOS and Android for grouped/list geometry, ripple and whole-row activation, both themes, French and English, large text, screen-reader traversal, and phone/tablet sizing.

#### Scenario: Automated gates protect behavior and consumers
- **WHEN** the mobile typecheck, lint, and affected Jest suites run
- **THEN** hub behavior and native chrome contracts pass
- **AND** About and Environment consumers render and act without native-host errors

#### Scenario: Device acceptance owns visual fidelity
- **WHEN** the owner evaluates the implementation build on iOS and Android
- **THEN** platform geometry, scrolling, navigation, themes, localization, large text, and assistive behavior are evaluated on real native hosts
- **AND** host tests are not cited as proof of pixel fidelity

### Requirement: Environment confirmation and reset status are accessible

The Environment UI SHALL localize choice labels, current-value text, destructive confirmation, cancellation, reset progress, and recovery failure in French and English. Controls SHALL expose roles, labels, state, focus order, large-text resilience, and minimum 44pt iOS / 48dp Android targets. While reset is active, duplicate activation SHALL be disabled and an accessible status SHALL be exposed.

#### Scenario: Confirmation describes the destructive effect

- **WHEN** a tester requests a different environment
- **THEN** the confirmation explicitly says the session and local calendar/app data will be cleared
- **AND** confirm and cancel actions are localized and accessible

#### Scenario: Reset failure remains recoverable

- **WHEN** the reset protocol reports failure
- **THEN** a localized accessible recovery surface blocks normal app use and offers retry

### Requirement: Settings section labels preserve localized casing
Settings grouped-section labels SHALL render the casing supplied by the active localized resource and SHALL NOT apply an uppercase or lowercase text transformation. The existing semantic label typography, secondary color, inset, section spacing, grouped surface, and platform-specific radius SHALL keep Calendars, Events, Preferences, App, Support, and Environment visually distinct from destination rows on iOS and Android.

#### Scenario: French section labels use catalog casing
- **WHEN** Settings renders in French
- **THEN** every section label uses the casing stored in the French catalog without a visual text transform
- **AND** the grouped surfaces and destination rows remain unchanged

#### Scenario: English hierarchy remains clear on both platforms
- **WHEN** Settings renders on iOS or Android in English
- **THEN** section labels use normal localized casing
- **AND** their semantic typography, spacing, and grouped containers distinguish them from rows without forced uppercase

### Requirement: Native settings chrome is reusable and theme-aware
The mobile chrome boundary SHALL own the only application imports of the Expo UI primitives used for settings composition and SHALL expose stable native host, section, row, switch, checkmarked-choice, and radio-dialog contracts to features. Every native host and dialog SHALL receive the app scheme resolved through `@/hooks/use-color-scheme`, while platform geometry and system typography remain native.

#### Scenario: Feature code stays behind the chrome seam
- **WHEN** a settings feature composes a native row, section, selection list, or dialog
- **THEN** it imports the project-owned contract from `@/components/chrome`
- **AND** it does not import an Expo UI platform subpath directly

#### Scenario: Explicit scheme reaches native controls
- **WHEN** the app preference resolves dark while the device scheme is light
- **THEN** the native settings host, controls, dialogs, and Router navigation render with the resolved dark scheme
- **AND** switching the preference updates the mounted surfaces live
