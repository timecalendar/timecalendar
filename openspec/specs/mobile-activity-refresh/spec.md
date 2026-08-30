# mobile-activity-refresh Specification

## Purpose
TBD - created by archiving change add-mobile-activity-refresh-coordinator. Update Purpose after archive.
## Requirements
### Requirement: Every Activity trigger shares one refresh seam

The Activity feature SHALL expose its network operations from a single data seam, and no other module SHALL invoke the generated calendar-log client or reach Activity tables directly.

The seam SHALL offer a newest-page refresh that accepts a forced/passive distinction, an older-page load driven only by the Activity screen, and a standalone ownership prune. It SHALL read the device's calendar tokens and calendar ids through the calendar-sources public barrel, so the Activity feature depends outward on calendar sources and nothing depends inward on Activity internals.

The seam SHALL treat every calendar the device holds as held, including calendars the student has hidden. Visibility is a display preference and SHALL NOT reduce the held-calendar set.

#### Scenario: Only the Activity data layer reaches the generated client

- **WHEN** the repository is linted
- **THEN** no module outside the Activity data layer imports the generated calendar-log operation
- **AND** no module outside the Activity data layer reaches the Activity tables through the database seam

#### Scenario: A hidden calendar is still a held calendar

- **WHEN** a refresh runs on a device holding a visible calendar and a hidden calendar
- **THEN** both calendars' tokens are sent
- **AND** both calendars' ids are supplied as the held set, so neither calendar's cached history is pruned

### Requirement: No Activity request is issued outside the contract's token bounds

The seam SHALL issue a newest-page or older-page request only when the device holds between one and one hundred unique calendar tokens inclusive.

Outside that range no request SHALL be issued, no page SHALL be written, no prune SHALL run, and the last-successful-refresh timestamp SHALL NOT move, so that the next trigger retries as soon as the device holds a usable token set rather than being suppressed by the freshness window. The operation SHALL resolve with an outcome naming the skipped precondition.

This bound exists because the server answers a zero-token request with a success, not an error: on a newest page that success carries a zero unread count computed without any query, which would clear the unread badge of a student who has unread activity; on an older page it carries a null next cursor, which permanently marks the older-page chain complete with no code path able to clear it again.

The guard SHALL live on the request precondition. The seam SHALL NOT instead ignore a null next cursor on older pages, because a null next cursor is the legitimate final-page signal.

#### Scenario: A device holding no calendars issues no request

- **WHEN** a newest-page refresh is triggered and the device's token list resolves empty
- **THEN** no network request is issued
- **AND** the last-successful-refresh timestamp is unchanged
- **AND** the operation resolves with the no-calendars outcome

#### Scenario: A stored unread count survives a refresh attempted with no calendars

- **WHEN** a stored unread count is non-zero and a refresh is triggered while the device's token list resolves empty
- **THEN** the stored unread count is unchanged
- **AND** the cached Activity rows are unchanged

#### Scenario: An older-page load with no calendars cannot end the chain

- **WHEN** an older-page load is triggered while the device's token list resolves empty
- **THEN** no network request is issued
- **AND** the older-page cursor and the older-page completion flag are unchanged

#### Scenario: A token set above the contract bound issues no request

- **WHEN** the device holds more than one hundred unique calendar tokens
- **THEN** no request is issued, because the endpoint rejects that request unconditionally
- **AND** the last-successful-refresh timestamp is unchanged

### Requirement: One refresh policy governs every trigger

A forced newest-page refresh SHALL always issue a request. A passive newest-page refresh SHALL issue a request only when the last successful refresh is older than five minutes, and SHALL otherwise resolve as already fresh without issuing one.

The freshness comparison SHALL read the persisted last-successful-refresh timestamp, so a cold launch does not reset the window.

Concurrent triggers SHALL join one in-flight newest-page request and SHALL receive that request's outcome, including its failure classification. The forced/passive distinction of a joining trigger SHALL NOT restart or duplicate a request already in flight.

