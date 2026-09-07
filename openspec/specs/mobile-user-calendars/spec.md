# mobile-user-calendars Specification

## Purpose
TBD - created by archiving change add-mobile-user-calendars. Update Purpose after archive.
## Requirements
### Requirement: A reachable "Mes calendriers" management screen lists every held calendar

The app SHALL provide a presentational user-calendars management screen (and a
deep-linkable thin route, a `Stack` sibling of the tabs, reached from the Settings
calendar summary) that reads the reactive `useUserCalendars()` list and renders one
row per held calendar. Each row SHALL show the calendar's **effective display name** as the title
and its `schoolName` (falling back to "Calendrier personnel" when absent) as the subtitle.

The effective display name SHALL be derived by the pure `effectiveCalendarName(stored, fallback)`
helper in the feature's `data/` sublayer defined under "Every calendar-name surface renders the
effective display name" below. Stored values SHALL NEVER be rewritten — the fallback is
display-only, so no backfill is required for the empty and whitespace-only names present in
production data. Every surface that renders a calendar's name — including the delete-confirmation
message — SHALL use this helper rather than reading `calendar.name` directly.

The row title SHALL render as body weight (a
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

#### Scenario: The screen lists held calendars with the effective name + school
- **WHEN** the management screen renders with a non-empty `useUserCalendars()` list
- **THEN** it lists one row per calendar, each showing the effective display name and the
  school subtitle (or "Calendrier personnel" when absent)

#### Scenario: An empty or whitespace-only stored name renders the localized fallback
- **WHEN** a held calendar's stored name is empty or contains only whitespace
- **THEN** the row title renders the localized "Mon emploi du temps" / "My timetable"
- **AND** the stored value is left untouched

#### Scenario: A stored name is trimmed for display only
- **WHEN** a held calendar's stored name has leading or trailing whitespace around real text
- **THEN** the row title renders the trimmed text
- **AND** the stored value is unchanged

#### Scenario: An over-long legacy name still renders
- **WHEN** a held calendar's stored name exceeds the 100-character input maximum
- **THEN** it renders as stored
- **AND** no validation error or truncation is applied to the existing row

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

### Requirement: Each row carries a native visibility switch that toggles the calendar's `visible` flag

Each calendar row SHALL carry a native React Native `Switch` whose value is derived from the
screen-owned optimistic visibility operation for that calendar ID, falling back to the reactive
canonical `visible` value when no operation remains. The switch SHALL expose the translated
calendar-specific accessibility label and visibility hint, a calendar-ID testID, the existing
theme track/thumb colors, a minimum 44-point target, and a large-font layout that places the
control below the label without duplicating controller state locally. The redundant short label
SHALL remain hidden from assistive technology.

Activating the switch SHALL request `setVisible(id, nextValue)` through the existing
observability-wrapped actions hook. The screen-owned controller SHALL render the target
optimistically, ignore further events for that calendar while its write is unresolved, retain a
successful target until the reactive read acknowledges it, and reveal the latest canonical value
on failure. Acknowledgement SHALL retire the operation without a passive reset effect so a later
external canonical change renders immediately. The switch SHALL NOT explicitly announce a
successful change because its native checked-state change is announced by the platform.

#### Scenario: Toggling a visible calendar hides it optimistically

- **WHEN** the native switch for a visible calendar emits `false`
- **THEN** `setVisible(id, false)` runs once and the switch renders off immediately
- **AND** the target remains rendered until acknowledgement or failure

#### Scenario: Toggling a hidden calendar shows it optimistically

- **WHEN** the native switch for a hidden calendar emits `true`
- **THEN** `setVisible(id, true)` runs once and the switch renders on immediately

#### Scenario: The native switch exposes accessible state and instructions

- **WHEN** assistive technology reads the visibility control
- **THEN** the native switch conveys its checked state
- **AND** its translated label names the calendar and its hint explains the Home/Calendar effect
- **AND** the redundant short visual label is hidden from assistive technology

#### Scenario: Large text preserves a usable switch target

- **WHEN** the font scale reaches the existing large-text breakpoint
- **THEN** the label and switch stack without shrinking the switch below its touch target

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

The Rename action SHALL preserve its existing localized title, accessibility meaning, and `rename`
id while displaying platform-native iconography: an appropriate SF Symbol on iOS and a Material
Symbol on Android. The Delete action SHALL retain its existing title, destructive attribute, and
icon behavior.

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
the resolved write, and NO undo). Choosing Rename SHALL open the controlled platform-native rename
dialog.

