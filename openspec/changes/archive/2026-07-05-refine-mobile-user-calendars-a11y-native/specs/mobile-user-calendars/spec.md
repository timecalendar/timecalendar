## MODIFIED Requirements

### Requirement: A reachable "Mes calendriers" management screen lists every held calendar

The app SHALL provide a presentational user-calendars management screen (and a
deep-linkable thin route, a `Stack` sibling of the tabs, reached from a Profile entry link)
that reads the reactive `useUserCalendars()` list and renders one row per held calendar.
Each row SHALL show the calendar's name (falling back to a "Calendrier" placeholder when
empty) as the title and its `schoolName` (falling back to "Calendrier personnel" when
absent) as the subtitle — Flutter `user_calendar_list_item.dart` parity. The row title
SHALL render as body weight (a `Platform.select` override), not the `ThemedText` default
that reads as emphasis. The empty state SHALL be gated on the read resolving: because
`useLiveQuery` starts with an empty array and resolves asynchronously, the screen SHALL
track a `loaded` flag (the `useLiveQuery` `updatedAt`, which is undefined until the first
resolve) and SHALL render neither the empty state nor any live region until the read has
loaded — so the empty state neither flashes nor false-announces "no calendars" on entry.
When loaded with no calendars the screen SHALL render an accessible, **centered** empty
state (a title + a `textSecondary` line that is a polite live region with a `text` role),
not a crash or a blank. Each row SHALL be a plain non-touchable container so its two
controls (the row-level visibility toggle and the delete button) never nest inside a parent
touchable, and the container SHALL NOT declare `accessible={true}` (which would flatten the
two-target design).

#### Scenario: The screen lists held calendars with name + school

- **WHEN** the management screen renders with a non-empty `useUserCalendars()` list
- **THEN** it lists one row per calendar, each showing the calendar name (or the "Calendrier"
  placeholder when empty) and the school subtitle (or "Calendrier personnel" when absent)

#### Scenario: The empty state waits for the read to resolve

- **WHEN** the management screen mounts before `useUserCalendars()` has resolved (not yet
  loaded)
- **THEN** neither the empty state nor its live region renders, so no "no calendars" is
  announced on entry

#### Scenario: Empty management state

- **WHEN** the read has resolved and no calendars are held
- **THEN** the screen shows an accessible, centered empty state (polite live region, text
  role), not a crash or a blank

#### Scenario: The management screen is reachable

- **WHEN** the user opens the Profile tab
- **THEN** a "Calendriers" / "Calendars" entry navigates to the management screen (also
  deep-linkable as a `Stack` sibling of the tabs)

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

### Requirement: Each row carries a confirm-gated delete reachable by button, iOS swipe, and an accessibility action, with no undo

