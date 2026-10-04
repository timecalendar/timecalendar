# Flutter-to-RN migration evidence, 2026-10-04

Implementation, deterministic acceptance and the local Android SEED-A/iOS SEED-B rehearsals are complete. Both shipping importers settle successfully in actual Expo SQLite and MMKV, preserve source bytes/preferences, survive cold relaunch, preserve newer RN edits, complete two synthetic syncs and deliver one private report each. All app fixtures are synthetic. No manual production deployment or store submission has been performed; a normal main-branch push may publish CI container images.

## Implementation and automated evidence

| Area | Commit / evidence | Observed result |
| --- | --- | --- |
| Mobile parser, journal, SQLite/MMKV participants, bootstrap, outbox | `39f37b22` · [core report](core/README.md) · [test inventory](core/verification.json) | 168/168 focused tests pass; full mobile 2,422/2,423, all coverage thresholds pass |
| Current storage mapping and QA inventory | `41793a35` · [persisted inventory](../../04-migration-qa/02-persisted-data-inventory.md) | Canonical weekend key, retained RN-only preferences, onboarding suppression and journal/outbox documented |
| Server/private schema, API/generated RN contract, security/retention | `f5f3ded5` · [reporting report](reporting/README.md) · [checks](reporting/verification.json) | Validator 50 tests; real Nest/Postgres/Redis E2E 32 tests; build/lint/codegen pass |
| Isolated synthetic native transport/readback harness | `9eb168db`, `5c88c876`, `cc456182` · [harness evidence](reporting/qa-transport/README.md) | Offline by default; only synthetic calendar tokens; local first-party report receiver; host harness tests pass |
| Native bridge, backup policy, fixture writer and builds | `33ec327a`, evidence `f2281888` · [native report](native/README.md) | Five Android native tests; Swift preference/path checks; production CNG/iOS simulator build and remote Android build pass |

The single mobile failure is the unchanged calendar accessibility `probe-late` test. Core independently reproduced it in a clean archive of `ca663a2d059032615efe7f3899dadbe7b1d6196f`. The server has one independently reproduced baseline notification-outbox failure; [the reporting report](reporting/README.md) includes its original-archive evidence. These failures remain visible rather than being suppressed.

## Runtime scenario matrix

| Scenario | Android SEED-A | iOS SEED-B | Evidence / interpretation |
| --- | --- | --- | --- |
| Genuine Flutter fixture, same application identity | Source installed and baselined | Source installed and baselined | [Android source](android/seed-a-before.json), [iOS B](ios/seed-b-before.json) |
| In-place local replacement / signing provenance | Matching debug certificates; remote-built target | Simulator replacement | [Android native validation](android/native-validation.json), [iOS artifacts](ios/native-artifacts.json) |
| Offline before RN first import | Airplane mode + failed internet probe | Injected fetch failure; not radio-off proof | [Android offline/install record](android/offline-and-install.json), [harness boundary](../../../../mobile/scripts/migration-rehearsal/README.md) |
| Actual Expo SQLite/MMKV values, terminal journal and private outbox | All 17 baseline checks pass; 1 calendar / 5 events / 5 checklists, hidden counts 1/1 | All 17 baseline checks pass; 3 calendars / 60 events / 134 checklists, hidden counts 21/6 | [Android readback](android/seed-a-offline-readback.json), [iOS readback](ios/seed-b-offline-readback.json); both `SETTLED_SUCCESS`, attempt 1; [1,576 independent iOS field comparisons, zero mismatches](ios/seed-b-independent-fields.json) |
| Retained source and preference equality | Unchanged after import, sync, edit and restart | Unchanged after import, sync, edit, delete, theme choice and restarts; source remains mode 0444 | [Android final source](android/seed-a-final-source.json), [iOS final source](ios/seed-b-final-source.json), [iOS final runtime](ios/seed-b-final-runtime.json) |
| Offline UI | Calendar and personal event render with imported settings | Calendar renders in dark appearance with Monday–Friday week columns | [Android Calendar](android/seed-a-rn-calendar.png), [Android event](android/seed-a-rn-personal-event.png), [iOS Calendar](ios/seed-b-rn-calendar.png); empty course cache is expected offline |
| Restart / newer RN edit preservation | Actual checklist toggle survives cold relaunch; original journal/report retained | Actual checklist toggle, deletion and Light choice survive cold relaunches; deleted row stays absent; no false integrity report | [Android edit/restart](android/seed-a-post-edit-restart.json), [iOS scenario report](ios/seed-b-verification.md), [independent final iOS check](ios/seed-b-independent-final.json) |
| Repeated synthetic sync and hidden/checklist associations | Two actual UI refreshes pass all 18 checks; 29 cached courses, 2 school-linked checklists, hidden selector exclusions correct | Two actual Home refreshes pass all 18 checks; 31 cached courses, 67 school-linked checklists, hidden selector exclusions correct | [Android sync 1](android/seed-a-sync1.json), [Android sync 2](android/seed-a-sync2.json), [iOS sync 1](ios/seed-b-sync1.json), [iOS sync 2](ios/seed-b-sync2.json) |
| Actual report delivery / idempotent receiver acknowledgement | One acknowledged device report retained after repeated sync and restart | One acknowledged device report retained after sync and subsequent edits/restarts | [Independent PostgreSQL receipts](reporting/qa-transport/device-receipts.json), [strict stored-payload privacy checks](reporting/qa-transport/device-privacy.json); both 962 bytes, calibration report excluded; duplicate acknowledgement separately proven by real server E2E |

