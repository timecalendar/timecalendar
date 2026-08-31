## ADDED Requirements

### Requirement: Fresh-install Maestro proves skippable onboarding and zero-calendar personal use
The native Maestro suite SHALL include a shared iOS/Android fresh-install flow that starts with `launchApp: clearState: true` and no deep link, observes the onboarding welcome before Home or Calendar, confirms Skip through the shared dialog, creates a personal event with zero user calendars, and observes the first-iCal reminder on both Home and Calendar. Existing seeded imported-calendar and onboarding-success coverage SHALL remain green. The PR SHALL run the native Android and iOS jobs on the exact implementation head before merge.

#### Scenario: Clear state enters onboarding without a deep link
- **WHEN** the development-variant app launches after `clearState` with no URL
- **THEN** the welcome-first onboarding surface is visible
- **AND** no Home or Calendar assertion is reachable first

#### Scenario: Skip preserves personal-calendar use and reminder visibility
- **WHEN** the flow confirms Skip and creates a personal event
- **THEN** the event is durably observable with zero imported calendars
- **AND** the same first-iCal reminder is observed on Home and Calendar

#### Scenario: Existing import-success coverage remains
- **WHEN** the seeded token/import and onboarding-success flows run
- **THEN** a successful import resolves to eligible tabs with its calendar visible
- **AND** the reminder is absent while the calendar exists

#### Scenario: Both native platforms prove the exact head
- **WHEN** the implementation PR is ready for review
- **THEN** the `run-e2e` path has completed successfully on Android and iOS for the exact head SHA
- **AND** missing native evidence is implementation rework rather than a separate human or QA gate
