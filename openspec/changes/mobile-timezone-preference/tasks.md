# Tasks — mobile display-timezone preference

> Precondition: `mobile-notifications-alignment` (epic 04) is landed — this change edits the
> `getEffectiveTimezone()` accessor it created. Verify early that `date-fns-tz`'s
> `formatInTimeZone`/`toZonedTime`/`fromZonedTime` behave under jest-expo (design D3 risk).

## 1. Preference + resolution seam (settings/prefs)

- [x] 1.1 Add `CURATED_TIMEZONES` (10 zones, design D1) and `TimezonePreference` type + `settings.timezonePreference` key to `settings/prefs/types.ts`; total parser via `makePreferenceParser`
- [x] 1.2 Add imperative `getTimezonePreference`/`setTimezonePreference` and `resolveTimezone(pref)` (preference wins; `"system"` → `getCalendars()[0]?.timeZone` → `"Europe/Paris"`) to `settings/prefs/store.ts`; export from barrel
- [x] 1.3 Add reactive `useTimezonePreference` and `useDisplayZone()` (re-renders on preference change and, under system, on device-zone change via `useCalendars`) to `settings/prefs/hooks.ts`
- [x] 1.4 Unit tests: round-trip, out-of-union fallback, resolve branches (explicit / system / no-device-zone), hook reactivity — coverage gate green

## 2. Zone-aware format seam

- [x] 2.1 Rework `calendar/data/format.ts`: all nine formatters take an explicit zone and format via `formatInTimeZone` with the existing format strings + `fr`/`enUS` locales; `formatEventDateRange`'s timed same-day comparison re-based on zone fields; all-day `utcDayProxy` branch untouched
- [x] 2.2 Consolidate day keys: zone-aware `dayKey(date, zone)` in `calendar/data/day-key.ts`; delete the copies in `home/data/selectors.ts` and `use-home-screen-controller.ts`; `utcDayKey` unchanged
- [x] 2.3 Format/day-key tests pinned to a non-device zone with a `23:30Z` midnight-boundary fixture (spec: CI proof requirement)

## 3. Calendar surface

- [x] 3.1 Thread the display zone through `use-calendar-screen-controller.ts` (`startOfLocalDay`, `parseFocusDate`, agenda range) and `agenda.ts` day bucketing
- [x] 3.2 Pass `timeZone={displayZone}` to `CalendarContainer` in `calendar-kit-timeline.tsx`; re-base `initialDate` and `event-window.ts` quarter boundaries on the zone; event adapter unchanged (instants for timed, `utcDayKey` for all-day)
- [x] 3.3 Now-indicator minute-of-day in `time-grid.ts` computed in the display zone
- [x] 3.4 Update consumers `event-tiles.tsx`, `agenda-list.tsx`, `calendar-screen.tsx`, `event-details-screen.tsx`, `hidden-events-screen.tsx` to pass the zone from `useDisplayZone()`
- [x] 3.5 Renderer/controller tests: cross-midnight bucketing, all-day lane stability, now-indicator position under a non-device zone

## 4. Home surface

- [x] 4.1 Thread the zone through `home/data/selectors.ts` (`eventsForDay`, `dynamicHourRange`) and `use-home-screen-controller.ts`; `greetingSelection` stays device-local (design D7)
- [x] 4.2 Update `welcome-card.tsx`, `upcoming-section.tsx`, `today-timeline.tsx` (day bounds + minute positioning), `upcoming-scroller.tsx`
- [x] 4.3 Home tests: today bucketing + timeline position under a non-device zone; greeting pinned to device time

## 5. Personal-events input + seam-bypass sites

- [x] 5.1 `date-time-field.tsx`: interpret picked wall-clock in the display zone (`fromZonedTime`), echo via zone-aware formatter (replaces raw `toLocaleString`)
- [x] 5.2 `personal-events-list.tsx:115`: replace `toLocaleString` with the format seam
- [x] 5.3 Tests: 14:00 entry round-trips to 14:00 in list and calendar under an explicit zone; behavior-identical under `"system"`

## 6. Notifications side

- [x] 6.1 `notifications/data/localization.ts`: `getEffectiveTimezone()` body delegates to `resolveTimezone(getTimezonePreference())`
- [x] 6.2 `registration.ts`: key the re-PUT effect on the resolved effective zone (preference change triggers; device change inert under explicit preference; skip initial mount)
- [x] 6.3 Subscription tests: PUT carries the override; preference-change re-PUT; device-change-inert-under-override; system fallback unchanged

## 7. Settings UI

- [x] 7.1 Picker screen in `settings/ui/` (Automatic + 10 zones, immediate persist via `useTimezonePreference`, a11y labels/selected state) + thin `src/app/` route
- [x] 7.2 Hub destination row in the settings screen
- [x] 7.3 i18n keys (row label, screen title, Automatic, 10 zone labels with UTC offsets) in `en.json` + `fr.json`, parity checked
- [x] 7.4 Screen test: selection persists and calls the setter; renders all 11 options

## 8. Book, gates, device pass

- [x] 8.1 ADR: display timezone is a curated preference resolved at one seam; all-day floating; push side follows display zone
- [x] 8.2 Update `features.md` (settings entry) + `calendar.md` (renderer `timeZone`, zone-threading rule) + `CHANGELOG.md`
- [x] 8.3 Full local gate: `tsc`, lint, `npm test -- --coverage` (90% per-file branches)
- [ ] 8.4 Device pass: set `Pacific/Noumea`, verify grid/home/details/all-day/now-line coherence + a received push renders times in the chosen zone; then Automatic restores device behavior