Fixture equality checks intentionally become false after user edits. Android's later `checklistFields=false` represents its actual toggle. iOS's final `checklistCount=false`, `checklistFields=false` and `darkTheme=false` represent the deliberate deletion/renumbering and Light choice; final iOS count is 133. All unmodified data checks pass. Neither platform increments the successful migration attempt or reimports the source.

The coordinator independently verifies [Android's final persisted edit and report](android/seed-a-independent-final.json) and [iOS's final UI and SQLite state](ios/seed-b-independent-final.json). These checks agree with the device-owner readbacks.

The debug rehearsal uses explicit app-root routing because the raw development bundle URL otherwise selects Expo Router’s unmatched route before app bootstrap. Native accessibility inspection confirmed that condition; the corrected entry reaches the shipping importer. The coordinator independently verified the successful iOS SEED-B journal at 17:48 UTC. Production identity, migration eligibility, shipping routes and the storage gate are unchanged by the rehearsal entry.

## Build provenance and ownership

[Android native validation](android/native-validation.json) records source/target APK SHA-256 identities, production application ID, matching debug certificate, backup references, and absence of external-storage permissions. Android compilation uses the remote Windows/WSL host (`ssh pc`); [native commands](native/commands.md) and [remote snapshot](native/remote-snapshot.json) record the build environment. The coordinator stopped earlier local Android compilation at 17:01 UTC; final accepted Android artifacts are remote-built. iOS simulator builds are local, arm64, and limited to two jobs.

Native owns bridge/builds and Android device operations. Core owns TypeScript, this evidence index, and the iOS B edit/delete/theme proof after the coordinator-authorized handoff; reporting owns the endpoint and rehearsal transport. Both device owners retain the synthetic data containers. Android's [original radio settings are restored](android/device-restored.json); iOS B is [gracefully shut down](ios/seed-b-final-runtime.json) after the coordinator's independent final check. iOS A remains a seeded Flutter-only sandbox, with no target import claimed. The native source/preference bridge has no write operation, and the TypeScript file handle is explicitly read-only.

These are local debug/simulator builds launched through an opt-in raw development bundle. The launcher omits normal manifest asset metadata, causing two empty-URL ExpoAsset download failures and missing decorative Android images. Shipping migration and settings operations execute, but the rehearsal does not establish signed release launch/asset behavior. [Native details](native/README.md) and [reproducible harness commands](../../../../mobile/scripts/migration-rehearsal/README.md) document that boundary.

## Remaining release gates

- Signed physical TestFlight and Play internal/closed upgrades, followed by final public-store upgrade passes.
- Physical iPhone container/data-protection behavior, Android backup/restore integrity, device restart/background-first-launch/OTA scenarios, and low-end release-mode duration/peak memory.
- Live timetable/push behavior with production-equivalent services; synthetic transport proves local integration only.
- Production report migration/grants, trusted proxy/rate-limit secret, Redis, retention, encryption and telemetry settings; local PostgreSQL 18 proof does not replace PostgreSQL 14 target verification.
- Resolve or formally account for the independent mobile/server baseline test failures before a clean release gate.

No broad rollout approval follows from this evidence. The [normative migration specification](../../05-tech-specs/data-migration.md) and [QA playbook](../../04-migration-qa/README.md) define the remaining gates.
