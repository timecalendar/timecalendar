# mobile-theming Specification

## Purpose
TBD - created by archiving change add-mobile-theming. Update Purpose after archive.

## Requirements

### Requirement: Design tokens live in a single typed theme layer
The mobile app SHALL define its design tokens — colors (light and dark), spacing, radii, and
typography — as typed constants in a single `src/theme/` module, which SHALL be the only source
of these values for application code. Tokens SHALL be plain TypeScript constants requiring no
styling runtime, so that a missing or mistyped token reference is a `tsc` error.

#### Scenario: Components consume tokens from the theme layer
- **WHEN** a component needs a color, spacing, radius, or typographic value
- **THEN** it obtains it from `@/theme` (directly or via `useTheme`)
- **AND** it does not redeclare its own copy of those values

#### Scenario: Mistyped token is a type error
- **WHEN** code references a token key that does not exist in the theme layer
- **THEN** `npx tsc --noEmit` fails

### Requirement: Light and dark resolution through the theme layer
The theme layer SHALL resolve colors for the current device color scheme (light or dark) via
the app's single `useColorScheme` wrapper (`@/hooks/use-color-scheme`), and SHALL expose this
through `useTheme`. The same wrapper SHALL be the scheme source for the root layout as well, so
there is exactly one color-scheme source. The app SHALL follow the device color scheme; it SHALL
NOT provide an in-app theme override at this step.

#### Scenario: Token resolves to the scheme-appropriate value
- **WHEN** `useTheme` is read under a light device color scheme
- **THEN** it returns the light value for a given color token
- **WHEN** it is read under a dark device color scheme
- **THEN** it returns the dark value for that same token

#### Scenario: The layout and the theme layer share one scheme source
- **WHEN** the root layout and `useTheme` each resolve the color scheme
- **THEN** both read it from `@/hooks/use-color-scheme`

### Requirement: The ThemedText heading-role contract is preserved
Changes to the themed components SHALL NOT break the accessibility heading-role contract established for `ThemedText`: the heading ramp steps (`largeTitle`, `title`, `title2`, `sectionTitle`) and the `subtitle` alias SHALL expose `accessibilityRole="header"`, a caller-supplied `accessibilityRole` SHALL still win, and every other accepted `type` SHALL carry no header role.

#### Scenario: Title and subtitle remain headings after the token-source change
- **WHEN** a `ThemedText` with a heading `type` is rendered
- **THEN** the rendered accessibility tree exposes a node with the `header` role
- **AND** the default variant exposes no header role
- **AND** an explicit `accessibilityRole` on the element overrides the header default

### Requirement: Native-chrome alpha APIs are accessed only through our own wrappers
The app SHALL access the alpha native-chrome APIs — Expo Router native tabs
(`expo-router/unstable-native-tabs`), `expo-glass-effect`, and `@expo/ui` — exclusively through
its own wrapper modules under `src/components/chrome/`, so that these churning APIs are isolated
behind a single swappable seam. Route and feature code SHALL NOT import these APIs directly.

#### Scenario: Tab bar uses the chrome wrapper, not the alpha API directly
- **WHEN** the app renders its native tab bar
- **THEN** it does so through the `src/components/chrome/` native-tabs wrapper
- **AND** the tab-bar code does not import `expo-router/unstable-native-tabs` directly

#### Scenario: A consumer reaching for an alpha API directly is rejected
- **WHEN** a file outside `src/components/chrome/` imports `expo-router/unstable-native-tabs`,
  `expo-glass-effect`, or `@expo/ui` (or a subpath)
- **THEN** `npm run lint` fails with the boundary message

### Requirement: The Liquid Glass degradation decision is centralized in one wrapper
The glass-effect wrapper SHALL be the single place that decides, at runtime, between Liquid
Glass and the non-glass fallback, per the recorded degradation baseline (iOS 26+ → Liquid
Glass; iOS 16.4–25 and Android → a plain themed view). Consumers SHALL request a glass surface
without themselves branching on platform or OS version.

#### Scenario: Glass renders on a supporting platform
- **WHEN** the glass wrapper renders on a build where Liquid Glass is available
- **THEN** it renders the native glass surface

#### Scenario: Fallback renders where glass is unavailable
- **WHEN** the glass wrapper renders where Liquid Glass is unavailable (e.g. iOS below 26,
  Android, or the test environment)
