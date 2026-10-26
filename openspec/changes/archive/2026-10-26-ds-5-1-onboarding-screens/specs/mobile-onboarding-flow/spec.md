# Spec Delta

## MODIFIED Requirements

### Requirement: The brand surface uses brand color with verified contrast
The carousel SHALL use the scheme-appropriate `background` as its screen surface and `backgroundElement` for each rounded illustration card. Titles SHALL use the primary text tone (`text`) and bodies the secondary tone (`textSecondary`), both through the text tone rather than a raw theme-color prop. The brand `primary` token SHALL be limited to the active indicator. Skip and Next SHALL be text buttons whose labels use `actionText`, and the final filled CTA SHALL use the documented `primaryStrong` background with `onPrimary` text. Inactive indicators SHALL use `backgroundSelected`. No raw color literal or Flutter gradient SHALL be added.

#### Scenario: Light and dark surfaces use verified token pairs
- **WHEN** any carousel page renders in light or dark mode
- **THEN** all screen, card, text, indicator, and action colors resolve from `@/theme`
- **AND** the final CTA uses the `primaryStrong`/`onPrimary` AA pair

#### Scenario: Brand-colored labels meet body contrast
- **WHEN** Skip or Next renders in the light scheme
- **THEN** its label color is `actionText`, not `primary`

#### Scenario: Body copy uses the secondary tone
- **WHEN** any carousel page body renders
- **THEN** its color is the scheme's `textSecondary`

#### Scenario: Flutter gradient is not ported
- **WHEN** the screen styles and dependencies are inspected
- **THEN** there is no coral-to-pink full-screen gradient or `expo-linear-gradient`
- **AND** pink appears only as an action or active-state accent

### Requirement: The welcome surface is accessible
Each page title SHALL be exposed as a heading through `ThemedText type="title"`; body text SHALL retain font scaling. Skip, Next, and the final CTA SHALL declare button roles, translated labels, and at least 44pt iOS / 48dp Android targets. The bar holding Skip SHALL be at least the platform touch target plus 16 points tall and SHALL grow with its content at large text sizes rather than clip it. Page titles, page bodies, Skip and Next SHALL wrap at large text sizes rather than truncate, shrink or clip, and each page SHALL scroll when its content outgrows the pager. The three visual indicator pills SHALL be grouped into one accessibility element labeled with the localized current/total page state and SHALL NOT be individually focusable. Decorative illustrations and symbols SHALL remain hidden from accessibility. When motion is allowed, the entrance fade SHALL take the shared `base` motion duration (250 ms) and the indicator-width transition the shared `fast` duration (150 ms), both through Reanimated rather than JavaScript-thread React Native `Animated` timing. The screen SHALL retain a live reduced-motion read and subscription; reduced motion SHALL schedule no decorative timing animation, SHALL snap entrance opacity and indicator widths to their final values, and SHALL use non-animated programmatic paging. Owned animations and the preference subscription SHALL be cleaned up across preference changes, rerenders, and unmounts.

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

#### Scenario: The Skip bar grows with the text
- **WHEN** the welcome screen renders on either platform
- **THEN** the Skip bar declares a minimum height of the platform touch target plus 16 points and no fixed height

#### Scenario: Welcome labels wrap at accessibility text sizes
- **WHEN** the welcome screen launches at the largest accessibility text size
- **THEN** each page title, page body, Skip and Next label wraps onto further lines instead of truncating or clipping
- **AND** none of them sets a one-line cap or shrink-to-fit

#### Scenario: Reduced motion schedules no decorative animation
- **WHEN** reduced motion is enabled before or during the screen lifetime
- **THEN** entrance opacity and indicator widths take their final values without a decorative timing animation
- **AND** Next calls `setPageWithoutAnimation` instead of `setPage`
- **AND** any already-running decorative animation is cancelled

#### Scenario: Normal motion remains smooth and bounded
- **WHEN** reduced motion is disabled and the screen enters or changes page
- **THEN** entrance opacity reaches its final value over the shared `base` duration and indicator width over the shared `fast` duration through UI-thread Reanimated transitions
- **AND** owned transitions are cancelled on replacement or unmount

#### Scenario: Reduced-motion preference remains live
- **WHEN** the operating-system reduced-motion preference changes while the welcome screen is mounted
- **THEN** pager and decorative-motion behavior use the new value without remounting
- **AND** the preference listener is removed when the screen unmounts
