# Design — mobile display-timezone preference

## Context

Every rendered event time goes through `date-fns format()` on local `Date` fields — device-timezone-bound by construction. The intended seam exists (`mobile/src/features/calendar/data/format.ts`, nine formatters), but ~20 hand-rolled `getHours()`/`getDate()` sites live outside it: day bucketing in `agenda.ts` and `home/data/selectors.ts`, the now-indicator in `time-grid.ts`, quarter windows in `event-window.ts`, day parsing in the calendar/home controllers, minute-of-day math in `today-timeline.tsx` — plus three copies of `localDayKey` and two direct `toLocaleString` calls (`personal-events-list.tsx`, `date-time-field.tsx`). Missing any of these renders an event at the right time on the wrong day.

Ready groundwork: `date-fns-tz` ^3.2.0 is installed (unused in mobile; the server formats pushes with its `formatInTimeZone`); `@howljs/calendar-kit` accepts a `timeZone` prop backed by a real internal `TimeZoneProvider`; epic 04's `getEffectiveTimezone()` (`notifications/data/localization.ts`) was written to be overridden by exactly this preference. Event storage is canonical UTC ISO text (`db/schema.ts`, `mappers.ts`); source offsets are destroyed at ingest, which is fine for re-projecting an instant to a display zone. All-day events are stored as UTC midnight and treated as floating everywhere.

**Ordering**: builds on the in-flight `mobile-notifications-alignment` change (epic 04) — that lands first.

## Goals / Non-Goals

**Goals:**

- One preference, `"system" | <curated zone>`, defaulting to today's behavior.
- Every event time and every day boundary the user sees resolves through one effective-zone seam.
- Notifications carry the same zone (server renders push bodies in it) with zero DTO/trigger churn beyond the accessor body and one new trigger key.
- All-day events remain floating.

**Non-Goals:**

- Per-calendar timezones.
- Server-side changes.
- Full 400-entry IANA picker or timezone search.
- Rendering an event in its *source* calendar's zone (offsets are already destroyed at ingest; out of scope by design).

## Decisions

### D1 — Curated zone union, validated like every other preference

`TimezonePreference = "system" | CuratedZone`, where `CuratedZone` is the 10-entry list: `Europe/Paris`, `America/Guadeloupe`, `America/Martinique`, `America/Cayenne`, `America/Miquelon`, `Indian/Reunion`, `Indian/Mayotte`, `Pacific/Noumea`, `Pacific/Wallis`, `Pacific/Tahiti`. A closed union means `makePreferenceParser` works unchanged (total parser, `"system"` on unset/corrupt/legacy) — an open IANA string would need bespoke validation and an unbuildable picker. Covers the epic's stated audience (métropole + outre-mer + anyone wanting "school time" from abroad). Extending the list later is additive.

*Alternative rejected*: full IANA list — 400-entry picker UI, open-string validation, no user need identified.

### D2 — Effective zone resolved in settings prefs; notifications accessor delegates

`resolveTimezone(pref)` (pref wins; `"system"` → device zone via `getCalendars()[0]?.timeZone` → `"Europe/Paris"` fallback) plus imperative `getDisplayZone()` and reactive `useDisplayZone()` live in `settings/prefs/` — the exact shape of `resolveLanguage`/`getLanguagePreference`. The notifications accessor `getEffectiveTimezone()` changes ONLY its body to delegate (`resolveTimezone(getTimezonePreference())`), the contract epic 04 wrote down; precedent for the cross-feature import is `getEffectiveLocale()` already calling `resolveLanguage`. This intentionally changes push-body formatting to the chosen zone — desired, so notification times match on-screen times.

*Alternative rejected*: separate display-zone vs notification-zone accessors — two zones for one user is a product bug, not flexibility.

### D3 — `date-fns-tz` re-projection, not Intl and not a library swap