- **THEN** it renders a plain themed view containing the same children
- **AND** it does not throw

### Requirement: Theme tokens document WCAG-AA contrast pairs
The theme layer SHALL document its foreground/background color **pairs** for both light and dark
schemes, and each documented pair SHALL meet WCAG AA contrast. This SHALL include the pairs
introduced by the brand `primary` token: where white text is drawn on a brand fill, the
documented pair SHALL use a brand tone that meets the 4.5:1 body-text threshold (the bright
identity pink, whose white-on-fill ratio is below 4.5:1, SHALL NOT be used as a white-text body
surface); where the brand color is used as a tint/accent on a neutral background, the documented
pair SHALL meet at least the 3:1 large-text / UI-component threshold; the dark-scheme brand tone
SHALL meet 4.5:1 on the dark background. Every opaque documented pair SHALL be checked by an
automated test that computes its WCAG relative-luminance contrast ratio and fails when the pair
falls below its stated floor (4.5:1 body text, 3:1 large text or UI component). Each ratio written
in the documentation SHALL be the computed value. The Definition of Done's manual color-contrast
review SHALL still check that rendered screens draw only documented pairs, because which token a
call site places on which surface cannot be checked statically.

#### Scenario: A token pair is contrast-documented
- **WHEN** a foreground token is intended to be drawn on a given background token
- **THEN** that pairing is recorded in the theme layer's documented contrast pairs
- **AND** the pairing meets WCAG AA in both light and dark schemes

#### Scenario: White text on a brand surface uses an AA-passing tone
- **WHEN** white text is to be drawn on the brand color
- **THEN** the documented pair uses a brand tone whose white-on-fill ratio is at least 4.5:1
- **AND** the bright identity pink (white-on-fill below 4.5:1) is not used for white body text

#### Scenario: A pair below its floor fails CI
- **WHEN** a token value changes so that a documented pair falls below its floor
- **THEN** the theme test fails and CI is red

### Requirement: Theming wiring is verified by an automated test
The unit test suite SHALL include a test that asserts a token (including the brand `primary`
token) resolves through `useTheme` to the expected value under both light and dark color
schemes, that the navigation theme maps its `background` and `primary` colors to the
scheme-appropriate theme tokens, and that the glass-surface wrapper renders its children
(exercising the fallback path in the test environment). Visual correctness on-device — actual
Liquid Glass, fallback appearance, and contrast legibility — is an explicitly manual review,
not a CI gate.

#### Scenario: Proof test covers token resolution, nav-theme mapping, and wrapper render
- **WHEN** the theming proof test runs
- **THEN** it asserts a token (including `primary`) resolves to its light value under a light
  scheme and its dark value under a dark scheme
- **AND** it asserts the navigation theme's `background` and `primary` equal the
  scheme-appropriate tokens
- **AND** it asserts the glass-surface wrapper renders its children without throwing

### Requirement: The theme layer defines a brand color token
The theme layer SHALL define a `primary` brand color token for both the light and dark
schemes, adopting the product brand **hue** (pink, aligned to the Flutter app's
`Colors.pink` identity) — NOT a port of the Flutter Material theme. The brand token
SHALL be a member of the typed token surface so that referencing it follows the same
`tsc`-checked discipline as every other token, and SHALL be the single source application
code uses for the brand color.

#### Scenario: Brand token resolves per scheme
- **WHEN** `useTheme` is read under a light device color scheme
- **THEN** it returns the light brand value for the `primary` token
- **WHEN** it is read under a dark device color scheme
- **THEN** it returns the dark brand value for that token

#### Scenario: Brand color is taken as hue, not Material specifics
- **WHEN** the brand token is adopted from the Flutter app's pink identity
- **THEN** only the hue and neutral intent are adopted
- **AND** no Flutter Material widget theming (app-bar, FAB, switch, custom font) is ported

### Requirement: The React Navigation theme is built from theme tokens
The app SHALL construct the React Navigation theme it passes to `ThemeProvider` from
`@/theme` tokens for both light and dark schemes, rather than using stock React
Navigation `DefaultTheme` / `DarkTheme` unmodified. At minimum the navigation
`colors.background`, `colors.card`, `colors.text`, `colors.border`, and `colors.primary`
SHALL be sourced from the theme tokens, so navigation chrome cannot drift from the token
palette.

