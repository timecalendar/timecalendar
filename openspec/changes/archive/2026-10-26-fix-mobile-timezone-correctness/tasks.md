## 1. Reproduce first

All commands run in `mobile/`. Plain `npx jest` output is filtered by an rtk hook, so use `rtk proxy npx jest …` when you need the full output.

- [x] 1.1 Record the baseline. Run `TZ=Pacific/Kiritimati`, `TZ=Pacific/Pago_Pago` and `TZ=America/St_Johns rtk proxy npx jest --ci --silent` and confirm the failure counts from design.md → Context: 3, 8 and 3. Verify that the failing test names match the root-cause table exactly. Any extra failure gets a row (app or test, with the cause) in the PR description before you go on.
- [x] 1.2 Reproduce the classifier defect. In `src/features/calendar/data/timed-support.test.ts`, add a case where the event runs 2026-10-25T00:30Z → 01:30Z with display zone `Europe/Paris`. It expects `{ supported: false, reason: "offset-transition" }`. Run the file with plain `TZ=UTC` and confirm that it fails (the current code returns `supported: true`).
- [x] 1.3 Reproduce the chooser offset defect. In `src/features/settings/data/timezone-catalog.test.ts`, add `formatTimezoneOffset("Europe/Paris", new Date("2026-10-25T01:30:00Z"))` and expect `"UTC+01:00"`. Run it with `TZ=UTC` and confirm that it fails (it returns `UTC+02:00`).
- [x] 1.4 Reproduce the Android date-dialog defect at the seam. Add `src/components/chrome/date-time-picker.test.tsx` with a per-file `@expo/ui/community/datetime-picker` mock that follows the Compose contract (design Decision 5). The mock renders the received `value` ISO string, and on press confirms `new Date(Date.UTC(2030, 0, 5))`. Under `usePlatform("android")`, with `mode="date"`, `presentation="dialog"` and `value = new Date(2030, 0, 2, 23, 30)`:
  - (a) The native control receives `2030-01-02T00:00:00.000Z`.
  - (b) After the press, `onValueChange` receives a Date whose local fields are 2030-01-05 23:30.
  - Add the same pair for `presentation="inline"` and for `mode="datetime"`.
  - (c) `mode="time"` and iOS pass `value` and the picked Date through unchanged.
  - (d) An invalid and an epoch picked Date reach `onValueChange` unchanged.
  - (e) `minimumDate` and `maximumDate` pass through unchanged.

  Run it with `TZ=UTC` and confirm that (a) and (b) fail against the raw re-export. The day is off by one in UTC− zones, and the time of day is lost in every zone.

## 2. Instant-based zone offsets and lint L11

- [x] 2.1 In `src/features/calendar/data/day-key.ts`, add `zoneOffsetMinutes(instant: Date, zone: string): number`. It parses `formatInTimeZone(instant, zone, "xxx")` (`±HH:MM`) into signed minutes (design Decision 2), and an unsupported zone throws as `formatInTimeZone` does. Export it from `src/features/calendar/data/index.ts`. In `day-key.test.ts`, cover: UTC → 0; Asia/Kathmandu → 345; America/St_Johns → −150 and −210 on each side of 2026-03-08T05:30Z; Europe/Paris → 120 and 60 on each side of 2026-10-25T01:00Z; Pacific/Kiritimati → 840; Pacific/Pago_Pago → −660; and an invalid zone throws. Verify with `TZ=UTC npx jest src/features/calendar/data/day-key.test.ts --coverage --collectCoverageFrom=src/features/calendar/data/day-key.ts`: `day-key.ts` is at 100% branches.
- [x] 2.2 Switch `classifyTimedEventSupport` (`timed-support.ts`) and `formatTimezoneOffset` (`src/features/settings/data/timezone-catalog.ts`, imported from `@/features/calendar/data/day-key` — the barrel closes a runtime cycle, design Decision 2) to `zoneOffsetMinutes`. Remove both `getTimezoneOffset` imports. Verify that 1.2 and 1.3 now pass under `TZ=UTC` and under all three matrix zones, and that `timezone-catalog.test.ts` and `timed-support.test.ts` pass entirely under all four zones.
- [x] 2.3 Add lint L11 in `mobile/eslint.config.js`. Add a `zoneOffsetTrapImportPath` (`{ name: "date-fns-tz", importNames: ["getTimezoneOffset"], message: "getTimezoneOffset reads device-local Date fields; use zoneOffsetMinutes from @/features/calendar/data (lint-format.md → L11)." }`), appended to `paths` under a new `banZoneOffsetTrap = true` flag of `restrictedImports`, the way L9 is. No exemption block is needed. Verify:
  - `npm run lint` reports L11 on a scratch file under `src/features/` that imports `getTimezoneOffset` from `date-fns-tz`. Delete the file afterwards.
  - `formatInTimeZone`, `toZonedTime` and `fromZonedTime` imports stay clean.
  - `grep -rn "getTimezoneOffset" mobile/src` matches no import.

