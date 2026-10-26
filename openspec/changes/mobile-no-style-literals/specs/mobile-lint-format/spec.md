# Spec Delta

## ADDED Requirements

### Requirement: Visual-style literals are a ratcheted lint error

Lint SHALL report an error, in every hand-written mobile source file under `src/` except the
theme module, the event color swatch presets, test fixtures and tests, for each of five
categories:

- **colors:** a hex, `rgb()`/`rgba()`, `hsl()`/`hsla()` or CSS named color string as the value of
  a `color`, `tintColor` or `*Color` style key or JSX prop. `transparent` and a typed theme-token
  name SHALL NOT be reported.
- **typography:** a literal `fontSize`, `lineHeight` or `fontWeight`. Native-chrome wrapper
  files SHALL be exempt from this category only.
- **shadows:** any legacy `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` or
  `elevation` style key, and a literal `boxShadow` string.
- **spacing:** a numeric literal other than 0 or 1 in any padding, margin or gap key, per-side
  and logical keys included.
- **radius:** a numeric literal other than 0 or 1 in any border radius key, per-corner keys
  included.

A value read from a theme token, the type ramp or `StyleSheet.hairlineWidth` SHALL NOT be
reported. A literal reached through a type cast, a conditional or logical branch, a negative
sign, literal-only arithmetic or a per-platform selection object SHALL be reported. Inline style
objects, style sheets, style arrays and plain `.ts` style helpers SHALL all be checked. Each
category SHALL report with its own message pointing to the token family that replaces it.

Files not yet migrated SHALL be listed in one committed allowlist that names, per file, the
categories it still violates and the slice that migrates it; lint SHALL skip only those
categories for that file. A test SHALL fail when a listed file no longer exists, is listed twice,
names an unknown category, no longer violates a listed category, or when any category's entry
count exceeds its pinned ceiling, so the list can only shrink.

#### Scenario: A screen hard-codes a color

- **WHEN** a feature file not on the allowlist styles a view with `backgroundColor: "#FFFFFF"`
  or passes `color="white"` to an icon
- **THEN** `npm run lint` fails with a message that points to the theme color tokens

#### Scenario: A theme token and transparent pass

- **WHEN** a feature file styles a view with `backgroundColor: theme.background`,
  `borderColor: "transparent"` or `themeColor="textSecondary"`
- **THEN** the rule reports nothing

#### Scenario: A screen sets its own type size

- **WHEN** a feature file not on the allowlist styles text with `fontSize: 17` or
  `fontWeight: "600"`
- **THEN** `npm run lint` fails with a message that points to the type ramp

#### Scenario: A native-chrome wrapper keeps native type values

- **WHEN** a file under the native-chrome wrapper seam styles text with `fontSize: 17`
- **THEN** the typography category reports nothing there, and the other categories still apply

#### Scenario: A screen draws a legacy shadow

- **WHEN** a feature file styles a view with `shadowOpacity` or `elevation`, whatever the value
- **THEN** `npm run lint` fails with a message that points to the elevation token

#### Scenario: A screen hard-codes spacing or a corner radius

- **WHEN** a feature file not on the allowlist styles a view with `paddingHorizontal: 12`,
  `marginStart: -4`, `gap: isWide ? 16 : 8` or `borderTopLeftRadius: 2`
- **THEN** `npm run lint` fails with a message that points to the spacing or radius tokens

#### Scenario: Zero, one and the hairline pass

- **WHEN** a file styles a view with `padding: 0`, `gap: 1`, `borderRadius: 0` or
  `marginTop: StyleSheet.hairlineWidth`
- **THEN** the rule reports nothing

#### Scenario: A cast does not hide a literal

- **WHEN** a file styles a view with `color: "#000" as ColorValue` or
  `padding: Platform.select({ ios: 12, default: 16 })`
- **THEN** `npm run lint` fails

#### Scenario: A style helper outside JSX is checked

- **WHEN** a `.ts` module returns `{ borderRadius: 6 }` for a component to spread into its style
- **THEN** `npm run lint` fails for that module

#### Scenario: An allowlisted file is exempt only for its listed categories

- **WHEN** a file is allowlisted for `spacing` only and gains `color: "#333"`
- **THEN** `npm run lint` fails on the color and still skips its spacing literals

#### Scenario: A migrated category leaves the allowlist

- **WHEN** an allowlisted file no longer violates a category it is listed for
- **THEN** the allowlist test fails and names the file and the stale category

#### Scenario: The allowlist cannot grow

- **WHEN** an entry is added that raises a category's count above its pinned ceiling
- **THEN** the allowlist test fails
