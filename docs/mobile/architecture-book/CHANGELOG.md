# Architecture Book changelog

## 2026-08-28

- Refined ADR 038's bounded iOS startup-transport classifier from two to three positive
  shapes. A deep-link reopen is retryable only when output contains the complete
  `IOSDriver.openLink` + `NSPOSIXErrorDomain code=60` + `Simulator device failed to open` +
  `Operation timed out` conjunction after the assertion guard; partial signatures, generic
  timeouts, assertion-bearing output, application failures, and unknown failures remain
  terminal with their original result (ADR 038, testing.md).
- Restored release-config native E2E routing to the seeded local backend by requiring the
  development app variant, independent development backend capability, and platform-local URL
  in every Android/iOS prebuild and release-compilation step, with step-scoped workflow proof
  (testing.md).
- Widened the ADR 038 iOS startup-retry class from "first-`launchApp` XCTest transport failure"
  to the two shapes a driver-startup failure actually takes, the second being the driver never
  binding its port (`IOSDriverTimeoutException`). Maestro raises that while creating the session,
  before it opens the flow, so its output carries no flow command — anchoring the classifier on
  `launchApp` made the most canonical startup flake terminal and spent none of the four-attempt
  budget. Assertion, application, and unknown failures stay terminal on first occurrence
  (ADR 038, testing.md).
- Required a Maestro seeded-title text selector to match every surface that renders that title,
  enforced by a second guard in `mobile/e2e/maestro-selectors.test.ts` in the baseline gate. An
  agenda or today-timeline tile is an accessibility container whose label _extends_ the title
  (`{{title}}, {{time}} {{location}}`); XCUITest collapses it and drops the child text, and a
  Maestro text selector is a fully anchored regex — so a bare title matched nothing on iOS
  against a screen that plainly showed the event, and one `assertNotVisible` passed vacuously.
  Flows now use `"<title>(,.*)?"`, one cross-platform form with no loss of strength. Distinct
  from a stale id and from a below-the-fold control: the id guard is correct to stay silent,
  since only the iOS projection of a real string differs (testing.md).
- Required Maestro flow `id:` selectors to resolve against real `mobile/src` testIDs, enforced by
  `mobile/e2e/maestro-selectors.test.ts` in the baseline (not the on-demand native) gate.
  Selectors match as regexes, testIDs count as JSX attributes and object properties, and
  template-literal testIDs stand for their family — a literal-only matcher would allowlist
  working ids and disarm the guard. Recorded the calendar-family `calendar-view` agenda switch
  and the EN-label fallback for controls that cannot carry a testID (testing.md).
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
