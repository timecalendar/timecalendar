# Synthetic QA transport evidence

The isolated harness lives under `mobile/scripts/migration-rehearsal/`. Its shipping
package entry and `src/**` importer/runtime are unchanged by the harness. Activation,
Hermes controls, exact readback assertions and network boundaries are documented in
[the harness README](../../../../../../mobile/scripts/migration-rehearsal/README.md).

`verification.json` records twelve passing Node checks and the coordinator's
independent twelve-test run at `590edb63` (17:47 UTC), plus its earlier six-test
transport check. The final independent run at `ea37ca51` (18:00 UTC) also passes
all twelve checks, including the direct Android bundle rewrite.
`receiver-smoke.json` records two HTTP acknowledgements
persisted as one real PostgreSQL report, with receipt count two. The calibration ID
is synthetic and must not be counted as a device migration result.

The real iOS SEED-B outbox delivered report
`7000d54a-612c-4726-bbb8-4e8fd82c1ecf` through the generated client and local receiver.
The independent [receiver readback](device-receipts.json) shows exactly one iOS row
with one receipt delivery at `2026-10-04T17:52:11.649Z`; the
[native snapshot](../../ios/seed-b-sync2.json) shows `delivered_at` ten milliseconds
later, after four outbox attempts including offline failures. The Android SEED-A
report `6c8eec01-f56f-4449-9a9a-838607f79a4e` is also stored exactly once at
`2026-10-04T17:57:21.986Z`; the [native Android snapshot](../../android/seed-a-sync2.json)
independently shows its acknowledged outbox on attempt three. Device and server wall clocks differ, so these stamps do not measure
delivery latency. The separate calibration report remains excluded from the device
denominator.

The independent [stored-payload privacy check](device-privacy.json) reruns the
shipping strict validator without exporting the payload: both real device reports
pass, occupy 962 serialized bytes each, and omit the fixtures' non-UUID calendar
identifiers with `calendarIdsTruncated=true`.

The real Nest controller/validator/repository receiver binds IPv4 loopback8090;
Metro is owned by the native worker on8086. The receiver uses the fixed local
`timecalendar_migration_rehearsal` database, separate from Jest's disposable worker
databases. No production connection string or credentials are read by its script.

Device first-launch, offline screenshots, in-place sandbox survival and real
Hermes/SQLite/MMKV results are collected by the native worker. Node tests do not
prove those device outcomes. iOS failure is fetch-injected; Android radio-off proof
is a separate device step. Native SDK networking is outside this fetch harness.

The debug entry uses the shipping ExpoRoot/route context/Head with initial location
`/`, because a raw bundle URL otherwise selects an unmatched application route.
Its fixed startup markers and production-identity/capability booleans contain no
source values, credentials, URLs, or raw errors. This route normalization is limited
to the opt-in rehearsal entry.