## 3. Zone-correct accessibility probe

- [x] 3.1 In `src/test-support/owned-calendar/accessibility-probe.ts`, make `accessibilityProbeFixture(zone: string)` build each instant with `fromZonedTime("2026-06-15THH:mm:00", zone)` (design Decision 3). Keep the same uids, order and durations, with `probe-next-date` at `2026-06-16T01:00:00`. `accessibilityProbeReader` passes `request.displayZone`. Update the three UTC consumers (`accessibility-projection.test.ts`, `owned-calendar-shell.test.tsx`, `calendar-screen.test.tsx`) to pass `"UTC"`. Update `accessibility-probe.md` to say that the hours are wall-clock in the effective display zone. Verify with `npx tsc --noEmit`.
- [x] 3.2 Add `src/test-support/owned-calendar/accessibility-probe.test.ts`. For `UTC`, `Pacific/Kiritimati`, `Pacific/Pago_Pago`, `America/St_Johns` and `Asia/Kathmandu`:
  - Every fixture except `probe-next-date` has `dayKey(startsAt, zone) === "2026-06-15"`.
  - `minuteOfDayInZone` of `probe-early`, `probe-tied-a` and `probe-late` is 60, 600 and 1380.
  - `probe-next-date` keys on `2026-06-16`.
  - For `UTC`, every instant equals the current `…Z` literal.

  Verify by running the file.
- [x] 3.3 In `calendar-screen.test.tsx`, add a probe case beside "runs the deterministic accessibility fixture only on the development route". It keeps the "system" preference (no `setTimezonePreference`), so it runs in the process zone. With `focusDate: "2026-06-15"`, it finds `Fixture probe-early` and `Fixture probe-late`, and asserts the canvas `contentOffset` `{ x: 0, y: 540 }`. Confirm that the case passes under all four zones. With the pre-3.1 fixture it fails under `TZ=Pacific/Kiritimati` and `TZ=Pacific/Pago_Pago`, because `probe-late` or `probe-early` leaves the day.

## 4. Device-local date picker seam (Android day conversion)

- [x] 4.1 Add `src/components/chrome/compose-date-day.ts` with `composeDayOf(local: Date): Date` (UTC midnight of the local Y/M/D) and `fromComposeDay(picked: Date, timeOfDay: Date): Date` (the local Date at `picked`'s UTC Y/M/D with `timeOfDay`'s local hours and minutes, seconds 0). Move `src/features/personal-events/ui/wall-clock-day.test.ts` to `src/components/chrome/compose-date-day.test.ts`, renaming the functions, and delete `wall-clock-day.ts`. Add the source pin to that test (design Decision 4). Read `node_modules/@expo/ui/android/src/main/java/expo/modules/ui/DatePickerView.kt` with `fs`, then assert that it contains `initialSelectedDateMillis = initialDate,` (dialog), `initialSelectedDateMillis = initialDate ?: fallbackDate,` (inline), and `toUtcDayMillis(` for the bounds. Verify by running the file: `compose-date-day.ts` is at 100% branches.
- [x] 4.2 Add `src/components/chrome/date-time-picker.tsx`. It wraps the raw control, which `expo-ui.tsx` now re-exports as `ExpoDateTimePicker` and which stays the only `@expo/ui` import site. On `Platform.OS === "android"` with `mode !== "time"`, the wrapper passes `value={composeDayOf(value)}` and wraps `onValueChange` and `onChange` so that a finite, non-epoch Date `d` becomes `fromComposeDay(d, value)`. Other Dates pass through. Everything else passes through as is. In `src/components/chrome/index.ts`, export the wrapper as `DateTimePicker` with the raw props type, and do not export `ExpoDateTimePicker` from the barrel. Verify:
  - 1.4 passes under `TZ=UTC` and the three matrix zones.
  - `date-time-picker.tsx` is at 100% branches.
  - `npx tsc --noEmit` is clean.
