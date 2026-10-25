## MODIFIED Requirements

### Requirement: Switching requires explicit destructive confirmation

The developer page SHALL present a localized confirmation before changing environment that clearly states the session and all local calendar/app data will be cleared. Cancellation SHALL leave persistence, caches, databases, diagnostics, and the effective environment unchanged. The reset orchestrator SHALL revalidate the target independently of the UI.

#### Scenario: User cancels the switch

- **WHEN** the user dismisses or rejects the destructive confirmation
- **THEN** no reset participant runs and the environment remains unchanged

#### Scenario: Invalid target bypass attempt is inert

- **WHEN** code invokes the switch orchestrator with a target not allowed by the current capability
- **THEN** the operation rejects before writing the reset journal or clearing state

### Requirement: Non-production use is unmistakable and diagnosable

Whenever `local` or `preprod` is effective, the developer page's environment entry SHALL be the
app's only environment indicator. It SHALL name the effective environment in localized text and
expose that value to assistive technology on both platforms, and it SHALL be the first row of the
developer page's backend section. The app SHALL NOT render any banner, strip, badge, watermark or
other persistent environment chrome over ordinary tab and stack navigation, and no environment
surface SHALL consume layout insets or otherwise change screen composition relative to a
production build. Production SHALL render no environment entry. Feedback and Crashlytics context
SHALL include only the environment enum, and a successful switch SHALL emit an Analytics event
containing only the from/to environment enums; endpoints, tokens, identifiers, e-mail, and message
content SHALL NOT be logged.

#### Scenario: Ordinary routes render no environment chrome

- **WHEN** local or preprod is effective and the user navigates across ordinary app routes
- **THEN** no environment banner or marker renders anywhere in the tree
- **AND** safe-area insets and screen composition match a production build, so headers can be
  integration-tested and screenshotted at their shipped position

#### Scenario: Settings names the effective environment

- **WHEN** the user opens Settings → Developer in a non-production build
- **THEN** the backend section's environment entry shows the effective environment as its value
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
environment entry's accessible name carries the effective environment, because it is the only
indicator, and that the developer page mounts the entry in its backend section. The component
suites named in `mobile/e2e/README.md` hold the switching proof; a Maestro flow is not required.
Native reload/accessibility/screenshot evidence that cannot run on this host SHALL be captured in
a non-blocking `(HUMAN: …)` inbox note. Native workflow execution remains optional diagnostic
evidence rather than ordinary feature proof.

#### Scenario: Local gates prove the safety contract

- **WHEN** the focused Jest and app-config suites run
- **THEN** every fail-closed and destructive-reset invariant is asserted, including call ordering and
  failure paths

#### Scenario: Device-only proof is non-blocking

- **WHEN** the host cannot run native iOS/Android verification
- **THEN** the remaining device checks are recorded as a tagged inbox checklist
- **AND** the PR does not request native E2E merely because this host lacks KVM

### Requirement: Every allowed environment choice and a cancel path are reachable on both platforms

The developer page's environment selector SHALL present every environment allowed by the build capability plus a cancel path on both platforms. It SHALL NOT use a presentation that silently drops choices (the Android native alert keeps at most three buttons). On Android the selector SHALL be a native Material single-choice dialog that marks the effective environment and offers Cancel; on iOS it SHALL remain a native alert listing every choice and Cancel. Selecting a choice SHALL keep the existing behavior: the current environment is a no-op, switching is single-flight, and any other choice requires the explicit destructive confirmation before any reset runs.

#### Scenario: Development capability on Android offers all three environments and Cancel

- **WHEN** a development build on Android opens the environment selector
- **THEN** Local, Preproduction, and Production are all selectable and the current environment is marked
- **AND** a Cancel action dismisses the selector with no confirmation and no reset

#### Scenario: Choosing another environment still requires confirmation

- **WHEN** the user selects an environment other than the current one on either platform
- **THEN** the destructive confirmation is presented and no reset runs until it is confirmed

#### Scenario: Choosing the current environment is inert

- **WHEN** the user selects the current environment
- **THEN** no confirmation is presented and no reset runs

#### Scenario: Production builds stay unchanged

- **WHEN** the build capability is production
- **THEN** no environment selector renders on either platform
