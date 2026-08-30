# mobile-user-calendars Specification

## Purpose
TBD - created by archiving change add-mobile-user-calendars. Update Purpose after archive.
## Requirements
### Requirement: A reachable "Mes calendriers" management screen lists every held calendar

The app SHALL provide a presentational user-calendars management screen (and a
deep-linkable thin route, a `Stack` sibling of the tabs, reached from the Settings
calendar summary) that reads the reactive `useUserCalendars()` list and renders one
row per held calendar. Each row SHALL show the calendar's name (falling back to a
"Calendrier" placeholder when empty) as the title and its `schoolName` (falling
back to "Calendrier personnel" when absent) as the subtitle — Flutter
`user_calendar_list_item.dart` parity. The row title SHALL render as body weight (a
`Platform.select` override), not the `ThemedText` default that reads as emphasis.
The empty state SHALL be gated on the read resolving: because `useLiveQuery` starts
with an empty array and resolves asynchronously, the screen SHALL track a `loaded`
flag (the `useLiveQuery` `updatedAt`, which is undefined until the first resolve) and
SHALL render neither the empty state nor any live region until the read has loaded —
so the empty state neither flashes nor false-announces "no calendars" on entry. When
loaded with no calendars the screen SHALL render an accessible, **centered** empty
state (a title + a `textSecondary` line that is a polite live region with a `text`
role), not a crash or a blank. Each row SHALL be a plain non-touchable container so
its two controls (the row-level visibility toggle and the delete button) never nest
inside a parent touchable, and the container SHALL NOT declare `accessible={true}`
(which would flatten the two-target design).

