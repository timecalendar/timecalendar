# mobile-personal-events-ui Specification

## Purpose

TBD - created by archiving change add-mobile-personal-events-ui. Update Purpose after archive.

## Requirements

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

### Requirement: A personal-event tap opens the unified event-details screen; create/edit/delete stays reachable

A tap on a personal event (in the day/week timeline, the agenda, or the home today view) SHALL open
the unified event-details screen (`/event-details/<uid>`) — the same destination as a synced event —
instead of routing straight to the personal-event edit form. This is a one-helper change to the single
tap-routing discriminator (`eventRoute(uid, userCalendarId)`), which now returns `/event-details/<uid>`
for both kinds. The personal-event **create** affordance SHALL remain the `/personal-events` list's Add
action (unchanged), and **edit/delete** SHALL remain fully reachable via an **Edit** header action on
the unified details screen (which opens `/personal-event-form?uid=<uid>`). The personal-event form, its
`/personal-event-form` route, and the `usePersonalEvents` read SHALL be unchanged (only the entry point
moves one tap, mirroring the Home-IA relocation).

#### Scenario: A personal event tap opens the details screen

- **WHEN** the user taps a personal event in any calendar view or the home today view
- **THEN** the unified event-details screen opens for that uid (showing the event details + its
  checklist + an Edit action), not the edit form directly

#### Scenario: Edit/delete is reachable via the details screen

- **WHEN** the user taps Edit on a personal event's details screen
- **THEN** the personal-event edit form opens for that uid, with its existing edit and delete controls
  intact

#### Scenario: The form route is unchanged and still deep-linkable

- **WHEN** `/personal-event-form?uid=<uid>` is reached (via the Edit action or a deep link)
- **THEN** the existing create/edit/delete form renders unchanged

#### Scenario: Create is reached from the personal-events list

- **WHEN** the user opens the `/personal-events` list and taps Add
- **THEN** the blank create form opens (unchanged — create did not move)

### Requirement: Personal-event deletion is confirmation-gated and single-flight

The personal-event edit form SHALL NOT invoke the delete repository action when the user first activates `personal-event-delete`. It SHALL first present a platform-native confirmation alert whose localized content names event deletion and whose explicit actions are Cancel and Delete. Only the destructive Delete confirmation SHALL invoke `useDeleteEvent().remove(uid)`. Cancel, supported back/outside dismissal, and accessibility escape SHALL perform no repository write, SHALL perform no navigation, and SHALL leave the populated edit form open.

Once a destructive confirmation starts the async removal, the form SHALL admit no second delete request until that request settles. A successful removal SHALL close the form exactly once. A failed removal SHALL perform no navigation, SHALL preserve the populated edit form and existing visible/recorded error behavior, and SHALL release the guard so the user can retry through a fresh confirmation.

#### Scenario: Opening the confirmation performs no write

- **WHEN** the user activates `personal-event-delete` on a populated edit form
- **THEN** a native confirmation alert naming event deletion is presented
- **AND** the repository remove action has not been called
- **AND** the edit form remains open

#### Scenario: Explicit cancel is inert

- **WHEN** the confirmation alert is open and the user activates Cancel
- **THEN** no repository write or navigation occurs
- **AND** the populated edit form remains open
- **AND** the user can open the confirmation again

#### Scenario: Passive or accessibility dismissal is inert where supported

- **WHEN** the confirmation alert is dismissed by platform back, outside dismissal, or accessibility escape where the platform supports that gesture
- **THEN** no repository write or navigation occurs
- **AND** the populated edit form remains open
- **AND** the user can open the confirmation again

#### Scenario: Confirmed deletion invokes the repository once

- **WHEN** the user activates the destructive Delete action
- **THEN** `useDeleteEvent().remove(uid)` is invoked with the edited event uid
- **AND** repeated Delete input or repeated confirmation callbacks while that promise is pending do not invoke a second removal

#### Scenario: Successful deletion closes exactly once

- **WHEN** the single confirmed repository removal resolves successfully
- **THEN** the form calls `router.back()` exactly once

#### Scenario: Failed deletion preserves the form and permits retry

