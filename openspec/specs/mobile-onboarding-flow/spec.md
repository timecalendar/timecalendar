# mobile-onboarding-flow Specification

## Purpose
TBD - created by archiving change add-mobile-onboarding-flow. Update Purpose after archive.
## Requirements
### Requirement: A native-default brand/welcome surface is the onboarding entry, in its own presentation-only feature folder
The app SHALL provide a three-page native onboarding carousel as the entry of the onboarding flow, implemented in the presentation-only `mobile/src/features/onboarding/ui/` sublayer with no `data/`, `store/`, or `form/` sublayer. Pages SHALL appear in the fixed order welcome → agenda → notifications and render the approved localized title/body plus mapped decorative illustration. The screen SHALL use React Native/shared components, `@/theme`, `expo-router`, `expo-image`, `expo-symbols`, `react-native-pager-view`, and i18n without importing school-selection internals or its own feature barrel.

#### Scenario: The carousel is the onboarding entry
- **WHEN** the onboarding flow is entered at `timecalendar-dev://onboarding`
- **THEN** page 1 is the welcome page and its title includes the literal string `TimeCalendar`
- **AND** swiping forward reveals agenda followed by notifications

#### Scenario: The onboarding feature remains presentation-only
- **WHEN** `mobile/src/features/onboarding/` is inspected
- **THEN** its product implementation remains under the `ui/` sublayer
- **AND** it has no `data/`, `store/`, or `form/` sublayer

#### Scenario: The screen respects feature boundaries
- **WHEN** the carousel screen's imports are inspected
- **THEN** it uses only the shared/theme/router/i18n and declared image/symbol/pager UI dependencies
- **AND** it does not import school-selection internals or its own feature barrel

### Requirement: The brand surface uses brand color with verified contrast
The carousel SHALL use the scheme-appropriate `background` as its screen surface and `backgroundElement` for each rounded illustration card. Titles and bodies SHALL use `text` and `textSecondary`. The brand `primary` token SHALL be limited to active/accent treatments (active indicator, Skip, and Next), while the final filled CTA SHALL use the documented `primaryStrong` background with `onPrimary` text. Inactive indicators SHALL use `backgroundSelected`. No raw color literal or Flutter gradient SHALL be added.

#### Scenario: Light and dark surfaces use verified token pairs
- **WHEN** any carousel page renders in light or dark mode
- **THEN** all screen, card, text, indicator, and action colors resolve from `@/theme`
- **AND** the final CTA uses the `primaryStrong`/`onPrimary` AA pair

#### Scenario: Flutter gradient is not ported
- **WHEN** the screen styles and dependencies are inspected
- **THEN** there is no coral-to-pink full-screen gradient or `expo-linear-gradient`
- **AND** pink appears only as an action or active-state accent

### Requirement: The onboarding Stack is welcome-first, with the school step at its own route
The nested onboarding Stack SHALL be ordered so the welcome surface is its entry: the entry route
(`mobile/src/app/onboarding/index.tsx`) SHALL re-export the welcome screen, the school-picker step
SHALL move to its own route (`mobile/src/app/onboarding/school.tsx`), and the group-picker step
(`mobile/src/app/onboarding/groups.tsx`) SHALL be unchanged. Each route SHALL remain a thin
entrypoint that only re-exports a feature `ui/` sub-barrel (the route-structure rule). The
`onboarding` group SHALL remain a `Stack` sibling of the `(tabs)` group in the root layout. The
development deep links SHALL be: `timecalendar-dev://onboarding` (welcome),
`timecalendar-dev://onboarding/school` (school step), and
`timecalendar-dev://onboarding/groups?schoolId=<id>` (group step).

#### Scenario: The welcome surface is the entry route
- **WHEN** `mobile/src/app/onboarding/index.tsx` is located
- **THEN** it re-exports the welcome screen from `@/features/onboarding/ui`
- **AND** it is a one-line thin route entrypoint

#### Scenario: The school step has its own route
- **WHEN** `mobile/src/app/onboarding/school.tsx` is located
- **THEN** it re-exports `SchoolPickerScreen` from `@/features/school-selection/ui`
- **AND** the school-picker screen implementation itself is unchanged

#### Scenario: The onboarding group remains a Stack sibling of the tabs
- **WHEN** the root layout declares its routes
- **THEN** `onboarding` is a `Stack` screen sibling of the `(tabs)` group
- **AND** its nested stack layout is unchanged

