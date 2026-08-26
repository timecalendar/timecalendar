## ADDED Requirements

### Requirement: OTA checks never block cold launch
The mobile app SHALL configure Expo Updates with `fallbackToCacheTimeout: 0` and SHALL NOT add update progress UI, a restart prompt, a dialog, or other user-facing text. A launch MUST continue with the cached or embedded bundle while update checking and downloading proceed in the background.

#### Scenario: Cold launch has no OTA wait
- **WHEN** the app cold-launches with no downloaded update ready
- **THEN** the app proceeds immediately with its cached or embedded bundle
- **AND** no OTA progress or prompt is shown

#### Scenario: Update discovery does not interrupt the foreground
- **WHEN** a compatible update is found and downloaded while the app remains active
- **THEN** the current JavaScript runtime continues without reloading
- **AND** the user sees no update UI

### Requirement: A downloaded update applies at a natural foreground boundary
The app SHALL request `reloadAsync()` only after `useUpdates()` reports a downloaded update pending and the mounted runtime has observed a real transition through `background` and back to `active`. Each qualifying JavaScript runtime SHALL make at most one reload attempt, and becoming pending while already active SHALL NOT reuse an earlier foreground boundary.

#### Scenario: Pending update waits while app stays foregrounded
- **WHEN** `isUpdatePending` becomes true while the app stays active
- **THEN** `reloadAsync()` is not called

#### Scenario: Pending update reloads after background and return
- **WHEN** an update is pending, the app enters `background`, and then returns to `active`
- **THEN** `reloadAsync()` is called exactly once

#### Scenario: Update downloaded after return waits for another boundary
- **WHEN** the app returns from `background` to `active` with no pending update and the update becomes pending afterward
- **THEN** the app does not reload immediately
- **AND** it waits for a subsequent real `background` to `active` transition

#### Scenario: Inactive alone is not a background boundary
- **WHEN** the app changes from `active` to `inactive` and back to `active` without entering `background`
- **THEN** `reloadAsync()` is not called

### Requirement: OTA runtime listener and failures are bounded
The OTA runtime SHALL own one AppState subscription, remove it on unmount, avoid listener churn when update state changes, and latch a reload attempt before invoking `reloadAsync()`. A rejected reload SHALL be recorded once through `@/firebase` under a constant context without personal data and SHALL NOT be retried in that JavaScript runtime.

#### Scenario: Update-state changes do not duplicate listeners
- **WHEN** `useUpdates()` changes from no pending update to a pending update
- **THEN** the existing AppState subscription observes the new state
- **AND** no second subscription is installed

#### Scenario: Duplicate foreground events do not duplicate reload
- **WHEN** multiple active events are emitted after one qualifying background transition
- **THEN** at most one `reloadAsync()` attempt is made

#### Scenario: Rejected reload is recorded safely
- **WHEN** `reloadAsync()` rejects
- **THEN** the error is passed to `recordUnknownError` with the constant context `ota/reload`
- **AND** no user, calendar, event, or schedule data is recorded
- **AND** another foreground event does not retry the reload in the same JavaScript runtime

#### Scenario: Runtime unmount removes its listener
- **WHEN** the OTA runtime component unmounts
- **THEN** its AppState subscription is removed
