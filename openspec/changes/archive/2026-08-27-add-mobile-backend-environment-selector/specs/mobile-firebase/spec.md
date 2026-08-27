## ADDED Requirements

### Requirement: Firebase records privacy-safe backend environment context

The app SHALL set the effective backend environment enum as a Crashlytics attribute through `@/firebase` after environment readiness resolves. After a successful confirmed switch, it SHALL emit one Analytics event with only `from_environment` and `to_environment` enum parameters. Cancellation and failed/partial resets SHALL NOT emit the successful-switch event. URLs, tokens, secrets, calendar/school identifiers, e-mail, and message content SHALL NOT be included.

#### Scenario: Runtime diagnostics identify preprod safely

- **WHEN** the app becomes ready with preprod effective
- **THEN** Crashlytics context identifies `preprod`
- **AND** it contains no endpoint or backend-bound user data

#### Scenario: Successful switch is recorded once

- **WHEN** a confirmed switch completes all reset participants and commits its target
- **THEN** one Analytics event records the from/to enum values
- **AND** cancellation or failure produces no successful-switch event