#### Scenario: The menu exposes the same two actions with native icons on both platforms

- **WHEN** the screen renders with `Platform.OS === "ios"` and again with `Platform.OS === "android"`
- **THEN** each row renders one overflow trigger whose menu carries exactly Rename and Delete
- **AND** Rename uses an SF Symbol on iOS and a Material Symbol image on Android without changing its label or id
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

Selecting Rename SHALL mount one controlled `NativeTextEntryDialog` contract from
`@/components/chrome`. The seam SHALL privately compose native SwiftUI text entry, text/progress,
and button controls on iOS and Material 3 `AlertDialog`, text entry, text/progress, and button
controls on Android. Feature code SHALL NOT import platform-specific Expo UI modules or render
app-styled `TextInput`/`Pressable` substitutes for the dialog field and actions.

The rename feature SHALL seed the native text buffer **once, from `trim(current name)`**, when the
dialog mounts. That buffer SHALL remain independent of the reactive `useLiveQuery` row, SHALL retain
fast typed input across pending and error rerenders, and SHALL provide the exact current draft when
Save or Retry is invoked. The dialog SHALL:

- expose the field with the localized `userCalendars.rename.label` and effective-name fallback placeholder;
- reject a value whose trimmed length exceeds 100 characters with inline, screen-reader-announced validation text, blocking submission while invalid without truncating the draft;
- accept an empty or whitespace value as legal;
- disable repeat submission and expose a native busy state while the request is pending, without removing the field, draft, Cancel action, or Save action from the native composition;
- on failure, remain open with the draft intact, show the inline recoverable error, and offer native Retry and Cancel actions;
- announce success only after server success and local persistence have resolved, then dismiss;
- dismiss only for explicit Cancel (including Android hardware Back as a cancel action) or resolved success; tapping outside SHALL not dismiss on either platform;
- retain stable selectors `user-calendar-rename-dialog`, `user-calendar-rename-input`, `user-calendar-rename-save`, and `user-calendar-rename-cancel`, plus a dialog title distinct from the menu action string;
- isolate VoiceOver/TalkBack focus from the calendar list behind it and remain usable at compact width, after rotation, and with Dynamic Type; and
- keep the native field and Cancel/Save actions visible and reachable while the keyboard is open.

#### Scenario: iOS renders controlled SwiftUI composition

- **WHEN** Rename opens on iOS
- **THEN** the dialog field and actions are SwiftUI native controls behind the chrome seam
- **AND** the controlled modal isolates background focus, ignores backdrop taps, adapts to the keyboard and compact width, and retains the stable selectors

#### Scenario: Android renders controlled Material 3 composition

- **WHEN** Rename opens on Android
- **THEN** a Material 3 native dialog renders native text entry and button actions behind the chrome seam
- **AND** outside taps are inert while hardware Back follows the explicit cancel path and the IME does not cover the field or actions

#### Scenario: A name over the normalized maximum is rejected locally

- **WHEN** the user enters a value whose trimmed length is 101 characters
- **THEN** inline validation text is shown and announced, Save is disabled, and no request is issued
- **AND** the field retains all 101 characters so the user can edit the invalid value

#### Scenario: A 100-character name and an empty name are both accepted

- **WHEN** the user enters exactly 100 trimmed characters, or clears the field entirely
- **THEN** Save is enabled and the request is issued with the current native draft

#### Scenario: Pending submission remains single-flight and reachable

- **WHEN** Save starts a rename request while the keyboard is open
- **THEN** repeat submission is disabled and a native busy state is exposed
- **AND** the field, draft, Cancel action, and Save action remain visible in the native dialog composition

#### Scenario: A failed rename keeps the dialog, the text, and the old local name

- **WHEN** the rename request rejects (offline, server error, or an unknown token)
- **THEN** the dialog stays open with the entered text still visible, shows the recoverable error
  with Retry and Cancel, and the calendar's local name is unchanged
- **AND** the calendar is NOT removed locally, whatever the failure

#### Scenario: Retry after a failure reissues the same request

- **WHEN** the user presses Retry after a failure
- **THEN** the dialog returns to `pending` and reissues the rename with the retained native draft

#### Scenario: Cancel and dismissal policy preserve explicit ownership

- **WHEN** the user presses Cancel, invokes Android hardware Back, or taps outside the dialog
- **THEN** Cancel and hardware Back close the dialog without a new write, while an outside tap does nothing
- **AND** a late completion after cancellation does not issue a second close or success announcement

