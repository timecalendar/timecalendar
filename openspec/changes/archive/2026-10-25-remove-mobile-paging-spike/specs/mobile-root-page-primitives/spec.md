## MODIFIED Requirements

### Requirement: Every root route has compact native Stack classification

The root Expo Router Stack SHALL use a shared typed options helper for user-facing non-tab destinations. The defaults SHALL show a localized compact native header, disable large titles, use a chevron-only/minimal back affordance that never exposes `(tabs)`, use the active theme's native header surface, and permit a feature to add or override native header actions. The `(tabs)` shell, nested `onboarding` flow, `profile` and `more` compatibility redirects, `dev-import` transition route, and `calendar-import-result` route SHALL be registered as explicit headerless exceptions, and they SHALL be the only headerless root registrations; every other root route SHALL inherit the visible defaults or declare a narrower presentation override without losing compact back behavior.

#### Scenario: User-facing destination inherits compact chrome

- **WHEN** Activity, Hidden events, personal events, the personal-event form, or another user-facing root sibling opens
- **THEN** it has one visible compact localized native header
- **AND** back navigation is a chevron without a text label derived from `(tabs)`

#### Scenario: Shell and internal routes stay headerless

- **WHEN** the root layout registers `(tabs)`, `onboarding`, `profile`, `more`, `dev-import`, and `calendar-import-result`
- **THEN** each route explicitly sets `headerShown: false`
- **AND** no route depends accidentally on the Stack default for its exception

#### Scenario: The headerless set is closed

- **WHEN** the root route registrations are compared with the files discovered under `mobile/src/app/`
- **THEN** exactly `(tabs)`, `onboarding`, `profile`, `more`, `dev-import`, and `calendar-import-result` set `headerShown: false`
- **AND** no other discovered root route, including any dev-only route, is headerless

#### Scenario: Feature action survives the defaults

- **WHEN** a root feature supplies an iOS native header item or Android React header action
- **THEN** the feature action renders with the shared compact header
- **AND** the feature does not import `@react-navigation/*`

### Requirement: Every non-tab route is exhaustively classified and page-framed

The mobile app SHALL maintain an exhaustive, test-enforced inventory of every top-level route and every child route auto-discovered by the nested onboarding Stack under `mobile/src/app/`. Ordinary non-tab pushes SHALL render one localized compact native header with `headerLargeTitle: false` and `headerBackButtonDisplayMode: "minimal"`, and SHALL use `RootPage` for their themed surface, non-header safe-area edges, shared top rhythm, and one semantic measured lane. Features SHALL retain ownership of localized titles, native header actions, lists, scroll views, keyboard avoidance, refresh, pagination, overlays, and platform presentation.

The top-level `(tabs)` shell, `profile` and `more` redirects, root `onboarding` Stack container, `dev-import` transition route, and `calendar-import-result` route SHALL remain explicit headerless exceptions. The nested onboarding `index` route SHALL remain an explicit headerless branded-landing exception. The QR camera content MAY remain full-bleed below its visible nested header, and `changelog-sheet` SHALL retain its iOS form-sheet and Android full-screen-modal presentation. No other discovered user-visible route SHALL inherit an untested header or page posture.

#### Scenario: Ordinary root destinations share compact chrome and rhythm

- **WHEN** any ordinary top-level destination opens, including Activity, Hidden events, Appearance and language, Timezone, Notifications, About, Feedback, User calendars, Personal events, personal-event create/edit, event details, or changelog history
- **THEN** one localized compact native header renders with a chevron-only back affordance that does not expose a route-group name
- **AND** the first content renders in the shared measured page frame without an additional safe-area owner or duplicated responsive gutter

#### Scenario: Root exceptions are explicit

- **WHEN** the root route inventory is compared with files discovered under `mobile/src/app/`
- **THEN** `(tabs)`, `profile`, `more`, `onboarding`, `dev-import`, and `calendar-import-result` are the explicit headerless registrations
- **AND** every other top-level file or route group is registered under compact defaults or a narrower tested presentation override

#### Scenario: Nested onboarding classification is explicit

- **WHEN** the onboarding route inventory is compared with files discovered under `mobile/src/app/onboarding/`
- **THEN** `index` is the explicit headerless branded landing
- **AND** `school`, `institution-name`, `programme`, `connect`, `import`, `qr-scan`, `ical-url`, and `groups` are visible-header pushes with feature-owned localized titles

#### Scenario: Full-bleed and presented content keep native ownership

- **WHEN** the QR scanner or changelog sheet opens
- **THEN** the scanner camera remains the full-bleed content owner below compact nested chrome and the changelog retains its platform-specific modal or sheet presentation
- **AND** neither exception disables the localized title, native back behavior, sheet Close action, or accessibility behavior
