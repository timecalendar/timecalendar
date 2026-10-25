# mobile-a11y Specification

## Purpose
Defines the React Native app's accessibility system: the heading-semantics
component contract encoded in `ThemedText`, the meaningful semantics every
surviving screen must expose, the live `react-native-a11y` + `i18next` lint
rules that stay enforced, the CI proof that the accessibility tree resolves,
and the runtime posture (Dynamic Type, touch targets, screen-reader passes,
reduced motion, contrast) recorded where lint cannot enforce it.

## Requirements

### Requirement: Heading semantics encoded in the text component
The shared `ThemedText` component SHALL map its heading ramp steps (`type="largeTitle"`, `type="title"`, `type="title2"` and `type="sectionTitle"`, plus the `subtitle` alias that resolves to `sectionTitle`) to `accessibilityRole="header"`, so that titles are exposed to assistive technologies (VoiceOver/TalkBack) as headings without each call site declaring the role by hand. Every other accepted `type` SHALL carry no header role. The role for each accepted `type` SHALL be declared in an exhaustive typed record, so a variant added without a role decision fails `tsc`. A caller-supplied `accessibilityRole` SHALL take precedence over the defaulted header role.

#### Scenario: Title renders as a heading
- **WHEN** a `ThemedText` with `type` set to `largeTitle`, `title`, `title2`, `sectionTitle` or `subtitle` renders
- **THEN** its node exposes `accessibilityRole="header"` in the accessibility tree

#### Scenario: Non-title text is not a heading
- **WHEN** a `ThemedText` with the default `type` or any of `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall`, `default`, `small`, `smallBold` renders
- **THEN** its node does not carry the header role

#### Scenario: Explicit role wins
- **WHEN** a `ThemedText` with a heading `type` is also given an explicit `accessibilityRole`
- **THEN** the caller-supplied role is used, not the defaulted header role

#### Scenario: A new variant needs a role decision
- **WHEN** a developer adds a member to the accepted `type` union without adding it to the heading-role record
- **THEN** `npx tsc --noEmit` fails

### Requirement: Skeleton screens expose meaningful semantics
Every surviving skeleton screen SHALL expose correct, meaningful accessibility semantics: screen titles SHALL be headings, and transient async states (loading, error) SHALL be conveyed to assistive technology as status rather than rendered as unlabeled text. No interactive control SHALL be introduced solely to exercise the lint rules.

#### Scenario: Schools screen title is a heading
- **WHEN** the schools screen renders its title
- **THEN** the title node carries the header role

#### Scenario: Async status is accessible
- **WHEN** the schools screen is in its loading or error state
- **THEN** the status text is readable by assistive technology as a status message, not a silent or unlabeled node

### Requirement: Accessibility lint rules remain enforced
The `react-native-a11y` rules (`has-accessibility-props`, `has-valid-accessibility-descriptors`, `has-valid-accessibility-role`, `no-nested-touchables`) SHALL remain active as errors, and the `i18next/no-literal-string` rule SHALL continue to cover `accessibilityLabel` and `accessibilityHint` so accessibility copy is translated. `npm run lint` SHALL pass with zero warnings. These rules are unexercised while the skeleton has no interactive control; the first interactive control SHALL be their first live test.

#### Scenario: A touchable without a11y props is rejected
- **WHEN** a developer adds a touchable/pressable with no accessibility role and no label+hint
- **THEN** the lint rule reports an error and CI fails

#### Scenario: Untranslated accessibility copy is rejected
- **WHEN** a developer passes a literal string to `accessibilityLabel` or `accessibilityHint` instead of a `t()` call
- **THEN** the `i18next/no-literal-string` rule reports an error

### Requirement: Accessibility wiring is verified by an automated test
The unit test suite SHALL include a test that renders a component through the real accessibility tree and asserts that an accessibility role/semantic resolves (not merely that a prop was passed), so the heading contract is proven in CI rather than only configured.

#### Scenario: Header role resolves in the rendered tree
- **WHEN** the a11y proof test renders a title-bearing component under the default locale
- **THEN** querying the accessibility tree by the `header` role finds the title node

### Requirement: Runtime accessibility posture recorded where lint cannot enforce it
The Architecture Book SHALL record, as prose, the accessibility concerns that cannot be encoded as a lint rule — touch-target minimums, meaningful-label review, manual screen-reader passes, reduced motion, and color contrast at the call site — each stating why it is not a lint rule and which step or artifact owns it. Font scaling SHALL be listed with the lint-enforced rules: disabling it is a lint error, and the Book SHALL record that `maxFontSizeMultiplier` caps are allowed and where the existing caps live.

