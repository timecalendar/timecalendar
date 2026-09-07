## ADDED Requirements

### Requirement: Root pages share a measured frame and optional intro hierarchy

The mobile app SHALL provide shared `RootPage` and `PageIntro` components for user-facing non-tab destinations. `RootPage` SHALL own the themed full-height surface, non-header safe-area edges, consistent vertical rhythm, and one measured `readable` or `standard` lane while leaving scrolling, virtualization, overlays, presentation, and feature state to the consumer. `PageIntro` SHALL support an optional heading and optional caption in source order; a native Stack title SHALL be sufficient as the route heading, and the component SHALL NOT require a second oversized in-content copy of that title.

#### Scenario: Native title stands alone

- **WHEN** a root destination supplies its localized route title through `Stack.Screen` and needs only explanatory intro copy
- **THEN** it renders `PageIntro` without a duplicate content heading
- **AND** the caption follows the shared spacing and text hierarchy

#### Scenario: Virtualized content keeps its owner

- **WHEN** a root page contains a `FlatList` or `SectionList`
- **THEN** `RootPage` provides the measured lane and available height without wrapping the list in another scroller
- **AND** the list retains its own refresh, pagination, and inset behavior

#### Scenario: Layout follows the actual page owner

- **WHEN** the page owner reports compact and portrait-tablet widths
- **THEN** the page resolves the existing compact/tablet gutters and semantic lane caps from `useAdaptiveLayout`
- **AND** it does not infer width from a device model or unrelated window

### Requirement: Every root route has compact native Stack classification

The root Expo Router Stack SHALL use a shared typed options helper for user-facing non-tab destinations. The defaults SHALL show a localized compact native header, disable large titles, use a chevron-only/minimal back affordance that never exposes `(tabs)`, use the active theme's native header surface, and permit a feature to add or override native header actions. The `(tabs)` shell, nested `onboarding` flow, `profile` and `more` compatibility redirects, and `dev-import` transition route SHALL be registered as explicit headerless exceptions; every other root route SHALL inherit the visible defaults or declare a narrower presentation override without losing compact back behavior.

#### Scenario: User-facing destination inherits compact chrome

- **WHEN** Activity, Hidden events, personal events, the personal-event form, or another user-facing root sibling opens
- **THEN** it has one visible compact localized native header
- **AND** back navigation is a chevron without a text label derived from `(tabs)`

#### Scenario: Shell and internal routes stay headerless

- **WHEN** the root layout registers `(tabs)`, `onboarding`, `profile`, `more`, and `dev-import`
- **THEN** each route explicitly sets `headerShown: false`
- **AND** no route depends accidentally on the Stack default for its exception

#### Scenario: Feature action survives the defaults

- **WHEN** a root feature supplies an iOS native header item or Android React header action
- **THEN** the feature action renders with the shared compact header
- **AND** the feature does not import `@react-navigation/*`

### Requirement: Empty states share screen and section composition

The app SHALL provide a shared `EmptyState` component with `screen` and `section` variants, a required localized title, an optional localized caption, optional paired local light/dark artwork, and a caller-owned stable `testID`. The screen variant SHALL grow within its owner and center a bounded content group; the section variant SHALL remain content-sized and left-aligned. Both variants SHALL preserve title-then-caption source order, wrap under Dynamic Type, use theme tokens, and add no animation.

#### Scenario: Full-screen empty state is centered

- **WHEN** a loaded root collection contains no entries and renders `variant="screen"`
- **THEN** its optional artwork, title, and caption form one centered group within the measured lane
- **AND** the state fills the content region without changing the screen's loading or error branches

#### Scenario: Section empty state stays left-aligned

- **WHEN** a compact section such as Home renders `variant="section"`
- **THEN** the state remains left-aligned and content-sized
- **AND** it receives no full-screen centering or mandatory artwork

#### Scenario: Empty state remains meaningful without artwork

- **WHEN** artwork is omitted, unavailable to accessibility, or not perceived
- **THEN** the localized title and optional caption convey the complete state
- **AND** their text scales and wraps without `allowFontScaling={false}`

### Requirement: Empty-state artwork is local, theme-paired, and license-recorded

Eligible full-screen exemplar states SHALL bundle optimized local PNG artwork in paired light/dark variants recolored to the exact semantic `primary` token for each scheme. Activity SHALL use unDraw “Developer Activity” and Hidden events SHALL use unDraw “No data”. The repository SHALL record each official source page, the official license URL, creator, retrieval date, variant colors, and permitted product-use posture beside the assets. Runtime rendering SHALL select through the single color-scheme seam, SHALL NOT fetch or hotlink artwork, and SHALL hide decorative artwork from the accessibility tree.

