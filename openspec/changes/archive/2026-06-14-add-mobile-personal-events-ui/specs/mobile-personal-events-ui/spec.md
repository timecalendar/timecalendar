## ADDED Requirements

### Requirement: Personal events are listed on the Home tab over the reactive data hook
The Home tab SHALL render the user's personal events using the data layer's reactive
`usePersonalEvents()` hook, so the list updates automatically when an event is created, edited, or
deleted. The list body SHALL be a presentational component at
`mobile/src/components/personal-events-list.tsx` (tested beside it), with the Home tab route
(`mobile/src/app/(tabs)/index.tsx`) remaining a thin entrypoint. The list SHALL show, per event, the
title, the color, and the date/time range; SHALL provide an accessible Add action that navigates to
the create form; and SHALL show a localized empty state when there are no events. Because it is
presentational, it SHALL fall under the 70% global coverage floor and SHALL NOT be subject to the
90% per-path logic threshold (ADR 003).

#### Scenario: The list renders events from the reactive hook
- **WHEN** the Home tab renders and personal events exist
- **THEN** each event is shown with its title, color, and date/time range
- **AND** the list re-renders automatically when the underlying table changes

#### Scenario: The list shows an empty state when there are no events
- **WHEN** the Home tab renders and there are no personal events
- **THEN** a localized empty state is shown
- **AND** an accessible Add action is available

#### Scenario: The Add action opens the create form
- **WHEN** the user activates the Add action
- **THEN** the create form route is shown with a blank form

### Requirement: A single form route handles both create and edit, with delete in edit mode
The create/edit form SHALL be a presentational component at
`mobile/src/components/personal-event-form-screen.tsx`, reachable through a thin route
`mobile/src/app/personal-event-form.tsx` that only re-exports it. The route SHALL accept an optional
`uid` parameter: with no `uid` it SHALL present a blank create form (with sensible default
start/end times) and SHALL NOT show a delete control; with a `uid` it SHALL prefill the form from the
existing event (loaded via the data layer) and SHALL show a delete control. The form SHALL be
registered as a `Stack` sibling of the `(tabs)` group in the root layout so the non-tab route is
navigable, and SHALL be reachable via the development deep link `timecalendar-dev://personal-event-form`.

#### Scenario: The form lives in components with a thin route
- **WHEN** the form screen and its colocated test are located
- **THEN** the screen is at `mobile/src/components/personal-event-form-screen.tsx` and its test beside it
- **AND** `mobile/src/app/personal-event-form.tsx` only re-exports the screen

#### Scenario: No uid presents a blank create form
- **WHEN** the form route is opened without a `uid`
- **THEN** a blank form with default start/end times is shown
- **AND** no delete control is shown

#### Scenario: A uid prefills the form for editing and shows delete
- **WHEN** the form route is opened with the `uid` of an existing event
- **THEN** the form is prefilled from that event
- **AND** a delete control is shown

#### Scenario: The form route is reachable as a Stack sibling and via the dev deep link
- **WHEN** the root layout declares its routes
- **THEN** `personal-event-form` is a `Stack` screen sibling of the `(tabs)` group
- **AND** the development-variant app opened with `timecalendar-dev://personal-event-form` shows the create form

### Requirement: Form validation and event assembly live in the feature folder as pure logic
The form's validation and event-assembly logic SHALL live under
`mobile/src/features/personal-events/form/` (the 90% coverage glob), separate from the presentational
screen. A pure `validateEventForm` SHALL reject an empty (whitespace-only) title and reject an end
that is not strictly after the start, returning localizable error keys (not rendered sentences). A
pure `buildEventFromForm` SHALL assemble a `PersonalEvent`: trimming string fields (empty optional
fields → `undefined`), assigning a fresh uid via the data layer's `newEventId()` and
`exportedAt = now` on create, and preserving the existing uid (with a refreshed `exportedAt`) on
edit. The screen SHALL only call these functions and the save/delete hooks; it SHALL add no
validation or assembly logic of its own.

#### Scenario: An empty title is rejected
- **WHEN** `validateEventForm` is called with a whitespace-only title
- **THEN** the result is invalid with the title-required error key

#### Scenario: An end not after the start is rejected
- **WHEN** `validateEventForm` is called with an end at or before the start
- **THEN** the result is invalid with the time-range error key