- **WHEN** the confirmed repository removal fails
- **THEN** the form does not navigate
- **AND** the populated values remain available
- **AND** the existing localized `WriteErrorNotice` and `useRecordedAction` error-recording behavior are preserved
- **AND** a later fresh confirmation can invoke one new removal and close on success

### Requirement: Personal-event delete confirmation is localized and conveys destructive meaning accessibly

The confirmation title, explanatory message, Cancel action, and destructive Delete action SHALL be present in both French and English catalogs with typed bidirectional key parity. The alert SHALL use the platform-native cancel and destructive action styles, and its words and action placement SHALL communicate permanence without relying on color alone. The underlying Delete control SHALL expose disabled state while the confirmed removal is pending.

#### Scenario: English confirmation copy is complete

- **WHEN** the app locale is English and the user opens the confirmation
- **THEN** the title, message, Cancel action, and Delete action render in English
- **AND** the destructive action is explicitly named Delete

#### Scenario: French confirmation copy is complete

- **WHEN** the app locale is French and the user opens the confirmation
- **THEN** the title, message, Cancel action, and Delete action render in French
- **AND** typed catalog parity passes with no missing or extra key

#### Scenario: Destructive semantics do not depend on color

- **WHEN** the native alert is announced or viewed without perceiving its destructive color
- **THEN** its title, explanatory message, and explicit Delete action still identify the permanent destructive operation

#### Scenario: Pending state is exposed on the underlying action

- **WHEN** a confirmed removal is in flight
- **THEN** `personal-event-delete` is disabled and exposes its disabled accessibility state

### Requirement: Confirmation behavior is proven at component and end-to-end boundaries

The colocated personal-event form component suite SHALL capture and exercise the native alert callbacks to prove alert opening, explicit cancellation, passive dismissal, confirmation, pending duplicate suppression, exactly-once success navigation, failure without navigation, and retry. The personal-events Maestro flow SHALL prove against the real device-local repository that cancelling deletion preserves the event and that a later confirmed deletion removes it.

#### Scenario: Component tests prove every confirmation branch

- **WHEN** the targeted personal-event form component suite runs
- **THEN** it proves open-without-write, cancel-without-write, dismiss-without-write, confirmed removal, pending duplicate suppression, exactly-once success navigation, failure without navigation, and successful retry

#### Scenario: Maestro cancel preserves the event

- **WHEN** the personal-events Maestro flow opens the created event, requests deletion, and activates Cancel
- **THEN** the edit screen remains open without a write
- **AND** the event remains present when the flow observes the personal-events list

#### Scenario: Maestro confirm removes the event

- **WHEN** the same flow reopens the event, requests deletion, and activates the destructive Delete action
- **THEN** the edit form closes after the successful write
- **AND** the personal-events list no longer contains the event title

#### Scenario: Physical-device accessibility evidence remains honest

- **WHEN** the implementation is ready for physical-device verification
- **THEN** a migration inbox note tagged `(HUMAN: ...)` requests VoiceOver and TalkBack checks for alert focus, title/message/action announcements, escape/back dismissal, destructive-action semantics, and platform-native presentation
- **AND** unrun device work is not represented as passed or used to block automatable completion

### Requirement: Personal-events list uses the shared standard lane
The personal-events list SHALL resolve a `standard` lane from the positive width of its existing safe-area owner. Its feature-owned header, Add action, empty state, rows, and scroll edges SHALL align within that lane while retaining one list and the existing navigation and reactive data behavior.

#### Scenario: Tablet list is centered and capped
- **WHEN** the personal-events owner reports a portrait-tablet width
- **THEN** the header, empty state, and rows align within the centered standard lane with tablet gutters
- **AND** rows do not stretch beyond the standard content cap

#### Scenario: List actions are unchanged
- **WHEN** a user activates Add or an existing row at any supported width
- **THEN** the create or edit route opens with the existing parameters and accessibility label/hint behavior

#### Scenario: Compact list is preserved
- **WHEN** the list owner reports 390 or another width below 600
- **THEN** the same one-column list uses compact gutters without changing row order or touch targets

### Requirement: Personal-event form body and footer share one readable lane

