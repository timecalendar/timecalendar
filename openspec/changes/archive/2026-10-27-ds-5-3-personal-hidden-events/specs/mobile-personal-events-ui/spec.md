## MODIFIED Requirements

### Requirement: Personal events are listed on the Home tab over the reactive data hook

The app SHALL render the user's personal events on the standalone `/personal-events` Stack route,
reached from Settings, using the data layer's reactive `usePersonalEvents()` hook, so the list
updates automatically when an event is created, edited, or deleted. The list body SHALL be a
presentational component under `mobile/src/features/personal-events/ui/` (tested beside it), with
the route file remaining a thin re-export. The list SHALL show, per event, the title, the color,
and the date/time range.

The list SHALL offer its Add action through the platform create idiom: a trailing header item with
the add glyph on iOS, and a floating action on Android, never both. The two SHALL share the
localized accessible label "Add event" / "Ajouter un événement" and the `personal-events-add`
selector, and SHALL navigate to the blank create form. The list SHALL NOT render an in-content Add
button. On Android, the list content SHALL reserve the shared floating-action bottom clearance so
the last row is never covered.

When there are no events, the list SHALL show a localized empty state with the title "No personal
events" / "Aucun événement personnel" and the caption "Events you add appear here." / "Les
événements que vous ajoutez apparaissent ici.". The copy SHALL NOT tell the user to tap a control
by a visible name that the platform does not show. Because the list is presentational, it SHALL
fall under the 70% global coverage floor and SHALL NOT be subject to the 90% per-path logic
threshold (ADR 003).

#### Scenario: The list renders events from the reactive hook

- **WHEN** the personal-events route renders and personal events exist
- **THEN** each event is shown with its title, color, and date/time range
- **AND** the list re-renders automatically when the underlying table changes

#### Scenario: The list shows an empty state when there are no events

- **WHEN** the personal-events route renders and there are no personal events
- **THEN** the localized empty title and caption are shown
- **AND** the platform Add action is available

#### Scenario: iOS adds through a header item

- **WHEN** the list renders on iOS
- **THEN** the trailing header item named "Add event" with identifier `personal-events-add` is declared
- **AND** no floating action and no in-content Add button render

#### Scenario: Android adds through a floating action

- **WHEN** the list renders on Android
- **THEN** a floating action named "Add event" with test ID `personal-events-add` renders
- **AND** no header Add item is declared, and the list's bottom padding equals the shared floating-action clearance

#### Scenario: The Add action opens the create form

- **WHEN** the user activates the Add action on either platform
- **THEN** the create form route is shown with a blank form

### Requirement: A single form route handles both create and edit, with delete in edit mode

The create/edit form SHALL remain reachable through the thin route `mobile/src/app/personal-event-form.tsx`, which only re-exports `PersonalEventFormScreen` from the personal-events feature. The feature-owned UI SHALL separate route/edit resolution, mutable editor orchestration, ordinary fields, sticky actions, and destructive confirmation into cohesive private modules under `mobile/src/features/personal-events/ui/`; no React component in this editor composition SHALL be materially above 200 lines. The route SHALL accept an optional `uid` parameter: with no `uid` it SHALL present a blank create form with sensible default start/end times and SHALL NOT show a delete control; with a `uid` it SHALL prefill from the loaded event and SHALL show a delete control. Late event loading and route-parameter changes SHALL not allow a stale event to overwrite the active editor. The form SHALL remain a `Stack` sibling of the `(tabs)` group and remain reachable via the development deep link `timecalendar-dev://personal-event-form`. Existing accessibility labels and `personal-event-*` test IDs on rendered controls SHALL remain on those controls.

The editor SHALL take its layout rhythm only from the shared keyboard-safe form layout and SHALL pass it no content or action style. The action region SHALL hold, in order, the write-failure notice when present, Save, and Delete in edit mode, stacked at full width with the shared action gap, and SHALL NOT wrap them in a second padded container.

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

#### Scenario: The editor uses the shared form rhythm

- **WHEN** the edit form renders on iOS or Android
- **THEN** the scroll content has `paddingTop: Spacing.four` and `gap: Spacing.three` and no other padding
- **AND** the action region has `gap: Spacing.two`, `paddingTop: Spacing.three` and `paddingBottom: Spacing.four`, and Save and Delete are its direct children

#### Scenario: The form route remains reachable

- **WHEN** the root layout declares its routes
- **THEN** `personal-event-form` is a `Stack` screen sibling of the `(tabs)` group
- **AND** the development-variant app opened with `timecalendar-dev://personal-event-form` shows the create form

### Requirement: Color is chosen from a preset palette and stored as a hex string verbatim

The personal-events feature SHALL own its preset palette, its default color and the translation key of every preset's name, in a module under `mobile/src/features/personal-events/ui/` that exports data, not components. The form SHALL render the color choice through the shared design-system color swatch field, giving it the localized "Color" label, one option per preset with its translated name, the current value and a change handler. The feature SHALL NOT build its own swatch control. Each swatch SHALL keep the `color-swatch-<hex>` test ID. The chosen color SHALL remain a `#RRGGBB` string stored verbatim by the data layer, with no UI re-encoding.

#### Scenario: Selecting a swatch reports its hex color

- **WHEN** the user selects a color swatch in the form
- **THEN** the form value becomes the swatch's `#RRGGBB` value
- **AND** the selected swatch is marked selected for assistive technology

#### Scenario: Palette data is separate from the component export

- **WHEN** React Doctor examines the personal-events UI modules
- **THEN** the preset palette, default color and name keys are imported from a non-component data module
- **AND** no component module exports palette data requiring suppression

#### Scenario: Every preset is named

- **WHEN** the form renders in English or French
- **THEN** each of the eight presets is announced by its translated color name, never a hex code

#### Scenario: The chosen color is stored verbatim

- **WHEN** an event is saved with a chosen color
- **THEN** the color is the `#RRGGBB` string from the palette
- **AND** it is passed unchanged to the data layer

### Requirement: The UI logic and wiring are verified by automated tests under the coverage gates

The unit-test suite SHALL cover, under the 90% logic gate: `validateEventForm` (empty title, end not
after start, valid input), `buildEventFromForm` (fresh uid + now on create, preserved uid on edit,
trimmed/optional fields), and the save/delete hooks (success calls the repository; a rejected call
records through `@/firebase` and surfaces failure). It SHALL cover, under the 70% floor: the list
(rows, empty state, the platform Add action), the form screen (localized labels; a valid save calls
the save hook; an empty title shows the validation error and does not save; edit mode shows delete
and triggers the delete hook; driving the date control's `onValueChange` updates the form state;
every preset swatch is named by its translated color; selecting a swatch saves its hex). The shared
color swatch field SHALL be covered by its own design-layer suite at a 90% per-file tier. The
`@expo/ui` native controls (including the date/time control) SHALL be mocked suite-wide so they
render and their callbacks can be driven under Jest. No configured coverage threshold SHALL be
lowered or removed.

#### Scenario: The validation and build logic are covered at the 90% gate

- **WHEN** the suite runs with coverage
- **THEN** the `src/features/personal-events/form/` logic meets the 90% lines+branches threshold

#### Scenario: Driving the date control updates the form state

- **WHEN** the test drives the form's date control `onValueChange` with a new date
- **THEN** the form's start/end state reflects the new date

#### Scenario: The coverage gate stays green without config changes

- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds pass, including the color swatch field's 90% per-file tier
- **AND** the only `coverageThreshold` change in `jest.config.js` is that added tier; no existing entry is lowered or removed
