---
kind: design
status: approved
---

# Target technical design

## Current context and constraints

Flutter replays an append-only Sembast JSONL database and uses platform-native preferences. React
Native stores durable entities in Drizzle-managed SQLite and settings/hidden state in MMKV. Current
React Native startup can mount consumers before an importer could settle, so implementation must
introduce a single readiness gate. The exact source shapes, historical transforms, target schemas,
and source references live in the
[normative technical specification](../../react-native-migration/05-tech-specs/data-migration.md).

## Target architecture

A narrow local Expo module exposes production-identity legacy document and native-preference reads.
A bounded JavaScript streaming parser replays Sembast into validated candidates. A migration engine
writes absent SQLite rows transactionally, converges independent MMKV participants without
overwriting, and records a singleton journal plus report outbox. Root bootstrap waits for database
readiness and a terminal migration result before changelog, onboarding, sync, push registration,
or tabs mount.

## Data and contracts

Only D01's allowlist crosses the boundary. The journal moves from `NOT_STARTED` to `IN_PROGRESS`
and then exactly one of `SETTLED_SUCCESS`, `SETTLED_PARTIAL`, or `SETTLED_FAILED`. A missing terminal
write remains retryable. SQLite import uses insert-if-absent and canonical comparison; independent
MMKV participants use recorded progress and the same absent/identical/divergent rule. Reports use
an idempotent first-party endpoint and a local outbox whose delivery never reopens migration.

## Security and integrity

Calendar tokens and user-authored event/checklist content remain only in their target stores. Raw
files, source lines, arbitrary exception messages, token hashes, and private content are excluded
from telemetry and diagnostics. Bounded enumerations, counts, durations, versions, platform, report
id, and calendar ids are allowed by D04. Native access is production-identity-only and environment
reset completes before discovery.

## Failure handling and operations

Malformed siblings are skipped independently; a truncated final line preserves its complete
prefix. React Native wins every collision. A process kill before a terminal commit retries safely;
a caught terminal failure is reported and never automatically rerun. Report delivery retries
independently when offline. Parser and payload limits settle through bounded error codes rather than
unbounded work or content-bearing exceptions.

## Rollout and rollback

Flutter source is never deleted automatically. A downgrade can still lose React Native-only writes.
The release starts around 1%, then 5%, and widens through normal whole-app stages based on QA and
monitoring. Internal signed upgrades and final public-store upgrades on both platforms precede
broad rollout. Repository merge does not authorize database deployment, store submission, or
rollout.

## Verification strategy

Each data and preference participant has success, malformed, collision, and retry fixtures. Tests
inject process kills around every journal boundary, exercise resource limits, verify offline report
delivery, and assert forbidden content never reaches diagnostics. Physical QA runs compact and
large seed packs through TestFlight and Play update paths, then repeats the final production-listing
gate and records low-end resource evidence.

## Decision index

- [D01 — Import scope and best-effort salvage](decisions/D01-import-scope-and-salvage.md)
- [D02 — No-overwrite one-shot lifecycle](decisions/D02-no-overwrite-one-shot-lifecycle.md)
- [D03 — Source retention and downgrade boundary](decisions/D03-source-retention-and-downgrade.md)
- [D04 — Private reporting and staged proof](decisions/D04-private-reporting-and-staged-proof.md)

## Open risks

Real released-install volumes, signed sandbox survival, Android backup behavior, and low-end Hermes
measurements remain release evidence. They are isolated in T08; a result that contradicts an
approved outcome or decision returns this plan to `needs-revision` instead of being worked around.
