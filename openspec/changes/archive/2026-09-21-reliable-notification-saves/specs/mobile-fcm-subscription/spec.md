## MODIFIED Requirements

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

### Requirement: Failed subscription PUT is recorded and surfaced for retry
A rejected current-generation subscription PUT SHALL be recorded through the `@/firebase` unknown-error seam with a static notification context and no token, calendar identifier, DTO, input signature, or payload. The shared runtime SHALL surface retryable error on the preferences screen and SHALL retain dirty intent. A stale-generation failure SHALL perform no status, retry, acknowledgment, or diagnostic side effect for newer work. Reactive preference reads SHALL remain total and infallible.

#### Scenario: Current failure records and surfaces
- **WHEN** the current subscription PUT rejects
- **THEN** one sanitized error is recorded and shared status exposes Retry without clearing dirty intent

#### Scenario: Stale failure is inert
- **WHEN** an older request rejects after generation or runtime identity changed
- **THEN** it cannot replace current status, schedule a retry, or clear acknowledgment

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

## ADDED Requirements

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

## RENAMED Requirements

- FROM: `### Requirement: Re-registration on preference change and on token refresh`
- TO: `### Requirement: Re-registration on preference change and on current-input change`
- FROM: `### Requirement: First registration triggered after permission grant and token acquisition`
- TO: `### Requirement: First registration triggered after existing permission request behavior`
- FROM: `### Requirement: Subscription write wiring proven in CI; real server push is device-only`
- TO: `### Requirement: Subscription synchronization wiring proven in CI; real server push is device-only`
