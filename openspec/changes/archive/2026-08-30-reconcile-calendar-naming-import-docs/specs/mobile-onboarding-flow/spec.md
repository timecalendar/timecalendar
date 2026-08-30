# mobile-onboarding-flow — delta

## MODIFIED Requirements

### Requirement: The welcome call-to-action navigates into the existing school step
The carousel SHALL expose Skip as a trailing top-bar text button on pages 1–2, Next as a trailing footer text button on pages 1–2, and a full-width filled final CTA on page 3. Skip and the final CTA SHALL push `/onboarding/school`. Next SHALL page forward through the native pager and SHALL use the non-animated pager method when reduced motion is enabled. Skip and Next SHALL be absent on the final page. The prior welcome QR and URL actions SHALL be removed from this screen without removing their routes or the school picker's iCal fallback. The QR and iCal-URL routes SHALL remain deep-linkable Stack siblings, now reached on the normal path from the manual-import step rather than from this screen. The group route SHALL remain registered and dev-deep-linkable but SHALL be reached by no navigation.

#### Scenario: Skip opens the school step
- **WHEN** the user activates Skip on page 1 or 2
- **THEN** `/onboarding/school` is pushed

#### Scenario: Next advances one page
- **WHEN** the user activates Next on page 1 or 2
- **THEN** the pager advances exactly one page and the selected page state updates
- **AND** the final page hides Skip and Next

#### Scenario: Final CTA opens the school step
- **WHEN** the user activates `onboarding-welcome-cta` on the notifications page
- **THEN** `/onboarding/school` is pushed

#### Scenario: Downstream routes remain available
- **WHEN** the carousel entry controls are inspected
- **THEN** QR and URL controls are absent from the carousel
- **AND** `/onboarding/qr-scan` and the iCal-URL route stay deep-linkable and are reached on the normal path from the manual-import step
- **AND** the group route stays registered and dev-deep-linkable while no navigation reaches it

### Requirement: The Maestro onboarding flow proves welcome → call-to-action → live school read
`mobile/.maestro/onboarding.yaml` SHALL cold-launch the development variant, deep-link to `timecalendar-dev://onboarding`, assert a visible title containing `TimeCalendar`, activate `onboarding-next` twice, assert the localized notifications title, activate `onboarding-welcome-cta`, and retain the existing school-step, seeded live-read, and search assertions. It SHALL then tap the seeded school row and assert the programme step opens, so the corrected school → import-journey navigation is proven on device and not only in Jest. The flow SHALL stop there: the steps below the programme step stay Jest-proven, and the camera and live-import steps SHALL NOT be driven. The same flow SHALL run on iOS and Android without platform-specific page selectors.

#### Scenario: Maestro traverses all carousel pages before the live read
- **WHEN** the onboarding flow runs on iOS or Android
- **THEN** it asserts the welcome page, advances twice by `onboarding-next`, and asserts the notifications title
- **AND** the final CTA opens the school step

#### Scenario: Existing school round-trip proof remains intact
- **WHEN** the final CTA completes navigation
- **THEN** the flow retains the seeded school visibility and search assertions from the live `GET /schools` round trip
- **AND** it remains shared across both platforms

#### Scenario: The flow proves the school row enters the import journey
- **WHEN** the flow taps the seeded school row after the search assertions
- **THEN** it asserts the programme step is visible
- **AND** it drives nothing below the programme step
