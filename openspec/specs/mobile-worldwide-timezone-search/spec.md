# mobile-worldwide-timezone-search Specification

## Purpose
TBD - created by archiving change add-worldwide-native-timezone-search. Update Purpose after archive.
## Requirements
### Requirement: Worldwide catalog is reproducibly derived from maintained versioned data
The mobile project SHALL pin compatible exact versions of `@vvo/tzdb` and the CLDR JSON packages used for French and English labels through npm. A deterministic generator SHALL produce a bounded feature-owned runtime catalog from tzdb identifiers/groups/common cities plus only the required `en`/`fr` exemplar-city and territory fields. The repository SHALL document package versions, licenses, generated inputs, the update procedure, and a check command that fails when the committed artifact is stale.

#### Scenario: Generated catalog is current
- **WHEN** the catalog check runs against the pinned lockfile dependencies
- **THEN** it produces no diff from the committed generated artifact

#### Scenario: Only bounded locale fields enter the runtime artifact
- **WHEN** the mobile bundle consumes time-zone labels
- **THEN** it imports the feature-owned generated artifact
- **AND** it does not import an all-locales CLDR distribution at runtime

#### Scenario: Missing translation falls back
- **WHEN** CLDR supplies no exemplar or territory label for a catalog record in the active locale
- **THEN** display falls back to the supplied tzdb name and then a readable identifier component
- **AND** the record remains searchable and selectable when runtime-supported

### Requirement: Catalog preserves every supplied identifier and alias as its own selection value
The catalog SHALL contain one de-duplicated record for every identifier supplied by tzdb names, row names, group members, deprecated compatibility aliases, and the library-provided UTC entry. Each record's selection value SHALL be its exact identifier. Group metadata MAY enrich labels and search tokens but SHALL NOT authorize replacing one identifier with another.

#### Scenario: Grouped alias stays distinct
- **WHEN** a tzdb group contains a representative identifier and one or more aliases
- **THEN** each supplied identifier has its own catalog record and exact selection value

#### Scenario: Existing curated values remain present
- **WHEN** the generated catalog is checked
- **THEN** all identifiers accepted by the previous curated picker are present unchanged

#### Scenario: UTC is selectable
- **WHEN** the user searches for `UTC`
- **THEN** the exact `UTC` record is returned with a zero current offset

### Requirement: Search is offline, normalized, localized, and deterministic
The feature SHALL build an immutable local index over exact identifiers/path components, tzdb alternative names, common cities, source country names, French and English CLDR exemplar aliases, and French and English territory labels. Query matching SHALL be case-insensitive and accent-insensitive, treat identifier separators and punctuation as token boundaries, require every query token to match, and perform no network, location, or search-term logging. Ranking and tie-breaking SHALL be deterministic.

#### Scenario: Common city finds its zone
- **WHEN** the user searches `Lyon`
- **THEN** a result whose exact identifier is `Europe/Paris` is returned

#### Scenario: Translated and source exemplar names both match
- **WHEN** the user searches `London` or `Londres`
- **THEN** the exact `Europe/London` result is returned

#### Scenario: Accent normalization matches both forms
- **WHEN** the user searches `Montreal` or `Montréal`
- **THEN** the relevant supplied Montreal result set is the same

#### Scenario: Country and identifier tokens match
- **WHEN** the user searches a supplied localized country name or an exact/partial zone identifier
- **THEN** matching catalog records are returned without an online lookup

#### Scenario: Empty query remains useful
- **WHEN** the search query is empty
- **THEN** the current or remembered selection is pinned when present
- **AND** the remaining available catalog is exposed in deterministic localized browse order

### Requirement: Runtime availability and current offsets are explicit
The chooser SHALL test each candidate through a cached total `Intl` support predicate. Runtime-unsupported records SHALL remain explainable in the catalog but SHALL be visibly unavailable and non-selectable. Row offsets SHALL be calculated for a screen-owned current instant with `date-fns-tz`, including UTC and fractional offsets, and that instant SHALL refresh when the chooser is focused or the app resumes.

#### Scenario: Runtime-unavailable alias is disabled
- **WHEN** the catalog contains an alias rejected by the current runtime database
- **THEN** its row exposes a localized unavailable state
- **AND** activating it does not save or close the chooser

#### Scenario: Fractional current offsets render correctly
- **WHEN** current offsets are rendered for Kathmandu and a half-hour zone
- **THEN** their signed hour-and-minute labels preserve the 45-minute and 30-minute components

#### Scenario: Offset snapshot refreshes
- **WHEN** the chooser reopens or the app resumes after the current offset may have changed
- **THEN** visible offsets are recomputed from the new current instant

