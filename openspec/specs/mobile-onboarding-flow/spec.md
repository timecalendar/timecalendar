# mobile-onboarding-flow Specification

## Purpose
TBD - created by archiving change add-mobile-onboarding-flow. Update Purpose after archive.
## Requirements
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
SHALL live at its own route (`mobile/src/app/onboarding/school.tsx`), and the group-picker step
(`mobile/src/app/onboarding/groups.tsx`) SHALL remain registered and deep-linkable even though it is
no longer on the normal import path (its removal is a separate cleanup). The Stack SHALL additionally
register the import-journey steps as routes: `institution-name`, `programme`, `connect`, and
`import`. Each route SHALL remain a thin entrypoint that only re-exports a feature `ui/` sub-barrel
(the route-structure rule). The onboarding Stack layout SHALL mount the ephemeral import-draft
provider around the nested `Stack`, so every route in the group — including the `qr-scan` and
`ical-url` siblings — can read the draft, and the draft's lifetime is the Stack's. The `onboarding`
group SHALL remain a `Stack` sibling of the `(tabs)` group in the root layout. The development deep
links SHALL be: `timecalendar-dev://onboarding` (welcome),
`timecalendar-dev://onboarding/school` (school step),
`timecalendar-dev://onboarding/institution-name` (unlisted institution step),
`timecalendar-dev://onboarding/programme` (programme step),
`timecalendar-dev://onboarding/connect` (Connect step),
`timecalendar-dev://onboarding/import` (manual import step), and
`timecalendar-dev://onboarding/groups?schoolId=<id>` (the retained group step).

#### Scenario: The welcome surface is the entry route
- **WHEN** `mobile/src/app/onboarding/index.tsx` is located
- **THEN** it re-exports the welcome screen from `@/features/onboarding/ui`
- **AND** it is a one-line thin route entrypoint

#### Scenario: The school step has its own route
- **WHEN** `mobile/src/app/onboarding/school.tsx` is located
- **THEN** it re-exports `SchoolPickerScreen` from `@/features/school-selection/ui`

#### Scenario: The journey steps are thin routes over the onboarding feature
- **WHEN** the `institution-name`, `programme`, `connect` and `import` routes are located
- **THEN** each is a one-line re-export from `@/features/onboarding/ui`
- **AND** each screen's colocated test lives beside the screen, outside `src/app/`

#### Scenario: The layout mounts the import-draft provider
- **WHEN** `mobile/src/app/onboarding/_layout.tsx` is inspected
- **THEN** it wraps the nested `Stack` in the import-draft provider
- **AND** the draft is discarded when the Stack is dismissed

#### Scenario: The onboarding group remains a Stack sibling of the tabs
- **WHEN** the root layout declares its routes
- **THEN** `onboarding` is a `Stack` screen sibling of the `(tabs)` group

#### Scenario: The group step remains registered but off the normal path
- **WHEN** the school step is used normally
- **THEN** no navigation reaches the group step
- **AND** `timecalendar-dev://onboarding/groups?schoolId=<id>` still resolves to it

### Requirement: The welcome call-to-action navigates into the existing school step
The carousel SHALL expose Skip as a trailing top-bar text button on pages 1–2, Next as a trailing footer text button on pages 1–2, and a full-width filled final CTA on page 3. Skip and the final CTA SHALL push `/onboarding/school`. Next SHALL page forward through the native pager and SHALL use the non-animated pager method when reduced motion is enabled. Skip and Next SHALL be absent on the final page. The prior welcome QR and URL actions SHALL be removed from this screen without removing their routes or the school picker's iCal fallback. The QR and iCal-URL routes SHALL remain deep-linkable Stack siblings, now reached on the normal path from the manual-import step rather than from this screen. The group route SHALL remain registered and dev-deep-linkable but SHALL be reached by no navigation.

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
- **AND** `/onboarding/qr-scan` and the iCal-URL route stay deep-linkable and are reached on the normal path from the manual-import step
- **AND** the group route stays registered and dev-deep-linkable while no navigation reaches it

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

