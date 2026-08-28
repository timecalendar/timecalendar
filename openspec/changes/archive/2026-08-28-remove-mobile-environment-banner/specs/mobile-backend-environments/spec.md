## MODIFIED Requirements

### Requirement: Non-production use is unmistakable and diagnosable

Whenever `local` or `preprod` is effective, the Settings environment entry SHALL be the app's only
environment indicator. It SHALL name the effective environment in localized text and expose that
value to assistive technology on both platforms, and it SHALL remain in Settings' final section.
The app SHALL NOT render any banner, strip, badge, watermark or other persistent environment chrome
over ordinary tab and stack navigation, and no environment surface SHALL consume layout insets or
otherwise change screen composition relative to a production build. Production SHALL render no
environment entry. Feedback and Crashlytics context SHALL include only the environment enum, and a
successful switch SHALL emit an Analytics event containing only the from/to environment enums;
endpoints, tokens, identifiers, e-mail, and message content SHALL NOT be logged.

#### Scenario: Ordinary routes render no environment chrome

- **WHEN** local or preprod is effective and the user navigates across ordinary app routes
- **THEN** no environment banner or marker renders anywhere in the tree
- **AND** safe-area insets and screen composition match a production build, so headers can be
  integration-tested and screenshotted at their shipped position

#### Scenario: Settings names the effective environment

- **WHEN** the user opens Settings in a non-production build
- **THEN** the final section's environment entry shows the effective environment as its value
- **AND** the entry's accessible name includes that value on both platforms

#### Scenario: Diagnostic context remains private

- **WHEN** Feedback is submitted or Crashlytics/Analytics context is recorded
- **THEN** the active environment enum is included
- **AND** no backend URL, secret, personal data, or backend-scoped identifier is added

### Requirement: Environment behavior has focused automated and device proof

Automated tests SHALL cover config capability/default matrices, exact URL allowlisting, production
visibility and behavioral inertness, malformed persistence, restart persistence, confirmation
cancellation, reset single-flight ordering, every current SQLite/MMKV/query/sync/notification/session
category, retained values, and partial-reset recovery. Focused tests SHALL also assert that the
Settings entry's accessible name carries the effective environment, because it is the only
indicator. A practical Maestro flow SHALL cover the visible Settings confirmation and SHALL read the
effective environment from the Settings entry alone, using selectors that resolve on both platforms
and that do not assume the entry is above the fold. Native reload/accessibility/screenshot evidence
that cannot run on this host SHALL be captured in a non-blocking `(HUMAN: …)` inbox note rather than
adding `run-e2e` by default.

#### Scenario: Local gates prove the safety contract

- **WHEN** the focused Jest and app-config suites run
- **THEN** every fail-closed and destructive-reset invariant is asserted, including call ordering and
  failure paths

#### Scenario: Device-only proof is non-blocking

- **WHEN** the host cannot run native iOS/Android verification
- **THEN** the remaining device checks are recorded as a tagged inbox checklist
- **AND** the PR does not request native E2E merely because this host lacks KVM
