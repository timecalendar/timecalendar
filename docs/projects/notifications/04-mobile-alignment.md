# Epic 04 — Mobile alignment

Repo: `mobile`. Depends on epic 03 freezing the wire contract v2. Small epic.

## Why

Mobile's notification feature was built against the frozen legacy contract (ADR 028) and
predates the v2 decisions. Three gaps:

1. **Casing bug**: `tap-routing.ts` compares `decoded.type === "CANCEL"` but the wire
   value is lowercase `"cancel"` — a cancellation tap currently routes to the details
   page of a deleted event (empty screen) instead of the calendar.
2. **No digest handling**: the v2 summary push (`action: "calendar_digest"`) parses to
   `null` today (safe — syncs, no navigation) but should route to the calendar.
3. **Missing DTO fields**: `locale` and `timezone` (epic 03) are not sent.

## Scope

- Fix the type comparison to the lowercase canon (`new | edit | cancel`); update the
  payload contract comment + ADR 028's payload description.
- `calendar_digest` tap route → `/calendar`; foreground digest message → re-sync (same as
  `calendar_changed`).
- Registration seam (`subscription.ts` / ADR 027): include `locale` (device language,
  `fr`/`en`) and `timezone` (device IANA zone) in the assembled DTO. Re-register when the
  device locale or timezone changes (extend the existing re-registration triggers).
  When epic 05 ships a timezone preference, the effective (overridden) zone is what gets
  sent — the seam reads one "effective timezone" accessor from day one.
- Regenerate the Orval client from the updated OpenAPI spec.
- Tests to the coverage gate; contract tests against the exact v2 payload shapes from
  epic 03.

## Out of scope

- Timezone preference UI / display-timezone rendering (epic 05).
- Notification-settings screen changes (none needed — locale/tz are ambient device
  values, not user-facing settings here).
- Client-side notification rendering (notifee).

## Tasks

1. Lowercase fix + tap-routing tests.
2. Digest action route + tests.
3. DTO assembly: locale + timezone + effective-timezone accessor; re-registration
   triggers; tests.
4. Orval regen; ADR 027/028 touch-ups.
