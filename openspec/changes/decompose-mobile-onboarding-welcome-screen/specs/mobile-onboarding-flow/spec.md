## MODIFIED Requirements

### Requirement: A native-default brand/welcome surface is the onboarding entry, in its own presentation-only feature folder
The app SHALL provide a three-page native onboarding carousel as the entry of the onboarding flow, implemented as focused modules in the presentation-only `mobile/src/features/onboarding/ui/` sublayer with no `data/`, `store/`, or `form/` sublayer. No welcome-screen component SHALL materially exceed 200 lines. Pages SHALL appear in the fixed order welcome → agenda → notifications and render the approved localized title/body plus mapped decorative illustration. The screen SHALL use React Native/shared components, `@/theme`, `expo-router`, `expo-image`, `expo-symbols`, `react-native-pager-view`, Reanimated, and i18n without importing school-selection internals or its own feature barrel.

#### Scenario: The carousel is the onboarding entry
- **WHEN** the onboarding flow is entered at `timecalendar-dev://onboarding`
- **THEN** page 1 is the welcome page and its title includes the literal string `TimeCalendar`
- **AND** swiping forward reveals agenda followed by notifications

#### Scenario: The onboarding feature remains presentation-only and focused
- **WHEN** `mobile/src/features/onboarding/` is inspected
- **THEN** its product implementation remains under the `ui/` sublayer
- **AND** it has no `data/`, `store/`, or `form/` sublayer
- **AND** the page catalog/rendering, native pager, controls, grouped indicator, and route-facing coordination are separated into cohesive modules with no materially over-200-line component

#### Scenario: The screen respects feature boundaries
- **WHEN** the carousel modules' imports and barrels are inspected
- **THEN** they use only shared/theme/router/i18n and declared image/symbol/pager/animation UI dependencies
- **AND** they do not import school-selection internals or their own feature barrel
- **AND** the existing `WelcomeScreen` exports remain compatible without exposing unused extracted internals

### Requirement: The welcome surface is accessible
Each page title SHALL be exposed as a heading through `ThemedText type="title"`; body text SHALL retain font scaling. Skip, Next, and the final CTA SHALL declare button roles, translated labels, and at least 44pt iOS / 48dp Android targets. The three visual indicator pills SHALL be grouped into one accessibility element labeled with the localized current/total page state and SHALL NOT be individually focusable. Decorative illustrations and symbols SHALL remain hidden from accessibility. When motion is allowed, the existing 300ms entrance fade and 150ms indicator-width transitions SHALL run through Reanimated rather than JavaScript-thread React Native `Animated` timing. The screen SHALL retain a live reduced-motion read and subscription; reduced motion SHALL schedule no decorative timing animation, SHALL snap entrance opacity and indicator widths to their final values, and SHALL use non-animated programmatic paging. Owned animations and the preference subscription SHALL be cleaned up across preference changes, rerenders, and unmounts.

#### Scenario: Every page exposes one heading
- **WHEN** assistive technology traverses any carousel page
- **THEN** that page's localized title is exposed as a heading
- **AND** the decorative illustration and forward symbol do not take focus

#### Scenario: Page indicator is one localized accessibility element
- **WHEN** the current page is 2 of 3
- **THEN** assistive technology encounters one indicator labeled with the localized equivalent of “Page 2 of 3”
- **AND** it does not encounter three focusable pills

#### Scenario: Controls meet accessibility contracts
- **WHEN** Skip, Next, or the final CTA renders
- **THEN** it has a translated accessibility label and button role
- **AND** its touch target meets the platform minimum

#### Scenario: Reduced motion schedules no decorative animation
- **WHEN** reduced motion is enabled before or during the screen lifetime
- **THEN** entrance opacity and indicator widths take their final values without a decorative timing animation
- **AND** Next calls `setPageWithoutAnimation` instead of `setPage`
- **AND** any already-running decorative animation is cancelled

#### Scenario: Normal motion remains smooth and bounded
- **WHEN** reduced motion is disabled and the screen enters or changes page
- **THEN** entrance opacity and indicator width reach the same final visual states through UI-thread Reanimated transitions
- **AND** owned transitions are cancelled on replacement or unmount

#### Scenario: Reduced-motion preference remains live
- **WHEN** the operating-system reduced-motion preference changes while the welcome screen is mounted
- **THEN** pager and decorative-motion behavior use the new value without remounting
- **AND** the preference listener is removed when the screen unmounts

### Requirement: The welcome surface is verified by an automated component test under the coverage gates
The colocated welcome-screen tests SHALL render through the real theme and i18n setup with the manual pager mock and supported Reanimated Jest setup. They SHALL verify every page's localized title/body, swipe and Next state changes, current-page indicator labels, Skip and final navigation, last-page control absence, accessibility grouping/labels, and both motion-enabled and reduced-motion behavior. Focused proofs SHALL cover live reduced-motion preference changes and cleanup without preserving expectations about React Native `Animated` calls. The complete mobile suite SHALL retain its configured global and logic coverage gates without lowering project thresholds.

#### Scenario: Page content and state transitions are covered
- **WHEN** the welcome-screen suite runs
- **THEN** it asserts all three localized page titles/bodies and indicator states
- **AND** it proves both native page-selection events and Next advance through the production state path

#### Scenario: Navigation and last-page controls are covered
- **WHEN** the suite activates Skip and the final CTA
- **THEN** each pushes `/onboarding/school`
- **AND** the suite proves Skip and Next are absent on the final page

#### Scenario: Accessibility behavior survives decomposition
- **WHEN** the extracted welcome modules render through the screen
- **THEN** page titles remain headings, controls retain translated labels and test IDs, and decorative descendants stay hidden
- **AND** the indicator remains one localized accessibility element

#### Scenario: Motion modes and cleanup remain green
- **WHEN** focused tests exercise initial preference resolution, a mid-screen preference change, rerender, and unmount
- **THEN** normal mode reaches final styles through Reanimated and reduced mode reaches them without decorative timing
- **AND** the native pager method, animation cancellation, and subscription cleanup match the active mode
- **AND** repository coverage thresholds are not weakened