#### Scenario: Create assembles a new event with a fresh uid and now
- **WHEN** `buildEventFromForm` is called with no existing event
- **THEN** the assembled event has a fresh uid from `newEventId()`
- **AND** `exportedAt` is set to the current time

#### Scenario: Edit preserves the existing uid
- **WHEN** `buildEventFromForm` is called with an existing event
- **THEN** the assembled event keeps the existing uid
- **AND** the trimmed field values are applied

### Requirement: Native date and time pickers are reached only through the @expo/ui chrome wrapper
The form's native date and time controls SHALL be rendered through the chrome wrapper
`mobile/src/components/chrome/expo-ui.tsx` (the single import site for `@expo/ui`, including its
date/time control), exported from the chrome barrel. The form (and any other feature/route code)
SHALL import the control from `@/components/chrome` and SHALL NOT import `@expo/ui` (or its subpaths)
directly, keeping the alpha API's blast radius inside the chrome seam. The control SHALL present the
platform-native date/time UI (it SHALL NOT be force-themed away from the platform appearance).

#### Scenario: The form imports the date/time control from the chrome seam
- **WHEN** the form renders a native date or time control
- **THEN** it imports the control from `@/components/chrome`
- **AND** it does not import `@expo/ui` or its subpaths directly

#### Scenario: @expo/ui is imported only inside the chrome wrapper
- **WHEN** `@expo/ui` (or a subpath) is imported anywhere in the app
- **THEN** the only import site is `mobile/src/components/chrome/expo-ui.tsx`
- **AND** the chrome barrel re-exports the wrapped control

### Requirement: Color is chosen from a preset palette and stored as a hex string verbatim
The form SHALL let the user choose an event color from a preset palette of selectable swatches, via a
custom accessible component `mobile/src/components/color-swatch-picker.tsx` (no new native
dependency). Each swatch SHALL be a single-select control declaring an accessibility role, its
selected state, and a translated accessibility label, with a touch target of at least 44pt (iOS) /
48dp (Android). The chosen color SHALL be a `#RRGGBB` hex string stored verbatim by the data layer
(no re-encoding in the UI).

#### Scenario: Selecting a swatch reports its hex color
- **WHEN** the user selects a color swatch
- **THEN** the component reports the swatch's `#RRGGBB` value
- **AND** the selected swatch is marked selected for assistive technology

#### Scenario: The chosen color is stored verbatim
- **WHEN** an event is saved with a chosen color
- **THEN** the color is the `#RRGGBB` string from the palette
- **AND** it is passed unchanged to the data layer

### Requirement: Creating, editing, and deleting an event persist through the data-layer repository
Saving the form SHALL persist the assembled event through the data layer's `upsert` (one write path
for create and edit, keyed by uid). Deleting in edit mode SHALL remove the event through the data
layer's `remove`. These mutations SHALL be invoked from save/delete hooks in
`mobile/src/features/personal-events/form/`; the screen SHALL only trigger them. After a successful
save or delete, the reactive list SHALL reflect the change without a manual refresh.

#### Scenario: Saving a valid create persists a new event
- **WHEN** the user saves a valid create form
- **THEN** the event is persisted via the repository `upsert`
- **AND** the new event appears in the reactive list

#### Scenario: Saving a valid edit updates the event
- **WHEN** the user saves a valid edit form
- **THEN** the existing event is updated via the repository `upsert` keyed by its uid

#### Scenario: Deleting removes the event
- **WHEN** the user deletes an event in edit mode
- **THEN** the event is removed via the repository `remove`
- **AND** it no longer appears in the reactive list

### Requirement: A failed event write is recorded through the observability seam
A rejected `upsert` or `remove` SHALL be recorded through the observability seam, because a
device-local database write can fail (unlike the synchronous, infallible key-value
preferences) — it SHALL be recorded through the `@/firebase`
observability seam (`recordError`) rather than silently swallowed, and the form SHALL surface a
failure state to the user. This error path SHALL be exercised by an automated test.

#### Scenario: A rejected save records the error
- **WHEN** the repository `upsert` rejects during a save
- **THEN** the error is recorded through `@/firebase`
- **AND** the form surfaces a failure state

