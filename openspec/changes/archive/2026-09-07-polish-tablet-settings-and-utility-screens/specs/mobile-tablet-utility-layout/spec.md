## ADDED Requirements

### Requirement: Settings destinations use semantic measured lanes without changing preference behavior

The Settings hub SHALL place its grouped summary and destination sections in one measured standard lane. Appearance, timezone, and notification settings SHALL place their one-column controls and every loading, error, retry, and destructive state in a measured readable lane. The lane SHALL remain inside the existing safe-area and route owners, and preference controls SHALL preserve immediate writes, native Picker/Host and Switch behavior, labels, summaries, badges, conditional rows, and destination order.

#### Scenario: Settings hub aligns complete sections in a standard lane

- **WHEN** the Settings hub lays out at 390, 768, 800, 834, or 1024 points
- **THEN** its calendar summary, event, preference, app, support, and conditional environment sections share the resolved standard-lane edges
- **AND** no section is split into tablet-only columns
- **AND** its rows retain their existing order, summaries, unread badge, routes, and accessibility semantics

#### Scenario: Preference screens remain readable and immediate

- **WHEN** appearance, timezone, or notification settings lays out at phone or portrait-tablet width
- **THEN** its controls and status content use the measured readable lane with compact behavior before measurement and below 600 points
- **AND** choosing a theme, language, timezone, frequency, day count, or active state preserves the existing immediate preference and registration behavior
- **AND** native control ownership, error retry, and destructive-state behavior are unchanged

### Requirement: Management and Activity collections share one measured standard lane

The hidden-events and Activity screens SHALL use the measured standard lane at their existing ScrollView or SectionList owner so collection content and loading, empty, cached-error, full-error, refresh, and pagination states align consistently. The responsive adaptation SHALL NOT alter hidden-event derivation or writes, Activity cache/read-watermark semantics, refresh single-flight, cursor pagination, sticky-header choice, row actions, or accessibility order.

#### Scenario: Hidden-event content and states align without semantic changes

- **WHEN** hidden events renders named entries, UID entries, an empty state, or a write error at a representative phone or portrait-tablet width
- **THEN** the applicable content uses one standard lane with adaptive gutters
- **AND** the section and row order, time formatting, un-hide actions, accessible error, and single-column reading order remain unchanged

#### Scenario: Activity keeps virtualized refresh and pagination behavior

- **WHEN** Activity renders loading, empty, cached-error, full-error, dense grouped, refreshing, older-loading, or older-error content at a representative phone or portrait-tablet width
- **THEN** the SectionList content and non-list states align to the same standard lane
- **AND** pull-to-refresh, `onEndReached`, footer retry, group order, row navigation, cancelled-row behavior, and accessibility traversal remain unchanged
- **AND** no wrapper nests Activity's virtualized list inside another vertical scroll container

### Requirement: Informational and form content uses readable bounds inside native presentation

About SHALL retain standard-lane grouped sections while its introductory and link-error copy is bounded to a readable inner width. Changelog history and sheet SHALL share a readable content lane. Feedback SHALL keep its keyboard-safe one-column form in a readable lane. These adaptations SHALL preserve all existing actions, metadata, form validation and state, chronological order, safe-area behavior, and native presentation.

#### Scenario: About retains grouped actions with readable prose

- **WHEN** About renders at phone or portrait-tablet width with long localized copy or unavailable native metadata
- **THEN** grouped rows remain in one measured standard lane and prose/error content uses readable inner bounds
- **AND** privacy, contact, changelog, developer, version/build, and link-failure behavior remains unchanged
- **AND** source and accessibility focus order remains top to bottom in one column

#### Scenario: Changelog constrains only shared inner content

- **WHEN** changelog history or the automatic changelog sheet renders several releases at a representative width
- **THEN** release prose, item rows, and the optional sheet footer share a readable measured lane in chronological order
- **AND** the regular history header, iOS form-sheet configuration, Android full-screen-modal configuration, close action, continue action, and acknowledgement lifecycle remain unchanged

#### Scenario: Feedback remains keyboard-safe and behaviorally identical

- **WHEN** Feedback renders empty, prefilled, invalid, pending, failure, or success behavior at phone or portrait-tablet width
- **THEN** its intro, fields, errors, submit action, and pending status share one readable lane inside the existing KeyboardAvoidingView, SafeAreaView, and ScrollView owners
- **AND** parameter normalization, validation, remembered e-mail, request deduplication, success alert, and back behavior remain unchanged

### Requirement: Existing no-change transient and redirect surfaces receive explicit regression proof

Splash SHALL remain a full-window overlay whose status is centered and non-stretched. Dev import SHALL remain a centered, headerless, readable transient state without changing its development-only import gate or self-routing. `/profile` and `/more` SHALL remain renderless redirects to `/settings`; responsive work SHALL NOT introduce feature UI at either route.

#### Scenario: Splash remains centered for every supported portrait class

- **WHEN** the splash overlay renders at 390, 768, 800, 834, or 1024 points with normal or reduced motion
- **THEN** its localized accessible progress content remains centered without stretching
- **AND** native-to-JavaScript handoff, readiness, fade, and reduced-motion semantics remain unchanged

#### Scenario: Dev import remains centered and runtime-gated

- **WHEN** dev import renders its production-inert, loading, or error state at phone or portrait-tablet width
- **THEN** the state remains centered in a readable region with no visible stretch
- **AND** production performs no import while a successful development import still replaces the route with `/calendar`

#### Scenario: Compatibility routes remain renderless

- **WHEN** `/profile` or `/more` is evaluated at any supported width
- **THEN** it redirects to `/settings`
- **AND** it renders no width-dependent content

### Requirement: Responsive ownership, phone parity, and native chrome remain protected

TIM-502 SHALL NOT edit the TIM-501-owned user-calendar responsive UI; it SHALL verify only that the Settings entry still reaches the management route. Every changed screen SHALL retain compact composition at 390 points, switch to tablet gutters at a measured width of at least 600 points, remain a single column at 768 and 800 points, and treat 834/1024 column eligibility as unused. Stack headers, native tabs, safe-area ownership, keyboard avoidance, refresh controls, alerts, menus, pickers, modal presentation, links, Dynamic Type, translations, touch targets, and existing Maestro selectors SHALL remain unchanged.

#### Scenario: Shared user-calendar ownership is respected

- **WHEN** the tablet utility change is reviewed
- **THEN** no responsive edit appears in `mobile/src/features/calendar-sources/ui/user-calendars-screen.tsx` or its rename content
- **AND** an integration test still proves the Settings calendar-summary row targets `/user-calendars`

#### Scenario: Measured boundaries preserve phone behavior and avoid columns

- **WHEN** a changed screen receives its first positive owner measurement at 599, 600, 768, 800, 834, or 1024 points
- **THEN** it uses compact gutters through 599 and tablet gutters from 600
- **AND** readable or standard caps follow the shared resolver
- **AND** the screen retains one source/focus-ordered column even where the resolver reports column eligibility

#### Scenario: Static route and selector contracts remain unchanged

- **WHEN** mobile static regression tests inspect the route tree and Maestro selectors
- **THEN** changelog presentation, Settings and Activity headers, dev-import headerlessness, and `/profile` and `/more` redirects match the existing contract
- **AND** every existing selector used by the affected flows still resolves to shipped UI
