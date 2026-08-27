## ADDED Requirements

### Requirement: Per-instance telemetry identity
The server SHALL attach a sanitized `service.instance.id` resource attribute derived
from the runtime pod hostname to its traces, metrics, and logs. The value MUST NOT be
derived from a request, calendar, user, random per-request identifier, or process-start
timestamp.

#### Scenario: Kubernetes pod emits a counter
- **WHEN** a server pod increments an application counter
- **THEN** the exported series carries that pod's sanitized instance identity and does not collide with a concurrent pod's cumulative series

#### Scenario: Runtime hostname is unusable
- **WHEN** the hostname is absent, oversized, or contains disallowed characters
- **THEN** telemetry uses the bounded `unknown` instance value and does not emit the raw input

### Requirement: Bounded upstream classification
The server SHALL derive sync metric and trace upstream dimensions through one finite,
source-controlled classifier. It MUST NOT export a raw user-provided hostname, URL,
port, path, query, fragment, credential, token, local address, or private address as an
upstream dimension.

#### Scenario: Reviewed university provider is contacted
- **WHEN** sync contacts an HTTP(S) host matching a reviewed exact domain or dot-boundary suffix
- **THEN** `calendar_sync_total.domain`, `peer.service`, and `upstream.domain` use the classifier's canonical provider-domain value

#### Scenario: Custom calendar provider is contacted
- **WHEN** sync contacts an otherwise valid public HTTP(S) host outside the reviewed allowlist
- **THEN** the exported upstream dimension is the bounded value `custom` and the raw hostname is absent

#### Scenario: Unsafe or malformed destination is observed
- **WHEN** an upstream input is malformed, non-HTTP(S), loopback, link-local, or private
- **THEN** the exported upstream dimension is the bounded value `invalid` and the raw input is absent

#### Scenario: Suffix is planted in an unrelated host
- **WHEN** a hostname merely contains a reviewed domain without matching it on a dot boundary
- **THEN** the classifier returns `custom` rather than the reviewed provider value

### Requirement: Sanitized OTLP application logs
When observability is enabled, the server SHALL export Nest application logs over
OTLP/gRPC through the configured collector endpoint while preserving console logging.
Every record MUST be sanitized before either sink and MUST carry only bounded approved
attributes plus active trace correlation when a trace is present.

#### Scenario: Application error occurs inside a traced request
- **WHEN** a Nest logger records an application error while a trace context is active
- **THEN** an OTLP log is emitted with mapped severity, bounded context and error type, and the active trace/span identifiers

#### Scenario: Sensitive values appear in logger arguments
- **WHEN** logger arguments contain a URL, calendar token, authorization credential, cookie-like field, email address, UUID, long opaque identifier, request body, or nested domain object
- **THEN** the console and OTLP bodies contain only redacted/bounded replacements and do not contain the original sensitive values

#### Scenario: Observability is disabled
- **WHEN** the server runs with `OTEL_ENABLED` false
- **THEN** application logs remain available on the console and no OTLP log exporter sends records

#### Scenario: Server shuts down
- **WHEN** the Nest application receives a supported shutdown signal
- **THEN** the telemetry SDK flushes and shuts down its bounded trace, metric, and log processors without hanging termination

### Requirement: Truthful sync trace lifecycle
HTTP sync traces SHALL contain only descendants whose work belongs to the request and
whose end time does not exceed the HTTP server span's end time. The trace SHALL retain
an awaited calendar-sync span and its outbound/database children with only bounded
attributes.

#### Scenario: Calendar sync request succeeds
- **WHEN** an HTTP calendar-sync request completes successfully
- **THEN** the HTTP server span contains the awaited `calendar.sync` span, its upstream client/database descendants finish first, and no Express middleware layer span extends past the server span

#### Scenario: Calendar sync request fails
- **WHEN** calendar sync throws
- **THEN** the sync span records a bounded error type, ends in all cases, and the original application error continues through the existing request behavior

#### Scenario: Work is intentionally detached
- **WHEN** work is queued or scheduled to execute after the HTTP response
- **THEN** it is represented by producer/consumer or linked trace semantics and is not retained as an active child of the completed HTTP server span

### Requirement: Compatible OpenTelemetry dependency cohort
The server SHALL declare every directly imported OpenTelemetry package and resolve the
SDK, exporters, resources, log API/SDK, and instrumentations to one mutually compatible
minor cohort. The change MUST NOT introduce a major dependency bump.

#### Scenario: Dependency tree is inspected
- **WHEN** the server dependency tree is installed from the committed lockfile
- **THEN** `npm ls` reports no invalid peer dependency and no stale 0.218 SDK/exporter cohort alongside the selected 0.219-compatible instrumentations