### Requirement: The welcome call-to-action navigates into the existing school step
The carousel SHALL expose Skip as a trailing top-bar text button on pages 1–2, Next as a trailing footer text button on pages 1–2, and a full-width filled final CTA on page 3. Skip and the final CTA SHALL push `/onboarding/school`. Next SHALL page forward through the native pager and SHALL use the non-animated pager method when reduced motion is enabled. Skip and Next SHALL be absent on the final page. The prior welcome QR and URL actions SHALL be removed from this screen without removing their routes or the school picker's iCal fallback.

#### Scenario: Skip opens the school step
- **WHEN** the user activates Skip on page 1 or 2
- **THEN** `/onboarding/school` is pushed

#### Scenario: Next advances one page
- **WHEN** the user activates Next on page 1 or 2
- **THEN** the pager advances exactly one page and the selected page state updates
- **AND** the final page hides Skip and Next

#### Scenario: Final CTA opens the school step
- **WHEN** the user activates `onboarding-welcome-cta` on the notifications page
- **THEN** `/onboarding/school` is pushed

#### Scenario: Downstream routes remain available
- **WHEN** the carousel entry controls are inspected
- **THEN** QR and URL controls are absent from the carousel
- **AND** `/onboarding/qr-scan`, the URL path, and school-to-group navigation remain unchanged and deep-linkable

### Requirement: Onboarding is reachable but not a hard startup gate
The onboarding flow SHALL be reachable from the Profile tab via an accessible entry control whose
target is the welcome surface (`/onboarding`), and via the development deep link. The app SHALL
NOT auto-route a first-run user into onboarding by gating first paint; the school-selection store's
derived onboarding-complete signal SHALL be left unchanged and available for the later step that
owns the startup gate.

#### Scenario: Onboarding is reachable from Profile
- **WHEN** the user activates the onboarding entry control on the Profile tab
- **THEN** the welcome surface is shown

#### Scenario: First launch is not force-gated into onboarding
- **WHEN** the app cold-launches with no school selected
- **THEN** the app does not auto-redirect first paint into the onboarding flow
- **AND** the onboarding-complete derivation in the school-selection store is unchanged

### Requirement: The welcome surface is accessible
Each page title SHALL be exposed as a heading through `ThemedText type="title"`; body text SHALL retain font scaling. Skip, Next, and the final CTA SHALL declare button roles, translated labels, and at least 44pt iOS / 48dp Android targets. The three visual indicator pills SHALL be grouped into one accessibility element labeled with the localized current/total page state and SHALL NOT be individually focusable. The existing 300ms entrance fade SHALL remain when motion is allowed; reduced motion SHALL snap entrance opacity, indicator widths, and programmatic page advancement to their final states.

#### Scenario: Every page exposes one heading
- **WHEN** assistive technology traverses any carousel page
- **THEN** that page's localized title is exposed as a heading
- **AND** the decorative illustration does not take focus

#### Scenario: Page indicator is one localized accessibility element
- **WHEN** the current page is 2 of 3
- **THEN** assistive technology encounters one indicator labeled with the localized equivalent of “Page 2 of 3”
- **AND** it does not encounter three focusable dots

#### Scenario: Controls meet accessibility contracts
- **WHEN** Skip, Next, or the final CTA renders
- **THEN** it has a translated accessibility label and button role
- **AND** its touch target meets the platform minimum

#### Scenario: Reduced motion snaps every programmatic animation
- **WHEN** reduced motion is enabled before or during the screen lifetime
- **THEN** entrance opacity and indicator widths take their final values without timing animation
- **AND** Next calls `setPageWithoutAnimation` instead of `setPage`

### Requirement: The welcome surface strings are fully localized (FR + EN)
Every user-facing string on the carousel SHALL use the approved flat translation keys under `onboarding.page.*`, `onboarding.skip`, `onboarding.skipLabel`, `onboarding.next`, `onboarding.nextLabel`, `onboarding.cta`, `onboarding.ctaLabel`, and `onboarding.pageIndicator`, with complete French and English catalog parity. The welcome title SHALL contain literal `TimeCalendar` in both locales. Every obsolete `onboarding.welcome.*` key SHALL be removed once it has no consumer.

#### Scenario: Approved copy resolves on every page
- **WHEN** the carousel renders in French or English
- **THEN** each page title/body and each visible/accessibility control string matches the approved catalog value
- **AND** the welcome title contains `TimeCalendar`

#### Scenario: Catalogs have parity and no dead welcome keys
- **WHEN** TypeScript and repository key searches run
- **THEN** French and English key sets are identical and every new key is a valid typed `t()` argument
- **AND** no obsolete `onboarding.welcome.*` key or call site remains

