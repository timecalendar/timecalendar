## ADDED Requirements

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
the app's `useColorScheme` wrapper, and SHALL expose this through `useTheme`. The app SHALL
follow the device color scheme; it SHALL NOT provide an in-app theme override at this step.

#### Scenario: Token resolves to the scheme-appropriate value
- **WHEN** `useTheme` is read under a light device color scheme
- **THEN** it returns the light value for a given color token
- **WHEN** it is read under a dark device color scheme
- **THEN** it returns the dark value for that same token

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
Glass; iOS 16.4–25, Android, and web → a plain themed view). Consumers SHALL request a glass
surface without themselves branching on platform or OS version.

#### Scenario: Glass renders on a supporting platform
- **WHEN** the glass wrapper renders on a build where Liquid Glass is available
- **THEN** it renders the native glass surface

#### Scenario: Fallback renders where glass is unavailable
- **WHEN** the glass wrapper renders where Liquid Glass is unavailable (e.g. iOS below 26,
  Android, web, or the test environment)
- **THEN** it renders a plain themed view containing the same children
- **AND** it does not throw

### Requirement: Theme tokens document WCAG-AA contrast pairs
The theme layer SHALL document its foreground/background color **pairs** for both light and dark
schemes, and each documented pair SHALL meet WCAG AA contrast. The Definition of Done's manual
color-contrast review SHALL check rendered screens against these named pairs. (A runtime or CI
contrast checker is explicitly not provided at this step.)

#### Scenario: A token pair is contrast-documented
- **WHEN** a foreground token is intended to be drawn on a given background token
- **THEN** that pairing is recorded in the theme layer's documented contrast pairs
- **AND** the pairing meets WCAG AA in both light and dark schemes

### Requirement: Theming wiring is verified by an automated test
The unit test suite SHALL include a test that asserts a token resolves through `useTheme` to the
expected value under both light and dark color schemes, and that the glass-surface wrapper
renders its children (exercising the fallback path in the test environment). Visual correctness
on-device — actual Liquid Glass, fallback appearance, and contrast legibility — is an explicitly
manual review, not a CI gate.

#### Scenario: Proof test covers light/dark resolution and wrapper render
- **WHEN** the theming proof test runs
- **THEN** it asserts a token resolves to its light value under a light scheme and its dark
  value under a dark scheme
- **AND** it asserts the glass-surface wrapper renders its children without throwing