#### Scenario: Successful persistence owns announcement and close

- **WHEN** the rename request and local persistence both resolve successfully
- **THEN** the localized success message is announced exactly after persistence succeeds
- **AND** the dialog then closes and the row reflects the persisted server response through existing cache semantics

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
calendar-name label the app renders — the list rows, the rename dialog, the delete-confirmation
message, and the event-details calendar label. The localized
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

### Requirement: The non-empty user-calendar collection is virtualized without changing surrounding states

The management screen SHALL render a non-empty held-calendar collection through one React Native virtualized list keyed by `calendar.id`. The list SHALL own the existing visibility-description header, row rendering, inter-row spacing, ordinary bottom padding, and additional Android FAB clearance. The unresolved-read blank state, centered loaded-empty state, accessible write-error notice, safe-area width and horizontal insets, Android FAB, and rename dialog SHALL preserve their existing layout and lifecycle outside the virtualized collection.

#### Scenario: A populated collection uses id-keyed virtualization

- **WHEN** the loaded management screen receives one or more held calendars
- **THEN** it renders them through a virtualized list whose item keys are their calendar ids
- **AND** it does not wrap that list in another vertical scroll container

#### Scenario: The list preserves its header and platform clearance

- **WHEN** the populated list renders on either platform
- **THEN** the visibility-description copy scrolls as the list header
- **AND** the existing bottom padding is preserved
- **AND** Android retains additional clearance so the final row does not sit beneath the FAB

#### Scenario: Non-list states retain their composition

- **WHEN** the read is unresolved, resolves empty, or a write failure is present
- **THEN** the screen preserves the existing blank, centered empty, and accessible error behavior respectively
- **AND** safe-area insets, the add affordance, and rename-dialog mounting are unchanged

### Requirement: Calendar-management UI ownership remains bounded and internal

The user-calendar management surface SHALL separate screen composition, calendar row/menu presentation, and visibility control/coordination into focused modules within `calendar-sources/ui`. No component in this surface SHALL be materially above 200 lines. The extraction SHALL preserve the existing public UI and feature barrels and SHALL obey the feature-sublayer and calendar-sources leaf boundaries.

#### Scenario: Extracted modules preserve the public surface

- **WHEN** the refactor is applied
- **THEN** `UserCalendarsScreen` remains available from the existing public barrels
- **AND** row/menu and visibility implementation details remain internal to `calendar-sources/ui`
- **AND** no component in the surface is materially above 200 lines

#### Scenario: The feature remains a dependency leaf

- **WHEN** lint evaluates the extracted modules
- **THEN** UI code reaches calendar-source data through its sibling data barrel
- **AND** no calendar-sources module imports Activity or bypasses the owned native-chrome seam

### Requirement: Optimistic visibility ordering is operation-keyed and survives row virtualization

Visibility presentation SHALL be coordinated above virtualized rows by per-calendar operation records keyed by calendar id. An accepted toggle SHALL render its target immediately and start at most one persistence write for that calendar while the write is unresolved. Repeated input during that pending write SHALL be ignored. A failed write SHALL remove only its current operation and reveal the latest canonical value. A successful write SHALL retain its optimistic target while the live query still exposes the pre-write canonical value; when canonical state acknowledges that target, the operation SHALL retire without a passive effect-driven state reset. Any later external canonical change SHALL render immediately, and an old async completion SHALL NOT change a newer operation or canonical result.

#### Scenario: Successful write remains optimistic before live-query echo

- **WHEN** a visible calendar is toggled off and persistence resolves successfully before canonical state changes
- **THEN** the switch renders off immediately and remains off while canonical state still reports on
- **AND** only one persistence write is issued

#### Scenario: Delayed canonical acknowledgement retires the operation

- **WHEN** a successful optimistic target is later emitted by the live query
- **THEN** the switch remains on that target without flashing the prior canonical value
- **AND** the acknowledged operation is retired

#### Scenario: Failed write rolls back to the latest canonical value

- **WHEN** persistence for the current optimistic operation reports failure
- **THEN** that operation is cleared
- **AND** the switch renders the latest canonical value
- **AND** the existing accessible write-failure notice remains available through the actions hook

#### Scenario: Rapid repeated input is ignored while pending

- **WHEN** the switch emits multiple repeated or opposing change events before the current write settles
- **THEN** exactly one persistence write runs for that calendar
- **AND** the displayed value remains the current operation's target

#### Scenario: Later external canonical change replaces acknowledged state

