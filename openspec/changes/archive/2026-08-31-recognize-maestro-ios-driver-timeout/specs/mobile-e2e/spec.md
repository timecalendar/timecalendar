## MODIFIED Requirements

### Requirement: XCTest startup retries cannot mask flow failures

The harness SHALL support a fixed, bounded number of Maestro startup attempts for iOS CI.
A failed attempt SHALL be retried only when its captured output positively identifies an
XCTest driver bootstrap failure: either the first `launchApp` / `setPermissions` setup failed
because the local XCTest driver was not listening or refused the connection, or Maestro 2.8.0
reported the explicit iOS driver-not-ready timeout / `IOSDriverTimeoutException` signature.
The classifier SHALL evaluate assertion-failure evidence first; unknown, application, and
assertion failures SHALL be terminal on their first occurrence even when a startup marker is
also present.

#### Scenario: A driver startup failure is retried within the bound

- **WHEN** a flow fails before an assertion with either a known first-launch XCTest
  driver-not-listening / local connection-refused signature or Maestro 2.8.0's explicit
  `iOS driver not ready in time` / `IOSDriverTimeoutException` signature
- **THEN** the harness starts a fresh Maestro process for the same flow, logs the retry reason
  and attempt number, preserves the failing exit status if all attempts fail, and never exceeds
  the configured maximum attempts

#### Scenario: A real assertion failure is never retried

- **WHEN** Maestro reports a missing element, content wait timeout, failed assertion, or any
  failure not positively classified as XCTest driver startup
- **THEN** the harness returns that non-zero result immediately, does not run the flow again,
  and does not continue to later flows

#### Scenario: Assertion evidence vetoes a startup marker

- **WHEN** one captured attempt contains both assertion-failure evidence and an otherwise
  retryable XCTest startup marker
- **THEN** the assertion evidence wins and the harness terminates after that single attempt

#### Scenario: Android and normal local runs remain single-attempt

- **WHEN** the harness is invoked without the explicit iOS startup-attempt option
- **THEN** each top-level flow is attempted exactly once
