# mobile-user-calendars — delta

## REMOVED Requirements

### Requirement: Each row carries a confirm-gated delete reachable by button, iOS swipe, and an accessibility action, with no undo

**Reason**: Superseded by "Each row carries one overflow menu exposing Rename and Delete on both
platforms" below. The canonical spec
(`docs/react-native-migration/05-tech-specs/calendar-naming-and-manual-import.md`, Rename journey
step 2) replaces the per-platform delete affordance with a single cross-platform overflow menu, so
the visible trailing delete button and Android's standalone trash affordance are gone.

This requirement also described two behaviors that were **never implemented**: the iOS
swipe-to-delete (there is no `Swipeable` anywhere in `mobile/src/features/calendar-sources/`) and the
row-level `accessibilityActions` delete path (no `accessibilityAction` in that feature at all). The
replacement describes the shape that actually ships rather than carrying that drift forward.

**Migration**: The confirm-gated `Alert`, the `remove(id)` call through the observability-wrapped
actions hook, the success announce, and the no-undo guarantee are all preserved verbatim in the
replacement requirement — only the affordance that opens the confirm changes, and the accessibility
route is now the menu trigger's own `activate` action.

## ADDED Requirements

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

## MODIFIED Requirements

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