A passive refresh that is satisfied by freshness SHALL NOT be observable as a completed request to a later forced trigger.

Older-page loading SHALL use a separate in-flight slot from newest-page refresh, so an older-page request can neither block nor be blocked by a forced newest-page request.

#### Scenario: A passive trigger inside the freshness window issues no request

- **WHEN** a passive refresh is triggered and the last successful refresh is less than five minutes old on a controlled clock
- **THEN** no request is issued and the operation resolves as already fresh

#### Scenario: A passive trigger outside the freshness window issues a request

- **WHEN** a passive refresh is triggered and the last successful refresh is more than five minutes old on a controlled clock
- **THEN** exactly one request is issued

#### Scenario: A forced trigger ignores the freshness window

- **WHEN** a forced refresh is triggered immediately after a successful refresh
- **THEN** a request is issued

#### Scenario: Overlapping triggers issue exactly one request

- **WHEN** several newest-page triggers, forced and passive, are started while a newest-page request is in flight
- **THEN** exactly one network request is issued
- **AND** every caller resolves with that request's outcome

#### Scenario: An older-page load does not block a forced refresh

- **WHEN** a forced newest-page refresh is triggered while an older-page request is in flight
- **THEN** the newest-page request is issued without waiting for the older-page request

### Requirement: The unread count is stored only when the request asked for it

A newest-page request SHALL send the stored read watermark as the unread-since bound whenever a watermark is stored, and SHALL send no unread-since bound when none is stored. An older-page request SHALL never send one.

The seam SHALL supply an unread count to the page write only when the request it issued actually carried an unread-since bound. It SHALL branch on what the request sent, never on whether the response carried the field, because the server emits a zero unread count on a request that did not ask for one.

The seam SHALL NOT write the read watermark on any path. Advancing the watermark belongs to the read action on the Activity screen, so that a background refresh can never mark unseen changes as read.

#### Scenario: A passive refresh stores the server unread count without moving the watermark

- **WHEN** a passive newest-page refresh succeeds while a read watermark is stored
- **THEN** the request carried the stored watermark as its unread-since bound
- **AND** the response's exact unread count is stored
- **AND** the stored read watermark is unchanged

#### Scenario: An older page never disturbs the unread count

- **WHEN** an older-page load succeeds
- **THEN** the request carried no unread-since bound
- **AND** the stored unread count is unchanged rather than reset to zero

#### Scenario: No refresh path writes the read watermark

- **WHEN** any newest-page or older-page operation completes, successfully or not
- **THEN** the stored read watermark is unchanged

### Requirement: Pagination advances only on a stored page, and a rejected cursor resets the chain

An older-page load SHALL use the stored older-page cursor, SHALL resolve as complete without a request when the chain is already complete, and SHALL resolve as unavailable without a request when no cursor is stored yet.

The seam SHALL treat a rejected cursor as exactly one condition: an HTTP 400 response to an older-page request. On that condition it SHALL clear the stored cursor and reset the chain so pagination restarts from the newest page, SHALL delete no cached rows, and SHALL report the reset to its caller.

The seam SHALL NOT infer a dead chain from the response's snapshot time, from an empty page, or from a null next cursor. The response's snapshot time on a following page is the client's own cursor value echoed back and therefore carries no liveness information; a null next cursor is the final page.

An HTTP 400 answering a newest-page request SHALL NOT be routed into cursor recovery, because that request carries no cursor.

#### Scenario: A rejected cursor resets the chain without losing history

- **WHEN** an older-page request is answered with HTTP 400
- **THEN** the stored older-page cursor is cleared and the chain is no longer marked complete
- **AND** every cached Activity row is still present
- **AND** the caller is told the cursor was reset

#### Scenario: A final page ends the chain without resetting it