#### Scenario: Theme selects a bundled asset

- **WHEN** an illustrated empty state renders in light and dark schemes
- **THEN** it selects the corresponding locally imported asset variant
- **AND** no network request or remote URI is used

#### Scenario: Artwork does not duplicate speech

- **WHEN** a screen reader reaches an illustrated empty state
- **THEN** the decorative image is not a focusable or announced element
- **AND** the title and caption are announced in meaningful order

#### Scenario: Source and license are auditable

- **WHEN** the committed empty-state asset directory is inspected
- **THEN** its record identifies both official illustration pages and the official unDraw license
- **AND** it states that the files are used as product UI rather than redistributed as an asset pack or used for AI/ML training

### Requirement: Filled primary actions share semantic colors, sizing, and state

The app SHALL provide a `PrimaryAction` component for filled body/footer actions. It SHALL render `onPrimary` content on `primaryStrong`, meet a minimum 44-point height on iOS and 48-dp height on Android, accept caller-owned translated label, activation handler, style, and `testID`, and expose disabled and busy states. Disabled or busy actions SHALL block activation, visibly differ from enabled state, and expose `accessibilityState.disabled`; busy actions SHALL additionally expose `accessibilityState.busy` and a non-focusable progress indicator while retaining a meaningful accessible label.

#### Scenario: Enabled action uses the verified brand pair

- **WHEN** a filled primary action is enabled in either color scheme
- **THEN** its fill is `primaryStrong` and its content is `onPrimary`
- **AND** its target meets the current platform minimum

#### Scenario: Disabled action cannot activate

- **WHEN** the action is disabled
- **THEN** activation does not invoke its handler
- **AND** disabled state is exposed visually and to assistive technology

#### Scenario: Busy action is single-flight and announced

- **WHEN** the action is busy
- **THEN** activation does not invoke a second handler call
- **AND** busy and disabled semantics are exposed on the same accessible button

#### Scenario: Native placement remains feature-owned

- **WHEN** the semantic primary action belongs in an iOS native header or Android FAB
- **THEN** the feature MAY use that platform-native placement and its platform-owned target sizing
- **AND** the shared contract does not force both platforms into the filled body-button layout

### Requirement: Focused forms keep actions pinned above the keyboard

The app SHALL provide a `KeyboardSafeActionLayout` that composes a flexing scrollable content region with a sibling action region inside `KeyboardAvoidingView`. It SHALL use padding behavior on iOS and height behavior on Android, retain `keyboardShouldPersistTaps="handled"`, accept the caller's measured lane and safe-area ownership, keep content scrollable, and place the action region immediately above the visible keyboard without absolute positioning.

#### Scenario: iOS keyboard lifts the action region

- **WHEN** a focused field opens the iOS keyboard
- **THEN** padding-based avoidance keeps the action region immediately above the keyboard
- **AND** fields remain reachable through the independent ScrollView

#### Scenario: Android keyboard resizes the owner

- **WHEN** a focused field opens the Android keyboard
- **THEN** height-based avoidance keeps the action region immediately above the keyboard
- **AND** the action is not overlaid on the fields or system inset

#### Scenario: Safe area and lane remain composable

- **WHEN** a root form uses the keyboard-safe layout on a phone or tablet
- **THEN** the screen retains ownership of safe-area edges and the form supplies its measured readable lane
- **AND** the layout adds no navigation, modal, or window-width policy

### Requirement: Shared primitive behavior is proven across accessibility and themes

Focused component tests SHALL cover measured page framing, optional intro headings, both empty-state variants, paired light/dark artwork selection, decorative-image semantics, Dynamic Type-compatible text props, no-motion rendering, primary-action colors/targets/disabled/busy behavior, and iOS/Android keyboard-layout behavior. Static route tests SHALL enumerate the root route classification and preserve feature header actions. Typed EN/FR catalogs, lint, React Doctor changed-code checks, TypeScript, and the full Jest coverage gate SHALL remain green.

#### Scenario: Focused shared-component suite runs

- **WHEN** the shared primitive tests run under Jest
- **THEN** every state, platform branch, scheme branch, and semantic contract above is asserted
- **AND** no native simulator or network service is required

#### Scenario: Native-only proof is recorded non-blockingly

- **WHEN** implementation is complete on a host without emulator support
- **THEN** a migration-inbox note tagged `(HUMAN: …)` records iOS/Android keyboard, Dynamic Type, light/dark, VoiceOver/TalkBack, and artwork rendering checks
- **AND** the absence of local emulator rendering does not block the implementation pipeline