#### Scenario: Book documents the non-encodable rules
- **WHEN** a developer reads the Architecture Book a11y section
- **THEN** it lists what the live lint rules enforce and where they bite, the heading-role component contract, and each non-encodable concern with its reason and owner

#### Scenario: Font scaling is not disabled
- **WHEN** a developer renders user-facing text with `allowFontScaling={false}`
- **THEN** lint fails, so text always scales with the OS font size

### Requirement: Small brand-colored text meets the AA body-text contrast floor

Text labels rendered below the WCAG large-text size in the brand color SHALL use the `actionText` tone, which meets the 4.5:1 body-text floor against the page background in both schemes. The bright `primary` identity tone (4.35:1 on white in light mode) SHALL NOT color small text. Large glyphs, fills, and non-text UI may keep `primary`, which meets the 3:1 floor.

#### Scenario: Small brand text action uses actionText

- **WHEN** a small bold brand-colored text action (onboarding Skip and Next, onboarding Connect Back, Home upcoming "See all", hidden-events Unhide, event-checklist Add, export-guide page visible Back) renders in light mode
- **THEN** its text color is the light `actionText` value, not the light `primary` value

#### Scenario: Dark mode is unchanged

- **WHEN** the same labels render in dark mode
- **THEN** their text color is the dark `actionText` value, which equals the dark brand tone already in use

#### Scenario: Large brand glyphs are out of the rule

- **WHEN** the school logo monogram fallback renders its large letter
- **THEN** it may keep the `primary` tone

### Requirement: Icons follow an explicit text-scaling contract

Every symbol icon in the app SHALL declare whether it scales with text. An icon beside or inside a text control SHALL grow with the OS text size (optionally up to the same cap as its neighbor text), and its container SHALL grow with it. A standalone chrome icon SHALL keep its design size at every text size. On both platforms no icon glyph SHALL be clipped by its own box at any text size, including Android font scale 2.0. Icons SHALL be hidden from assistive technology; the control that contains an icon owns its accessible name.

#### Scenario: A text-adjacent icon grows with the font scale

- **WHEN** an icon declared as text-scaled with size 20 renders at font scale 2.0
- **THEN** its glyph and its box both measure 40

#### Scenario: A text-adjacent icon honors its neighbor's cap

- **WHEN** a text-scaled icon with size 12 and a cap of 1.2 renders at font scale 2.0
- **THEN** its glyph and its box both measure 14.4

#### Scenario: A chrome icon keeps its size

- **WHEN** an icon declared as fixed with size 24 renders at font scale 2.0 or 0.8
- **THEN** its glyph and its box both measure 24 and the glyph does not scale with the OS font size

#### Scenario: A row chevron stays a cue

- **WHEN** the school row's text-scaled chevron renders at iOS AX5
- **THEN** it grows at most 2× its design size

#### Scenario: Icons are decorative

- **WHEN** any icon renders on either platform
- **THEN** the icon is not an accessibility element and is not announced

#### Scenario: Every Android glyph resolves to the Material Symbols codepoint

- **WHEN** the app's Android glyph table is compared with the Material Symbols font table
- **THEN** every glyph name maps to the same codepoint in both

### Requirement: Accessibility text sizes are detected through one threshold

The app SHALL treat a text size as an accessibility size when the OS font scale is at or above the iOS accessibility-medium multiplier (1.786), on both platforms, through one shared detection used by every layout that changes shape at accessibility sizes. The detection SHALL follow a live text-size change without a restart.

#### Scenario: Threshold boundaries

- **WHEN** the font scale is 1.353 (iOS xxxLarge)
- **THEN** the text size is not an accessibility size
- **AND** at 1.786 and above it is an accessibility size

### Requirement: Unbreakable brand text caps its scale

Text whose content includes the one-word brand name "TimeCalendar" SHALL cap its font scale at 1.5, so the word never breaks inside itself at the largest text sizes. The cap SHALL come from one shared theme value and SHALL apply only to that brand text.

#### Scenario: The brand word stays whole at the largest size

- **WHEN** the Home app name or an onboarding page title renders at iOS AX5 or Android font scale 2.0
- **THEN** its font scale multiplier is capped at 1.5
