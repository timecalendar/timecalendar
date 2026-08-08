# Mobile display-timezone preference

## Why

A student traveling abroad sees every course time shift to the device timezone (real reported bug from the Flutter era): a Paris school's schedule should be readable in Paris time from anywhere — and the inverse holds for outre-mer and exchange students. The display zone must be a user preference, not an inference. The groundwork is ready: epic 04 shipped the `getEffectiveTimezone()` accessor designed for exactly this override, `date-fns-tz` is already a dependency, and `@howljs/calendar-kit` accepts a `timeZone` prop.

## What Changes

- **New setting** `settings.timezonePreference`: `"system" | <curated IANA zone>`, default `"system"` (device zone — today's behavior). Curated list = Europe/Paris + the French outre-mer zones (~10 entries), not a 400-entry picker. Stored/validated/exposed exactly like the theme and language preferences (total parser, reactive hook).
- **Display rendering in the effective zone** (the real work): every rendered event time — calendar grid, agenda, event details, home dashboard (welcome card, upcoming, today timeline), hidden-events list, personal-events list — formats in the effective display zone instead of the device zone. Day bucketing ("today", day keys, agenda ranges, calendar-kit grid, now-indicator position) follows the same zone so an event never renders at the right time on the wrong day. The three duplicated `localDayKey` copies collapse into one zone-aware helper.
- **All-day events stay floating**: date-only events keep the existing UTC-day-key path and are never shifted by the preference.
- **Personal-event input coherence**: the date-time pickers interpret and echo wall-clock times in the effective zone, so a created "14:00" event displays as 14:00.
- **Notification side rides the epic 04 seam**: `getEffectiveTimezone()`'s body changes to preference-wins-device-fallback, so the subscription PUT carries the override automatically; a preference change becomes a re-registration trigger. Push bodies are then rendered by the server in the chosen zone — intended, and consistent with the display.
- **Settings UI**: a timezone row in the settings hub opening a picker screen (curated list + "Automatic"), FR/EN strings.
- **Greeting stays device-local**: good-morning/evening follows where the user physically is, not the display zone.

## Capabilities

### New Capabilities

- `mobile-display-timezone`: the display-timezone preference (curated union, storage, resolution to an effective zone) and the rendering contract — all event times and day bucketing in the effective zone, all-day events floating, picker UI.

### Modified Capabilities

- `mobile-settings-prefs`: the settings prefs layer persists a third preference (timezone) under the same seam/validator/hook pattern.
- `mobile-fcm-subscription`: the effective-timezone accessor becomes preference-aware (preference wins, device fallback); a timezone-preference change becomes a re-registration trigger alongside the device-timezone change.

## Impact

- `mobile/src/features/settings/prefs/` — new preference key, parser, hook, `resolveTimezone`; curated zone list.
- `mobile/src/features/calendar/data/format.ts` — all nine formatters become zone-aware (`date-fns-tz` `formatInTimeZone`, same format strings/locales).
- `mobile/src/features/calendar/data/day-key.ts` + the two duplicated copies (`home/data/selectors.ts`, `use-home-screen-controller.ts`) — consolidated, zone-aware.
- ~20 hand-rolled local-field sites (agenda bucketing, time-grid now indicator, event-window, calendar/home controllers, today-timeline) — re-based on the effective zone.
- `mobile/src/features/calendar/renderer/calendar-kit/calendar-kit-timeline.tsx` — pass `timeZone` to `CalendarContainer`.
- `mobile/src/features/notifications/data/localization.ts` + `registration.ts` — accessor body + trigger wiring.
- `mobile/src/components/date-time-field.tsx`, `personal-events-list.tsx` — the two seam-bypassing `toLocaleString` sites.
- New settings picker screen + route + i18n keys (FR/EN).
- No server changes (already accepts any IANA zone). No per-calendar timezones.
- **Depends on** the `mobile-notifications-alignment` change (epic 04) landing first — it creates the accessor seam this change overrides.
