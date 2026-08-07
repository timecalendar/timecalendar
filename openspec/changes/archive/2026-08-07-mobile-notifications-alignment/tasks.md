# Tasks — mobile notifications alignment

## 1. Tap routing (v2 contract)

- [x] 1.1 `tap-routing.ts`: lowercase type canon (`new | edit | cancel`), `cancel` → `{ kind: "calendar" }`; update the payload contract comment to the v2 shapes
- [x] 1.2 `tap-routing.ts`: `calendar_digest` action → `{ kind: "calendar" }` in the parser; foreground handler syncs on either action
- [x] 1.3 Rewrite tap-routing tests against the literal v2 payload shapes (lowercase types, digest with `count`); all parser branches + dispatcher paths to the branch gate

## 2. Subscription DTO (locale + timezone)

- [x] 2.1 Add `getEffectiveLocale()` (settings `resolveLanguage(getLanguagePreference())`) and `getEffectiveTimezone()` (`getCalendars()[0]?.timeZone ?? "Europe/Paris"`) accessors in the notifications `data/` sublayer
- [x] 2.2 `subscription.ts`: include `locale` and `timezone` in the assembled `NotificationSubscriptionCreate` DTO, read only through the accessors
- [x] 2.3 Tests: PUT body carries `locale`/`timezone`; settings-override locale wins; timezone fallback when device zone unavailable

## 3. Re-registration triggers

- [x] 3.1 `registration.ts`: subscribe i18n `languageChanged` → re-PUT (unsubscribe on unmount); failures record + self-heal like existing triggers
- [x] 3.2 `registration.ts`: watch device timezone via `expo-localization` `useCalendars()`; effect keyed on the zone re-PUTs on change, skipping the initial mount value
- [x] 3.3 Tests: language-change re-PUT carries the new `locale`; timezone-change re-PUT carries the new `timezone`; no duplicate PUT on mount

## 4. Docs + verification

- [x] 4.1 Verify the generated Orval client is current against `openapi/openapi.json` (regen is a no-op; `locale`/`timezone` already present)
- [x] 4.2 ADR 027: registration seam now sends `locale`/`timezone` via the effective accessors; new triggers. ADR 028: payload description to the v2 canon (lowercase types, `calendar_digest`)
- [x] 4.3 Architecture Book touch-ups if the notifications feature entry in `features.md` (or `firebase.md`) describes the wire contract
- [x] 4.4 Full local green: `tsc`, lint, `npm test -- --coverage` (90% per-file branch gate)
