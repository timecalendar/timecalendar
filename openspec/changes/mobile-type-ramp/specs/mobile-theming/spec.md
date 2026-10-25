# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: The ThemedText heading-role contract is preserved
Changes to the themed components SHALL NOT break the accessibility heading-role contract established for `ThemedText`: the heading ramp steps (`largeTitle`, `title`, `title2`, `sectionTitle`) and the `subtitle` alias SHALL expose `accessibilityRole="header"`, a caller-supplied `accessibilityRole` SHALL still win, and every other accepted `type` SHALL carry no header role.

#### Scenario: Title and subtitle remain headings after the token-source change
- **WHEN** a `ThemedText` with a heading `type` is rendered
- **THEN** the rendered accessibility tree exposes a node with the `header` role
- **AND** the default variant exposes no header role
- **AND** an explicit `accessibilityRole` on the element overrides the header default
