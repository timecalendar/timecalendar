## MODIFIED Requirements

### Requirement: Feedback is proven without sending real mail in E2E

Automated tests SHALL cover pure validation, total persisted-email parsing, device-info formatting, DTO construction through the real generated mutation with `customFetch` mocked, screen states, both navigation entry points, and privacy constraints at the applicable coverage thresholds. A Maestro flow SHALL navigate from Settings, reveal the `settings-feedback` row with a bounded downward scroll before its explicit visibility wait and selector tap, and assert client-side validation only; it MUST NOT submit a valid form or contact the real `/contact` endpoint. A focused off-device structure proof SHALL enforce the reveal ordering and unchanged validation tail. A non-blocking `(HUMAN: …)` inbox note SHALL define the iOS/Android device pass.

#### Scenario: Data proof exercises the generated mutation without a server
- **WHEN** the feedback data test runs with `customFetch` mocked
- **THEN** the real generated contact mutation receives the complete expected DTO
- **AND** success and rejection behavior are deterministic without a live server

#### Scenario: Maestro reveals the Feedback row before navigation
- **WHEN** the feedback Maestro flow enters Settings with `settings-feedback` below the initial viewport
- **THEN** it runs `scrollUntilVisible` for `settings-feedback` in the `DOWN` direction with a finite timeout before the existing visibility wait and selector tap
- **AND** it does not use coordinates, localized row text, blanket retries, or flow reordering

#### Scenario: Maestro remains mail-safe
- **WHEN** the feedback Maestro flow taps the revealed Feedback row
- **THEN** it preserves the existing Feedback title wait, empty-form submit, and required e-mail/message validation assertions
- **AND** no valid request is sent to `/contact`

#### Scenario: Recovery PR supplies exact-head native proof
- **WHEN** the recovery implementation is ready for Reviewer merge
- **THEN** baseline CI and both native Android and iOS E2E jobs are successful for the current PR head
- **AND** any later commit invalidates the earlier native evidence until both jobs pass again

#### Scenario: Native-only checks are recorded nonblockingly
- **WHEN** implementation documentation is completed
- **THEN** a migration inbox note tagged `(HUMAN: …)` lists the iOS/Android keyboard, accessibility, dark-mode, Alert, retry, and iCal-context checks
- **AND** the note does not block merge