### Requirement: Existing timezone route owns automatic and manual mode
The stable `/timezone-settings` URL SHALL remain reachable through the Settings hub and deep links. It SHALL use the native settings host to expose a localized “Use device time zone” switch. Automatic mode SHALL show a readable noninteractive effective-zone row. Manual mode SHALL show the exact saved identifier and an action that opens the chooser. Unsupported saved intent SHALL be identified without crashing or silently clearing it.

#### Scenario: Automatic mode explains the effective zone
- **WHEN** automatic mode is enabled
- **THEN** the switch is on
- **AND** a noninteractive row displays the effective device identifier in readable form

#### Scenario: Manual mode opens chooser with saved selection
- **WHEN** automatic mode is disabled with a supported remembered identifier
- **THEN** the screen displays that exact identifier
- **AND** activating the row opens the chooser with it selected

#### Scenario: Existing deep link remains valid
- **WHEN** the app opens `timecalendar-dev://timezone-settings`
- **THEN** the automatic/manual timezone settings screen is presented under the existing root Stack contract

### Requirement: Chooser uses platform-native presentation and one lazy content owner
The chooser SHALL be a thin root Stack route. On iPhone it SHALL use a tall native form sheet with native swipe dismissal and a localized Close action; on iOS 26+ its controlled native search bar SHALL occupy the bottom toolbar search slot, while older iOS/iPad SHALL use Router's native adaptation. Android SHALL use a full-screen native Stack search/back flow. The content SHALL have exactly one inset-aware `FlatList` scroll owner and SHALL NOT create one separately hosted native control per result or a nested navigator.

#### Scenario: iOS 26 uses bottom-toolbar search
- **WHEN** the chooser runs on iOS 26 or newer
- **THEN** one `Stack.SearchBar` is hosted through `Stack.Toolbar.SearchBarSlot` in the bottom toolbar
- **AND** the list owns content scrolling and automatic insets

#### Scenario: Older iOS and iPad adapt natively
- **WHEN** the chooser runs on an older supported iOS version or iPad
- **THEN** Router's native form-sheet/header-search presentation is used
- **AND** no custom overlay substitutes for it

#### Scenario: Android is full screen with native back
- **WHEN** the chooser runs on Android
- **THEN** it is presented full screen with native header search and system back behavior
- **AND** no sheet-specific custom navigation is introduced

### Requirement: Selection commits once while every dismissal path is non-mutating
Selecting an available result SHALL revalidate it, persist the exact active and remembered identifier, and close the chooser with exactly one back action. Close, Android back, iOS swipe, search clear, and keyboard dismissal without selection SHALL leave both persisted values unchanged. Empty/no-results/current-selection states SHALL be localized and accessible.

#### Scenario: Selection saves and closes once
- **WHEN** the user activates an available result
- **THEN** its exact identifier is persisted as active and remembered manual state
- **AND** the chooser performs one close/back transition

#### Scenario: Close or swipe cancels
- **WHEN** the user closes, navigates back, or swipes away the chooser without selecting
- **THEN** active and remembered preferences remain unchanged

#### Scenario: Search clear does not navigate
- **WHEN** the user clears the search field or dismisses the keyboard
- **THEN** the query/list state updates without closing the chooser or causing double navigation

#### Scenario: No results is clear and localized
- **WHEN** a normalized query matches no records
- **THEN** the list renders one localized accessible no-results state

### Requirement: Wider selection does not change event-time interpretation
The expanded chooser SHALL continue using the existing effective-zone resolver, `date-fns-tz`, and `Intl` conversion paths. Current chooser offsets SHALL use now; event offsets SHALL use each event instant; stored UTC instants and floating all-day dates SHALL remain unchanged. Notification registration SHALL send the same resolved display identifier, while the fixed notification schedule remains independent.

#### Scenario: Paris daylight offsets use the event instant
- **WHEN** winter and summer Paris events are formatted under `Europe/Paris`
- **THEN** each event reflects the offset at its own instant rather than the chooser's current offset

#### Scenario: All-day date is invariant
- **WHEN** a user changes between automatic mode and worldwide manual identifiers
- **THEN** an all-day event retains the same floating calendar date

#### Scenario: Notification formatting follows the resolver
- **WHEN** a worldwide manual identifier becomes active
- **THEN** notification registration receives that exact resolved identifier through the existing resolver
- **AND** no queue schedule changes

#### Scenario: Representative selectable identifiers pass server compatibility
- **WHEN** representative canonical, alias, UTC, and fractional-offset selections are checked with the unchanged server validator
- **THEN** every identifier claimed selectable by that compatibility fixture is accepted
- **AND** the test does not assume every mobile OS supports every catalog alias
