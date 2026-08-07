# Design — mobile notifications alignment

## Context

The server's v2 notifications pipeline (epic 03) froze the wire contract: detail push `data.action = "calendar_changed"` with `data.payload = {type, event}`, `type ∈ new | edit | cancel` (lowercase canonical); summary push `data.action = "calendar_digest"` with `data.count`; subscription PUT DTO carries optional `locale` (`fr | en`, server default `fr`) and `timezone` (IANA, server default `Europe/Paris`). The generated Orval client already has both fields (regenerated in the epic 03 PR).

Mobile's current implementation: `tap-routing.ts` compares `type === "CANCEL"` (legacy uppercase — never matches v2, so a cancel tap routes to a deleted event's empty details page); `calendar_digest` parses to `null` (no navigation, no sync); `subscription.ts` assembles the DTO without `locale`/`timezone`.

Relevant existing seams: `@/i18n` `detectLocale()` (device fr/en with en fallback), settings `resolveLanguage(getLanguagePreference())` (user can override app language to fr/en or "system"), live language switching via `i18n.changeLanguage` (i18next emits `languageChanged`), `expo-localization` (already a dependency) provides `getCalendars()[0].timeZone` and the reactive `useLocales()`/`useCalendars()` hooks.

## Goals / Non-Goals

**Goals:**

- Route v2 payloads correctly: lowercase type canon, `cancel` → calendar, digest tap → calendar, foreground digest → re-sync.
- Send `locale` and `timezone` in every subscription PUT, reading each through one accessor so epic 05 can override the timezone without touching the seam.
- Re-PUT when the effective locale or device timezone changes.
- Contract tests against the exact v2 payload shapes; coverage to the 90% branch gate.

**Non-Goals:**

- Timezone preference UI / display-timezone rendering (epic 05).
- Notification-settings screen changes (locale/tz are ambient device values here).
- Client-side notification rendering (notifee).
- Server or OpenAPI spec changes.

## Decisions

### D1 — Locale sent is the app's effective language, not the raw device locale

The DTO `locale` is the language the app actually displays: `resolveLanguage(getLanguagePreference())` (explicit fr/en preference wins, "system" falls through to `detectLocale()`). The epic text says "device language", but the app has a user-facing language override — a user who forces English in settings must not receive French pushes. Read at DTO-assembly time via a `getEffectiveLocale()` accessor in the notifications `data/` sublayer (a data → data cross-feature read of the settings store, same pattern as the `user_calendars` read; B-1 compliant).

Alternative rejected: reading `i18n.language` from the live instance — same value, but couples the seam to i18n runtime init order instead of the pure store + leaf detector.

### D2 — Effective-timezone accessor with device fallback, epic-05-ready

`getEffectiveTimezone()` in the notifications `data/` sublayer returns the device IANA zone: `getCalendars()[0]?.timeZone`, falling back to `"Europe/Paris"` when expo-localization yields none (matches the server default; rare simulator/edge case). Epic 05's timezone preference will later change ONLY this accessor's body (preference wins, device as fallback) — the DTO assembly and triggers never change. This is the "seam reads one effective-timezone accessor from day one" requirement.

### D3 — Re-registration triggers: i18next `languageChanged` + reactive timezone watch

Extend `useNotificationRegistration` (root-layout hook, already owns the mount-PUT and token-refresh triggers):

- **Locale**: subscribe the i18n instance's `languageChanged` event and re-PUT. This covers both the settings override (goes through `i18n.changeLanguage`) and the device-language change on Android while pref is "system" (i18n language-detector re-fires); on iOS a system language change restarts the app, and the existing mount PUT covers it.
- **Timezone**: `useCalendars()` from expo-localization re-renders on device timezone change (Android config change); an effect keyed on the resolved timezone re-PUTs on change, skipping the initial value (the mount PUT already carried it).

Every cold start already PUTs the full DTO, which backstops any change the live triggers miss. Failed trigger PUTs record and self-heal exactly like the existing triggers (Decision 6 of ADR 027).

Alternative rejected: polling or an AppState listener re-reading values on foreground — more moving parts for the same backstop the cold-start PUT already provides.

### D4 — Parser handles both v2 actions; lowercase canon only

`parseNotificationRoute` gains the `calendar_digest` branch returning `{ kind: "calendar" }` (no payload parse needed — `data.count` is display-only server-side). The type comparison becomes `decoded.type === "cancel"`; the defensive "unknown type with a uid routes to the event" behavior stays. No uppercase back-compat: zero deployed users, the v2 contract is the only live one. The foreground handler syncs on either action (`calendar_changed` or `calendar_digest`).

### D5 — Contract tests mirror epic 03's exact shapes

Tap-routing tests are rewritten against literal v2 payloads (lowercase `type`, digest with `count`) copied from the epic 03 spec — the test file is the mobile-side record of the frozen contract. Subscription tests assert the PUT body carries `locale`/`timezone` and that each trigger re-PUTs.

## Risks / Trade-offs

- [i18next `languageChanged` fires on init in some configs] → the trigger subscribes after mount inside `useEffect`; the mount PUT and idempotent PUT semantics make a duplicate re-PUT harmless anyway.
- [`getCalendars()` timezone can be null on some simulators] → explicit `"Europe/Paris"` fallback, matching the server default; recorded in the accessor's test.
- [Digest replacement re-alerts on Android (server-side constraint)] → out of scope here; epic 03 records notifee client rendering as the future fix.
- [Epic 05 changes the timezone source] → contained by D2: one accessor body changes, callers untouched.

## Migration Plan

Pure client change, zero deployed users: ship in one PR (code + tests + ADR 027/028 touch-ups). No rollback concerns beyond git revert.

## Open Questions

None.