The personal-event create/edit/delete form SHALL use the shared `KeyboardSafeActionLayout` while retaining its native date-time pickers, field order, validation, save/delete semantics, confirmation alerts, and error presentation. Its scroll body and keyboard-safe action footer SHALL share one measured `readable` lane at every supported portrait width. The localized create/edit title SHALL live in the compact native Stack header, and the scroll body SHALL NOT repeat it as an oversized in-content route title.

Save SHALL use the shared button's `filled` variant with `primaryStrong`/`onPrimary`, the platform minimum target, disabled/busy accessibility semantics when the save hook is pending, and the unchanged `personal-event-save` selector. Delete SHALL use the shared button's `destructive` variant after Save, with the `destructive` label color, busy and disabled accessibility semantics while the delete is pending, and the unchanged `personal-event-delete` selector. Save/delete failure notices SHALL remain in the pinned action region.

#### Scenario: Form and footer align on tablet

- **WHEN** the form owner reports a portrait-tablet width
- **THEN** fields, validation messages, error notices, Save, and Delete align within the same centered readable lane
- **AND** the footer remains immediately above the keyboard through the shared owner

#### Scenario: Native header replaces the duplicate title

- **WHEN** the create or edit form opens
- **THEN** the compact Stack header shows the corresponding localized create/edit title
- **AND** the scroll body starts with form fields rather than a second oversized route title

#### Scenario: Save uses the semantic primary action

- **WHEN** the form renders or a save is pending
- **THEN** Save uses the shared filled brand pair, platform target, and enabled/disabled/busy semantics
- **AND** `personal-event-save` remains the selector on the accessible button

#### Scenario: Delete uses the destructive button

- **WHEN** an existing event's form renders or its delete is pending
- **THEN** Delete uses the shared destructive button, platform target, and enabled/disabled/busy semantics
- **AND** `personal-event-delete` remains the selector on the accessible button

#### Scenario: Create and edit behavior is preserved

- **WHEN** a user creates an event or edits an existing event at phone or tablet width
- **THEN** native pickers, validation, persistence, back navigation, save failure, delete confirmation, delete failure, and action order remain unchanged
- **AND** the existing `personal-event-*` field and action selectors remain stable

#### Scenario: Large text retains sequential form order

- **WHEN** font scaling stresses the form at 834 or a wider owner
- **THEN** the form remains one readable column in field, validation, Save, then Delete source and focus order
- **AND** its content remains scrollable while the action region stays pinned above the keyboard

### Requirement: Standalone personal-events states use the shared root-page composition

The standalone Personal events destination SHALL use `RootPage` with one measured `standard` lane while retaining its compact localized native title, body Add action, reactive data hook, row order, `FlatList`, and create/edit navigation. Its loaded-empty branch SHALL use the shared `StatusView` (`kind="empty"`, `presentation="section"`) without artwork and SHALL retain the existing localized meaning. The route SHALL NOT add a duplicate in-content title, second scroll owner, or new action placement.

#### Scenario: Empty list uses the shared page state

- **WHEN** the personal-events hook returns an empty collection
- **THEN** the shared screen empty state fills the available standard lane below the compact native title
- **AND** the Add action remains reachable with its current label and selector

#### Scenario: Populated list keeps virtualization and navigation

- **WHEN** personal events exist
- **THEN** the existing `FlatList` remains the only virtualized owner and renders the same rows in the shared lane
- **AND** activating Add or a row opens the create or edit form with unchanged parameters, labels, hints, and `personal-event-*` selectors

#### Scenario: Form behavior remains under the existing keyboard-safe contract

- **WHEN** the user opens create or edit from the normalized list
- **THEN** the existing compact create/edit title, readable lane, keyboard-safe body/footer, native pickers, Save/Delete actions, validation, persistence, and confirmation behavior remain unchanged
- **AND** the form route does not gain a second in-content title or scroll owner

### Requirement: The personal-event Delete action labels in the destructive color

The personal-event form's Delete action SHALL label in the semantic `destructive` color on its neutral surface, never brand pink. That color SHALL meet the WCAG AA 4.5:1 text contrast floor in both schemes.

