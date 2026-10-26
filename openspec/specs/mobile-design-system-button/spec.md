# mobile-design-system-button Specification

## Purpose
One shared button contract for the React Native app: the closed set of visual intents, sizes and
states every in-content button uses, with platform-native press feedback, accessible state and
text scaling owned by the primitive rather than by each screen.

## Requirements

### Requirement: Buttons declare a closed visual intent

The app SHALL provide one shared button whose caller MUST choose a visual intent from a closed set:
`filled` (brand fill carrying `onPrimary` text on `primaryStrong`), `tonal` (neutral
`backgroundElement` fill carrying `text`), `outlined` (no fill, an `outline` boundary, `actionText`
label), `text` (no fill, no boundary, `actionText` label) and `destructive` (neutral
`backgroundElement` fill carrying a `destructive` label). Colors SHALL come only from the active
scheme's tokens; a caller SHALL NOT be able to pass a color, fill, border, height, padding, radius
or opacity. Each foreground/background pairing a variant draws SHALL be a documented contrast pair
that clears its floor in both schemes.

#### Scenario: Filled uses the verified brand pair in both schemes

- **WHEN** a `filled` button renders in light or dark
- **THEN** its fill is `primaryStrong` and its label is `onPrimary`

#### Scenario: Destructive reads as destructive

- **WHEN** a `destructive` button renders in either scheme
- **THEN** its label uses the `destructive` color on the neutral element fill
- **AND** the pair is in the documented contrast table at the body-text floor

#### Scenario: A caller cannot recolor a button

- **WHEN** a caller passes a background color, opacity or minimum height through `style`
- **THEN** the type check fails

### Requirement: Button sizes map to tokens and keep the platform touch target

The button SHALL offer `small`, `medium` (default) and `large` sizes whose padding, gap, radius,
label style and icon size come from theme tokens. Every size and variant SHALL be at least the
platform minimum touch target (44 points on iOS, 48 dp on Android) tall and wide, including `text`
buttons with a short label. `large` SHALL be taller than the minimum target.

#### Scenario: A short text button still meets the target

- **WHEN** a `small` `text` button with a two-letter label renders on iOS and on Android
- **THEN** its minimum height and minimum width equal the platform touch target

#### Scenario: Large is taller than the target

- **WHEN** a `large` button renders
- **THEN** its minimum height is greater than the platform touch target

### Requirement: Button states are exposed visually and to assistive technology

The button SHALL be one accessible element with the `button` role by default, or `link` when the
caller declares it opens external content. Its accessible name SHALL default to the visible label,
and the caller MAY give a more descriptive label and a hint. `disabled` and `busy` SHALL block
activation and dim the button by `StateOpacity.disabled`. A busy button SHALL show a progress
indicator that is hidden from assistive technology, keep its visible label, keep the label as its
accessible name, and expose `accessibilityState` `{ disabled: true, busy: true }`. A disabled
button SHALL expose `{ disabled: true, busy: false }`.

#### Scenario: Busy keeps the label for screen readers

- **WHEN** a button labeled "Enregistrer" is busy
- **THEN** its accessible name is still "Enregistrer"
- **AND** the visible label is still rendered
- **AND** it exposes busy and disabled state, and the progress indicator is not an accessible element

#### Scenario: Disabled and busy block activation

- **WHEN** a disabled or busy button is pressed
- **THEN** its handler is not called

#### Scenario: An external link declares the link role

- **WHEN** a button opens a web page and is declared as a link
- **THEN** it exposes the `link` role

### Requirement: Press feedback follows each platform

On Android a pressable button SHALL show the Material ripple in the `ripple` token color, clipped to
the button's shape, and no opacity change. On iOS a pressed button SHALL dim to
`StateOpacity.pressed`. A disabled or busy button SHALL show no press feedback.

#### Scenario: Android ripple

- **WHEN** an enabled button renders on Android
- **THEN** it carries a ripple in the scheme's `ripple` color and keeps full opacity while pressed

#### Scenario: iOS highlight

- **WHEN** an enabled button is pressed on iOS
- **THEN** its opacity is `StateOpacity.pressed`

### Requirement: Button labels scale with the OS text size and never clip

The label SHALL follow the OS text size without a scale cap, wrap onto up to sixteen centered lines,
and grow the button's height rather than clip. An optional icon SHALL render through the shared
icon primitive with text scaling, take the label's color, stay hidden from assistive technology,
and sit before the label by default or after it when the caller asks.

#### Scenario: The longest French label at the largest text size

- **WHEN** the longest French gallery label renders at the largest accessibility text size
- **THEN** the label wraps within the button and no line is cut mid-glyph

#### Scenario: The longest French label beside another button

- **WHEN** the longest French gallery label renders in a row beside a short button at the largest
  accessibility text size
- **THEN** the whole label renders without an ellipsis

#### Scenario: A trailing arrow icon

- **WHEN** a `text` button declares a trailing icon
- **THEN** the icon renders after the label in the label's color and is not announced

### Requirement: Caller style lays a button out and wins

A caller's `style` SHALL accept layout properties only (margin, flex, alignment, width, position)
and SHALL be applied after the button's own styles, so a caller's alignment or width wins over the
button's defaults.

#### Scenario: Caller alignment wins

- **WHEN** a caller passes `alignSelf: "flex-end"`
- **THEN** the rendered button is aligned to the end even though the default stretches

### Requirement: The button gallery fixture covers every variant, size and state

The design-system gallery SHALL hold a button fixture with one story per variant showing every
size enabled, disabled and busy; a story with leading and trailing icons; and a story with the
longest French strings (a long sentence and a single long word) on several variants. Each story
SHALL render in both schemes on both platforms with every button exposing a role and a label, and
its titles, story names and labels SHALL be translated in French and English.

#### Scenario: Deep link to the busy states

- **WHEN** a development build opens `timecalendar-dev://developer/gallery/button--filled`
- **THEN** the screen shows the filled button in every size, enabled, disabled and busy

#### Scenario: Registry matrix

- **WHEN** the gallery registry test runs
- **THEN** every button story renders in light and dark on iOS and Android without an error or an
  unlabeled interactive element
