# Architecture Book changelog

## 2026-08-29

- Split the two meanings of "server E2E". `server/npm run test:e2e` is now a committed,
  dependency-free in-process Nest HTTP smoke with its own discovery root
  (`server/test/jest-e2e.json`, `test/**/*.e2e-spec.ts`) that cannot rediscover the
  `server/src` unit suite, enforced as a named `Run server E2E tests` step in
  `ci-build-deploy.yml`; `ci/e2e-server.sh` keeps sole ownership of the real-backend
  lifecycle behind Maestro and legacy Flutter device E2E. `--passWithNoTests` is banned
  so an empty E2E suite stays red. No ADR: this restores a documented gate and records
  existing ownership rather than making a costly-to-reverse choice (testing.md).
- Recorded that the committed spec now carries `PATCH /v1/calendars/{token}` (token-authorized
  calendar rename), served by a second controller with a path-level `/v1` prefix rather than by
  NestJS global versioning, which stays disabled so the existing unversioned calendar read, create
  and sync routes keep serving Flutter release builds. Generalized the `/v1` rule from "exactly one
  route" to "a path-level prefix per controller" now that `POST /v1/calendar-logs/search` is a
  second instance of the same pattern. The epic's architecture decisions record is owned by a later
  ticket; this entry states the contract fact only (data.md).
- Added the device-local Activity model: the `activity_logs` and `activity_state` tables, an
  additive migration, and the `activity` feature's data layer. Two decisions are recorded in
  ADR 046. First, the cache is **merged by server log id, never drop+replaced** — history is
  cursor-paginated, so a replacing newest-page refresh would delete every older page a student
  had backfilled and shrink the offline timeline to one page; upsert identity is also what makes
  a repeated page, an overlapping page and a restarted pagination chain idempotent. Second, the
  **read watermark is server-issued time**: a device-clock watermark on a phone whose clock is
  set forward hides every subsequent change permanently, and set backward re-marks read history
  as unread forever. The one-year prune cutoff derives from server time for the same reason, and
  `lastSuccessfulRefreshAt` stays device time by design — the two clocks in one row are the point
  of the record, not an inconsistency to unify (storage.md, features.md, ADR 046).
- Grew the single backend-bound reset list from four tables to six. `switch.ts` calls
  `resetBackendDatabase()`, so there remains exactly one list and the environment switch needs no
  separate change; a table missing from it would leave another environment's private schedule data
  on the device (storage.md).
- Required a migration's upgrade path to be proven against **real SQLite**, not only against the
  suite-wide expo-sqlite mock: the committed SQL is applied to an in-memory `node:sqlite` database
  on a fresh install *and* on top of a database already holding rows in every earlier table. The
  mocked seam can only prove runner wiring, and a migration that fails on an installed database is
  a data incident. No ADR: this tightens the existing testing contract for a surface the Book
  already calls sensitive (storage.md, testing.md).
- Left ADR `045` free. The open source-recovery PR carries an ADR numbered `044` that collides
  with the merged `044` and renumbers to `045` on rebase; an ADR-number collision is invisible to
  git because two different filenames merge as two clean adds (decisions/README.md).

## 2026-08-28

- Isolated four mobile Jest suites from declaration order by awaiting RNTL 14 async helpers and
  adding targeted exception-safe teardown for one-shot mocks, spy implementations, and MMKV test
  preferences. Global mock restoration remains prohibited because it would remove harness-owned
  native spies. No ADR is needed: this applies the existing test-isolation contract without a
  costly-to-reverse architecture decision (testing.md).
- Required suite-owned spy history and queued one-shot implementations to be reset through
  exception-safe, targeted teardown before another test runs, while preserving persistent
  `jest/setup-*.ts` spy wrappers. The splash dismissal suite is the concrete pattern; this is an
  R-4 test-harness leaf fix and adds no ADR (testing.md).
