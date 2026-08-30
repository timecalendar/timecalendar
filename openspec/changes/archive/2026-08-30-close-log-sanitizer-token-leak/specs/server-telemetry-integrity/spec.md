# server-telemetry-integrity — delta

## MODIFIED Requirements

### Requirement: Sanitized OTLP application logs

When observability is enabled, the server SHALL export Nest application logs over
OTLP/gRPC through the configured collector endpoint while preserving console logging.
Every record MUST be sanitized before either sink and MUST carry only bounded approved
attributes plus active trace correlation when a trace is present.

Redaction of opaque identifiers MUST be bounded by the surrounding **delimiter** rather than
by word-character boundaries, so an identifier is redacted regardless of which characters of
its own alphabet appear at its edges. Sensitive-key redaction MUST also fire when the key is
JSON-serialized, that is when a quote separates the key from its `:` separator. Sanitization
MUST NOT redact less than the previous behavior on any input.

#### Scenario: Application error occurs inside a traced request

- **WHEN** a Nest logger records an application error while a trace context is active
- **THEN** an OTLP log is emitted with mapped severity, bounded context and error type, and the active trace/span identifiers

#### Scenario: Sensitive values appear in logger arguments

- **WHEN** logger arguments contain a URL, calendar token, authorization credential, cookie-like field, email address, UUID, long opaque identifier, request body, or nested domain object
- **THEN** the console and OTLP bodies contain only redacted/bounded replacements and do not contain the original sensitive values

#### Scenario: Calendar token carries a hyphen at either edge

- **WHEN** a log line contains a default-length `nanoid` calendar token that begins with `-`, ends with `-`, begins and ends with `-`, contains an internal `-`, or contains an underscore
- **THEN** every one of those token shapes is replaced by the redaction placeholder and none of them appears in the console or OTLP body

#### Scenario: Entity-not-found message reaches the log exporter

- **WHEN** a TypeORM `EntityNotFoundError` for an unknown calendar token is logged at debug level, including a token with a hyphen at an edge
- **THEN** the body handed to the OTLP exporter contains no substring equal to the submitted token

#### Scenario: Sensitive key is JSON-serialized

- **WHEN** a log line contains a quoted `"token"`, `"password"`, or `"secret"` key followed by its `:` separator and value
- **THEN** the key rule redacts the value and the emitted redaction label carries the bare key name without a stray quote

#### Scenario: Non-sensitive values must survive redaction

- **WHEN** a log line or allow-listed structured value contains a short identifier, a hyphen-edged run of ten or more digits, an ISO-8601 timestamp, a 16-hex span identifier, or an allow-listed structured key such as `school`, `queue`, `action`, `service.name`, or `service.instance.id`
- **THEN** each retains exactly the value the previous sanitizer produced for it, so redaction is never widened at the cost of debuggability

#### Scenario: Observability is disabled

- **WHEN** the server runs with `OTEL_ENABLED` false
- **THEN** application logs remain available on the console and no OTLP log exporter sends records

#### Scenario: Server shuts down

- **WHEN** the Nest application receives a supported shutdown signal
- **THEN** the telemetry SDK flushes and shuts down its bounded trace, metric, and log processors without hanging termination