#### Scenario: Navigation colors follow the tokens per scheme
- **WHEN** the navigation theme is resolved for the light scheme
- **THEN** its `background` and `primary` colors equal the corresponding light theme tokens
- **WHEN** it is resolved for the dark scheme
- **THEN** its `background` and `primary` colors equal the corresponding dark theme tokens

#### Scenario: Navigation theme keeps the full color set
- **WHEN** the navigation theme is built by overriding tokens onto the stock theme
- **THEN** the result is a complete React Navigation theme (the keys not tokenized retain
  their stock values)
- **AND** `npx tsc --noEmit` accepts it as a valid navigation theme

### Requirement: The app uses a single color-scheme source
The app SHALL resolve the device color scheme through exactly one seam — the
`@/hooks/use-color-scheme` wrapper — consumed by both `useTheme` and the root layout.
Application code SHALL NOT read the device color scheme directly from `react-native` in
more than this one seam, so that the in-app override (Settings) has a single place
to intercept. This SHALL be enforced by lint: importing `useColorScheme` or `Appearance` from
`react-native` is an error in every file except the seam module.

#### Scenario: Root layout reads the scheme through the wrapper
- **WHEN** the root layout determines the active color scheme
- **THEN** it obtains it from `@/hooks/use-color-scheme`
- **AND** it does not import `useColorScheme` directly from `react-native`

#### Scenario: A direct device-scheme import outside the seam fails lint
- **WHEN** any file other than the seam module imports `useColorScheme` or `Appearance` from `react-native`
- **THEN** `npm run lint` reports an error naming the `@/hooks/use-color-scheme` seam

### Requirement: The theme layer defines semantic status color tokens

The theme layer SHALL define semantic status tokens for a positive state and an informational state alongside the existing destructive token, in both the light and the dark scheme, so a feature expressing "added", "modified", or "removed" draws from the shared palette instead of a locally defined color.

Each token SHALL be defined for light and dark together; a light-only status token is incomplete. Each SHALL be documented in the theme layer's contrast block with its computed ratio against the surfaces it is drawn on, and each SHALL meet the WCAG AA body-text threshold on those surfaces so the token may carry text and not only tint an icon.

Status tokens SHALL NOT be used as generic accents, and event or calendar colors SHALL NOT be used as status colors: an arbitrary event green is not a success state.

A consumer SHALL NOT rely on a status token as the only carrier of meaning; the distinction it expresses SHALL also be available as text.

Background or surface variants of these tokens SHALL NOT be added until a consumer fills a surface with one.

#### Scenario: A status token is defined and documented for both schemes

- **WHEN** the theme tokens are inspected
- **THEN** the positive and informational tokens each have a light and a dark value
- **AND** each has a documented contrast ratio against the surfaces it is drawn on, meeting WCAG AA for body text

#### Scenario: Status meaning survives without color

- **WHEN** a feature distinguishes states using the status tokens
- **THEN** the same distinction is also expressed as translated text

### Requirement: The theme layer defines interaction, elevation, motion and layout tokens
The theme layer SHALL define, as typed constants exported from `@/theme`:

- spacing steps of 12 and 48 in addition to the existing 2/4/8/16/24/32/64 scale, without
  renaming any existing step;
- a minimum touch target that resolves to 44 on iOS and 48 on Android;
- an icon-size scale of 14 / 17 / 22 / 28;
- state opacities: pressed 0.65 (iOS pressed feedback; Android uses ripple) and disabled 0.55;
- a raised elevation expressed as a light and a dark CSS `boxShadow` string, never as legacy
  `shadow*` / `elevation` style props;
- motion durations fast 150 ms, base 250 ms, slow 400 ms; consumers still honor reduced motion;
- a floating-action clearance of 96.

These tokens SHALL be additive: no existing token key or value changes and no screen is required
to consume them in this change.

#### Scenario: Touch target resolves per platform
- **WHEN** the theme layer is evaluated with the platform set to iOS
- **THEN** the minimum touch target is 44
- **AND** when evaluated with the platform set to Android it is 48

#### Scenario: Elevation ships a pair of shadow strings
- **WHEN** a consumer reads the raised elevation
- **THEN** it obtains a `boxShadow` string for the light scheme and a different one for the dark scheme

#### Scenario: Existing spacing keys are unchanged
- **WHEN** code reads any spacing step that existed before this change
- **THEN** it resolves to the same value as before

