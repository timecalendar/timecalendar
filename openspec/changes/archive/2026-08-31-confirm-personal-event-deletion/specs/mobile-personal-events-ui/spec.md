## ADDED Requirements

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
