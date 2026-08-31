## MODIFIED Requirements

### Requirement: The welcome call-to-action navigates into the existing school step
The carousel SHALL expose Skip as a trailing top-bar text button on pages 1–2, Next as a trailing footer text button on pages 1–2, and a full-width filled final CTA on page 3. Skip SHALL open the shared import-later confirmation instead of navigating. Next SHALL page forward through the native pager and SHALL use the non-animated pager method when reduced motion is enabled. The final CTA SHALL push `/onboarding/school`. Skip and Next SHALL be absent on the final page. The prior welcome QR and URL actions SHALL remain absent without removing their routes or the school picker's iCal fallback. The QR and iCal-URL routes SHALL remain deep-linkable Stack siblings, reached on the normal path from the manual-import step. The group route SHALL remain registered and dev-deep-linkable but SHALL be reached by no navigation.

#### Scenario: Skip asks for confirmation
- **WHEN** the user activates Skip on page 1 or 2
- **THEN** the shared import-later confirmation opens
- **AND** school selection is not pushed

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

## REMOVED Requirements

### Requirement: Onboarding is reachable but not a hard startup gate
**Reason**: The revised product contract requires unresolved fresh zero-calendar installs to enter onboarding before post-onboarding routes can mount.

**Migration**: Replace the non-gating behavior with the `mobile-first-launch-gate` capability. The onboarding group remains reachable from existing entry points after resolution.

## ADDED Requirements

### Requirement: Onboarding is the unresolved fresh-install gate and remains reachable later
The welcome-first onboarding group SHALL be the first available route after startup for a user with zero durable calendars and no onboarding resolution. The same group SHALL remain reachable from existing accessible settings/calendar-management entry points and development deep links after the user skips or imports. It SHALL NOT be reopened solely because the last calendar is later deleted.

#### Scenario: Fresh unresolved user starts at welcome
- **WHEN** startup eligibility resolves to onboarding required
- **THEN** the existing carousel welcome surface opens before post-onboarding routes mount

#### Scenario: Resolved user can revisit onboarding
- **WHEN** an eligible user activates an existing add/onboarding entry or development deep link
- **THEN** the same welcome-first stack remains reachable
- **AND** visiting it does not erase the durable resolution