### Requirement: The Maestro onboarding flow proves welcome → call-to-action → live school read
`mobile/.maestro/onboarding.yaml` SHALL cold-launch the development variant, deep-link to `timecalendar-dev://onboarding`, assert a visible title containing `TimeCalendar`, activate `onboarding-next` twice, assert the localized notifications title, activate `onboarding-welcome-cta`, and retain the existing school-step, seeded live-read, and search assertions. It SHALL then tap the seeded school row and assert the programme step opens, so the corrected school → import-journey navigation is proven on device and not only in Jest. The flow SHALL stop there: the steps below the programme step stay Jest-proven, and the camera and live-import steps SHALL NOT be driven. The same flow SHALL run on iOS and Android without platform-specific page selectors.

#### Scenario: Maestro traverses all carousel pages before the live read
- **WHEN** the onboarding flow runs on iOS or Android
- **THEN** it asserts the welcome page, advances twice by `onboarding-next`, and asserts the notifications title
- **AND** the final CTA opens the school step

#### Scenario: Existing school round-trip proof remains intact
- **WHEN** the final CTA completes navigation
- **THEN** the flow retains the seeded school visibility and search assertions from the live `GET /schools` round trip
- **AND** it remains shared across both platforms

#### Scenario: The flow proves the school row enters the import journey
- **WHEN** the flow taps the seeded school row after the search assertions
- **THEN** it asserts the programme step is visible
- **AND** it drives nothing below the programme step

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

### Requirement: Onboarding presentation adapts to its measured portrait width
The onboarding welcome, connect, institution-name, programme, and manual-import screens SHALL use
the shared measured responsive lanes while preserving their existing sequence, validation,
keyboard, safe-area, accessibility, and navigation behavior.

#### Scenario: Welcome remains usable on a compact screen
- **WHEN** the welcome composition is measured at 390 points
- **THEN** page content and action content each retain one compact responsive gutter
- **AND** their usable width is not reduced by a second outer content lane

#### Scenario: Welcome content remains balanced on a tablet
- **WHEN** the welcome composition is measured at tablet width
- **THEN** page copy, illustrations, and actions remain centered within their readable caps
- **AND** the pager order, indicator, Skip, Next, and final action behavior remain unchanged

#### Scenario: Onboarding forms use readable lanes
- **WHEN** a connect, institution-name, programme, or manual-import step is presented at tablet width
- **THEN** its one-column content is centered in a measured readable lane
- **AND** its current safe-area, keyboard, validation, and navigation owners remain in place

### Requirement: Ordinary onboarding pushes use compact native chrome and shared page rhythm

The nested onboarding Stack SHALL reuse the shared compact Stack options for every ordinary pushed child while the root `onboarding` container remains headerless. The branded carousel at `onboarding/index` SHALL remain headerless. School, institution-name, programme, connect, manual import, QR scan, iCal URL, and the retained off-path groups route SHALL show a localized compact native title and minimal chevron-only back affordance. Their ordinary content SHALL use the shared root-page rhythm without changing the welcome carousel, import-draft provider lifetime, deep links, journey order, input/keyboard behavior, camera behavior, or completion/dismissal behavior.

#### Scenario: Welcome remains a branded exception

- **WHEN** the onboarding entry route renders
- **THEN** the native nested header is hidden and the three-page brand carousel retains its own top controls, page headings, and safe-area composition
- **AND** pushing School transitions to a visible compact native header

#### Scenario: Import journey titles move into native chrome

- **WHEN** institution-name, programme, connect, manual import, iCal URL, QR permission, or groups content renders
- **THEN** its localized route title appears in native chrome and is not repeated as an oversized content heading
- **AND** any helper copy renders as caption content at the shared spacing below the header

#### Scenario: School and Programme actions survive inherited chrome

- **WHEN** School opens from calendar management or Programme renders its Skip action
- **THEN** School keeps its platform-specific dismissing chevron and native search configuration, and Programme keeps its iOS native or Android header Skip action
- **AND** both screens display their localized compact title instead of a blank header title

#### Scenario: QR camera retains full-bleed content

- **WHEN** QR permission is granted and the scanner phase renders
- **THEN** the localized compact header and back affordance remain visible
- **AND** the camera, viewfinder overlay, scan callbacks, failure recovery, and accessibility labels remain owned by the QR feature below the header

