# Core migration acceptance, 2026-10-04

The TypeScript importer, SQLite journal/outbox, MMKV participants, production eligibility, and ordered root bootstrap are implemented in `39f37b22`, with mapping documentation aligned in `41793a35`. All fixtures and evidence in this directory are synthetic. The automated core matrix is executable in the checked-out mobile project; [the consolidated index](../README.md) links actual native and server/database proof.

## Implementation

- Streaming read-only Sembast replay accepts versions 1–3, integer/string record keys, tombstones, repeated writes, and a complete prefix followed by a truncated tail. SHA-256 fingerprints stay local. Unsupported metadata and hard resource limits produce a terminal failure before target writes.
- Calendar subscriptions, personal events, checklist items, and both hidden arrays preserve validated content and identifiers. Explicit nullable Flutter fields, local ISO timestamps, historical event names, calendar re-keying, exact color case, and soft checklist links are covered. Calendar/Activity caches are excluded.
- The preference allowlist is theme with an absent-only dark-mode fallback, changelog seen version, notification enabled, startup tab, and weekend visibility. The active weekend key is `settings.showWeekends`. A qualifying calendar sets migration onboarding suppression without fabricating school/group selection.
- A normal Drizzle migration creates the singleton journal and immutable report outbox. Every SQLite row is absent/identical/divergent checked, including calendar token collisions. One SQLite transaction applies the entities and progress marker; each MMKV participant independently compares, writes, reads back, and journals progress.
- A crash leaves `IN_PROGRESS` retryable with the same report ID and start time. Terminal launches never discover or reimport the source. Successful MMKV participant hashes detect missing/divergent restores; bounded hashes recorded by normal RN setters recognize legitimate later choices. A mismatch queues at most one additional sanitized report and preserves current values/defaults.
- Schema initialization precedes environment recovery, which precedes migration. Routes, changelog, calendar/Activity sync, notification runtimes, OTA, and report delivery mount after settlement. No timer bypasses migration. Startup calendar intent preserves explicit cold deep links and allows later navigation to Home.
- Reports use the generated first-party client and remain queued offline. Delivery is single-flight, has bounded exponential backoff, retains permanent rejections for a daily retry, and replays the same immutable ID/payload after an interrupted acknowledgement. Payloads and echoed response bodies are redacted from API debug logging.

## Executable checks

Run from `mobile/` with Node supporting `node:sqlite` and installed mobile dependencies. The cross-package contract command additionally requires installed server dependencies.

```sh
npx tsc --noEmit
npm run lint
npm run react-compiler:check
npm run react-doctor:changed
npm run test:perf
MIGRATION_SERVER_CONTRACT=1 npm test -- --runInBand --coverage
```

The deterministic migration subset is:

```sh
MIGRATION_SERVER_CONTRACT=1 npm test -- --runInBand \
  src/features/legacy-migration src/storage/migration-participants.test.tsx \
  src/db/migrate.test.ts src/features/splash/ui/use-app-ready.test.ts \
  src/api/mutator.test.ts \
  src/features/notifications/ui/notification-native-controls.contract.test.ts
```

Host SQLite tests execute the production Drizzle migration SQL against actual SQLite through Node's `DatabaseSync`, including file close/reopen and WAL recovery after real child-process `SIGKILL` before/after commit. The host MMKV adapter uses the library's Jest mock through the production storage seam and real settings hooks. This is not a claim of native MMKV durability; see the native rehearsal report below.

## Deterministic acceptance matrix

