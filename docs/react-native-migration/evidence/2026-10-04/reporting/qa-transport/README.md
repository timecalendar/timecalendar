# Synthetic QA transport evidence

The isolated harness lives under `mobile/scripts/migration-rehearsal/`. Its shipping
package entry and `src/**` importer/runtime are unchanged by the harness. Activation,
Hermes controls, exact readback assertions and network boundaries are documented in
[the harness README](../../../../../../mobile/scripts/migration-rehearsal/README.md).

`verification.json` records nine passing Node checks and the coordinator's independent
six-test transport run. `receiver-smoke.json` records two HTTP acknowledgements
persisted as one real PostgreSQL report, with receipt count two. The calibration ID
is synthetic and must not be counted as a device migration result.

The real Nest controller/validator/repository receiver binds IPv4 loopback8090;
Metro is owned by the native worker on8086. The receiver uses the fixed local
`timecalendar_migration_rehearsal` database, separate from Jest's disposable worker
databases. No production connection string or credentials are read by its script.

Device first-launch, offline screenshots, in-place sandbox survival and real
Hermes/SQLite/MMKV results are collected by the native worker. Node tests do not
prove those device outcomes. iOS failure is fetch-injected; Android radio-off proof
is a separate device step. Native SDK networking is outside this fetch harness.