Formatting: `formatInTimeZone(date, zone, fmt, {locale})` — same format strings and `fr`/`enUS` locale objects `format.ts` already uses, and parity with how the server formats push bodies. Field math (day keys, hour buckets, minute-of-day): `toZonedTime(date, zone)` then the existing local-field logic on the shifted Date. Input (D6): `fromZonedTime`. `Intl.DateTimeFormat`'s `timeZone` support on this Hermes build is unverified — not worth finding out.

### D4 — Zone is threaded explicitly; day-key duplicates collapse

Formatters and day-key/bucketing helpers take the zone as a parameter; components read `useDisplayZone()` and pass it down (controllers/selectors take it as an argument). Explicit threading keeps pure functions pure and testable, and makes the compiler enumerate every call site — exactly the inventory this change must not miss. The three `localDayKey` copies (`calendar/data/day-key.ts` canonical, duplicated in `home/data/selectors.ts` and `use-home-screen-controller.ts`) collapse into one zone-aware `dayKey(date, zone)`; `utcDayKey` stays as-is for all-day floating dates. Reactivity comes free: preference changes re-render via `useParsedStoredString`, device-zone changes (under `"system"`) via expo-localization's `useCalendars()`.

*Alternative rejected*: formatters read the zone internally via an imperative getter — hides the dependency, breaks re-render on preference change, unpure tests.

### D5 — calendar-kit gets the `timeZone` prop; grid math follows

`CalendarContainer` receives `timeZone={displayZone}` (`calendar-kit-timeline.tsx`), so calendar-kit's internal event division/visible-day logic shifts with us. `initialDate`, the event-window quarter boundaries, and the now-indicator minute-of-day all re-base on the display zone so the grid, the window of fetched events, and the red line agree. Timed events keep `{dateTime: toISOString()}` in the adapter (instants; calendar-kit projects them); all-day keeps `{date: utcDayKey(...)}` untouched.

### D6 — Personal-event input interprets wall-clock in the display zone

The date-time pickers return device-local `Date`s; the field takes the picked wall-clock components and reinterprets them in the display zone (`fromZonedTime`), and echoes values back with the zone-aware formatter (replacing the two raw `toLocaleString` sites). A user who types 14:00 sees 14:00 in the list — under `"system"` this is byte-for-byte today's behavior.

### D7 — What stays device-local

`greetingSelection` (good-morning/evening + weekend tint) keeps device time: it's about where the user physically is. Nothing else does.

### D8 — Settings UI: hub row + small picker screen

A timezone destination row in the settings hub opens a dedicated screen (thin `src/app/` route re-exporting from `settings/ui/`, per route rules) listing "Automatic" + the 10 curated zones — the existing appearance-settings `<Picker>`/chrome pattern scaled to 11 entries; no search needed. Zone labels are i18n keys (FR/ER parity) with the city/territory name, e.g. "La Réunion (UTC+4)".

## Risks / Trade-offs

- [A missed local-field site renders the right time on the wrong day — looks like a data bug] → zone threading makes call sites compiler-enumerable; the tasks carry the full inventory as a checklist; tests pin a non-device zone (e.g. `Pacific/Noumea`) against fixtures spanning midnight boundaries.
- [Repointing `getEffectiveTimezone()` silently changes push-body rendering] → intended and documented (D2); the spec delta makes it normative.
- [calendar-kit's `timeZone` prop is exercised for the first time] → covered by renderer tests + the device pass; if its internal bucketing disagrees with ours at DST edges, our own day keys are authoritative for what we bucket.
- [DST boundary math via `toZonedTime` shifted Dates] → keep all *instant* arithmetic on real timestamps; shifted Dates are used for display/bucketing only, never persisted.
- [jest-expo Hermes lacks full ICU for exotic zone names in tests] → `date-fns-tz` uses its own zone data path via `Intl` — verify in the first task; if red, pin tests to zones known present in jest's Node ICU (full-icu is standard in Node ≥ 14).

## Open Questions

None blocking — greeting scope (D7) and push-side coupling (D2) are decided here; flag in review if disputed.
