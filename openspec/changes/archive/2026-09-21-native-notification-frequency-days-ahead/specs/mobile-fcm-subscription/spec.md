## MODIFIED Requirements

### Requirement: Subscription-preferences sub-screen bound to the local store
The app SHALL provide a native notification preferences screen that exposes `frequency`, `nbDaysAhead`, and `isActive` through the project-owned `@/components/chrome` boundary. iOS SHALL use a SwiftUI grouped form, native switch, and Router-pushed checkmarked choice pages; Android SHALL use a Material list, native switch, and single-choice radio dialogs. The screen and child pages SHALL live in the notifications feature `ui/` sublayer behind thin `src/app/` route re-exports registered as root Stack siblings of `(tabs)`. Expo Router SHALL remain the only navigation owner, and each page SHALL have exactly one native scroll/inset owner. Feature UI SHALL consume the local preference/status hook and SHALL NOT access storage, the generated client, transport, or a route-scoped mutation directly. All controls and status actions SHALL carry localized accessible labels/state, and every user-facing string SHALL exist in both `en.json` and `fr.json`.

#### Scenario: The native screen reflects the local store
- **WHEN** the notification preferences screen mounts on iOS or Android
- **THEN** its switch and row summaries show the canonical locally stored `isActive`, `frequency`, and effective `nbDaysAhead`
- **AND** no universal select control or custom increment/decrement stepper is rendered

#### Scenario: Platform navigation and scroll ownership stay singular
- **WHEN** an iOS choice page or custom sheet is opened, or an Android dialog is shown
- **THEN** Expo Router remains the only navigation/presentation owner and the native form or list remains the page's only scroll/inset owner
- **AND** notification feature code imports no Expo UI platform package directly

#### Scenario: Turning notifications off retains the choices
- **WHEN** the student turns subscription intent off and later views or reenables it
- **THEN** the stored frequency and horizon remain unchanged and visible
- **AND** the switch makes no claim about device permission or delivery authorization

#### Scenario: A committed control change persists once and uses shared synchronization
- **WHEN** the student commits a frequency, preset horizon, custom horizon, or switch change
- **THEN** the matching local preference setter is invoked exactly once
- **AND** T05's single shared runtime owns dirty intent, remote synchronization, status, and Retry after any child route dismisses

## ADDED Requirements

### Requirement: Frequency uses native single-choice journeys
Frequency SHALL offer exactly Immediately, Hourly, and Daily, mapped to the unchanged `immediately | hourly | daily` preference values. iOS SHALL open a Router-pushed native checkmarked list and Android SHALL open a Material single-choice radio dialog. The currently stored frequency SHALL be the sole selected accessible choice. Selection SHALL commit locally immediately and return/dismiss according to platform convention; opening, native Back, Cancel, or dismissal without selection SHALL perform no write.

#### Scenario: iOS frequency selection commits and returns
- **WHEN** an iOS student opens Frequency and chooses Daily
- **THEN** `daily` is persisted exactly once, its row is selected accessibly, and the pushed page returns through Router

#### Scenario: Android frequency selection commits and dismisses
- **WHEN** an Android student opens Frequency and chooses Hourly
- **THEN** `hourly` is persisted exactly once, the dialog dismisses, and the parent summary shows Hourly

#### Scenario: Frequency cancellation is write-free
- **WHEN** a student opens the platform frequency choice surface and leaves by Back, Cancel, or dismissal without choosing
- **THEN** no frequency setter or synchronization intent is produced
- **AND** the prior selection remains displayed

### Requirement: Days-ahead presets preserve every valid stored value
Days ahead SHALL offer preset choices 1, 3, 7, 14, and 30 plus Custom. A stored preset-equivalent integer SHALL select that preset; every other valid stored integer from 1 through 30 SHALL select Custom and show its saved number in the Custom choice. The parent summary SHALL always show the effective saved number with correct French/English pluralization. Choosing a preset SHALL commit immediately exactly once; choosing Custom SHALL only open the numeric editor and SHALL NOT write a synthetic value.

#### Scenario: Preset-equivalent values select the preset
- **WHEN** the saved horizon is 1, 3, 7, 14, or 30 and the chooser opens
- **THEN** exactly the matching preset is selected
- **AND** Custom is not simultaneously selected

#### Scenario: Existing nonpreset value remains custom
- **WHEN** the saved horizon is 12 and the chooser opens
- **THEN** Custom is the sole selected choice and displays the localized equivalent of 12 days
- **AND** the parent summary also displays the effective value 12 without rewriting it

#### Scenario: Preset selection commits immediately
- **WHEN** the student chooses the 14-day preset
- **THEN** `14` is persisted exactly once and submitted through the shared runtime
- **AND** the platform choice surface returns or dismisses

#### Scenario: Opening Custom performs no preference write
- **WHEN** the student activates Custom from the horizon chooser
- **THEN** the custom editor opens from the current effective saved value
- **AND** no horizon setter or synchronization intent has yet occurred

