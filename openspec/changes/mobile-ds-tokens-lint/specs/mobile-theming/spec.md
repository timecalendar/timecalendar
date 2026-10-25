# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