- Removed the persistent non-production environment marker. The Settings environment entry is now
  the single non-production indicator and must expose the effective environment in its accessible
  name on both platforms; no environment surface may consume layout insets or otherwise change
  screen composition relative to a production build, so headers can be integration-tested and
  screenshotted at their shipped position. Supersedes the marker consequence of ADR 043
  (043-backend-environment-reset.md, features.md).
- Set an explicit per-test time budget for the Jest harness (`testTimeout: 30000`) with a
  config-drift guard at a 20 000 ms floor, resolving the baseline gate's named intermittent —
  a per-test timeout misread as a `getByText` miss. ADR 044 records the measurements and the
  binding rule: the budget is a harness capacity setting and may never be cited for a longer
  query wait, a retry, or a weakened matcher. Also added `usePlatform`
  (`src/test-support/platform.ts`) so a `Platform.OS` override always restores, a separate
  latent order dependence (testing.md, ADR 044).
- Added fetch-time ADE iCal normalization to a rolling UTC window from 12 calendar months
  before through 12 months after each fetch. Rewrites remain ephemeral so source URLs are not
  persisted with expiring dates, while existing sync cadence and school-specific exceptions
  remain unchanged (calendar.md).
- Added the nullable school dark-logo API contract and mobile theme selection with required light
  fallback. ADR 041 records the relative-key server mapping, generated-client obligation, and
  additive Flutter/web compatibility (data.md, theming.md, features.md).

## 2026-08-27

- Added the independent backend capability, fixed endpoint allowlist, visible preview/development
  selector, persistent non-production marker and journaled destructive cross-store reset. ADR 043
  records fail-closed production behavior, state classification and the future-auth participant
  invariant; all four release fingerprints changed and require fresh native builds.
- Bound the iOS `preview` submit profile to public App Store Connect app `1479613630` while keeping
  production and Apple account/team credentials environment-backed. Focused Jest and direct `jq`
  checks guard the destination; no build, signing, upload, or submission occurred (eas.md,
  `mobile/EAS.md`).
- Restored the iPhone+iPad App Store continuity contract while retaining portrait-only,
  full-screen behavior and intentionally disabling iPad multitasking. Source-config tests and a
  disposable generated-native assertion enforce device families `1,2`, full-screen presentation,
  and portrait-only iPad orientations. Refreshed iOS fingerprint evidence records the required
  fresh signed preview binary and OTA incompatibility; no build or submission occurred (ADR 042,
  runtime.md, eas.md, `mobile/EAS.md`).
- Established the worktree-scoped local Compose entrypoint and the reusable
  Postgres/Redis-only prerequisite for OpenAPI generation and server tests, while
  preserving `ci/e2e-server.sh` as the E2E lifecycle owner (testing.md).

## 2026-08-26

- Made contact-service 503 failures explicitly retryable in Feedback while retaining
  form values, added equivalent accessible FR/EN guidance, and redacted `/contact`
  request/response bodies from development API diagnostics (data.md, features.md).
- Made iOS submit profiles target the existing App Store Connect record with the committed public
  `ascAppId`; EAS-managed API-key authentication remains off-repo. Removed literal `$EXPO_*`
  strings because `eas.json` does not shell-expand field values (eas.md, `mobile/EAS.md`,
  `mobile/eas.json`).
- Confirmed from the signed local iOS preview artifact that `eas build --local` stamps the selected
  profile's `expo-channel-name` into `Expo.plist`; removed the incorrect deferred
  `updates.requestHeaders` work (eas.md, `mobile/EAS.md`).
- Wired preview and production native builds to signed xprem delivery: one validated
  `OTA_CHANNEL` source, exact endpoint/app/branch headers, embedded public certificate metadata,
  development OTA disablement, and retained independent EAS linkage. SDK 56 fingerprint evidence
  records conservative per-channel iOS/Android runtimes plus a native-change control; no
  `.fingerprintignore` weakens native config protection (ADR 037, eas.md, `mobile/EAS.md`).
