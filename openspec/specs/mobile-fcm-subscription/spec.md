# mobile-fcm-subscription Specification

## Purpose
TBD - created by archiving change add-mobile-fcm-subscription. Update Purpose after archive.
## Requirements
### Requirement: Subscription preferences persisted locally as the source of truth
The app SHALL persist the notification-subscription preferences `frequency` (`immediately` | `hourly` | `daily`), `nbDaysAhead` (1..30), and `isActive` (boolean) in the MMKV `@/storage` seam under flat keys, as the **single source of truth**, because the server subscription API is PUT-only (create-or-update with NO GET) and therefore has no read-back. Reads SHALL go through total parsers that return the default for any unset, corrupt, legacy, or out-of-range value and SHALL never throw; `nbDaysAhead` SHALL be clamped to the range [1, 30] on read. The defaults SHALL be `frequency = "immediately"`, `nbDaysAhead = 7`, `isActive = true`. The preference store SHALL be the only place the notifications feature touches `@/storage`.

#### Scenario: A stored preference reads back
- **WHEN** a preference is written through the store and read again
- **THEN** the read returns the written value

#### Scenario: Defaults on an unset store
- **WHEN** no preference has been written
- **THEN** `frequency` reads `"immediately"`, `nbDaysAhead` reads `7`, and `isActive` reads `true`

#### Scenario: A corrupt or out-of-range value falls back / clamps
- **WHEN** a stored value is outside its allowed set (an unknown frequency, a non-boolean, or an `nbDaysAhead` below 1 or above 30)
- **THEN** the read returns the default (or the clamped 1..30 bound) without throwing

#### Scenario: The store survives a restart
- **WHEN** a preference is written, the store module is reloaded, and the preference is read
- **THEN** the previously written value is returned

### Requirement: FCM token registered with the backend via the generated PUT client
The app SHALL synchronize the device's notification subscription with the server through the already-generated plain `PUT /notification-subscription` function over the single `customFetch` mutator. One notification-feature runtime SHALL assemble `NotificationSubscriptionCreate` fresh for each attempt from the local preference store (`frequency` / `nbDaysAhead` / `isActive`), the current non-null FCM token, the loaded `user_calendars` rows' server ids, and the effective locale and display timezone accessors. The generated client SHALL be imported only in the feature's `data/` sublayer and SHALL NOT be regenerated or hand-edited. No screen hook SHALL own a generated mutation instance.

#### Scenario: Ready current sources produce one full DTO
- **WHEN** synchronization runs with a non-null token and a loaded calendar snapshot
- **THEN** the generated PUT receives the current preferences, token, calendar server ids, effective locale, and effective display timezone

#### Scenario: Missing token waits without acknowledgment
- **WHEN** the current FCM token is null
- **THEN** no PUT is sent, dirty intent remains durable, and shared status waits for registration

#### Scenario: Unloaded calendars do not masquerade as empty
- **WHEN** the calendar live query has not completed its first load
- **THEN** no PUT is sent and dirty intent waits for calendar readiness

#### Scenario: Loaded empty calendars are valid
- **WHEN** the calendar live query is loaded and contains no rows
- **THEN** the PUT is sent with `calendarIds: []`

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

### Requirement: Failed subscription PUT is recorded and surfaced for retry
A rejected current-generation subscription PUT SHALL be recorded through the `@/firebase` unknown-error seam with a static notification context and no token, calendar identifier, DTO, input signature, or payload. The shared runtime SHALL surface retryable error on the preferences screen and SHALL retain dirty intent. A stale-generation failure SHALL perform no status, retry, acknowledgment, or diagnostic side effect for newer work. Reactive preference reads SHALL remain total and infallible.

#### Scenario: Current failure records and surfaces
- **WHEN** the current subscription PUT rejects
- **THEN** one sanitized error is recorded and shared status exposes Retry without clearing dirty intent

#### Scenario: Stale failure is inert
- **WHEN** an older request rejects after generation or runtime identity changed
- **THEN** it cannot replace current status, schedule a retry, or clear acknowledgment

### Requirement: Re-registration on preference change and on current-input change
The single app-lifetime notification runtime SHALL invalidate older acknowledgments whenever a notification preference, FCM token, loaded calendar revision, effective locale, or effective display timezone changes. A preference mutation SHALL mark durable intent dirty before writing the local preference. Token, locale, zone, and calendar triggers SHALL feed the same owner and SHALL NOT create independent request lifecycles or duplicate token listeners. Startup SHALL invalidate once as an idempotent full-state backstop.

#### Scenario: Preference mutation is dirty before local write
- **WHEN** a notification preference is committed
- **THEN** the runtime increments durable generation and marks dirty before the preference setter runs
- **AND** synchronization reads the new current value after the write

#### Scenario: Current input invalidates an older request
- **WHEN** token, locale, effective zone, or loaded calendar membership changes while a PUT is active
- **THEN** the active request cannot acknowledge the newer generation
- **AND** one subsequent PUT uses the latest complete snapshot

