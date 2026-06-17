## ADDED Requirements

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
The app SHALL register the device's FCM token with the server by calling the already-generated `PUT /notification-subscription` client (`useNotificationSubscriptionControllerCreateOrUpdateSubscription`) over the single `customFetch` mutator, assembling the `NotificationSubscriptionCreate` DTO from the local preference store (`frequency` / `nbDaysAhead` / `isActive`), the `fcmToken` from the `@/firebase` `getFcmToken` helper, and `calendarIds` taken from the durable `user_calendars` rows' server ids. The generated client SHALL be imported only in the feature's `data/` sublayer (never regenerated, never imported elsewhere). The PUT SHALL be idempotent — the full DTO is computed and sent fresh on each registration.

#### Scenario: Registration PUTs the assembled DTO
- **WHEN** a non-null FCM token is available and registration runs
- **THEN** the generated PUT mutation is invoked with a DTO carrying the local `frequency` / `nbDaysAhead` / `isActive`, the token as `fcmToken`, and the held calendars' server ids as `calendarIds`

#### Scenario: Null token defers registration
- **WHEN** `getFcmToken` resolves to null (e.g. iOS APNS not yet ready)
- **THEN** no PUT is sent and registration waits for the token-refresh path

#### Scenario: Zero held calendars still PUTs an empty set
- **WHEN** the user holds no calendars and registration runs with a non-null token
- **THEN** the PUT is sent with `calendarIds: []` (so the server can prune), not skipped

### Requirement: Re-registration on preference change and on token refresh
The app SHALL re-PUT the subscription idempotently whenever a preference changes and whenever the FCM token refreshes. A preference mutation SHALL write the local store first, then trigger a registration with the updated DTO. The token-refresh subscription (`@/firebase` `onFcmTokenRefresh`) SHALL trigger a registration with the new token.

#### Scenario: Changing a preference re-PUTs
- **WHEN** the user changes `frequency`, `nbDaysAhead`, or `isActive`
- **THEN** the local store is updated and a PUT is sent carrying the new value

#### Scenario: Token refresh re-PUTs
- **WHEN** the FCM token refreshes via `onFcmTokenRefresh`
- **THEN** a PUT is sent carrying the new token

### Requirement: First registration triggered after permission grant and token acquisition
The app SHALL trigger the first registration after requesting notification permission and acquiring a non-null FCM token, via a fire-and-forget once-effect mounted inside the query provider (mirroring the startup-sync trigger) so the generated mutation has the QueryClient in context. The trigger SHALL go through the feature `data/` hook and SHALL NOT import the generated client or `@/db` directly.

#### Scenario: First registration fires on a token
- **WHEN** the app starts, permission is requested, and a non-null token is acquired
- **THEN** the first PUT is sent

#### Scenario: Trigger is idempotent across cold starts
- **WHEN** the app cold-starts again
- **THEN** re-running the trigger re-PUTs the current local-store DTO without error or duplicate side effects

### Requirement: Subscription-preferences sub-screen bound to the local store
The app SHALL provide a preferences sub-screen that lets the user set `frequency` (immediately / hourly / daily), `nbDaysAhead` (a bounded 1..30 control), and `isActive` (a toggle), each bound to the local preference store and each committed change driving an idempotent re-PUT. The screen SHALL live in the notifications feature `ui/` sublayer with a thin `src/app/` route re-export (route-structure rule) reached as a Stack sibling of `(tabs)` from a Profile entry link. All controls SHALL carry accessible labels and roles, and all user-facing strings SHALL exist in both `en.json` and `fr.json`.

#### Scenario: The screen reflects the local store
- **WHEN** the preferences screen mounts
- **THEN** each control shows the value from the local preference store

#### Scenario: A control change persists and re-PUTs
- **WHEN** the user changes a control
- **THEN** the local store is updated and an idempotent PUT is sent with the new DTO

### Requirement: Failed subscription PUT is recorded and surfaced for retry
A rejected subscription PUT SHALL be recorded through the `@/firebase` `recordError` seam with a context tag and SHALL surface an accessible failure state with a Retry affordance on the preferences screen (a retryable network write whose silent failure breaks the user's reminders). The background/startup re-PUT SHALL record on failure without an on-screen surface and self-heal on the next change or token refresh. The reactive preference read SHALL be total and infallible (no record).

#### Scenario: A failed PUT records and surfaces
- **WHEN** the subscription PUT rejects while the preferences screen is showing
- **THEN** the error is recorded through `@/firebase` `recordError`
- **AND** an accessible failure state with a Retry control is shown

#### Scenario: Retry re-sends the PUT
- **WHEN** the user activates Retry after a failed PUT
- **THEN** the PUT is re-sent with the current DTO

### Requirement: Subscription write wiring proven in CI; real server push is device-only
The unit test suite SHALL drive the registration seam against the mocked `customFetch` mutator and assert: a PUT-on-change carries the new value, a re-PUT-on-token-refresh carries the new token, the local store persists and reads back (including a restart-simulation), and a rejected PUT records through `@/firebase` and sets the error state. Confirming that a real notification is delivered by the server as a result of the registration is NOT a CI gate — it is the device-only verification already recorded in the Ship-A push-delivery inbox note.

#### Scenario: Write paths asserted at the mutator
- **WHEN** the proof tests run with `customFetch` mocked
- **THEN** they assert the PUT-on-change, the re-PUT-on-token-refresh, the persist/read-back, and the failure → record + error-state paths

#### Scenario: Real delivery is not asserted in CI
- **WHEN** the test suite runs in CI
- **THEN** it does not assert that any real server-sent push was delivered to a device
