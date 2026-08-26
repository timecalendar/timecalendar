# Architecture Book changelog

## 2026-08-25

- Replaced the interim onboarding welcome with a neutral, localized three-page carousel and adopted the feature-local `react-native-pager-view` native bridge. ADR 036 records its native paging/event contract, suite-wide Jest seam, autolink/no-permission posture, and fresh-binary fingerprint consequence.

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