- **WHEN** canonical state acknowledges a successful target and later changes again externally
- **THEN** the switch renders the later canonical value immediately
- **AND** no retired optimistic value flashes or masks it

#### Scenario: Stale completion cannot overwrite newer state

- **WHEN** an async completion arrives for an operation id that is no longer current
- **THEN** the completion is ignored
- **AND** the current operation or canonical value remains displayed

#### Scenario: Virtualized row remount preserves an active operation

- **WHEN** a row unmounts and remounts while its write or canonical acknowledgement is outstanding
- **THEN** its displayed target and one-write-at-a-time guard remain owned by the id-keyed controller
- **AND** remounting does not start another write or reveal stale canonical state

### Requirement: The refactor retains focused regression and compiler evidence

Automated tests SHALL retain the existing behavior proofs for delete, rename, visibility, menu behavior on both platforms, accessibility, testIDs, translations, effective-name fallbacks, safe-area spacing, loading/empty/error states, and platform add affordances. New tests SHALL prove every optimistic ordering scenario above with controlled promises and canonical rerenders, without retries, extended query waits, or weakened matchers. React Doctor SHALL run against the changed files; its visibility-path try/finally finding SHALL be fixed only if single-flight release and explicit failure recovery remain clear and covered, and every remaining finding SHALL be classified rather than suppressed.

#### Scenario: Focused tests prove preserved behavior and async ordering

- **WHEN** focused Jest suites for the changed screen, row/menu, and visibility controller run
- **THEN** all preserved management behavior remains green
- **AND** successful acknowledgement, failed writes, rapid repeated input, delayed canonical echo, stale completion, remount, and later external canonical changes are covered

#### Scenario: Compiler findings are handled with evidence

- **WHEN** React Doctor runs on the changed files
- **THEN** the former try/finally bailout is either removed by an explicit tested rewrite or retained with a documented classification
- **AND** no finding is hidden by suppression without evidence

### Requirement: Calendar management uses semantic measured lanes
The user-calendar management screen SHALL align its collection and states to a measured standard
lane. The rename dialog SHALL use its platform-native width and keyboard-inset behavior behind the
shared chrome contract, without changing calendar-source behavior.

#### Scenario: Calendar collection is centered on a tablet
- **WHEN** user calendars are presented at tablet width
- **THEN** populated, loading, and empty collection content share the standard lane
- **AND** visibility, overflow, rename, delete, and add behavior remain unchanged

#### Scenario: Rename content adapts within its native dialog
- **WHEN** the rename dialog is presented at tablet width
- **THEN** the platform-native composition keeps its field and actions readable and reachable
- **AND** focus isolation, validation, pending, retry, cancel, and save behavior remain unchanged

### Requirement: Calendar-management top rhythm scrolls with populated content

The calendar-management route SHALL retain one standard-lane `RootPage` and one id-keyed `FlatList`, but the populated branch's shared first-content top inset SHALL belong to the list's scrollable content rather than a persistent wrapper above the list. At the initial offset the visibility caption SHALL begin at the shared tokenized distance below the native header. During scrolling, the caption, inset, and rows SHALL move together and content SHALL clip directly at the page boundary beneath the header without a persistent empty band.

The unresolved-read blank state, centered loaded-empty state, accessible write-error notice, platform-safe bottom and horizontal insets, measured tablet lane, row gap, ordinary list bottom padding, Android FAB clearance, iOS header add action, Android FAB, and conditional rename-dialog mounting SHALL retain their current ownership and geometry. The change SHALL NOT add a scroller, automatic top-safe-area inset, sticky spacer, negative offset, or global `RootPage` behavior change.

#### Scenario: Initial populated content uses the shared first-content inset

- **WHEN** calendar management first renders one or more held calendars at scroll offset zero
- **THEN** the visibility caption begins at the shared tokenized first-content distance below native chrome
- **AND** the list remains the sole vertical scroll owner in the measured standard lane

#### Scenario: Scrolled rows clip directly below native chrome

- **WHEN** the populated calendar list scrolls past its caption and initial inset
- **THEN** rows clip at the list viewport directly beneath the native header
- **AND** no non-scrolling empty band remains between the header and scrolling content

#### Scenario: Non-list states and platform clearance remain correct

- **WHEN** the screen is unresolved, loaded empty, showing a write error, rendered on a tablet, or rendered with a bottom safe-area/platform add action
- **THEN** each state retains its current centered/accessible/lane/safe-area behavior
- **AND** the final row remains clear of ordinary bottom insets and the Android FAB
