## ADDED Requirements

### Requirement: Backend reset invalidates notification synchronization work
The journaled backend reset SHALL invoke the notification runtime participant after backend work is quiesced and before committing the target environment. The participant SHALL advance runtime identity, cancel retry timers, abort the active subscription transport, detach live triggers, clear shared in-memory status, and remove backend-bound notification synchronization metadata idempotently. Any completion captured under the prior runtime/environment identity SHALL be inert even if its underlying server operation finishes after abort. Normal startup on the target SHALL create fresh dirty intent and SHALL rebuild only from target-environment current sources.

#### Scenario: Reset during a request makes its completion inert
- **WHEN** backend reset begins while a notification PUT is unresolved and that promise later succeeds or fails
- **THEN** the old completion cannot clear new intent, publish status, record an error, or schedule a retry

#### Scenario: Reset cancels timers and transport
- **WHEN** backend reset runs with an active retry timer or request
- **THEN** the timer is cleared, the request receives cancellation, and no old-runtime retry starts

#### Scenario: Reset participant is idempotent
- **WHEN** journal recovery invokes notification reset again after a partial reset
- **THEN** it completes safely with no retained runtime work or synchronization metadata

#### Scenario: Target startup uses target sources only
- **WHEN** reset completes and the target runtime starts
- **THEN** its first subscription DTO is rebuilt from current target-environment preferences, loaded calendars, token, locale, and effective zone
- **AND** no token, calendar payload, acknowledgment, or queued work from the prior environment is replayed