#### Scenario: Delete is a destructive-colored label

- **WHEN** the edit form shows the Delete action in light or dark scheme
- **THEN** the Delete label renders in that scheme's `destructive` color

### Requirement: The Android date/time field announces its current value

On Android, the personal-event date/time field's accessible name SHALL include both the field's localized label and its currently displayed date and time, joined by a comma, so a screen reader that reads the focused control's label instead of its child text still announces the value. The name SHALL follow the value after a commit. The label SHALL be localized in French and English by the form; the field SHALL use no translation key of its own.

#### Scenario: The field's name includes the value

- **WHEN** the Android personal-event form shows the Starts field with a value
- **THEN** the field's accessible name is the Starts label followed by a comma, a space and the same formatted date and time the field displays

#### Scenario: The name follows a committed change

- **WHEN** the user commits a new date and time through the native dialogs
- **THEN** the field's accessible name contains the newly displayed value

### Requirement: Date and time display follows the device clock setting

Personal-event date/time text SHALL follow the device's 12/24-hour preference in the app's language: the Android date/time field's displayed value, its accessible "label, value" name and the personal-events list ranges SHALL render 12-hour time when the device uses a 12-hour clock and 24-hour time otherwise. The iOS native date/time picker SHALL receive no locale override, so it follows the device's language and hour cycle.

#### Scenario: A 12-hour device on Android

- **WHEN** the device uses a 12-hour clock and the Starts field holds 25 Oct 22:40 in English
- **THEN** the field displays the time with a 12-hour clock and an AM/PM marker
- **AND** its accessible name is "Starts, " followed by that same displayed value

#### Scenario: A 24-hour device on Android

- **WHEN** the device uses a 24-hour clock
- **THEN** the field displays "25 Oct 22:40"

#### Scenario: The iOS picker follows the device

- **WHEN** the app language is French and the device uses a 12-hour clock
- **THEN** the iOS picker receives no locale and renders with the device language and hour cycle

#### Scenario: The list follows the same setting

- **WHEN** the personal-events list renders on a 12-hour device
- **THEN** each event's start–end range uses 12-hour times

### Requirement: Color swatches announce color names and selection

Each personal-event color swatch SHALL announce a translated human color name (FR/EN), never a hex code, together with its selection state using the platform's native semantics: a checked or unchecked radio button inside the color radio group on Android, and a button with the selected trait on iOS. Every preset color SHALL have a name.

#### Scenario: Android swatch semantics

- **WHEN** the color picker renders on Android in English with pink selected
- **THEN** the pink swatch is a radio with the name "Pink" and checked state, and the other swatches are unchecked radios with their names

#### Scenario: iOS swatch semantics

- **WHEN** the color picker renders on iOS in French with pink selected
- **THEN** the pink swatch is a button named "Rose" with the selected state

#### Scenario: No swatch announces a hex code

- **WHEN** any swatch renders in either language
- **THEN** its accessible name contains no "#" character

### Requirement: The chrome date/time picker takes device-local Dates on both platforms

The chrome date/time picker SHALL accept and report device-local Dates on iOS and Android alike. On Android, a date picker (date mode, or the date-only rendering of datetime mode, as a dialog or inline) SHALL open on the value's device-local calendar day. A picked day SHALL be reported as that device-local day with the value's device-local time of day. The event reported with a converted Date SHALL describe that same Date: its `nativeEvent.timestamp` SHALL equal the Date's time and its `nativeEvent.utcOffset` SHALL equal the Date's device offset in minutes, and the deprecated change event SHALL keep its `type`. The conversion to and from the native control's UTC-day representation SHALL happen inside the chrome seam, so no consumer converts days or timestamps itself. Minimum and maximum dates, the time picker, and iOS SHALL pass through unchanged. An invalid or epoch Date from the native control SHALL reach the consumer unchanged, with its event unchanged.

#### Scenario: The Android date dialog opens on the local day in a UTC− zone

- **WHEN** an Android date picker is given the value 23:30 local on 2 January in a zone behind UTC
- **THEN** the native date control receives 2 January (UTC midnight of that day), not 3 January

