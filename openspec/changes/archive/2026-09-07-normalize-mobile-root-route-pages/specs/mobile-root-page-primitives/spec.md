## ADDED Requirements

### Requirement: Every non-tab route is exhaustively classified and page-framed

The mobile app SHALL maintain an exhaustive, test-enforced inventory of every top-level route and every child route auto-discovered by the nested onboarding Stack under `mobile/src/app/`. Ordinary non-tab pushes SHALL render one localized compact native header with `headerLargeTitle: false` and `headerBackButtonDisplayMode: "minimal"`, and SHALL use `RootPage` for their themed surface, non-header safe-area edges, shared top rhythm, and one semantic measured lane. Features SHALL retain ownership of localized titles, native header actions, lists, scroll views, keyboard avoidance, refresh, pagination, overlays, and platform presentation.

The top-level `(tabs)` shell, `profile` and `more` redirects, root `onboarding` Stack container, and `dev-import` transition route SHALL remain explicit headerless exceptions. The nested onboarding `index` route SHALL remain an explicit headerless branded-landing exception. The QR camera content MAY remain full-bleed below its visible nested header, and `changelog-sheet` SHALL retain its iOS form-sheet and Android full-screen-modal presentation. No other discovered user-visible route SHALL inherit an untested header or page posture.

#### Scenario: Ordinary root destinations share compact chrome and rhythm

- **WHEN** any ordinary top-level destination opens, including Activity, Hidden events, Appearance and language, Timezone, Notifications, About, Feedback, User calendars, Personal events, personal-event create/edit, event details, or changelog history
- **THEN** one localized compact native header renders with a chevron-only back affordance that does not expose a route-group name
- **AND** the first content renders in the shared measured page frame without an additional safe-area owner or duplicated responsive gutter

#### Scenario: Root exceptions are explicit

- **WHEN** the root route inventory is compared with files discovered under `mobile/src/app/`
- **THEN** `(tabs)`, `profile`, `more`, `onboarding`, and `dev-import` are the explicit headerless registrations
- **AND** every other top-level file or route group is registered under compact defaults or a narrower tested presentation override

#### Scenario: Nested onboarding classification is explicit

- **WHEN** the onboarding route inventory is compared with files discovered under `mobile/src/app/onboarding/`
- **THEN** `index` is the explicit headerless branded landing
- **AND** `school`, `institution-name`, `programme`, `connect`, `import`, `qr-scan`, `ical-url`, and `groups` are visible-header pushes with feature-owned localized titles

#### Scenario: Full-bleed and presented content keep native ownership

- **WHEN** the QR scanner or changelog sheet opens
- **THEN** the scanner camera remains the full-bleed content owner below compact nested chrome and the changelog retains its platform-specific modal or sheet presentation
- **AND** neither exception disables the localized title, native back behavior, sheet Close action, or accessibility behavior

### Requirement: Root-page adoption preserves each content owner's behavior

Every eligible ordinary destination SHALL have exactly one primary page-frame and measured-lane owner. A virtualized `FlatList` or `SectionList` SHALL remain the sole collection owner and SHALL receive shared lane geometry without being wrapped in another scroller. Existing `ScrollView` and `KeyboardAvoidingView` owners SHALL retain keyboard and reachability props. Loading, empty, error, and populated branches of one screen SHALL render below the same native header and within the same shared frame so state transitions do not introduce overlap or an unexplained blank band.

#### Scenario: Virtualized lists retain refresh and pagination

- **WHEN** Activity, Hidden events, Personal events, User calendars, or School renders a populated collection
- **THEN** its existing `SectionList` or `FlatList` remains the only virtualized owner with current refresh, pagination, inset, keyboard, and list-padding behavior
- **AND** its rows, actions, and selectors align in the shared standard lane

#### Scenario: Form and scroll owners remain reachable

- **WHEN** Feedback, personal-event create/edit, event details, About, changelog, or an onboarding form renders with a keyboard or large text
- **THEN** the existing scroll or keyboard owner remains responsible for reachability and focus order
- **AND** `RootPage` adds no nested scroller, absolute footer, keyboard listener, or second measured gutter

#### Scenario: State branches share one frame

- **WHEN** an affected screen changes between loading, empty, retryable error, and populated content
- **THEN** each branch begins below the same native header at the shared tokenized distance
- **AND** feature-specific retry, refresh, pagination, cache, and loading gates remain unchanged

### Requirement: Native route titles are not repeated as oversized page headings

An ordinary destination SHALL present its localized route name through the compact native Stack title. When supporting explanation is needed, the page SHALL render caption-only `PageIntro` at the shared tokenized distance below native chrome using the shared secondary-text typography and color. The page SHALL NOT repeat the same route name as an oversized in-content heading. Content-level headings that identify a selected event, a section, release, calendar, or onboarding carousel page SHALL remain when they do not duplicate the route title.

#### Scenario: Caption follows native title

- **WHEN** Feedback, School, User calendars, or an onboarding/import step has explanatory copy
- **THEN** the compact header contains the localized route title and `PageIntro` contains only the supporting caption
- **AND** the caption precedes fields, actions, states, or list rows in source and focus order

#### Scenario: A route with no caption adds no placeholder intro

- **WHEN** an ordinary destination needs no explanatory copy
- **THEN** content starts at the shared page rhythm without an empty intro or duplicate title
- **AND** the visible native title remains the sole route name

#### Scenario: Content headings remain semantic

- **WHEN** event details, changelog releases, Activity groups, settings sections, or onboarding carousel pages render their own domain headings
- **THEN** those headings remain in content with their current accessibility semantics
- **AND** they are not treated as duplicate route titles merely because the route also has native chrome

### Requirement: Empty and status content adopts shared composition without semantic loss

Loaded empty Personal events and User calendars collections SHALL use the shared screen `EmptyState` while retaining their existing localized meaning and stable selectors. User calendars SHALL render no empty state or live region until its asynchronous local read has settled. Feature-specific loading, search-no-results, not-found, cached-error, and retryable-error states MAY keep their specialized components, but SHALL render inside the same `RootPage` frame and measured lane as populated content. Existing Activity and Hidden events illustrated empty-state behavior SHALL remain unchanged.

#### Scenario: Personal events uses a shared empty state

- **WHEN** the personal-events read returns no entries
- **THEN** a shared screen empty state renders in the standard lane with the existing localized meaning
- **AND** Add, row navigation, list ownership, and `personal-event-*` selectors remain unchanged

#### Scenario: User calendars does not flash empty while loading

- **WHEN** the user-calendars local read has not settled
- **THEN** neither the shared empty state nor an empty-state live region is mounted
- **AND** once the settled collection is empty, the shared centered title and caption render below the native header

#### Scenario: Specialized failures stay distinct from valid emptiness

- **WHEN** School search fails, event details is not found, or a collection exposes a retryable failure
- **THEN** the feature-specific status and recovery action render in the shared frame
- **AND** they are not replaced by a valid-empty presentation or stripped of their live-region semantics
