# server-mail-delivery Specification

## Purpose
TBD - created by archiving change boot-server-without-smtp-url. Update Purpose after archive.
## Requirements
### Requirement: Mail configuration never blocks application boot
The server SHALL construct every module in its application graph without reading a usable
SMTP configuration. The mail transport SHALL NOT be created while the dependency injector
builds providers, and no value of `SMTP_URL` — absent, empty, or malformed — SHALL prevent
the application from starting or from serving `/health`.

#### Scenario: Boot with SMTP_URL unset
- **WHEN** the server starts with no `SMTP_URL` in its environment
- **THEN** the Nest application bootstraps and `/health` returns its health status

#### Scenario: Boot with SMTP_URL empty
- **WHEN** the server starts with `SMTP_URL` set to an empty string
- **THEN** the Nest application bootstraps and `/health` returns its health status,
  identically to the unset case

#### Scenario: Mail module compiles with no SMTP configuration
- **WHEN** the mailer module is compiled with `SMTP_URL` empty
- **THEN** compilation succeeds, the mail service resolves, and no SMTP transport has been
  constructed

### Requirement: Unconfigured mail degrades to a logged no-op
When `SMTP_URL` is absent or empty the server SHALL treat mail as disabled: a send request
SHALL construct no transport, emit no network traffic, log one warning naming the missing
configuration, and return without throwing.

#### Scenario: Sending with mail disabled
- **WHEN** an email send is requested while `SMTP_URL` is empty
- **THEN** no transport is created, nothing is sent, a warning is logged, and the call
  returns `undefined` without throwing

### Requirement: Configured mail delivery is unchanged
When `SMTP_URL` is set the server SHALL send mail exactly as before: one transport built
from `SMTP_URL` and reused across sends, the same `SMTP_FROM` sender and rendered template,
and failures contained rather than propagated to the caller.

#### Scenario: Sending with SMTP configured
- **WHEN** an email send is requested while `SMTP_URL` is set
- **THEN** a transport is built from that URL and the message is sent with the `SMTP_FROM`
  sender, the recipient address, the subject, and the rendered template body

#### Scenario: Transport is built once and reused
- **WHEN** two email sends are requested on the same service instance while `SMTP_URL` is
  set
- **THEN** the transport is constructed once and reused for the second send

#### Scenario: Delivery failure does not propagate
- **WHEN** transport construction or delivery fails while `SMTP_URL` is set
- **THEN** the failure is logged as a warning, the call returns without throwing, and the
  process keeps running

### Requirement: No environment sets a placeholder SMTP URL to survive boot
The repository SHALL NOT carry a placeholder or dummy `SMTP_URL` whose only purpose is to
keep a process from crashing at construction. Environment configuration MAY set `SMTP_URL`
only where mail is genuinely expected to be delivered or captured.

#### Scenario: OpenAPI spec emission needs no SMTP placeholder
- **WHEN** the OpenAPI emit script builds the application module graph under the test
  environment profile
- **THEN** it does so with no `SMTP_URL` assignment of its own, and the emitted spec is
  identical to the committed contract

#### Scenario: E2E compose stack needs no SMTP placeholder
- **WHEN** the e2e compose overlay starts the server service
- **THEN** its environment declares no `SMTP_URL`, and the service still reaches its
  healthy state through the `/health` healthcheck