#### Scenario: The Android picked day keeps the local day and time

- **WHEN** the native date control confirms 5 January as its UTC-midnight day and the picker's value is 09:30 local on 2 January
- **THEN** the consumer receives 09:30 local on 5 January in every device zone

#### Scenario: The Android event agrees with the picked Date

- **WHEN** the native date control confirms 5 January with an event whose timestamp is UTC midnight of 5 January
- **THEN** the consumer's event timestamp equals the reported local Date's time and its UTC offset equals that Date's device offset, in every device zone
- **AND** a deprecated change event keeps its `set` or `dismissed` type

#### Scenario: The gallery date story shows the picked day

- **WHEN** the gallery date picker story on Android, opened on 2 January, confirms 5 January in any device zone
- **THEN** its row shows 5 January, not the day it opened on and not the day before

#### Scenario: The seam fails loudly when the native contract changes

- **WHEN** the installed `@expo/ui` Android date control stops treating its initial value and picked value as UTC-midnight days
- **THEN** a repository test that pins the native source fails

### Requirement: The personal-event form uses the design-layer date/time field over the @expo/ui chrome wrapper

The personal-event form SHALL render its start and end values through the design layer's shared `DateTimeField` (`mobile/src/design/field/`), imported from `@/design`; the personal-events feature SHALL NOT own a date/time field component. The field's native date and time controls SHALL still be rendered through the chrome wrapper `mobile/src/components/chrome/expo-ui.tsx`, the single import site for `@expo/ui` and its date/time control. The field and all feature/route code SHALL NOT import `@expo/ui` or its subpaths directly. The control SHALL retain the platform-native date/time UI, compact Android dialog lifecycle, inline iOS behavior, and display-zone wall-clock conversion in both directions. On Android, where the native dialog picks either a date or a time but not both, the field SHALL present a native date dialog followed by a native time dialog and SHALL commit the chosen calendar day and time of day together as one display-zone wall clock; a cancel at either step SHALL leave the stored value unchanged.

#### Scenario: The design-layer field imports the native control from the chrome seam

- **WHEN** `DateTimeField` renders a native date or time control
- **THEN** it imports the control from `@/components/chrome`
- **AND** it does not import `@expo/ui` or its subpaths directly

#### Scenario: The personal-event form uses the shared field

- **WHEN** the personal-event form renders its Starts and Ends fields
- **THEN** both are the `DateTimeField` from `@/design`
- **AND** no date/time field component exists under `mobile/src/features/personal-events/`

#### Scenario: @expo/ui remains isolated to the chrome wrapper

- **WHEN** `@expo/ui` or a subpath is imported anywhere in the app
- **THEN** the only import site is `mobile/src/components/chrome/expo-ui.tsx`
- **AND** the chrome barrel re-exports the wrapped control

#### Scenario: Display-zone conversion survives the ownership move

- **WHEN** a stored instant is shown and changed while the effective display zone differs from the device zone
- **THEN** the picker receives the display zone's wall-clock value
- **AND** the chosen wall-clock value is converted back to the correct stored instant

#### Scenario: Android sets date and time in two native steps

- **WHEN** the user taps the Android field, confirms a day in the date dialog, and then confirms a time in the time dialog
- **THEN** the field reports exactly one change whose display-zone wall clock has the confirmed day and the confirmed hour and minute
- **AND** no change is reported after the date step alone
- **AND** no dialog remains open after the time step

#### Scenario: Android date step preserves the calendar day across zones

- **WHEN** the effective display zone is ahead of or behind UTC and the user confirms a day in the Android date dialog
- **THEN** the date dialog opens with the stored value's display-zone day selected
- **AND** the time dialog opens with the confirmed day and the stored value's display-zone time of day

#### Scenario: Cancelling either Android step is inert

- **WHEN** the user dismisses the Android date dialog, or confirms a date and then dismisses the time dialog
- **THEN** the field reports no change and the stored value is unchanged
- **AND** no dialog remains open and the field can be reopened

#### Scenario: iOS keeps the single inline date-time control

- **WHEN** the field renders on iOS
- **THEN** it renders one inline native date-and-time control and reports each change directly in the display zone
