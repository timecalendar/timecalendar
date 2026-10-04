# Synthetic migration transport rehearsal

This opt-in debug entry runs the shipping importer, gates, repositories and UI
under the production application ID and production backend eligibility. It changes
only JavaScript fetch transport. It is never imported by the shipping entry and
refuses `__DEV__ === false`.

Native/device ownership remains with the native worker. Do not replace or clear a
device's app unless that worker has verified its synthetic Flutter seed. Android
APK builds run on the approved remote Windows PC, never on the MacBook Air.

## Metro activation

From `mobile/`, the native owner starts Metro with the existing production debug
binary's environment and the isolated config (one worker):

```sh
APP_VARIANT=production OTA_CHANNEL=production \
BACKEND_ENVIRONMENT_CAPABILITY=production \
EXPO_OVERRIDE_METRO_CONFIG=./scripts/migration-rehearsal/metro.config.cjs \
npx expo start --dev-client --max-workers 1 --port 8086
```

The pinned Expo 56 CLI reads `EXPO_OVERRIDE_METRO_CONFIG` in
`instantiateMetro.js`. This internal CLI option is version-sensitive. The config
preserves Expo's default rewrite (including Hermes/router transform parameters),
then redirects the default app entry bundle to `entry.js`. Package metadata,
shipping source, native identities, importer eligibility and storage are untouched.

Connect the production-identity debug app to this Metro instance using the normal
development-client URL/device reverse-port flow. Before accepting a first launch,
verify in the Hermes inspector that `globalThis.__migrationRehearsal.status()`
exists and reports `mode: "offline"`. A missing global means the isolated entry
was not activated; do not interpret that launch as an offline fixture pass.

For a production-identity debug build whose development manifest requests the
production OTA signing key, the installed dev launchers also accept a direct raw
JavaScript bundle URL. The native owner can use this as the development-client
deep link's encoded `url` value, with the appropriate platform:

```text
http://127.0.0.1:8086/scripts/migration-rehearsal/entry.bundle?platform=ios&dev=true&minify=false&transform.routerRoot=src%2Fapp
```

The iOS manifest parser classifies a JavaScript response without `Exponent-Server`
as a raw bundle; Android has the corresponding React Native loader. This explicit
debug launch does not change release signing or require the production private key.
It may omit manifest-derived configuration, so verify runtime readiness and importer
eligibility before interpreting device results.

## Inspector controls and readback

```js
__migrationRehearsal.status()
__migrationRehearsal.snapshot("SEED-A")
__migrationRehearsal.setMode("online", 1)
// Trigger pull-to-refresh through the actual app UI.
__migrationRehearsal.snapshot("SEED-A", "after-sync")
__migrationRehearsal.setMode("online", 2)
// Pull-to-refresh again: UIDs stay stable and visible course titles update.
__migrationRehearsal.snapshot("SEED-A", "after-sync")
__migrationRehearsal.setMode("offline")
```

`snapshot` reads the real SQLite/MMKV state through shipping seams. It returns
counts, exact fixture-equality booleans, bounded journal/outbox state, and cache
presence/revision checks, never tokens or user-authored values. It refuses unknown
entity IDs before projection. `SEED-B` expects 3 calendars, 60 personal events,
134 checklist items and 21/6 hidden UID/name entries. `SEED-A` expects 1/5/5 and 1/1.
Changelog may already advance through the shipping gate; its check accepts the
imported value or a later seen version. Ongoing user edits can deliberately make
fixture-equality checks false; capture the baseline first. Baseline expects an empty
sync cache; `after-sync` expects cached courses and applies the real shipping
`selectPageEvents` to decoded SQLite rows, proving UID/name hiding and visible linked
courses. Calendar school fields, timestamps and exact lowercase source colour are
checked, and migration onboarding suppression must be true.

The online fixture accepts only the exact synthetic token pattern from
`app/tool/migration_seed.dart`. It returns generated calendar DTO fields including
the checklist-linked `synthetic-cached-event`, a visible course, every seeded hidden
UID/name match, and a stable-ID revision 2. Unknown requests and non-synthetic
calendar tokens fail closed. No backend request delegates to production fetch.

This is injected fetch failure on iOS, not radio-off evidence. Android radio-off
proof is a separate native-device operation. Native SDK traffic, Expo asset/native
networking and WebSockets are outside this fetch harness; do not claim the whole
device is disconnected from these counters. Use only synthetic app state.

## Reporting

Online capture alone returns 503 so the genuine outbox stays pending. The actual
local receiver runs the compiled shipping Nest reporting module against the isolated
`timecalendar_migration_rehearsal` PostgreSQL database on loopback37291 and Redis
on loopback37292. It creates only that fixed local database/schema, binds IPv4
loopback8090, and retains rows across receiver restarts:

```sh
# From mobile; server must already have been built.
node scripts/migration-rehearsal/report-server.cjs
# A second terminal can inspect bounded, content-free receipt metadata:
node scripts/migration-rehearsal/report-server.cjs --status
```

Stop the receiver with SIGINT/SIGTERM after device proof. The baseline smoke report
`c210fa96-6794-4d70-93fd-a4e10cb8830a` is synthetic receiver calibration, not a device
result. This fixture receiver uses the local database owner; production role
separation is proved separately by server E2E tests, not this loopback process.

Optionally,
configure an explicit reachable local first-party reporting test server:

```js
__migrationRehearsal.setReportEndpoint(
  "http://127.0.0.1:8090/v1/migration-reports",
)
await __migrationRehearsal.deliverReports()
__migrationRehearsal.status()
```

The local URL must use HTTP, a loopback/private IPv4 host, the exact report path,
and no credentials/query. Use Android reverse-port forwarding or a permitted local
iOS test route as appropriate. Only report delivery may use saved real fetch;
calendar sync remains synthetic. The backend's actual HTTP status determines
delivery. The shipping outbox's next-attempt time remains authoritative: the manual
call does not bypass backoff, edit its state, or force delivery early. Report status
contains only report IDs, outcomes and receipt counts; no report body is logged.

## Checks

```sh
node --test scripts/migration-rehearsal/*.test.cjs
```

The Node tests cover offline-by-default, no production delegation, exact synthetic
DTOs/identities, repeat/update sync, local-only report forwarding, pending outbox
semantics and the actual pinned Metro config rewrite. Device execution and screenshot
evidence belong to the native worker.