### Requirement: Custom days validates a local draft before one explicit commit
Custom days SHALL use a Router-owned native iOS form sheet with explicit Cancel and Done actions or a Material Android numeric dialog with explicit Cancel and Save actions. The editor SHALL initialize a fresh local draft from the effective saved horizon each time it opens and SHALL use a numeric keyboard hint only as input assistance. Submission SHALL trim surrounding whitespace, require decimal digits, and accept only a whole numeric value from 1 through 30 without clamping. Blank, signed, fractional, exponent, nonnumeric, pasted invalid, and out-of-range drafts SHALL remain unpersisted and SHALL expose understandable localized validation. A valid confirmation SHALL persist the numeric value exactly once and dismiss; Cancel, iOS swipe dismissal, and Android Back SHALL discard the draft.

#### Scenario: Valid custom boundaries commit once
- **WHEN** the student confirms `1` or `30` in the custom editor
- **THEN** the numeric value is persisted exactly once and the editor dismisses
- **AND** reopening starts from that effective saved value

#### Scenario: Existing custom draft is seeded from storage
- **WHEN** the saved horizon is 12 and Custom is opened, edited, cancelled, and reopened
- **THEN** the reopened draft is `12`
- **AND** the cancelled edit never reached persistence or synchronization

#### Scenario: Invalid text cannot save or clamp
- **WHEN** the submitted draft is blank, fractional, signed, exponent notation, nonnumeric, pasted invalid text, below 1, or above 30
- **THEN** localized validation remains visible and the editor stays open
- **AND** no value is silently clamped, persisted, or submitted

#### Scenario: Dismissal discards the draft on each platform
- **WHEN** the student leaves through iOS Cancel or swipe dismissal, or Android Cancel or hardware Back
- **THEN** no horizon write occurs and the prior saved value remains canonical

### Requirement: Notification copy states intent and fixed processing truthfully
The native notification screen SHALL explain in French and English that the switch controls subscription intent for calendar changes rather than OS permission. Frequency copy SHALL state that immediate changes are processed every five minutes and daily changes are processed at 19:00 Paris time without guaranteeing exact arrival. Horizon copy SHALL describe the future calendar-change window and SHALL NOT imply that an event reminder is delivered the selected number of days before class. Labels, summaries, values, actions, validation, and accessibility copy SHALL use typed parity-checked translation keys with correct singular/plural forms.

#### Scenario: Daily and immediate descriptions match the fixed server schedule
- **WHEN** the student reviews frequency help or choices in either supported language
- **THEN** Daily names 19:00 Paris time and Immediate names five-minute processing
- **AND** neither promises exact notification delivery

#### Scenario: Horizon copy describes calendar-change coverage
- **WHEN** the student reviews the days-ahead control
- **THEN** the copy describes which upcoming calendar changes are included
- **AND** it does not describe reminder-alarm timing or device permission

### Requirement: Native notification controls retain shared save status across routes
The notification UI SHALL render T05's route-independent pending, prerequisite-waiting, retryable-error, and acknowledged states through a reusable feature-owned status presentation. Pushed choice pages MAY render the same shared presentation, and returning or dismissing any child SHALL reveal the current status and Retry on the parent without resetting it. A failed remote save SHALL retain the locally committed frequency or horizon. Remote acknowledgment copy SHALL remain distinct from permission approval and actual delivery.

#### Scenario: Status survives a pushed page unmount
- **WHEN** an iOS selection commits locally, synchronization fails, and the child route unmounts
- **THEN** the parent shows the same shared error and Retry action
- **AND** the committed local choice remains selected

#### Scenario: Android dialog dismissal does not erase status
- **WHEN** an Android selection dismisses its dialog while synchronization is pending or failed
- **THEN** the parent continues to show the shared pending or error state
- **AND** Retry still sends the latest current snapshot

### Requirement: Native notification controls are verified at behavior and contract boundaries
Automated tests SHALL cover pure preset classification and exact custom validation; both platform screen compositions; all frequency values and horizon presets; existing custom values including 1, 30, and a nonpreset; current selection; off-state retention; opening/cancelling/reopening Custom; invalid pasted drafts; exactly one commit on valid confirmation; shared status after child unmount; translated copy/plurals; thin routes; form-sheet registration; chrome-only Expo UI imports; and one native scroll/navigation owner. The ordinary CI-discovered Jest inventory SHALL include a focused proof that fails if selected-state derivation, cancellation write guards, or single-commit behavior regresses. Automated tests SHALL NOT claim native sheet geometry, keyboard reachability, swipe/Back feel, Dynamic Type, light/dark rendering, or screen-reader announcement quality.

#### Scenario: Host tests prove deterministic behavior
- **WHEN** the focused notification and chrome suites run in the mobile gate
- **THEN** every option, boundary, invalid draft, cancellation path, route contract, selected state, and setter cardinality is deterministic on both platform branches
- **AND** the DTO/generated client and server schedule remain unchanged

#### Scenario: Device-only evidence stays explicit
- **WHEN** automated notification control tests pass
- **THEN** they make no claim about native visual fidelity, physical keyboard/sheet behavior, large text, VoiceOver/TalkBack quality, or exact delivery
- **AND** those surfaces remain owner-led release acceptance under D05 rather than a separate repository merge gate
