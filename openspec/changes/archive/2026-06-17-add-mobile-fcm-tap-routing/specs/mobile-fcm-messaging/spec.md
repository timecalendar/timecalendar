## ADDED Requirements

### Requirement: Messaging seam exposes the notification-tap entrypoints
The `@/firebase` messaging seam SHALL expose two tap entrypoints, following the same lazy-resolve-native posture as the existing messaging helpers so that importing the seam never touches native code (Jest-safe): `onNotificationOpenedApp(handler)` — subscribes to a tap that brings the app from background to foreground and returns an unsubscribe function — and `getInitialNotification()` — resolves the notification that cold-started the app, or `null` when the app was not launched from a notification. Both SHALL resolve the native messaging instance lazily inside their body and SHALL be mocked in the Jest setup so the seam stays native-free under test.

#### Scenario: Background-tap subscription
- **WHEN** `onNotificationOpenedApp` is called with a handler
- **THEN** the handler is invoked with the message when a backgrounded notification is tapped
- **AND** the call returns an unsubscribe function

#### Scenario: Cold-start notification resolves or is null
- **WHEN** `getInitialNotification` is awaited at launch
- **THEN** it resolves the launching notification message, or `null` if the app was not launched from a notification

#### Scenario: Importing the seam stays native-free
- **WHEN** `@/firebase` is imported under Jest
- **THEN** neither tap entrypoint resolves a native messaging instance at import time
