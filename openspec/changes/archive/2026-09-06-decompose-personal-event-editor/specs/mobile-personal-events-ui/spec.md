## MODIFIED Requirements

### Requirement: A single form route handles both create and edit, with delete in edit mode

The create/edit form SHALL remain reachable through the thin route `mobile/src/app/personal-event-form.tsx`, which only re-exports `PersonalEventFormScreen` from the personal-events feature. The feature-owned UI SHALL separate route/edit resolution, mutable editor orchestration, ordinary fields, sticky actions, and destructive confirmation into cohesive private modules under `mobile/src/features/personal-events/ui/`; no React component in this editor composition SHALL be materially above 200 lines. The route SHALL accept an optional `uid` parameter: with no `uid` it SHALL present a blank create form with sensible default start/end times and SHALL NOT show a delete control; with a `uid` it SHALL prefill from the loaded event and SHALL show a delete control. Late event loading and route-parameter changes SHALL not allow a stale event to overwrite the active editor. The form SHALL remain a `Stack` sibling of the `(tabs)` group and remain reachable via the development deep link `timecalendar-dev://personal-event-form`. Existing accessibility labels and `personal-event-*` test IDs SHALL remain on their rendered controls.

#### Scenario: The form is feature-owned behind a thin route

- **WHEN** the form screen and its private editor modules are located
- **THEN** they are under `mobile/src/features/personal-events/ui/`
- **AND** `mobile/src/app/personal-event-form.tsx` only re-exports the public screen
- **AND** the feature's UI and root barrels retain their existing public exports without an internal self-barrel import cycle

#### Scenario: No uid presents a blank create form

- **WHEN** the form route is opened without a `uid`
- **THEN** a blank form with default start/end times is shown
- **AND** no delete control is shown

#### Scenario: A uid prefills the form for editing and shows delete

- **WHEN** the form route is opened with the `uid` of an existing event and the event resolves
- **THEN** the form is prefilled from that event
- **AND** a delete control is shown

#### Scenario: A stale edit load cannot overwrite a newer route

- **WHEN** the route `uid` changes while an earlier event lookup is unresolved
- **THEN** the editor ultimately displays values for the current `uid`
- **AND** resolution of the stale lookup does not overwrite them

#### Scenario: Form selectors and keyboard-reachable actions remain stable

- **WHEN** the decomposed editor renders
- **THEN** the existing accessibility labels and `personal-event-*` test IDs remain on the same user-facing controls
- **AND** Save and Delete remain in the sticky footer outside the scrollable field content

#### Scenario: The form route remains reachable

- **WHEN** the root layout declares its routes
- **THEN** `personal-event-form` is a `Stack` screen sibling of the `(tabs)` group
- **AND** the development-variant app opened with `timecalendar-dev://personal-event-form` shows the create form

### Requirement: Native date and time pickers are reached only through the @expo/ui chrome wrapper

The personal-events feature SHALL own its single-consumer `DateTimeField` under `mobile/src/features/personal-events/ui/`. The field's native date and time controls SHALL still be rendered through the chrome wrapper `mobile/src/components/chrome/expo-ui.tsx`, the single import site for `@expo/ui` and its date/time control. The field and all feature/route code SHALL NOT import `@expo/ui` or its subpaths directly. The control SHALL retain the platform-native date/time UI, compact Android dialog lifecycle, inline iOS behavior, and display-zone wall-clock conversion in both directions.

#### Scenario: The feature-owned field imports the native control from the chrome seam

- **WHEN** `DateTimeField` renders a native date or time control
- **THEN** it imports the control from `@/components/chrome`
- **AND** it does not import `@expo/ui` or its subpaths directly

#### Scenario: @expo/ui remains isolated to the chrome wrapper

- **WHEN** `@expo/ui` or a subpath is imported anywhere in the app
- **THEN** the only import site is `mobile/src/components/chrome/expo-ui.tsx`
- **AND** the chrome barrel re-exports the wrapped control

#### Scenario: Display-zone conversion survives the ownership move

- **WHEN** a stored instant is shown and changed while the effective display zone differs from the device zone
- **THEN** the picker receives the display zone's wall-clock value
- **AND** the chosen wall-clock value is converted back to the correct stored instant

### Requirement: Color is chosen from a preset palette and stored as a hex string verbatim

The personal-events feature SHALL own its single-consumer `ColorSwatchPicker` and preset palette under `mobile/src/features/personal-events/ui/`, with palette data exported from a non-component module rather than from the React component module. The accessible picker SHALL offer selectable preset swatches without a new native dependency. Each swatch SHALL declare an accessibility role, selected state, translated accessibility label, and a touch target of at least 44pt on iOS and 48dp on Android. The chosen color SHALL remain a `#RRGGBB` string stored verbatim by the data layer, with no UI re-encoding.

#### Scenario: Selecting a swatch reports its hex color

- **WHEN** the user selects a color swatch
- **THEN** the component reports the swatch's `#RRGGBB` value
- **AND** the selected swatch is marked selected for assistive technology

#### Scenario: Palette data is separate from the component export

- **WHEN** React Doctor examines the color-picker component module
- **THEN** preset palette data is imported from a separate non-component module
- **AND** the component module has no non-component preset export requiring suppression

#### Scenario: The chosen color is stored verbatim

- **WHEN** an event is saved with a chosen color
- **THEN** the color is the `#RRGGBB` string from the palette
- **AND** it is passed unchanged to the data layer
