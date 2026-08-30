## ADDED Requirements

### Requirement: The accepted trigger set is exactly five, each reaching Activity through its public barrel

Every event that makes Activity current SHALL call the Activity feature's public refresh operation, and no trigger SHALL issue a calendar-log request by any other path.

This requirement governs *which callers fire and by what import path*. The seam they call — its single-flight collapse, token bounds and failure classification — is governed by the `mobile-activity-refresh` capability and its coordinator ADR, not restated here.

The accepted triggers are exactly: the Activity screen's pull-to-refresh, a relevant push message, a successful calendar sync, opening the Activity screen, and the app returning to the foreground. Cold launch is served by the startup calendar sync's post-sync refresh and SHALL NOT add an independent request.

#### Scenario: A trigger reaches Activity through its public barrel

- **WHEN** the repository is linted and type-checked
- **THEN** no trigger outside the Activity feature imports the generated calendar-log client
- **AND** no trigger outside the Activity feature reaches Activity tables through the database seam

#### Scenario: Cold launch issues no independent Activity request

- **WHEN** the app starts and the startup calendar sync succeeds
- **THEN** exactly one Activity newest-page request is issued, caused by that sync
- **AND** no separate cold-launch trigger issues a second request

### Requirement: A successful calendar sync forces an Activity refresh after the events are stored

A calendar sync SHALL request a forced Activity refresh immediately after the local event write commits, and SHALL NOT wait for that refresh to settle.

The refresh SHALL NOT be requested when the sync issued no request because the device holds no calendar tokens, and SHALL NOT be requested when the local event write failed. The refresh SHALL be requested before the separate calendar-name convergence write, so that a failing name write cannot suppress it.

#### Scenario: Events are stored, then Activity is refreshed

- **WHEN** a calendar sync fetches events and its local event write commits
- **THEN** a forced Activity refresh is requested
- **AND** the sync does not await it before reporting that it finished

#### Scenario: A failed event write refreshes nothing

- **WHEN** a calendar sync's local event write throws
- **THEN** no Activity refresh is requested

#### Scenario: A device holding no calendars refreshes nothing

- **WHEN** a calendar sync finds no held calendar tokens and issues no request
- **THEN** no Activity refresh is requested

### Requirement: A calendar-sync success is never converted into a failure by an Activity refresh

A calendar sync's reported outcome SHALL be unaffected by the result of the Activity refresh it triggers.

The refresh operation resolves with an outcome and never rejects, so the sync SHALL neither await it nor inspect it, and a failed Activity refresh SHALL NOT set the sync's error state, SHALL NOT be recorded under a calendar-sync context, and SHALL NOT discard stored events.

#### Scenario: The Activity refresh fails after a successful sync

- **WHEN** a calendar sync stores its events and the triggered Activity refresh resolves with a failure outcome
- **THEN** the sync reports success
- **AND** the sync's error state stays false
- **AND** the stored calendar events are unchanged

### Requirement: A relevant push refreshes Activity independently of the calendar sync

A push message carrying a calendar-change or calendar-digest action SHALL request a forced Activity refresh independently of the calendar sync that the same message requests.

This SHALL hold for all three receipt states — a foreground message, a background tap, and a cold-start tap — and SHALL NOT be chained onto the sync's completion, so the refresh happens even when the sync request itself fails. Relevance SHALL be decided on the message's action, not on whether the message decoded to a navigation route, so a calendar-change message with an undecodable payload still refreshes Activity. Activity refresh SHALL NOT depend on the student's notification subscription preferences.

#### Scenario: A foreground calendar-change message refreshes Activity while the sync fails

- **WHEN** a foreground push carrying the calendar-change action arrives and the calendar sync request fails
- **THEN** a forced Activity refresh is still requested
- **AND** no navigation occurs

#### Scenario: A background tap refreshes Activity and routes

- **WHEN** a student taps a background calendar-change notification
- **THEN** a forced Activity refresh is requested
- **AND** the existing calendar routing for that message is performed unchanged

#### Scenario: A cold-start tap refreshes Activity

- **WHEN** the app is launched by tapping a calendar-digest notification
- **THEN** a forced Activity refresh is requested

#### Scenario: An undecodable payload still refreshes Activity

