## MODIFIED Requirements

### Requirement: Focused forms keep actions pinned above the keyboard

The app SHALL provide a `KeyboardSafeActionLayout` that composes a flexing scrollable content region with a sibling action region. On iOS it SHALL use `KeyboardAvoidingView` height behavior with a vertical offset measured from the owner's window position. On Android it SHALL pad its owner by the measured keyboard overlap. It SHALL retain `keyboardShouldPersistTaps="handled"`, accept the caller's measured lane and safe-area ownership, keep content scrollable, and place the action region immediately above the visible keyboard without absolute positioning.

The layout SHALL own the shared form rhythm. The scroll content SHALL default to `paddingTop: Spacing.four` and `gap: Spacing.three`. The action region SHALL default to `gap: Spacing.two`, `paddingTop: Spacing.three` and `paddingBottom: Spacing.four`. Caller `contentContainerStyle` and `actionContainerStyle` SHALL apply after these defaults.

The layout SHALL accept `contentPlacement` of `"top"` (the default) or `"center"`. `"center"` SHALL make the scroll content fill the viewport (`flexGrow: 1`) and center it vertically. It SHALL also lay the scroller out below the header (`contentInsetAdjustmentBehavior` `"never"`, no vertical bounce). The prop type SHALL reject `scrollsUnderHeader` together with `"center"`, so a centered form cannot scroll under the bar.

#### Scenario: iOS keyboard lifts the action region

- **WHEN** a focused field opens the iOS keyboard
- **THEN** height-based avoidance with the measured window offset keeps the action region immediately above the keyboard
- **AND** fields remain reachable through the independent ScrollView

#### Scenario: Android keyboard resizes the owner

- **WHEN** a focused field opens the Android keyboard
- **THEN** the owner pads its bottom by the measured keyboard overlap and the action region sits immediately above the keyboard
- **AND** the action is not overlaid on the fields or system inset

#### Scenario: Safe area and lane remain composable

- **WHEN** a root form uses the keyboard-safe layout on a phone or tablet
- **THEN** the screen retains ownership of safe-area edges and the form supplies its measured readable lane
- **AND** the layout adds no navigation, modal, or window-width policy

#### Scenario: A form without layout styles gets the shared rhythm

- **WHEN** a screen renders `KeyboardSafeActionLayout` without `contentContainerStyle` or `actionContainerStyle`
- **THEN** the scroll content has `paddingTop: Spacing.four` and `gap: Spacing.three`
- **AND** the action region has `gap: Spacing.two`, `paddingTop: Spacing.three` and `paddingBottom: Spacing.four` beside the lane's gutter and maximum width

#### Scenario: Caller styles still win

- **WHEN** a caller passes `actionContainerStyle` or `contentContainerStyle` that sets one of the default keys
- **THEN** the caller's value is the flattened result for that key and the other defaults remain

#### Scenario: A centered form fills the viewport below the header

- **WHEN** a screen renders `KeyboardSafeActionLayout contentPlacement="center"`
- **THEN** the scroll content has `flexGrow: 1` and `justifyContent: "center"`
- **AND** the scroller has `contentInsetAdjustmentBehavior` `"never"` and `alwaysBounceVertical` `false`

#### Scenario: A centered form cannot scroll under the header

- **WHEN** a caller passes `scrollsUnderHeader` together with `contentPlacement="center"`
- **THEN** `npx tsc --noEmit` fails
