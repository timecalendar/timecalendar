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