### Requirement: The welcome surface is verified by an automated component test under the coverage gates
The colocated welcome-screen test SHALL render through the real theme and i18n setup with the manual pager mock. It SHALL verify every page's localized title/body, swipe and Next state changes, current-page indicator labels, Skip and final navigation, last-page control absence, accessibility grouping/labels, and both motion-enabled and reduced-motion branches. The complete mobile suite SHALL retain its configured global and logic coverage gates, and the focused coverage report for `welcome-screen.tsx` SHALL show at least 90% branch coverage without lowering project thresholds.

#### Scenario: Page content and state transitions are covered
- **WHEN** the welcome-screen suite runs
- **THEN** it asserts all three localized page titles/bodies and indicator states
- **AND** it proves both native page-selection events and Next advance through the production state path

#### Scenario: Navigation and last-page controls are covered
- **WHEN** the suite activates Skip and the final CTA
- **THEN** each pushes `/onboarding/school`
- **AND** the suite proves Skip and Next are absent on the final page

#### Scenario: Motion branches and coverage remain green
- **WHEN** focused and full coverage commands run
- **THEN** the test distinguishes animated from snapping pager/indicator behavior and `welcome-screen.tsx` reaches at least 90% branch coverage
- **AND** the repository's configured coverage thresholds are not weakened

### Requirement: The Maestro onboarding flow proves welcome → call-to-action → live school read
`mobile/.maestro/onboarding.yaml` SHALL cold-launch the development variant, deep-link to `timecalendar-dev://onboarding`, assert a visible title containing `TimeCalendar`, activate `onboarding-next` twice, assert the localized notifications title, activate `onboarding-welcome-cta`, and retain the existing school-step, seeded live-read, and search assertions. The same flow SHALL run on iOS and Android without platform-specific page selectors.

#### Scenario: Maestro traverses all carousel pages before the live read
- **WHEN** the onboarding flow runs on iOS or Android
- **THEN** it asserts the welcome page, advances twice by `onboarding-next`, and asserts the notifications title
- **AND** the final CTA opens the school step

#### Scenario: Existing school round-trip proof remains intact
- **WHEN** the final CTA completes navigation
- **THEN** the flow retains the seeded school visibility and search assertions from the live `GET /schools` round trip
- **AND** it remains shared across both platforms

### Requirement: The onboarding carousel uses the platform-native pager with an off-device test seam
The onboarding screen SHALL use the Expo-compatible `react-native-pager-view` native dependency, backed by `UIPageViewController` on iOS and `ViewPager2` on Android. The dependency SHALL autolink without an `app.config.ts` plugin or new permission and SHALL be represented in the committed mobile package manifest and lockfile. Jest SHALL provide a manual mock that renders pager children in a React Native `View`, forwards a ref, exposes `setPage` and `setPageWithoutAnimation`, and emits page-selection events that exercise the production state path.

#### Scenario: Native pager dependency is installed without native configuration
- **WHEN** the mobile dependency and Expo configuration are inspected
- **THEN** the Expo-compatible `react-native-pager-view` version is committed in the manifest and lockfile
- **AND** no pager plugin or permission is added to `app.config.ts`

#### Scenario: Jest can drive imperative paging
- **WHEN** a component test invokes Next with motion enabled or reduced
- **THEN** the manual pager mock receives `setPage` or `setPageWithoutAnimation` respectively
- **AND** its emitted page-selection event updates the production indicator and controls

#### Scenario: Native fingerprint consequence is documented
- **WHEN** runtime and EAS guidance is read after the dependency lands
- **THEN** it states that the pager changes the native fingerprint and requires fresh development/EAS binaries
- **AND** no EAS or CI workflow configuration is changed

### Requirement: Legacy illustrations are copied as immutable decorative assets
The three Flutter PNGs SHALL be copied byte-for-byte into `mobile/assets/images/onboarding/` with the mapping `schools.png` → `welcome.png`, `home.png` → `agenda.png`, and `notifications.png` → `notifications.png`. The React Native screen SHALL render each through `expo-image` with `contentFit="contain"`, mark it decorative and inaccessible, and place it inside a rounded `backgroundElement` card. The legacy `app/` files SHALL NOT be modified.

#### Scenario: Assets retain the approved mapping
- **WHEN** the three carousel pages render
- **THEN** welcome uses the copied schools image, agenda uses the copied home image, and notifications uses the copied notifications image
- **AND** each copy matches its legacy source bytes

#### Scenario: Illustration is decorative and scheme-safe
- **WHEN** assistive technology traverses a page in light or dark mode
- **THEN** the illustration is excluded from focus and has no alternative text
- **AND** the page heading/body convey its meaning while the image sits on a tokenized neutral card

