# Architecture Book changelog

## 2026-08-26

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
