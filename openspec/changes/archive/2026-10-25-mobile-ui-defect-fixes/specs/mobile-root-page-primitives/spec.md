## MODIFIED Requirements

### Requirement: Every root route has compact native Stack classification

The root Expo Router Stack SHALL use a shared typed options helper for user-facing non-tab destinations. The defaults SHALL show a localized compact native header, disable large titles, use a chevron-only/minimal back affordance that never exposes `(tabs)` visibly or to assistive technology, use the active theme's native header surface, and permit a feature to add or override native header actions. The `(tabs)` shell, nested `onboarding` flow, `profile` and `more` compatibility redirects, and `dev-import` transition route SHALL be registered as explicit headerless exceptions; every other root route SHALL inherit the visible defaults or declare a narrower presentation override without losing compact back behavior. The `(tabs)` registration SHALL carry a localized title ("Back" / "Retour") so the native back button of any root sibling pushed from a tab has a meaningful accessible label.

#### Scenario: User-facing destination inherits compact chrome

- **WHEN** Activity, Hidden events, personal events, the personal-event form, or another user-facing root sibling opens
- **THEN** it has one visible compact localized native header
- **AND** back navigation is a chevron without a text label derived from `(tabs)`

#### Scenario: Back button from a tab has a localized accessible label

- **WHEN** a root sibling such as Hidden events is pushed from a tab and VoiceOver focuses its back button
- **THEN** the back button is announced with the localized "Back" / "Retour" label, never "(tabs)"
- **AND** the visible back affordance remains the minimal chevron without text

#### Scenario: Shell and internal routes stay headerless

- **WHEN** the root layout registers `(tabs)`, `onboarding`, `profile`, `more`, and `dev-import`
- **THEN** each route explicitly sets `headerShown: false`
- **AND** no route depends accidentally on the Stack default for its exception

#### Scenario: Feature action survives the defaults

- **WHEN** a root feature supplies an iOS native header item or Android React header action
- **THEN** the feature action renders with the shared compact header
- **AND** the feature does not import `@react-navigation/*`