### Requirement: The theme layer defines outline and scrim color roles
The theme layer SHALL define an `outline` color role and a `scrim` color role, each with a light
and a dark value. `outline` is the boundary of text fields and outlined controls and SHALL meet the
WCAG 1.4.11 3:1 non-text contrast ratio against `background`, `backgroundElement` and
`backgroundSelected` in both schemes. `scrim` is the modal/backdrop dimming layer; it carries no
foreground and has no contrast obligation, which the theme layer SHALL state.

#### Scenario: Outline clears 3:1 against its surfaces in both schemes
- **WHEN** the contrast ratio of `outline` is computed against each of `background`, `backgroundElement` and `backgroundSelected`
- **THEN** every ratio is at least 3:1 in the light scheme
- **AND** every ratio is at least 3:1 in the dark scheme

#### Scenario: Scrim resolves per scheme
- **WHEN** `useTheme` is read under a light and then a dark scheme
- **THEN** `scrim` resolves to the light value and then the dark value

### Requirement: The theme layer defines a platform-resolved type ramp
The theme layer SHALL define the app's type ramp in `src/theme/typography.ts`, re-exported from `@/theme`, as a `TypeRamp` record keyed by the closed `TypeVariant` union `largeTitle`, `title`, `title2`, `sectionTitle`, `headline`, `body`, `callout`, `label`, `footnote`, `caption`, `captionSmall`. Each step SHALL resolve per platform at module load: iOS values SHALL follow the Apple HIG text styles at the default (Large) content size and SHALL name the matching UIKit Dynamic Type ramp; Android values SHALL follow the Material 3 type scale, including its letter spacing, and SHALL name no Dynamic Type ramp. `caption` and `captionSmall` SHALL keep identical values on both platforms and name no Dynamic Type ramp. `ThemedText` SHALL read its text styles from `TypeRamp` and SHALL NOT declare its own type scale.

#### Scenario: iOS resolves the HIG ramp
- **WHEN** `TypeRamp` is loaded with `Platform.OS = "ios"`
- **THEN** `body` is 17/22 at weight 400 with Dynamic Type ramp `body`
- **AND** `sectionTitle` is 20/25 at weight 600 with Dynamic Type ramp `title3`

#### Scenario: Android resolves the Material 3 ramp
- **WHEN** `TypeRamp` is loaded with `Platform.OS = "android"`
- **THEN** `body` is 16/24 at weight 400 with letter spacing 0.5 and no Dynamic Type ramp
- **AND** `sectionTitle` is 22/28 at weight 400

#### Scenario: Dense calendar steps are platform-independent
- **WHEN** `TypeRamp` is loaded on either platform
- **THEN** `caption` is 12/14 at weight 600 and `captionSmall` is 11/13 at weight 400

#### Scenario: Existing variant names keep compiling as aliases
- **WHEN** a `ThemedText` renders with `type` `default`, `small`, `smallBold` or `subtitle`
- **THEN** it renders the `body`, `callout`, `label` or `sectionTitle` step respectively

#### Scenario: An unknown variant is a type error
- **WHEN** code passes a `type` that is neither a `TypeVariant` nor an alias
- **THEN** `npx tsc --noEmit` fails

### Requirement: ThemedText colors text through a closed tone
`ThemedText` SHALL accept a `tone` prop from the closed union `primary`, `secondary`, `action`, `destructive`, `onPrimary`, resolving to the `text`, `textSecondary`, `actionText`, `destructive` and `onPrimary` color tokens for the active scheme. The union SHALL NOT contain a brand-pink member, so brand-colored text is `tone="action"`. `tone` and the `themeColor` prop SHALL be mutually exclusive at the type level. With neither prop, text SHALL use the `text` token. `themeColor` SHALL keep resolving any `ThemeColor` until its last call site migrates.

#### Scenario: A tone resolves to its token
- **WHEN** a `ThemedText` with `tone="action"` renders under the light scheme
- **THEN** its color is `Colors.light.actionText`

#### Scenario: Brand pink is not a tone
- **WHEN** code passes `tone="brand"` or `tone="tertiary"`
- **THEN** `npx tsc --noEmit` fails

#### Scenario: tone and themeColor cannot be combined
- **WHEN** code passes both `tone` and `themeColor` to one `ThemedText`
- **THEN** `npx tsc --noEmit` fails