### Requirement: Programme uses the shared primary action and keyboard-safe owner
The programme step SHALL compose one shared `KeyboardSafeActionLayout` inside the readable root-page safe-area surface. Its intro, field, and validation error SHALL remain in the sole scrollable body, while Continue SHALL use `PrimaryAction` in a sibling region pinned immediately above the focused keyboard. Continue SHALL use `primaryStrong`/`onPrimary`, the 44-point iOS or 48-dp Android minimum, the existing localized label and `onboarding-programme-continue` selector, and disabled accessibility state while the normalized name is empty.

The iOS native header Skip item and Android header Skip control SHALL retain their current platform placement, localized labels, target semantics, and selector. Name normalization, length validation, draft writes, Return-key submission, Skip's empty-name behavior, Continue navigation, route order, and existing selectors SHALL remain unchanged.

#### Scenario: Programme action stays above the iOS keyboard
- **WHEN** the programme field is focused on iOS
- **THEN** padding-based keyboard avoidance keeps Continue immediately above the keyboard in a sibling action region
- **AND** the intro, field, and error remain reachable in the sole scroll owner

#### Scenario: Programme action stays above the Android keyboard
- **WHEN** the programme field is focused on Android
- **THEN** height-based keyboard avoidance keeps Continue immediately above the keyboard in a sibling action region
- **AND** the intro, field, and error remain reachable in the sole scroll owner

#### Scenario: Empty programme preserves Skip as the only advance path
- **WHEN** the normalized programme name is empty
- **THEN** Continue is disabled with accessible disabled state
- **AND** the platform-native Skip action remains enabled and advances with an empty programme name

#### Scenario: Valid programme preserves draft navigation
- **WHEN** the user enters a valid programme and activates Continue or the keyboard action
- **THEN** the normalized name is written to the existing import draft and the journey advances to Connect with unchanged route and selectors

### Requirement: Institution gates lead into the mandatory export guide
The onboarding import path SHALL derive its next legal step from the current draft and the listed
school's server-owned export-guide reference. A listed institution SHALL show Programme only when
`requireProgramme` is true, otherwise storing an empty calendar name. It SHALL show Connect only
when `requireConnect` is true and `safeIntranetUrl` accepts the URL. Missing or unsafe required
Connect URLs SHALL be skipped with a sanitized configuration diagnostic. An unlisted institution
SHALL always show the existing skippable Programme step, never Connect, and proceed to provider
selection. Every path SHALL complete a guide before the existing manual selector.

#### Scenario: Listed gate matrix is preserved
- **WHEN** a listed school's Programme and Connect flags are exercised in every combination
- **THEN** only enabled legal gates are pushed in order before exact-version guide resolution
- **AND** `requireProgramme: false` stores an empty calendar name rather than inventing one

#### Scenario: Required Connect URL is unsafe or absent
- **WHEN** `requireConnect` is true but the listed URL is missing or fails `safeIntranetUrl`
- **THEN** Connect is skipped and guide resolution remains the next step
- **AND** the diagnostic contains only missing/unsafe reason and validated provider slug

#### Scenario: Unlisted path uses provider selection
- **WHEN** an unlisted institution continues or skips Programme
- **THEN** it opens provider selection without rendering Connect
- **AND** completing the chosen guide is required before manual import

### Requirement: Existing calendar creation remains behind the completed guide
The existing manual selector, QR scanner, iCal URL form, and calendar-create derivation SHALL retain
their successful behavior after a valid current guide completion. They SHALL not create or submit
before the protected-route guard succeeds, and leaving/restarting onboarding SHALL remove the proof
needed to reach them.

#### Scenario: Completed guide preserves QR creation
- **WHEN** a student completes the current guide, selects QR, and imports a valid token
- **THEN** the existing create flow receives the current listed or unlisted create fields
- **AND** its success behavior is unchanged

#### Scenario: Completed guide preserves iCal creation
- **WHEN** a student completes the current guide, selects iCal URL, and submits a valid URL
- **THEN** the existing create flow receives the current listed or unlisted create fields
- **AND** its validation, failure switching, and success behavior are unchanged

#### Scenario: Process death restarts onboarding
- **WHEN** the process dies with manual, QR, or iCal in restored route history
- **THEN** no calendar create action is enabled from that history
- **AND** recovery starts at School because the ephemeral draft and completion no longer exist