#### Scenario: A rejected delete records the error
- **WHEN** the repository `remove` rejects during a delete
- **THEN** the error is recorded through `@/firebase`

### Requirement: Personal-events UI strings are fully localized (FR + EN)
Every user-facing string on the list, form, and color picker SHALL be a translation key with complete
FR and EN catalog entries (covering their controls and accessibility labels too). This covers the list title
and empty state, the Add action, the form field labels and placeholders, the save and delete actions,
the validation messages, and the color label. Localization SHALL be enforced by the
no-hardcoded-strings lint rule and by `tsc`-typed bidirectional FR/EN parity (a missing or extra key
in either catalog fails the typecheck).

#### Scenario: No hardcoded user-facing string in the UI
- **WHEN** the list, form, or color picker renders text or an accessibility label
- **THEN** that string comes from a translation key
- **AND** the no-hardcoded-strings lint rule passes

#### Scenario: FR and EN catalogs are complete and in parity
- **WHEN** a personal-events UI key is added to one catalog
- **THEN** the same key exists in the other catalog
- **AND** `tsc` fails if a key is missing or extra in either direction

### Requirement: Every interactive control is accessible
Every interactive control SHALL declare an accessibility role and a meaningful translated
accessibility label and provide a touch target of at least 44pt (iOS) / 48dp (Android) — the list
rows, the Add action, the color swatches, the date/time controls, and the save and delete actions. No text SHALL disable font
scaling (`allowFontScaling={false}` SHALL NOT be used). The accessibility-lint rules SHALL pass.

#### Scenario: Interactive controls declare role and label
- **WHEN** an interactive control on the list or form renders
- **THEN** it declares an accessibility role and a translated accessibility label

#### Scenario: Accessibility lint passes
- **WHEN** the lint suite runs over the new UI
- **THEN** the accessibility-lint rules pass with zero warnings

### Requirement: The UI logic and wiring are verified by automated tests under the coverage gates
The unit-test suite SHALL cover, under the 90% logic gate: `validateEventForm` (empty title, end not
after start, valid input), `buildEventFromForm` (fresh uid + now on create, preserved uid on edit,
trimmed/optional fields), and the save/delete hooks (success calls the repository; a rejected call
records through `@/firebase` and surfaces failure). It SHALL cover, under the 70% floor: the list
(rows, empty state, Add), the form screen (localized labels; a valid save calls the save hook; an
empty title shows the validation error and does not save; edit mode shows delete and triggers the
delete hook; driving the date control's `onValueChange` updates the form state), and the color-swatch
picker (renders swatches with labels/selected state; selecting reports the hex). The `@expo/ui`
native controls (including the date/time control) SHALL be mocked suite-wide so they render and their
callbacks can be driven under Jest. The configured coverage thresholds SHALL stay green without
changing `jest.config.js`.

#### Scenario: The validation and build logic are covered at the 90% gate
- **WHEN** the suite runs with coverage
- **THEN** the `src/features/personal-events/form/` logic meets the 90% lines+branches threshold

#### Scenario: Driving the date control updates the form state
- **WHEN** the test drives the form's date control `onValueChange` with a new date
- **THEN** the form's start/end state reflects the new date

#### Scenario: The coverage gate stays green without config changes
- **WHEN** the suite runs with coverage
- **THEN** all configured thresholds still pass
- **AND** `jest.config.js` `coverageThreshold` is unchanged

### Requirement: A Maestro flow proves the create→list→delete round-trip
The e2e suite SHALL include a Maestro flow that cold-launches the development-variant app, deep-links
to the create form, types a title via the text input, accepts the default dates, saves, asserts the
new title appears in the list, opens it, deletes it, and asserts it is gone. The flow SHALL NOT
depend on driving a native date/time picker popup (native pickers are not reliably addressable across
iOS and Android); the picker-to-state wiring is proven instead by the automated unit test.

#### Scenario: The Maestro flow performs a CRUD round-trip
- **WHEN** the Maestro personal-events flow runs on iOS or Android
- **THEN** it creates an event via the text input with default dates
- **AND** it asserts the event appears in the list and is gone after delete

#### Scenario: The flow does not drive the native date/time picker
- **WHEN** the Maestro personal-events flow is authored
- **THEN** it relies on default dates and the text title only
- **AND** it does not open or drive the native date/time picker popup
