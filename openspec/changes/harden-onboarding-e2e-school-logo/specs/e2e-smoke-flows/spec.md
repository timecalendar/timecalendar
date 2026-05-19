## MODIFIED Requirements

### Requirement: Onboarding and add-school smoke flow

The app SHALL have an end-to-end test that exercises the onboarding screens and
entry into the add-school flow against the live backend. The flow SHALL be
deterministic: it MUST NOT depend on outbound DNS resolution, and a failed
school-logo image load MUST degrade gracefully to a placeholder rather than
surface a reported `FlutterError` that fails the test.

#### Scenario: A new user walks onboarding to school selection

- **WHEN** the app boots with no local calendar
- **THEN** the onboarding screens show, advancing through them reaches the school-selection screen, the two seeded schools load over a real `GET /schools` request, and tapping a school advances the add-school assistant flow to its next native screen

#### Scenario: A failed school-logo load does not fail the flow

- **WHEN** a seeded school's logo URL cannot be loaded
- **THEN** the `SchoolItem` widget renders the `assets/images/school.png` placeholder via an image error builder, no `FlutterError` is reported, and the onboarding flow continues to pass
- **AND** the seeded logo URLs resolve without any outbound DNS lookup, so the flow's outcome does not depend on emulator network behaviour
