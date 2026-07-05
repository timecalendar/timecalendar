# mobile-user-calendars Specification

## Purpose
TBD - created by archiving change add-mobile-user-calendars. Update Purpose after archive.
## Requirements
### Requirement: A reachable "Mes calendriers" management screen lists every held calendar

The app SHALL provide a presentational user-calendars management screen (and a
deep-linkable thin route, a `Stack` sibling of the tabs, reached from a Profile entry link)
that reads the reactive `useUserCalendars()` list and renders one row per held calendar.
Each row SHALL show the calendar's name (falling back to a "Calendrier" placeholder when
empty) as the title and its `schoolName` (falling back to "Calendrier personnel" when
absent) as the subtitle — Flutter `user_calendar_list_item.dart` parity. When no calendars
are held the screen SHALL render an accessible empty state (a `textSecondary` line that is a
polite live region with a `text` role), not a crash or a blank. Each row SHALL be a plain
non-touchable container so its two controls (the visibility checkbox and the delete button)
never nest inside a parent touchable.

#### Scenario: The screen lists held calendars with name + school

- **WHEN** the management screen renders with a non-empty `useUserCalendars()` list
- **THEN** it lists one row per calendar, each showing the calendar name (or the "Calendrier"
  placeholder when empty) and the school subtitle (or "Calendrier personnel" when absent)

#### Scenario: Empty management state

- **WHEN** no calendars are held
- **THEN** the screen shows an accessible empty state (polite live region, text role), not a
  crash or a blank

#### Scenario: The management screen is reachable

- **WHEN** the user opens the Profile tab
- **THEN** a "Calendriers" / "Calendars" entry navigates to the management screen (also
  deep-linkable as a `Stack` sibling of the tabs)

### Requirement: Each row carries a visibility checkbox that toggles the calendar's `visible` flag

Each calendar row SHALL carry a leading visibility control implemented as a `Pressable`
with `accessibilityRole="checkbox"` and `accessibilityState={{ checked: visible }}`, whose
`accessibilityLabel` is the calendar's name and school (e.g. "{name}, {school}"). The
visible/hidden **state** SHALL live in `accessibilityState`, never in the label. Pressing
the control SHALL call `setVisible(id, !visible)` through the observability-wrapped actions
hook. The control SHALL NOT announce the change explicitly (the `checked`-state change
announces for free).

#### Scenario: Toggling a visible calendar hides it

- **WHEN** the user presses the checkbox of a currently-visible calendar
- **THEN** `setVisible(id, false)` runs and the reactive read re-renders the row as unchecked

#### Scenario: Toggling a hidden calendar shows it

- **WHEN** the user presses the checkbox of a currently-hidden calendar
- **THEN** `setVisible(id, true)` runs and the reactive read re-renders the row as checked

#### Scenario: The checkbox carries state in accessibilityState, not the label

- **WHEN** assistive tech reads the checkbox
- **THEN** the label conveys the calendar name and school and the checked/unchecked state is
  conveyed via `accessibilityState={{ checked }}`, with no "visible"/"hidden" wording baked
  into the label

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
`minHeight`/`minWidth` ≥44 + `hitSlop`, rendering a trash affordance that is cross-platform
(an iOS SF Symbol and a themed Android fallback, no blank button); (b) an **iOS-only** swipe
(the row wrapped in a swipeable with a trailing red trash action, gated on
`Platform.OS === "ios"`, whose full-swipe/open OPENS the confirm rather than instant-committing —
delete is non-undoable; Android gets no swipe); and (c) the row's
`accessibilityActions=[{ name: "delete", label }]` + `onAccessibilityAction` so VoiceOver/
TalkBack reach delete without the gesture (WCAG 2.5.1). There SHALL be NO undo (`remove()` is
irreversible).

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

#### Scenario: The accessibility action reaches delete without a gesture

- **WHEN** a screen-reader user invokes the row's "delete" accessibility action
- **THEN** the same `confirmDelete` opens the confirm (the swipe path is non-exclusionary)

#### Scenario: Android has no swipe

- **WHEN** the screen renders on Android
- **THEN** no swipe-to-delete is wired (the visible button + accessibility action remain the
  delete paths)

### Requirement: An add affordance routes to school selection

The screen SHALL provide an accessible add affordance (a "+" / "Ajouter un calendrier"
control, `accessibilityRole="button"`, translated label) that navigates to school selection
(`/onboarding/school`) — Flutter FAB parity. The Profile onboarding entry remains a second
add path.

#### Scenario: The add control routes to school selection

- **WHEN** the user activates the add affordance
- **THEN** the app navigates to `/onboarding/school`

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

The observability-wrapped actions hook SHALL be covered under the K-3 90% logic gate (both
mutators' success and failure-record branches). The presentational management screen SHALL
meet the 70% floor: the list render, the empty state, the checkbox toggle wiring, the delete
button → `Alert` confirm/cancel branches, the `onAccessibilityAction` → confirm path, and
the write-failure notice — every branch machine-coverable via `jest.spyOn(Alert, "alert")` +
invoking the captured button `onPress` (NO gesture simulation). The raw iOS swipe gesture
SHALL NOT gate coverage (device-verified only). This change SHALL NOT add, modify, or
re-implement anything in `data/user-calendars/` beyond the new actions hook — the existing
`remove` / `setVisible` / `useUserCalendars` are reused as-is, with no new dependency, no new
Drizzle table, and no new migration.

#### Scenario: The actions hook and screen meet their coverage thresholds

- **WHEN** `npm test -- --coverage` runs in `mobile/`
- **THEN** the actions hook clears the 90% gate, the screen meets the 70% floor, and the suite
  is green

#### Scenario: The delete branches are covered without simulating the swipe

- **WHEN** the screen test spies on `Alert.alert` and invokes the captured confirm/cancel
  `onPress` plus the row's `onAccessibilityAction`
- **THEN** the confirm-deletes, cancel-does-nothing, and accessibility-action-opens-confirm
  branches are all asserted, and the raw swipe pan is not part of the coverage

#### Scenario: No new schema, dependency, or migration is introduced

- **WHEN** the change is applied
- **THEN** `data/user-calendars/` gains only the actions hook (+ barrel re-exports), and no
  new npm dependency, Drizzle table, or migration is added

