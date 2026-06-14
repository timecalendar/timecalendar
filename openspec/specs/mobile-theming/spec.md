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
Repointing the themed components at the theme layer SHALL NOT change their public props or the
accessibility heading-role contract established for `ThemedText`: `type="title"` and
`type="subtitle"` SHALL still expose `accessibilityRole="header"`, a caller-supplied
`accessibilityRole` SHALL still win, and other variants SHALL carry no header role.

#### Scenario: Title and subtitle remain headings after the token-source change
- **WHEN** a `ThemedText` with `type="title"` or `type="subtitle"` is rendered
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
SHALL meet 4.5:1 on the dark background. The Definition of Done's manual color-contrast review
SHALL check rendered screens against these named pairs. (A runtime or CI contrast checker is
explicitly not provided at this step.)

#### Scenario: A token pair is contrast-documented
- **WHEN** a foreground token is intended to be drawn on a given background token
- **THEN** that pairing is recorded in the theme layer's documented contrast pairs
- **AND** the pairing meets WCAG AA in both light and dark schemes

#### Scenario: White text on a brand surface uses an AA-passing tone
- **WHEN** white text is to be drawn on the brand color
- **THEN** the documented pair uses a brand tone whose white-on-fill ratio is at least 4.5:1
- **AND** the bright identity pink (white-on-fill below 4.5:1) is not used for white body text

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
more than this one seam, so that a future in-app override (Settings) has a single place
to intercept.

#### Scenario: Root layout reads the scheme through the wrapper
- **WHEN** the root layout determines the active color scheme
- **THEN** it obtains it from `@/hooks/use-color-scheme`
- **AND** it does not import `useColorScheme` directly from `react-native`