| Specification/QA requirement | Executable evidence | Result |
| --- | --- | --- |
| v1/v2/v3, string/integer keys, pre-v2 fields/UID-less rejection, pre-v3 re-key | `parser.test.ts`, `engine.sqlite.test.ts` | Pass |
| Effective last write, tombstones, malformed interior and truncated tail | `parser.test.ts` | Pass |
| All local entities, null/empty optionals, Unicode, emoji, DST/offset/local dates, color case, soft checklist ownership | `parser.test.ts`, `engine.sqlite.test.ts`, `sync.sqlite.test.ts` | Pass |
| Every retained preference, invalid-type isolation, future changelog rejection, absent-only theme fallback, dropped preferences | `preferences.test.ts`, `migration-participants.test.tsx` | Pass |
| Missing file, valid empty store, zero bytes, invalid metadata, unsupported version, discovery error, preferences only | `engine.sqlite.test.ts`, `parser.test.ts` | Pass |
| Below/at/above actual limits: 64 MiB file, 200,000 lines, 2 MiB line, 100,000 live records, 256 KiB text, 50,000 array members, 512-byte identifiers; capped diagnostics | `resource-boundaries.test.ts`, `parser.test.ts` | Pass |
| Source duplicate IDs/tokens; target absent/identical/divergent; newer RN rows/preferences | `parser.test.ts`, `engine.sqlite.test.ts` | Pass |
| Write and readback failure for each of seven native participants | `engine.sqlite.test.ts` | Pass at production storage seam with MMKV Jest backend |
| All journal/parse/SQLite/native/terminal crash checkpoints, including native write before progress for each participant | `engine.sqlite.test.ts` | Pass with injected interruption and real SQLite reopen |
| Actual process death during/beyond SQLite commit | `engine.sqlite.test.ts` | Pass with child-process SIGKILL and WAL recovery |
| Stable retry ID/attempts, changed source, terminal immutability, singleton/corrupt journal validation, terminal/outbox atomicity | `engine.sqlite.test.ts` | Pass |
| Terminal native restore mismatch, one additional report, legitimate post-import RN edits, no resurrection after delete | `engine.sqlite.test.ts`, `migration-participants.test.tsx` | Pass at host seam |
| Ordered readiness beyond 60 seconds, failed prerequisites, single-flight initialization, deep-link/startup tab precedence | `bootstrap-gate.test.tsx`, `startup-tabs-gate.test.tsx`, `migrate.test.ts`, `use-app-ready.test.ts` | Pass |
| Exact production identity, effective backend gating, unsupported platform | `runtime.test.ts`, `engine.sqlite.test.ts` | Pass |
| Real generated-client invocation, offline/permanent/transient failures, backend change while draining, foreground retry, unmount cleanup | `runtime.test.ts`, `engine.sqlite.test.ts`, `report-runtime.test.tsx` | Pass |
| Max 100 UUID calendar IDs, non-UUID imports retained, 23 error codes, saturated counters, payload below 16 KiB, server validator acceptance | `report.contract.test.ts`, `engine.sqlite.test.ts` | Pass with `MIGRATION_SERVER_CONTRACT=1` |
| No private source values/hash/witnesses in report/journal diagnostics; no payload or echoed IDs in API logs | `engine.sqlite.test.ts`, `report.contract.test.ts`, `mutator.test.ts` | Pass |
| Source retention/read-only 64 KiB reads, close on EOF/early return/read failure | `native-source.test.ts` plus native report | Pass at host seam; native report owns filesystem survival |
| Real calendar cache replacement preserves migrated personal/checklist/hidden state | `sync.sqlite.test.ts` | Pass with production repository and actual SQLite |

Test file basenames above resolve under `mobile/src/features/legacy-migration/` unless the command identifies another location. `REC-08` and `REC-09` are covered by the malformed/retry/outbox rows. The host matrix supports `OFF-01` through `OFF-18` data behavior and `ON-02/03/06` persistence, but does not replace signed device UI verification.

## Verification status and limits

TypeScript, full repository lint, React Compiler (24 renderer functions), all 15 performance-contract tests, and changed-file React Doctor (47 files including additions) pass. The final full Jest run passes 242 of 243 suites and 2,422 of 2,423 tests, with every configured coverage threshold passing. The sole failure is the baseline issue below. The final focused core run passes all 16 suites and 168 tests; the final journal/report loop cleanup is covered by this run with 100% journal and 91.7% report branch coverage. [verification.json](./verification.json) contains the sanitized test inventory and coverage counts.

The existing calendar accessibility fixture test `CalendarScreen owned shell / runs the deterministic accessibility fixture only on the development route` cannot find `probe-late`. It also fails unchanged on an isolated `git archive` of baseline `ca663a2d059032615efe7f3899dadbe7b1d6196f` (1 failed, 48 passed). No calendar implementation or calendar test is part of this change. The notification native-control contract uses whitespace-insensitive matching for the existing sheet option because bootstrap nesting changes indentation, and its three tests pass.

Actual iOS SEED-B [Hermes SQLite/MMKV readback](../ios/seed-b-offline-readback.json) passes all 17 checks after cold relaunch: 3 calendars, 60 personal events, 134 checklist items and 21/6 hidden entries, with stable successful journal attempt 1. An independent source-to-native comparison checks 1,576 fields with zero mismatches. Two actual Home pull-to-refresh operations preserve all local content and hidden/checklist relationships; [sync 2](../ios/seed-b-sync2.json) also confirms one delivered report after offline queueing. Shipping UI checklist edits, deletion and a newer Light preference survive subsequent cold restarts with no reimport or false integrity report; [the iOS scenario report](../ios/seed-b-verification.md) explains the intentional fixture differences and unchanged retained source. The coordinator independently verifies the final Light UI, 133 remaining checklist rows, unchanged attempt 1 and single delivered outbox record.

Actual OnePlus Android SEED-A [native readback](../android/seed-a-offline-readback.json) passes all 17 baseline checks after a radio-off in-place upgrade. Both synthetic syncs pass all 18 checks; [the edited checklist survives a cold restart](../android/seed-a-post-edit-restart.json), with the original journal/report and unchanged source/preferences. These runs close the actual Expo SQLite/MMKV execution requirement for core, while signed physical release gates remain separate. Both reports are [independently persisted and validated](../reporting/qa-transport/README.md) through the real local Nest/PostgreSQL receiver.

Native evidence is maintained in [the native report](../native/README.md), with [Android artifacts](../android/) and [iOS artifacts](../ios/). Endpoint/Postgres/Redis evidence is maintained in [the reporting report](../reporting/README.md). Native MMKV readback, actual Expo SQLite execution, local Flutter-to-RN replacement, and source retention must be taken from those concrete artifacts, not inferred from host mocks.

The signed TestFlight/Play internal and public-store gates, physical iPhone data protection, backup/restore, low-end release-mode peak memory/duration, live subscription/push reconnection, and OTA-after-migration proof remain release-owner gates. No production deployment, store submission, real-user data extraction, or rollout approval is represented here.
