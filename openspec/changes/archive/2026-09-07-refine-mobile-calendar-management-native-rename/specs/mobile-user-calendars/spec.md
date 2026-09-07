## ADDED Requirements

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

## MODIFIED Requirements

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
