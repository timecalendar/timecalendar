# 035 — Display timezone is a curated preference resolved at one seam

## Status

Accepted.

## Context

Event instants are stored as UTC ISO text; every rendered time and day boundary
was derived from device-local `Date` fields, so travelling shifted a Paris
school's schedule to the device zone (a reported Flutter-era bug). The intended
override point existed (`getEffectiveTimezone()`, ADR 027 era), `date-fns-tz`
was already a dependency, and `@howljs/calendar-kit` accepts a `timeZone` prop.

## Decision

- The display timezone is a settings preference `settings.timezonePreference`,
  a CLOSED union `"system" | <curated zone>` (Europe/Paris + the nine French
  outre-mer zones), stored/validated/exposed exactly like theme and language
  (total parser, reactive hook). No open IANA strings, no 400-entry picker.
- One resolution seam in `settings/prefs`: `resolveTimezone(pref)` — explicit
  preference wins; `"system"` resolves to the device zone via expo-localization
  with `"Europe/Paris"` as the no-zone fallback. Reactive counterpart
  `useDisplayZone()`. No display or notification code resolves a zone any
  other way.
- The zone is THREADED EXPLICITLY: formatters (`calendar/data/format.ts`),
  day-key/bucketing helpers (`day-key.ts`, `agenda.ts`, home selectors), the
  time-grid now-indicator, and the calendar-kit `timeZone` prop all take it as
  a parameter, so the compiler enumerates every call site. Formatting uses
  `formatInTimeZone`; field math uses `toZonedTime`/`fromZonedTime` proxies;
  instant arithmetic stays on real timestamps.
- All-day events stay FLOATING on the UTC-day-key path; the preference never
  shifts them.
- Personal-event input interprets the picked wall clock in the display zone
  (`fromZonedTime`) and echoes through the zone-aware formatters.
- The push side rides the same seam: `getEffectiveTimezone()` delegates to
  `resolveTimezone(getTimezonePreference())`, so the subscription PUT carries
  the override and the server renders push bodies in the displayed zone. The
  re-registration trigger keys on the RESOLVED effective zone (a device-zone
  change under an explicit preference is inert).
- The greeting stays device-local — it is about where the user physically is.

*Rejected*: full IANA list (unbuildable picker, open-string validation);
separate display vs notification zones (two zones for one user is a product
bug); formatters reading the zone internally via a getter (hides the
dependency, breaks re-render on change).

## Consequences

- Every future rendered-time call site must accept/pass the zone — the
  signature is the guardrail; a device-local `getHours()`/`toLocaleString` on
  an event instant is a defect.
- Extending the curated list is additive (union + i18n labels + picker row).
- calendar-kit's `timeZone` prop is now load-bearing; DST-edge disagreements
  are adjudicated by our own day keys.
- Tests pin non-device zones with midnight-boundary fixtures; jest aligns the
  jest-expo device zone to the machine zone (`jest/setup-localization.ts`).

## Revisit if

- A user needs a zone outside the curated set (then: searchable picker over the
  full IANA list, open-string validation).
- Per-calendar timezones become a requirement (source offsets are destroyed at
  ingest today).
- calendar-kit's internal bucketing disagrees with our day keys at DST edges.
