## MODIFIED Requirements

### Requirement: Notification taps route across all three app states

The app SHALL wire notification routing once using the `@/firebase` messaging entrypoints. A **foreground** `calendar_changed` or `calendar_digest` message SHALL trigger calendar sync/refetch and SHALL NOT navigate. A **background tap** (`onNotificationOpenedApp`) SHALL trigger sync/refetch and THEN navigate per `parseNotificationRoute`. The one **killed/cold-start** `getInitialNotification` read SHALL be owned by launch resolution: it SHALL settle before the Home/Calendar fallback becomes eligible, and a valid parsed event or Calendar target SHALL win over the stored startup tab while retaining the same sync/refetch and Activity-refresh behavior. A null or invalid initial route SHALL contribute no explicit intent and allow ordinary onboarding/default resolution. The refetch SHALL reuse the existing calendar sync seam, listener subscriptions SHALL be cleaned up on unmount, and native initial notification SHALL be consumed exactly once.

#### Scenario: Foreground refetches without navigating

- **WHEN** a `calendar_changed` or `calendar_digest` message arrives while the app is foregrounded
- **THEN** the calendar sync is triggered
- **AND** no navigation occurs

#### Scenario: A background tap refetches then navigates

- **WHEN** the user taps a `new`/`edit` `calendar_changed` notification from background
- **THEN** the calendar sync is triggered
- **AND** the app navigates to that event's `event-details/[uid]` route

#### Scenario: Cold-start tap wins over startup preference

- **WHEN** the app is killed and a valid event or Calendar notification launches it
- **THEN** the notification is consumed once, calendar sync is triggered, and its parsed destination is committed
- **AND** the launch coordinator does not replace it with Home, Calendar fallback, or onboarding

#### Scenario: A cancelled-event tap opens the calendar

- **WHEN** the user taps a `cancel` `calendar_changed` notification
- **THEN** the app navigates to the calendar route rather than a detail page

#### Scenario: A digest tap opens the calendar

- **WHEN** the user taps a `calendar_digest` notification from background or cold start
- **THEN** the calendar sync is triggered
- **AND** the app navigates to the calendar route

#### Scenario: No launch notification allows normal resolution

- **WHEN** the app cold-starts without an initial notification, or its payload yields no route
- **THEN** notification routing performs no notification navigation
- **AND** the launch coordinator continues with onboarding or the stored-tab fallback