- [x] 4.3 Simplify `DateTimeField` (`date-time-field.tsx`). The Android date step passes `value={wallClock}` and sets `pending` to the picked Date directly (no `dateDialogValue` or `mergePickedDay`). Update its header comment to say that the seam owns the Compose day conversion and the field owns the display-zone conversion. Update `date-time-field.test.tsx` so that the date-confirm text stays the UTC midnight of the wall-clock day (the seam's output) and `pending` stays `new Date(2030, 0, 2, h, m)` from the wall clock. Verify that the whole file passes under `TZ=UTC` and the three matrix zones once 5.2 lands.
- [x] 4.4 In `jest/setup-expo-ui.ts`, make the suite-wide `@expo/ui/community/datetime-picker` mock confirm `new Date(Date.UTC(2030, 0, 2))` when `Platform.OS === "android"` and `mode !== "time"` (design Decision 5). Read `Platform` inside the factory with `require`. Keep `2030-01-02T03:04Z` otherwise, and update the mock's comment. In `date-time-picker.gallery.test.tsx`, the Android `Date` story test asserts:
  - the picker received `value` `2030-01-02T00:00:00.000Z`;
  - after the confirm, the row shows `format(new Date(2030, 0, 2), { dateStyle: "medium" })`;
  - a case with the fixture's initial value set to 23:30 local (or a direct seam render) still opens on 2 January.

  Keep the iOS assertions. Verify that the gallery test, `src/design/gallery/registry.test.ts` and `personal-event-form-screen.test.tsx` pass under `TZ=UTC` and the three matrix zones.

## 5. Zone-agnostic tests

- [x] 5.1 In `calendar-screen.test.tsx`, build the timed fixtures that the five failing cases seed as device-local wall clocks: `new Date(2026, 5, 16, 10)` and similar for `"2026-06-16T10:00:00.000Z"` and its siblings, and `` new Date(`${destination}T10:00:00`) `` (no `Z`) in the `it.each`. Keep each case's intent, assertions and relative times. Verify that the file passes under `TZ=UTC` and the three matrix zones.
- [x] 5.2 In `date-time-field.test.tsx` › "displays and announces the device clock", replace the hard-coded `^1 Jan` with a day-agnostic pattern (`/^\d{1,2} [A-Z][a-z]{2} \d{1,2}:\d{2} (AM|PM)$/` and `/^\d{1,2} [A-Z][a-z]{2} \d{2}:\d{2}$/`). Keep the exact `formatShortDateTime` equality assertions. Verify that the file passes under `TZ=UTC` and the three matrix zones.

## 6. CI time-zone matrix and local command

- [x] 6.1 Add `mobile/scripts/test-timezones.sh` (`set -euo pipefail`). It loops over `Pacific/Kiritimati Pacific/Pago_Pago America/St_Johns`, running `TZ="$zone" npx jest --ci "$@"`, echoes the zone before each run, and stops at the first failing zone. Add `"test:timezones": "bash ./scripts/test-timezones.sh"` to `mobile/package.json`. Verify that `npm run test:timezones` passes after sections 2–5.
- [x] 6.2 In `.github/workflows/ci-mobile.yml`, add `env: TZ: UTC` to the existing `test-mobile` "Test" step. Add the job `test-mobile-timezones` (design Decision 1):
  - name `Run mobile tests in ${{ matrix.tz }}`;
  - `runs-on: ubuntu-latest`;
  - `strategy: { fail-fast: false, matrix: { tz: [Pacific/Kiritimati, Pacific/Pago_Pago, America/St_Johns] } }`;
  - steps: checkout, `actions/setup-node@v6` with `.nvmrc` and the npm cache on `mobile/package-lock.json`, `npm ci` in `./mobile`, then a "Test" step with `working-directory: ./mobile`, `env: TZ: ${{ matrix.tz }}` and `run: npm test`.

  Add a short comment above the job that states the rule and links `testing.md` → Time zones. Verify with `npx --yes @action-validator/cli .github/workflows/ci-mobile.yml` (or `actionlint` if available), and by reading the file.
- [x] 6.3 Add `mobile/ci-timezones.contract.test.ts` (beside `jest.config.test.ts`). It reads `../.github/workflows/ci-mobile.yml` and `scripts/test-timezones.sh` as text, plus `package.json`, and asserts:
  - the `test-mobile-timezones` job exists, with `fail-fast: false`;
  - the matrix lists exactly the three zones, in order;
  - the Test step has `TZ: ${{ matrix.tz }}` and `run: npm test`;
  - the `test-mobile` Test step has `TZ: UTC` and `npm test -- --coverage`;
  - `test:timezones` runs the script, and the script lists the same three zones.

  A second case: when `process.env.TZ` is set and not empty, `Intl.DateTimeFormat().resolvedOptions().timeZone` equals it (when `TZ` is unset, the case asserts nothing). Verify the file under `TZ=UTC` and `TZ=Pacific/Pago_Pago`. Remove one zone from a scratch copy of the YAML string in a local check to see the matrix assertion fail, then restore it.

## 7. Architecture Book, inbox

- [x] 7.1 `docs/mobile/architecture-book/testing.md`, current state only. Add a `## Time zones` section that states:
  - The unit suite passes in any process zone. Fixtures are built in the zone under display, and expectations are derived from the same zone-aware helpers.
  - CI runs the full suite under Kiritimati, Pago_Pago and St_Johns in `test-mobile-timezones`, beside the `TZ: UTC` coverage run.
  - `npm run test:timezones` reproduces the matrix locally.
  - `ci-timezones.contract.test.ts` pins the matrix and checks that the zone reached the worker.
  - Device-local field math on an event instant is caught by this matrix, not by lint (ADR 035).

  Add `test-mobile-timezones` to the `## CI topology` job list and the `ci-mobile.yml` workflow bullet. In the stateful-fixture bullet, state that the Android date mode of the `@expo/ui/community/datetime-picker` mock confirms a UTC-midnight day, as Compose does. Verify with `grep -n "test-mobile-timezones\|Time zones" docs/mobile/architecture-book/testing.md`.
- [x] 7.2 `lint-format.md`: add **L11 — no device-zone-dependent offsets** after L9, in the same shape (the `zoneOffsetTrapImportPath` flag, no exemption, static-import-only caveat, the link to `zoneOffsetMinutes`). `calendar.md`: in the display-zone paragraph, add that zone offsets come from `zoneOffsetMinutes` at the instant (L11), and that the dev accessibility probe places its fixtures on display-zone wall-clock hours. `features.md` → Personal events and Design system gallery: the chrome `DateTimePicker` takes device-local Dates on both platforms, and `src/components/chrome/compose-date-day.ts` owns the Android day conversion, pinned to `DatePickerView.kt`. Verify by reading the three sections.
- [x] 7.3 Write `docs/mobile/architecture-book/decisions/066-device-local-date-picker-seam-and-timezone-ci.md` from `TEMPLATE.md`. It covers design Decisions 1 and 4: the three-zone CI matrix over a pinned TZ, and the seam-owned Compose day conversion. Include their rejected alternatives and Revisit-if items: `@expo/ui` converts days itself (the pin fails), a new zone class appears, or runner cost becomes friction. Add the row to `decisions/README.md`. Verify that the README index links the file.
- [x] 7.4 Add `## 2026-10-26 — Time-zone correctness` at the top of `docs/mobile/architecture-book/CHANGELOG.md`. It lists, current state only, the rule changes in 7.1–7.3 with their enforcing gates: the `test-mobile-timezones` job plus `ci-timezones.contract.test.ts`, L11, `zoneOffsetMinutes`, the probe fixture, the device-local `DateTimePicker` plus the `DatePickerView.kt` pin, and ADR 066. Verify that it is the first entry.
- [x] 7.5 In `docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md`, delete the "Android date dialog day in UTC− zones" bullet from "Component findings", because this change fixes it in the seam (inbox convention: a cleared item leaves the note). Leave the other items as they are. Verify that `grep -n "UTC− zones" docs/react-native-migration/inbox/2026-10-25-mobile-gallery-fixtures-findings.md` returns nothing and that the note still states its open items.

## 8. Local verification and CI proof

- [x] 8.1 In `mobile/`, run `npx tsc --noEmit`, `npm run lint` (zero warnings) and `TZ=UTC npm test -- --coverage`. The 90% per-file branch gate passes, and no threshold is lowered.
- [x] 8.2 In `mobile/`, run `npm run test:timezones`. All three zones pass. Paste the three `Tests:` summary lines into the PR description.
- [x] 8.3 Run `npx prettier --check` on every touched source, test, JSON, YAML and Markdown file, and `openspec validate fix-mobile-timezone-correctness --strict`.
- [x] 8.4 Confirm that the diff adds no dependency (the lockfile is unchanged, and `package.json` changes only by the `test:timezones` script). It touches no native or store config, `app.config.ts`, `openapi/`, generated client, server or Flutter `app/`.
- [ ] 8.5 CI proof: on the PR head commit, `test-mobile` and all three `test-mobile-timezones` legs are green. Report pending checks as pending, and never re-run a red leg without reading its log.
- [ ] 8.6 (Optional) iOS simulator check of the probe outside UTC. Use the development build on an iOS simulator. Set the display zone to manual `Pacific/Pago_Pago` in Settings → Time zone, then open `timecalendar-dev://calendar?focusDate=2026-06-15&accessibilityProbe=timed-events` (`xcrun simctl openurl booted …`). In Day view, 15 June 2026 shows the 10:00 fixtures in the initial viewport, with 01:00 and 23:00 off screen. Record the simulator, OS and commit in the PR. Skip without blocking if no development build is installed.
- [ ] 8.7 (Skipped, unverified) Android device or emulator check of the date dialog in a UTC− zone. Never build Android on this Mac. Run it only if an existing development APK at this commit is available on the Windows host (`ssh pc`). Otherwise record "Android date dialog: unverified on device; Jest proves the seam against the pinned Compose contract" in the PR.