Each row SHALL carry a delete affordance driven by a single shared `confirmDelete(id, name)`
handler that opens a native `Alert` (title + a "Êtes-vous sûr de vouloir supprimer le
calendrier {name} ?" message; a `cancel`-style Annuler and a `destructive`-style Supprimer),
and on the destructive confirm calls `remove(id)` through the observability-wrapped actions
hook. On a successful delete the app SHALL announce it via
`AccessibilityInfo.announceForAccessibility` (working on both platforms). Delete SHALL be
reachable through THREE paths, all calling the one `confirmDelete`: (a) a visible trailing
delete button on **both** platforms — a sibling `Pressable`, `accessibilityRole="button"`,
`accessibilityLabel="Supprimer le calendrier {name}"` (never a bare "Supprimer"),
`minHeight`/`minWidth` ≥44 + `hitSlop`, with a pressed-state affordance, rendering a trash
affordance that is cross-platform (an iOS SF Symbol and a themed Android
`userCalendars.delete.action` text label — a dedicated key decoupled from the Alert confirm
string, no blank button); (b) an **iOS-only** swipe (the row wrapped in a swipeable with a
trailing red trash action, gated on `Platform.OS === "ios"`, whose full-swipe/open OPENS the
confirm rather than instant-committing — delete is non-undoable; Android gets no swipe); and
(c) the **row-level toggle Pressable's** `accessibilityActions=[{ name: "delete", label }]` +
`onAccessibilityAction` so VoiceOver/TalkBack reach delete without the gesture (WCAG 2.5.1).
The accessibility action SHALL be declared on the toggle `Pressable` (a real accessibility
element assistive tech can reach), NOT on the plain row container `View` (a non-accessible
ancestor from which UIKit does not inherit custom actions — placing it there makes the action
dead on iOS). There SHALL be NO undo (`remove()` is irreversible).

#### Scenario: The visible delete button opens the confirm on both platforms

- **WHEN** the user presses the trailing delete button on iOS or Android
- **THEN** the native `Alert` confirm opens with the calendar name in the message and no
  deletion has happened yet

#### Scenario: Confirming the Alert deletes and announces

- **WHEN** the user chooses the destructive Supprimer in the confirm and the write succeeds
- **THEN** `remove(id)` runs and the deletion is announced via
  `AccessibilityInfo.announceForAccessibility`

#### Scenario: Cancelling the Alert deletes nothing

- **WHEN** the user chooses Annuler in the confirm
- **THEN** `remove(id)` is NOT called and the calendar remains

#### Scenario: The accessibility action on the toggle element reaches delete without a gesture

- **WHEN** a screen-reader user invokes the "delete" accessibility action on the row-level
  toggle element
- **THEN** the same `confirmDelete` opens the confirm (the action lives on a reachable
  accessibility element, so the swipe path is non-exclusionary on iOS as well as Android)

#### Scenario: Android has no swipe

- **WHEN** the screen renders on Android
- **THEN** no swipe-to-delete is wired (the visible button + accessibility action remain the
  delete paths)

### Requirement: An add affordance routes to school selection

The screen SHALL provide an accessible add affordance rendered as a **native header action**
(`Stack.Screen options.headerRight`) — a primary-tinted `smallBold` `Pressable` mirroring the
shipped event-details header-action pattern, with a short visible label
(`userCalendars.add.short`, "Add"/"Ajouter"), the full "Ajouter un calendrier" string kept as
its `accessibilityLabel`, `accessibilityRole="button"`, and a pressed-state affordance — that
navigates to school selection (`/onboarding/school`) — Flutter FAB parity. The add SHALL NOT
render as an off-platform in-body bordered text button. The Profile onboarding entry remains a
second add path.

#### Scenario: The add header action routes to school selection

- **WHEN** the user activates the header add action
- **THEN** the app navigates to `/onboarding/school`

#### Scenario: The add action is a native header action with a full accessible name

- **WHEN** assistive tech reads the add control
- **THEN** it is a header-right button whose visible label is the short "Add"/"Ajouter" and
  whose `accessibilityLabel` is the full "Ajouter un calendrier" string

### Requirement: The user-calendars UI is verified by automated tests under the coverage gate, and the existing data layer is reused unchanged

The observability-wrapped actions hook SHALL be covered under the K-3 90% logic gate (both
mutators' success and failure-record branches). The presentational management screen SHALL
meet the 70% floor: the list render, the gated/empty state, the toggle wiring, the delete
button → `Alert` confirm/cancel branches, the `onAccessibilityAction` → confirm path fired on
the **reachable toggle element**, and the write-failure notice — every branch machine-coverable
via `jest.spyOn(Alert, "alert")` + invoking the captured button `onPress` (NO gesture
simulation). The cancel-path test SHALL assert the `Alert` opened, that the cancel button is
`style: "cancel"`, and that it carries no `onPress`. A `Platform.OS === "android"` render test
SHALL cover the Android row shape (the bare row + the text delete affordance — jest runs the
iOS shape by default), and SHALL NOT lower screen coverage. The raw iOS swipe gesture SHALL
NOT gate coverage (device-verified only). This change SHALL NOT add, modify, or re-implement
anything in `data/user-calendars/` beyond memoizing the existing `useUserCalendars` reactive
read — the `remove` / `setVisible` repository writes are reused as-is, with no new dependency,
no new Drizzle table, and no new migration.

#### Scenario: The actions hook and screen meet their coverage thresholds

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** the actions hook clears the 90% gate, the screen meets the 70% floor, and the suite
  is green

#### Scenario: The delete branches are covered without simulating the swipe

- **WHEN** the screen test spies on `Alert.alert`, invokes the captured confirm/cancel
  `onPress`, and fires the row-level toggle element's `onAccessibilityAction`
- **THEN** the confirm-deletes, cancel-does-nothing (with the cancel button asserted
  `style: "cancel"` and no `onPress`), and accessibility-action-opens-confirm branches are all
  asserted, and the raw swipe pan is not part of the coverage

#### Scenario: The Android row shape is covered

- **WHEN** the screen test renders with `Platform.OS === "android"`
- **THEN** the Android row shape (no swipe wrapper, the text delete affordance) renders and is
  asserted

#### Scenario: No new schema, dependency, or migration is introduced

- **WHEN** the change is applied
- **THEN** `data/user-calendars/` gains only the `useMemo` on the existing read (+ no new
  exports), and no new npm dependency, Drizzle table, or migration is added

## ADDED Requirements

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
