# timecalendar-observability-operations Specification

## Purpose
TBD - created by archiving change harden-sync-observability. Update Purpose after archive.
## Requirements
### Requirement: Version-controlled observability runbook
The repository SHALL contain an operator runbook that documents TimeCalendar signal
names, finite label vocabularies, privacy invariants, copy/paste backend queries,
expected results, and the preproduction-before-production verification order.

#### Scenario: Operator investigates sync volume
- **WHEN** the operator follows the VictoriaMetrics section
- **THEN** they can query per-instance sync rate and total sync rate calculated after per-series rate without counter-reset collisions

#### Scenario: Operator investigates upstream health
- **WHEN** the operator follows the metrics and trace sections
- **THEN** they can compare reviewed provider domains plus the bounded `custom` and `invalid` buckets without exposing an arbitrary hostname

#### Scenario: Operator investigates a long request
- **WHEN** the operator follows the Tempo section for a slow calendar-sync request
- **THEN** they can identify time spent in the awaited sync, upstream HTTP, and database spans and verify no descendant ends after the HTTP server span

#### Scenario: Operator investigates application errors
- **WHEN** the operator follows the VictoriaLogs section
- **THEN** they can find sanitized error records by service, environment, severity, context, and trace identifier

### Requirement: Preproduction telemetry proof
Before production rollout, the change SHALL be exercised in preproduction with a
synthetic success and failure whose non-sensitive expected values are documented. The
proof SHALL cover positive signal presence and negative privacy/cardinality checks.

#### Scenario: Synthetic preproduction exercise completes
- **WHEN** the documented success and failure are generated in preproduction
- **THEN** VictoriaMetrics shows distinct instance-aware counters and bounded upstream labels, VictoriaLogs shows correlated sanitized application errors, and Tempo shows contained sync trace descendants

#### Scenario: Sensitive synthetic fixtures are searched
- **WHEN** the operator searches VictoriaLogs and Tempo for the synthetic URL, token, email, and identifier fixtures
- **THEN** no raw fixture value is found in exported log bodies, attributes, span names, or span attributes

#### Scenario: Unexpected signal shape is found
- **WHEN** a raw domain/sensitive value, counter collision, missing log stream, or child-after-parent trace is observed
- **THEN** production rollout stops and the application instrumentation is corrected or escalated without changing global collector policy in this issue

### Requirement: Calendar architecture boundary
The calendar Architecture Book SHALL identify the ownership boundary between mobile
sync behavior and server observability and SHALL link to the server runbook. It MUST
state that calendar URLs/tokens are not telemetry dimensions and that this change does
not alter the mobile API or local sync behavior.

#### Scenario: Engineer changes calendar sync
- **WHEN** an engineer reads the Calendar Architecture Book before modifying sync
- **THEN** they can locate the server observability contract and preserve the no-token/no-URL telemetry boundary