#### Scenario: The screen lists held calendars with name + school
- **WHEN** the management screen renders with a non-empty `useUserCalendars()` list
- **THEN** it lists one row per calendar, each showing the calendar name (or the
  "Calendrier" placeholder when empty) and the school subtitle (or "Calendrier
  personnel" when absent)

#### Scenario: The empty state waits for the read to resolve
- **WHEN** the management screen mounts before `useUserCalendars()` has resolved
- **THEN** neither the empty state nor its live region renders, so no "no calendars"
  is announced on entry

#### Scenario: Empty management state
- **WHEN** the read has resolved and no calendars are held
- **THEN** the screen shows an accessible, centered empty state (polite live region,
  text role), not a crash or a blank

#### Scenario: The management screen is reachable
- **WHEN** the user activates the calendar summary on Settings
- **THEN** the app navigates to the user-calendars management screen
- **AND** the screen remains directly deep-linkable as a Stack sibling of the tabs

### Requirement: Each row carries a visibility checkbox that toggles the calendar's `visible` flag

Each calendar row SHALL carry its visibility control as a single **row-level toggle**
`Pressable` (merging the checked indicator and the name/school text into one accessibility
element that spans the row, clearing the 48dp Android target floor) with
`accessibilityRole="checkbox"` and `accessibilityState={{ checked: visible }}`, whose
`accessibilityLabel` is the calendar's name and school built from the i18n template
`userCalendars.rowLabel` ("{{name}}, {{school}}"), and whose `accessibilityHint` states that
the control shows or hides the calendar (`userCalendars.visibilityHint`). The visible/hidden
**state** SHALL live in `accessibilityState`, never in the label or the hint. Pressing the
control SHALL call `setVisible(id, !visible)` through the observability-wrapped actions hook,
and SHALL NOT announce the change explicitly (the `checked`-state change announces for free).
The toggle SHALL give a pressed-state affordance (an Android foreground ripple and an iOS
`pressed` background). The checked indicator SHALL be a checkmark (iOS
`SymbolView name="checkmark"`, Android a `✓` glyph) tinted `onPrimary` on a `primaryStrong`
fill — NOT a knockout dot whose fill resolves to the scheme background (which renders
black-on-pink in dark mode). The redundant row text SHALL be hidden from assistive tech
(`importantForAccessibility="no-hide-descendants"` / `accessibilityElementsHidden`) since the
toggle's label already carries the name and school.

#### Scenario: Toggling a visible calendar hides it

- **WHEN** the user presses the row toggle of a currently-visible calendar
- **THEN** `setVisible(id, false)` runs and the reactive read re-renders the row as unchecked

#### Scenario: Toggling a hidden calendar shows it

- **WHEN** the user presses the row toggle of a currently-hidden calendar
- **THEN** `setVisible(id, true)` runs and the reactive read re-renders the row as checked

#### Scenario: The toggle carries state in accessibilityState, not the label or hint

- **WHEN** assistive tech reads the row toggle
- **THEN** the label conveys the calendar name and school (from `userCalendars.rowLabel`), the
  hint conveys that it shows or hides the calendar (from `userCalendars.visibilityHint`), and
  the checked/unchecked state is conveyed via `accessibilityState={{ checked }}` with no
  "visible"/"hidden" wording baked into the label or hint

#### Scenario: The checked indicator is legible in both color schemes

- **WHEN** a calendar is visible in either light or dark mode
- **THEN** the checked indicator is a checkmark tinted `onPrimary` on a `primaryStrong` fill
  (the AA-verified 5.87:1 pair), not a background-colored dot that inverts to black-on-pink in
  dark mode

### Requirement: An add affordance routes to school selection

The screen SHALL provide an accessible add affordance rendered as a **native header
action** (`Stack.Screen options.headerRight`) — a primary-tinted `smallBold`
`Pressable` mirroring the shipped event-details header-action pattern, with a short
visible label (`userCalendars.add.short`, "Add"/"Ajouter"), the full "Ajouter un
calendrier" string kept as its `accessibilityLabel`, `accessibilityRole="button"`,
and a pressed-state affordance — that navigates to school selection
(`/onboarding/school`) — Flutter FAB parity. The add SHALL NOT render as an
off-platform in-body bordered text button. Settings provides the calendar-management
front door; it SHALL NOT duplicate the Add calendar action.

#### Scenario: The add header action routes to school selection
- **WHEN** the user activates the header add action
- **THEN** the app navigates to `/onboarding/school`

#### Scenario: The add action is a native header action with a full accessible name
- **WHEN** assistive tech reads the add control
- **THEN** it is a header-right button whose visible label is the short
  "Add"/"Ajouter" and whose `accessibilityLabel` is the full "Ajouter un
  calendrier" string

#### Scenario: Settings does not duplicate the add action
- **WHEN** the Settings hub renders
- **THEN** it links to calendar management through its summary
- **AND** it does not render a separate Add calendar action

### Requirement: A failed visibility or delete write is recorded and surfaced; the read is infallible

The visibility toggle and delete writes SHALL go through an observability-wrapped actions
hook (mirroring `useHideActions`) built on the shared write controller: a thrown
`setVisible`/`remove` (a local-persistence write with no server backup) SHALL be reported
through the `@/firebase` `recordError(error, "user-calendars/<action>")` seam AND surfaced as
an accessible failure state via `WriteErrorNotice`. The visibility read/filter SHALL be
total/infallible (a calendar simply absent from the list is not in the visible set) and SHALL
NOT be recorded. The actions hook SHALL be the single UI write path; the reactive read SHALL
NOT write.

#### Scenario: A write failure is recorded and surfaced

- **WHEN** a `setVisible` or `remove` write throws
- **THEN** the error is reported through `@/firebase` `recordError` under a
  `"user-calendars/<action>"` context AND an accessible failure notice is shown

#### Scenario: A successful write clears the failure surface

- **WHEN** a write succeeds after a prior failure
- **THEN** the `failed` flag clears and the failure notice is not shown

### Requirement: The user-calendars UI is verified by automated tests under the coverage gate, and the existing data layer is reused unchanged

The observability-wrapped actions hook SHALL be covered under the K-3 90% logic gate (both mutators'
success and failure-record branches). The presentational management screen and the rename dialog
SHALL meet the 70% floor: the list render, the gated/empty state, the toggle wiring, the **overflow
menu's Rename and Delete actions on both platforms**, the delete → `Alert` confirm/cancel branches,
and the write-failure notice — every branch machine-coverable by invoking the captured `MenuView`
`onPressAction` and the captured `Alert` button `onPress` (NO gesture simulation). The cancel-path
test SHALL assert the `Alert` opened, that the cancel button is `style: "cancel"`, and that it
carries no `onPress`. A `Platform.OS === "android"` render test SHALL cover the Android row shape
(the overflow trigger and its `MenuComponentRef` `show()` path — jest runs the iOS shape by default),
and SHALL NOT lower screen coverage.

The rename dialog's validation, pending, failure, retry and cancel branches SHALL be covered, as
SHALL the local-state-only-after-success rule. `useRenameCalendar`, `effectiveCalendarName` and
`updateName` are logic and SHALL clear the 90% gate.

This change SHALL add to `data/user-calendars/` only the narrow `updateName` write, the
`useRenameCalendar` seam and the pure `effectiveCalendarName` helper; the `remove` / `setVisible` /
`upsert` repository writes are reused as-is, with no new npm dependency, no new Drizzle table, and no
new migration.

#### Scenario: The actions hook, rename seam and screens meet their coverage thresholds

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** the actions hook, `useRenameCalendar`, `effectiveCalendarName` and `updateName` clear the
  90% gate, the screen and the rename dialog meet the 70% floor, and the suite is green

#### Scenario: The menu and delete branches are covered without simulating a gesture

- **WHEN** the screen test invokes the captured `MenuView` `onPressAction` for `rename` and for
  `delete`, spies on `Alert.alert`, and invokes the captured confirm/cancel `onPress`
- **THEN** the rename-dialog-opens, confirm-deletes and cancel-does-nothing branches are all
  asserted (with the cancel button asserted `style: "cancel"` and carrying no `onPress`), and no pan
  or long-press gesture is part of the coverage

#### Scenario: The Android row shape is covered

- **WHEN** the screen test renders with `Platform.OS === "android"`
- **THEN** the Android row shape renders with the overflow trigger (no standalone trash affordance),
  its `onPress` calls the menu ref's `show()`, and its `activate` accessibility action does the same

#### Scenario: No new schema, dependency, or migration is introduced

- **WHEN** the change is applied
- **THEN** `data/user-calendars/` gains only `updateName`, `useRenameCalendar` and
  `effectiveCalendarName`, and no new npm dependency, Drizzle table, or migration is added

### Requirement: The reactive user-calendars read returns a stable identity

The `useUserCalendars()` reactive read SHALL memoize its mapped result
(`useMemo(() => data.map(rowToCalendar), [data])`) so it returns the same array identity
across renders where the underlying `useLiveQuery` `data` is unchanged. This preserves the
referential stability the events-source seam `useCalendarEvents` `useMemo` (ADR 031) depends
on — an unmemoized `data.map(...)` would produce a fresh array every render and defeat the
downstream memo it exists to feed.

#### Scenario: A stable read does not defeat the downstream memo

- **WHEN** `useUserCalendars()` re-renders while its underlying `useLiveQuery` `data` is
  unchanged
- **THEN** it returns the same array identity, so the events-seam `useCalendarEvents` `useMemo`
  that depends on `calendars` does not recompute needlessly

### Requirement: Each row carries one overflow menu exposing Rename and Delete on both platforms

Each calendar row SHALL carry a single trailing overflow affordance, identical on iOS and Android,
rendered through the `@/components/chrome` `MenuView` seam and exposing exactly two actions —
**Rename** (`userCalendars.rename.action`) and **Delete** (`userCalendars.delete.action`, carrying
the destructive attribute). Android SHALL NOT render a standalone trash button.

The trigger SHALL be a `Pressable` with `accessibilityRole="button"`, an
`accessibilityLabel` naming the calendar (`userCalendars.actions`, never a bare "Actions"), a target
of at least 44×44, and `testID={`user-calendar-actions-${id}`}`.

Because `MenuView` does not self-open on Android, the Android path SHALL use the idiom already proven
in `calendar-view-menu.tsx`: a `MenuComponentRef` whose `show()` the trigger's `onPress` calls, plus
`accessibilityActions={[{ name: "activate" }]}` and a matching `onAccessibilityAction`, so TalkBack
opens the menu without a gesture. iOS SHALL open the menu natively on press.

Choosing Delete SHALL open the existing confirm-gated native `Alert` (unchanged: a `cancel`-style
Annuler carrying no `onPress`, a `destructive`-style Supprimer calling `remove(id)` through the
observability-wrapped actions hook, an `AccessibilityInfo.announceForAccessibility` announce gated on
the resolved write, and NO undo). Choosing Rename SHALL open the controlled rename dialog.

#### Scenario: The menu exposes the same two actions on both platforms

- **WHEN** the screen renders with `Platform.OS === "ios"` and again with `Platform.OS === "android"`
- **THEN** each row renders one overflow trigger whose menu carries exactly Rename and Delete
- **AND** no standalone trash affordance is rendered on either platform

#### Scenario: Delete from the menu opens the existing confirm

- **WHEN** the user selects Delete in the overflow menu
- **THEN** the native `Alert` confirm opens with the calendar name in the message and nothing is
  deleted yet
- **AND** confirming calls `remove(id)` and announces, while cancelling calls nothing

#### Scenario: TalkBack opens the menu without a gesture

- **WHEN** a screen-reader user invokes the `activate` accessibility action on the Android trigger
- **THEN** the menu is shown via the `MenuComponentRef`

### Requirement: Rename opens one shared controlled dialog that survives pending and failure

Selecting Rename SHALL open a single React Native `Modal` dialog used unchanged on both platforms —
NOT iOS `Alert.prompt` plus a separate Android implementation. The dialog SHALL:

- seed its controlled `TextInput` **once, from `trim(current name)`**, holding the value in local
  component state (never bound to a `useLiveQuery` value, whose async round-trip drops characters
  under fast typing);
- expose the input with an `accessibilityLabel` (`userCalendars.rename.label`) and the localized
  effective-name fallback as its placeholder;
- reject a value whose trimmed length exceeds 100 characters with inline, screen-reader-announced
  validation text, blocking Save while invalid;
- accept an **empty or whitespace** value as valid — an empty name is legal and renders as the
  fallback;
- hold a `pending` state during the request in which Save is disabled and the entered text stays
  visible;
- on failure, remain open with the entered text intact, show a recoverable error, and offer **Retry**
  and **Cancel**;
- dismiss ONLY on a resolved success or an explicit cancel, never on a press alone;
- carry `testID`s `user-calendar-rename-dialog`, `user-calendar-rename-input`,
  `user-calendar-rename-save`, `user-calendar-rename-cancel`, a distinct dialog title string that no
  menu action duplicates, and iOS modal isolation (`accessibilityViewIsModal`) plus an Android
  `onRequestClose` mapped to cancel.

#### Scenario: A name over the normalized maximum is rejected locally

- **WHEN** the user enters a value whose trimmed length is 101 characters
- **THEN** inline validation text is shown, Save is disabled, and no request is issued

#### Scenario: A 100-character name and an empty name are both accepted

- **WHEN** the user enters exactly 100 trimmed characters, or clears the field entirely
- **THEN** Save is enabled and the request is issued

#### Scenario: A failed rename keeps the dialog, the text, and the old local name

- **WHEN** the rename request rejects (offline, server error, or an unknown token)
- **THEN** the dialog stays open with the entered text still visible, shows the recoverable error
  with Retry and Cancel, and the calendar's local name is unchanged
- **AND** the calendar is NOT removed locally, whatever the failure

#### Scenario: Retry after a failure reissues the same request

- **WHEN** the user presses Retry after a failure
- **THEN** the dialog returns to `pending` and reissues the rename with the entered value

#### Scenario: Cancel discards the edit

- **WHEN** the user cancels from any state
- **THEN** the dialog closes and the calendar's local name is unchanged

### Requirement: Rename calls the generated PATCH mutation from the data layer and persists the server's name

The app SHALL provide a `useRenameCalendar()` seam in
`features/calendar-sources/data/user-calendars/` that wraps the generated
`useCalendarV1ControllerRenameCalendar` mutation (the ONLY site importing it — the `data/`-only-seam
rule, B-1), sends the **trimmed** value as `{ token, data: { name } }`, and on success persists the
name from the returned `CalendarForPublic` — NOT the string the user typed — through
`updateName(id, name)`.

Local state SHALL change only after a successful server response. A request rejection SHALL surface
as a recoverable error and SHALL NOT be reported to Crashlytics (mirroring the fetch-path posture); a
rejection of the local `updateName` write after a successful response SHALL be reported through the
`@/firebase` `recordError` seam as a crash-worthy local-persistence failure.

#### Scenario: A successful rename persists the server's normalized name

- **WHEN** the user saves a name and the server responds with a `CalendarForPublic`
- **THEN** `updateName(id, response.name)` is called with the **response's** name, and the row
  re-renders with it

#### Scenario: Nothing is written locally when the request fails

- **WHEN** the rename request rejects
- **THEN** no local write is issued and the failure is not sent to `recordError`

### Requirement: A narrow name-only repository write exists and touches no other column

The user-calendars repository SHALL expose `updateName(id: string, name: string): Promise<void>`
issuing a single-column `UPDATE ... SET name WHERE id = ?` over the `@/db` seam, mirroring the
existing `setVisible`. It SHALL NOT be implemented as an `upsert`, and SHALL NOT read, write, or
default `visible`, `token`, `createdAt`, `lastUpdatedAt`, `schoolName`, or `schoolId`.

#### Scenario: The name write updates one column

- **WHEN** `updateName(id, name)` runs against the mocked `@/db` seam
- **THEN** the query is an `update` on `user_calendars` setting only `name`, filtered by `id`

#### Scenario: A name write for an unknown id is harmless

- **WHEN** `updateName` runs for an id with no local row
- **THEN** it resolves without throwing and inserts nothing

### Requirement: Every calendar-name surface renders the effective display name

The app SHALL expose one pure helper, `effectiveCalendarName(stored, fallback)`, returning
`trim(stored)` when non-empty and the localized fallback otherwise, and SHALL use it for every
calendar-name label this capability renders — the list rows and the rename dialog. The localized
fallback SHALL be **"My timetable" / "Mon emploi du temps"** (the value of
`userCalendars.namePlaceholder`).

A stored name SHALL NOT be silently replaced: the fallback is a display substitution only, and a
stored name longer than 100 characters SHALL still be displayed in full.

#### Scenario: A whitespace-only stored name displays the fallback

- **WHEN** a calendar's stored name is `"   "` (or empty)
- **THEN** the row and the rename dialog display the localized timetable fallback
- **AND** the stored value is not rewritten

#### Scenario: A stored name is trimmed for display

- **WHEN** a calendar's stored name is `"  L3 Informatique  "`
- **THEN** the displayed label is `"L3 Informatique"`

#### Scenario: An over-long stored name still displays

- **WHEN** a calendar's stored name exceeds 100 characters
- **THEN** it is displayed as stored, and renaming it requires a value of at most 100 trimmed
  characters

