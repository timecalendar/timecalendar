## MODIFIED Requirements

### Requirement: Foreground messages and token refresh are subscribable
The seam SHALL expose a foreground-message subscription (over messaging `onMessage`) and a
token-refresh subscription (over messaging `onTokenRefresh`); each SHALL accept a handler and
return an unsubscribe function. The token-refresh subscription SHALL be consumed by the
subscription-registration seam to re-register the device's FCM token with the backend whenever
the token refreshes (its first consumer); the seam's shape and posture are unchanged.

#### Scenario: Foreground subscription drives onMessage
- **WHEN** a handler is registered via the foreground-message helper
- **THEN** messaging `onMessage` is subscribed with a function that forwards the message to the handler
- **AND** the helper returns an unsubscribe function

#### Scenario: Token-refresh subscription drives onTokenRefresh
- **WHEN** a handler is registered via the token-refresh helper
- **THEN** messaging `onTokenRefresh` is subscribed
- **AND** the helper returns an unsubscribe function

#### Scenario: Token refresh re-registers the subscription with the backend
- **WHEN** the FCM token refreshes and the registration seam's handler runs
- **THEN** the subscription is re-PUT to the backend carrying the new token