- **WHEN** an older-page request succeeds with a null next cursor
- **THEN** the chain is marked complete
- **AND** the cursor is not treated as rejected and no restart is requested

#### Scenario: A completed chain issues no further requests

- **WHEN** an older-page load is triggered and the chain is already complete
- **THEN** no request is issued

#### Scenario: A newest-page rejection is not cursor recovery

- **WHEN** a newest-page request is answered with HTTP 400
- **THEN** the stored older-page cursor and completion flag are unchanged
- **AND** the failure is recorded as unexpected

### Requirement: Refresh failures are classified and never propagate as rejections

Every newest-page and older-page operation SHALL resolve with an outcome and SHALL NOT reject, so a caller cannot convert an Activity failure into its own failure. In particular a successful calendar sync SHALL NOT become a failed calendar sync because the Activity refresh that followed it failed.

The seam SHALL distinguish a network fault, a server response fault, a malformed response, and a local storage fault. It SHALL NOT classify a fault by whether a screen is visible: the trigger's caller decides whether a failure is user-visible, per the refresh policy.

A response SHALL be treated as malformed, and SHALL NOT be written or counted as a success, when its snapshot time cannot be parsed or its items or next cursor do not match the contract's types. The snapshot time is the trusted clock for local retention, so a page whose snapshot time is unreadable is not a successful page.

No failure SHALL move the last-successful-refresh timestamp and no failure SHALL remove cached rows, so a later trigger retries and the student keeps their last-good history.

A malformed response, a local storage fault, and a newest-page HTTP 400 SHALL each be recorded once through the unexpected-error path with a static context and no payload. A network fault and an ordinary server response fault SHALL NOT be recorded, being expected conditions on a mobile device.

No recorded value, analytics event, or log message SHALL contain a calendar token, a cursor value, a calendar name, a calendar id, a log id, a request body, or any event title, location, or description.

#### Scenario: A network failure preserves cached history and retries later

- **WHEN** a newest-page refresh fails because the request throws
- **THEN** the operation resolves with a network fault rather than rejecting
- **AND** the cached rows, the unread count, and the last-successful-refresh timestamp are unchanged

#### Scenario: A storage failure resolves rather than rejecting

- **WHEN** the page write throws
- **THEN** the operation resolves with a storage fault
- **AND** the last-successful-refresh timestamp is unchanged

#### Scenario: An unreadable snapshot time is not a successful refresh

- **WHEN** a response arrives with a snapshot time that cannot be parsed
- **THEN** no page is written
- **AND** the operation resolves with a malformed-response fault
- **AND** the last-successful-refresh timestamp is unchanged

#### Scenario: Expected faults are not recorded and unexpected faults are

- **WHEN** a refresh fails with a network fault and another fails with a malformed response
- **THEN** the network fault produces no unexpected-error record
- **AND** the malformed response produces exactly one record carrying a static context and no payload

#### Scenario: No sensitive value reaches an error record

- **WHEN** any Activity failure is recorded
- **THEN** the recorded value contains no calendar token, cursor value, calendar name, calendar id, log id, request body, or event content

### Requirement: The Activity request bypasses the query cache and uses the shared request seam

The seam SHALL issue its request through the single shared fetch mutator by way of the generated calendar-log operation, and SHALL NOT introduce a second request path.

The seam SHALL NOT use the React Query client for Activity requests, so no Activity result can enter the persisted query cache. SQLite remains the only source of truth for rendered history and unread metadata.

The page size SHALL be sent explicitly as a named constant rather than left to the server's default, so the client's payload bound is visible in the client's own source and is the single value the capacity gate adjusts.

#### Scenario: A refresh adds nothing to the query cache

- **WHEN** a newest-page refresh succeeds
- **THEN** no Activity entry exists in the query cache
- **AND** the rendered history is read from the local database

#### Scenario: The request carries an explicit page size

- **WHEN** any Activity request is issued
- **THEN** it carries the page-size constant defined by the Activity data layer

