# Mobile notifications alignment (epic 04)

## Why

The mobile notification feature was built against the frozen legacy wire contract (ADR 028) and predates the server's v2 notifications pipeline (epic 03, shipped). Three gaps: a casing bug makes a cancellation tap route to the details page of a deleted event (empty screen) instead of the calendar; the new v2 digest push (`action: "calendar_digest"`) is not handled and should route to the calendar; and the subscription DTO does not send `locale`/`timezone`, so the server renders every notification in French / Europe/Paris regardless of the device. The app has zero deployed users, so the contract can be adopted directly with no compatibility window.

## What Changes

- **Tap-routing casing fix**: `parseNotificationRoute` compares `decoded.type === "CANCEL"` but the v2 canonical wire values are lowercase `new | edit | cancel`. Align the comparison (and the payload contract comment + ADR 028's payload description) to the lowercase canon.
- **Digest handling**: the v2 summary push (`data.action = "calendar_digest"`, `data.count`) currently parses to `null` (safe no-op). A digest tap SHALL route to `/calendar`; a foreground digest message SHALL trigger a calendar re-sync (same as `calendar_changed`).
- **DTO fields**: the registration seam (`subscription.ts`, ADR 027) SHALL include `locale` (device language, `fr`/`en`) and `timezone` (device IANA zone) in the assembled `NotificationSubscriptionCreate` DTO. The seam reads one "effective timezone" accessor from day one, so epic 05's timezone preference can later override the device zone without touching the seam.
- **Re-registration triggers**: a device locale or timezone change SHALL re-PUT the subscription (extends the existing preference-change / token-refresh triggers).
- **Docs**: ADR 027/028 touch-ups for the new fields and payload canon.

The Orval client was already regenerated from the epic 03 OpenAPI spec (`locale`/`timezone` are present in the generated schemas); this change only verifies it is current.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mobile-fcm-tap-routing`: payload `type` canon becomes lowercase `new | edit | cancel` (cancel → calendar route); new `calendar_digest` action routes taps to the calendar and re-syncs on foreground.
- `mobile-fcm-subscription`: the assembled DTO gains `locale` and `timezone` (via an effective-timezone accessor); device locale/timezone changes become re-registration triggers.

## Impact

- `mobile/src/features/notifications/data/tap-routing.ts` — casing fix, digest action, contract comment.
- `mobile/src/features/notifications/data/subscription.ts` — DTO assembly (`locale`, `timezone`), effective-timezone accessor.
- `mobile/src/features/notifications/data/registration.ts` — locale/timezone-change re-registration trigger (expo-localization).
- Tests: tap-routing contract tests against the exact v2 payload shapes; subscription/registration tests to the 90% branch coverage gate.
- Docs: ADR 027 (registration seam), ADR 028 (payload contract), Architecture Book `features.md` if the feature entry describes the contract.
- No server changes; no generated-client changes expected (regenerated in epic 03).