- Recorded the live xprem endpoint and TimeCalendar app UUID plus xprem's database-managed
  per-app signing mode, single public certificate path/fingerprint, and private-key custody
  boundary. Client endpoint/header/channel/certificate wiring remains downstream (eas.md).
- Removed `docs/mobile/build-infrastructure/` and its `mobile-build-infrastructure-guidance`
  spec: the pack recommended EAS Build for signed binaries and a separate `internal-store`
  profile, both rejected by ADR 040, and had no surviving content that `eas.md`,
  `docs/mobile/releases/` or the ADRs did not already carry. Corrected the release guide's
  remaining "EAS build ID" wording to the local artifact record.
- Made `preview` a store-distributed profile (`app-bundle` + store `.ipa`, `autoIncrement`, own
  `submit.preview`), moved store binary production to `eas build --local` on the macOS host with
  EAS retained as credential authority and upload transport, established annotated tags on `main`
  as the release selector, and prohibited promoting a build across channel lanes. ADR 040 records
  it and supersedes decision 2 of ADR 006; decision 1 (the `fingerprint` policy) is unchanged
  (eas.md, `mobile/EAS.md`, `mobile/eas.json`).
- Marked `docs/mobile/ota/` and `docs/mobile/build-infrastructure/` as exploration rather than
  rules, and indexed `docs/mobile/releases/` from the Architecture Book and the rules pointer, so
  the binding release contract has one home.

- Isolated each top-level Maestro flow in its own CLI/XCTest lifecycle while retaining one
  shared backend lifecycle, and bounded iOS retries to positively classified startup-only
  transport failures so assertion and application failures remain terminal (ADR 038,
  testing.md).

## 2026-08-25

- Ratified signed, self-hosted xprem OTA delivery with Cloudflare R2 assets, the existing
  production Postgres control plane without ClickHouse, fingerprint runtime compatibility,
  deliberately imperative channel/rollout controls, non-blocking launch, silent one-attempt
  foreground-boundary application, and five bundle-identity Crashlytics keys (ADR 037,
  eas.md, firebase.md).
- Reconciled `architecture.md` so this file is the canonical Architecture Book rule-change log,
  while Git retains implementation history and detailed diffs.
- Added the bundled Changelog history and tabs-only once-per-version sheet contract. ADR 039
  records the integer MMKV gate, fresh-install suppression, OTA semantics, and Phase 09 import
  ordering.
- Replaced the interim onboarding welcome with a neutral, localized three-page carousel and adopted the feature-local `react-native-pager-view` native bridge. ADR 036 records its native paging/event contract, suite-wide Jest seam, autolink/no-permission posture, and fresh-binary fingerprint consequence.
- Added the layered Feedback root route, validated last-e-mail persistence, existing
  generated contact-client seam, Settings support entry, and DTO-bounded report action
  for recorded iCal import failures. Contact failure telemetry remains body-free.

## 2026-08-08

- Added the curated display-timezone preference (`settings.timezonePreference`,
  `"system"` + 10 French zones) resolved at one settings-prefs seam
  (`resolveTimezone`/`useDisplayZone`); every rendered event time and day
  boundary is zone-threaded explicitly (formatters, day keys, bucketing,
  now-indicator, calendar-kit `timeZone`), all-day events stay floating, the
  greeting stays device-local, and the notification subscription follows the
  same zone with a resolved-zone re-registration trigger (ADR 035, calendar.md,
  features.md).
- Aligned the notifications feature to the server's v2 wire contract: lowercase
  `new | edit | cancel` payload canon plus the `calendar_digest` action (routes to
  Calendar, re-syncs on foreground), and the subscription DTO now carries `locale`/
  `timezone` read through effective accessors, with language- and timezone-change
  re-registration triggers (ADRs 027/028, firebase.md).

## 2026-08-07

- Established Home · Calendar · Settings as the mobile tab hierarchy, with a nested
  Settings Stack, feature-owned grouped destination hub, derived held-calendar
  summary, and temporary `/profile` compatibility redirect (ADR 034).