- **WHEN** a push carrying the calendar-change action arrives with a payload that cannot be decoded
- **THEN** a forced Activity refresh is requested
- **AND** no navigation occurs

#### Scenario: An unrelated push refreshes nothing

- **WHEN** a push carrying an action the app does not recognize arrives
- **THEN** no Activity refresh is requested

### Requirement: Existing calendar notification routing is unchanged

Adding the Activity trigger SHALL NOT change which screen a notification opens, when a notification navigates, or when a notification requests a calendar sync.

#### Scenario: Every established routing behavior still holds

- **WHEN** the notification routing tests run
- **THEN** a foreground message refetches without navigating
- **AND** a background or cold-start tap refetches and then opens the affected event for a new or edited change, or the calendar for a cancellation or a digest
- **AND** none of these behaviors required its existing test to be edited

### Requirement: Passive triggers refresh only outside the five-minute freshness window

Opening the Activity screen and the app returning to the foreground SHALL request a passive refresh, which issues a request only when the last successful refresh is older than five minutes.

The freshness comparison SHALL remain the refresh seam's, against its persisted last-success timestamp, so the window survives process death. A foreground refresh SHALL be requested only on a transition from the background state, never on a transition from the transient inactive state, and its failure SHALL be silent. A screen-open refresh's outcome SHALL be available to the screen so a failure can be shown, and SHALL NOT clear cached content.

#### Scenario: A recent success suppresses the passive request

- **WHEN** the Activity screen opens less than five minutes after the last successful refresh
- **THEN** no request is issued

#### Scenario: A stale last success issues one request

- **WHEN** the app returns to the foreground more than five minutes after the last successful refresh
- **THEN** exactly one request is issued

#### Scenario: Returning from the transient inactive state issues nothing

- **WHEN** the app moves to the inactive state and back to active without ever entering the background
- **THEN** no request is issued

#### Scenario: Pull-to-refresh always forces

- **WHEN** the student pulls to refresh on the Activity screen inside the freshness window
- **THEN** a request is issued
- **AND** the outcome is available to the screen, with cached content still rendered

### Requirement: Overlapping triggers produce exactly one newest-page request

Concurrent triggers SHALL result in exactly one newest-page request. Every invocation SHALL join the same in-flight refresh operation; screen-owned callers that await the operation SHALL receive its shared outcome, while silent host/runtime callers MAY deliberately ignore it.

#### Scenario: Four triggers overlap

- **WHEN** a push, a successful calendar sync, a screen open and a foreground return occur while one newest-page request is in flight
- **THEN** exactly one calendar-log search request is sent
- **AND** the screen-open caller receives that in-flight operation's outcome

### Requirement: Removing a calendar deletes its Activity history immediately

Removing a held calendar SHALL prune the cached Activity history to the calendars the device still holds, without waiting for a network request.

The pruned-to set SHALL be the authoritative post-removal held set, observed as a transition away from a previously observed held set — never an unqualified read that could be an unsettled or racing query. Calendars the student has hidden SHALL remain in the held set. The prune SHALL NOT move the read watermark, the unread count, the last-success timestamp, the pagination cursor, or the completion flag, and a failing prune SHALL be recorded without failing the removal.

#### Scenario: A removed calendar's history disappears offline

- **WHEN** the student removes one of two held calendars while the device is offline
- **THEN** that calendar's cached Activity rows are deleted
- **AND** the remaining calendar's rows and the stored read state are unchanged

#### Scenario: A hidden calendar's history survives

- **WHEN** the student hides a calendar rather than removing it
- **THEN** no Activity rows are pruned

#### Scenario: An unsettled first read prunes nothing

- **WHEN** the held-calendar read has not yet settled, or reports its first observed set
- **THEN** no prune runs, whatever that set contains

### Requirement: Trigger edges point outward from Activity's consumers

Calendar sync, notification handling and the root runtime SHALL depend on the Activity feature, and the Activity feature SHALL NOT depend on calendar internals.

The calendar-sources data layer SHALL NOT import the Activity feature, because the Activity data layer imports the calendar-sources data layer and the pair would form a module cycle. This SHALL be enforced by a lint rule rather than by convention.

#### Scenario: The dependency direction is enforced

- **WHEN** the repository is linted
- **THEN** an import of the Activity feature from the calendar-sources feature is reported as an error
- **AND** no Activity module imports calendar feature internals
