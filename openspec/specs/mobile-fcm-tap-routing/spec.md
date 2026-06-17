# mobile-fcm-tap-routing Specification

## Purpose
TBD - created by archiving change add-mobile-fcm-tap-routing. Update Purpose after archive.
## Requirements
### Requirement: Notification payload decoded to a route by a pure parser
The app SHALL decode an incoming FCM message into a navigation intent with a pure function `parseNotificationRoute(message)` that handles only the server's frozen `calendar_changed` contract — `data.action === "calendar_changed"` with `data.payload` a JSON string encoding `{ type, event }` where `type ∈ { NEW, CANCEL, EDIT }` and `event.uid` identifies the changed event. The parser SHALL return `{ kind: "event", uid }` for `NEW`/`EDIT`, `{ kind: "calendar" }` for `CANCEL`, and `null` for any message it does not handle (missing data, a non-`calendar_changed` action, an unparseable payload, or a missing `event.uid`). A JSON parse failure SHALL be recorded via the `@/firebase` `recordError` seam and SHALL yield `null` rather than throwing. The parser SHALL NOT import React, Expo Router, or any native module.

#### Scenario: A NEW/EDIT event routes to the event detail
- **WHEN** a `calendar_changed` message carries `type` `NEW` or `EDIT` with a non-empty `event.uid`
- **THEN** the parser returns `{ kind: "event", uid }` for that uid

#### Scenario: A CANCEL routes to the calendar
- **WHEN** a `calendar_changed` message carries `type` `CANCEL`
- **THEN** the parser returns `{ kind: "calendar" }`

#### Scenario: An unhandled message yields no route
- **WHEN** a message has no data, an action other than `calendar_changed`, or a missing `event.uid`
- **THEN** the parser returns `null`

#### Scenario: A malformed payload is recorded, not thrown
- **WHEN** a `calendar_changed` message's `payload` is not valid JSON
- **THEN** the parser records the error through `@/firebase` and returns `null`

### Requirement: Notification taps route across all three app states
The app SHALL wire a tap-routing dispatcher, mounted once in the root layout, that handles a `calendar_changed` notification in every app state using the `@/firebase` messaging entrypoints. A **foreground** message SHALL trigger a calendar sync/refetch and SHALL NOT navigate. A **background tap** (`onNotificationOpenedApp`) and a **killed/cold-start launch** (`getInitialNotification`, resolved after the root navigator has mounted) SHALL trigger a calendar sync/refetch and THEN navigate per `parseNotificationRoute` — `{ kind: "event", uid }` to the `event-details/[uid]` route, `{ kind: "calendar" }` to the calendar route. A `null` route or an absent initial notification SHALL be a safe no-op. The refetch SHALL reuse the existing calendar sync seam (no new sync path). Listener subscriptions SHALL be cleaned up on unmount.

#### Scenario: Foreground refetches without navigating
- **WHEN** a `calendar_changed` message arrives while the app is foregrounded
- **THEN** the calendar sync is triggered
- **AND** no navigation occurs

#### Scenario: A background/cold-start tap refetches then navigates
- **WHEN** the user taps a `NEW`/`EDIT` `calendar_changed` notification from background or a cold start
- **THEN** the calendar sync is triggered
- **AND** the app navigates to that event's `event-details/[uid]` route

#### Scenario: A cancelled-event tap opens the calendar
- **WHEN** the user taps a `CANCEL` `calendar_changed` notification
- **THEN** the app navigates to the calendar route rather than a detail page

#### Scenario: No launch notification is a no-op
- **WHEN** the app cold-starts without having been launched from a notification
- **THEN** the dispatcher performs no sync and no navigation