#### Scenario: One token listener owns refresh
- **WHEN** both the root runtime and notification settings route are rendered
- **THEN** token refresh is subscribed exactly once by the root owner
- **AND** the screen owns no subscription PUT lifecycle

### Requirement: First registration triggered after existing permission request behavior
The app SHALL preserve the existing notification permission request timing and behavior, then start the single notification synchronization runtime at the app lifecycle boundary inside the query provider. The runtime SHALL remain mounted across child-route navigation, SHALL replay durable dirty intent at startup, and SHALL perform the existing cold-start full-state PUT backstop once prerequisites are ready.

#### Scenario: Startup mounts one synchronization owner
- **WHEN** the environment runtime gate admits normal app startup
- **THEN** one notification runtime is mounted after the existing permission request path
- **AND** dirty or cold-start intent is synchronized when token and calendars are ready

#### Scenario: Route dismissal does not dispose the owner
- **WHEN** the notification settings route closes while synchronization is pending or failed
- **THEN** the root runtime, durable intent, and shared status remain active

### Requirement: Subscription synchronization wiring proven in CI; real server push is device-only
Automated tests SHALL use an injected transport with controlled promises, recreated storage/runtime instances, fake timers, and root integration mounts to prove dirty-before-write crash recovery, restart replay, A-to-B coalescing, stale success/failure, token rotation, unloaded versus loaded-empty calendars, route unmount/remount, foreground/manual recovery, retry exhaustion, disposal, and reset during a request. A contract proof SHALL establish one PUT source and one token listener. Confirming real server delivery, OS authorization, or exact notification arrival remains device-only and SHALL NOT be inferred from these tests.

#### Scenario: Race and recovery transitions are deterministic
- **WHEN** focused controller tests settle controlled A and B requests in either order and advance retry timers
- **THEN** only the current generation can acknowledge intent and exhausted work stops without losing dirty state

#### Scenario: Integration owns one request source
- **WHEN** root and screen integration tests mount, navigate, rotate token, load calendars, foreground, and reset
- **THEN** all PUT triggers pass through the one runtime and old-environment completions are inert

#### Scenario: Real delivery is not asserted in CI
- **WHEN** the mobile test gate runs
- **THEN** it makes no claim that the OS authorized notifications or a real server push reached a device

### Requirement: Durable latest-state synchronization is serialized and generation-safe
The runtime SHALL persist only backend-bound dirty and monotonic-generation bookkeeping, SHALL keep at most one client request active, and SHALL coalesce changes during a request into the next latest current snapshot. It SHALL persist no FCM token, calendar identifier set, DTO, request payload, or job queue. A success SHALL clear dirty intent only when its captured generation and live runtime/environment epoch still equal the current values; failure SHALL never clear dirty intent.

#### Scenario: Earlier success cannot clear newer intent
- **WHEN** generation A is in flight and generation B is created before A succeeds
- **THEN** A's success does not clear dirty intent or publish B as acknowledged
- **AND** B's current snapshot is sent next

#### Scenario: Earlier failure cannot overwrite newer success
- **WHEN** generation A settles after a newer current generation has succeeded
- **THEN** A's failure is inert and does not replace the current acknowledged status or schedule a retry

#### Scenario: Crash between dirty mark and preference write converges
- **WHEN** the process stops after durable dirty generation is written but before its preference write
- **THEN** restart replays the complete current preference snapshot safely
- **AND** no partial DTO or token was persisted

#### Scenario: Dirty intent survives process restart
- **WHEN** a failed or interrupted current generation remains dirty and storage/runtime are recreated
- **THEN** startup restores pending or prerequisite-waiting state and retries the current full snapshot

### Requirement: Shared synchronization status and bounded recovery
The notifications feature SHALL expose one route-independent status distinguishing `pending`, prerequisite `waiting`, retryable `error`, and remotely `acknowledged` state. The existing notification settings screen SHALL render concise localized pending/waiting/error feedback from that shared state and SHALL expose Retry for an error. Copy SHALL NOT equate remote acknowledgment with OS permission or guaranteed delivery. Failures SHALL retain durable intent and use at most three automatic retries at 1, 5, and 30 seconds while the app is active; exhaustion SHALL stop timers without clearing intent. Startup, foreground, manual Retry, token/prerequisite availability, and relevant input changes SHALL resume the latest current snapshot.

#### Scenario: Status survives route remount
- **WHEN** a request fails, the notification route unmounts, and the route opens again
- **THEN** the same shared retryable error and Retry action are visible

#### Scenario: Automatic retries exhaust without spinning
- **WHEN** the initial attempt and all three active retry delays fail for the current generation
- **THEN** no further timer is scheduled, shared status remains retryable error, and durable dirty intent remains set

#### Scenario: Foreground and manual retry use current state
- **WHEN** dirty intent is paused or exhausted and the app foregrounds or the user activates Retry
- **THEN** the retry budget resets and synchronization rebuilds the latest snapshot rather than replaying an old payload

#### Scenario: Waiting prerequisites consume no retry budget
- **WHEN** token or calendar readiness is missing
- **THEN** the runtime schedules no retry timer and resumes only when a prerequisite/input/startup/foreground/manual trigger occurs

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

