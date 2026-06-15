## 1. Data layer: the create-calendar seam (`data/create.ts`, B-1)

- [x] 1.1 Create `src/features/calendar-sources/data/create.ts` — the feature's first generated-hook import site (B-1). Wrap the generated `useCalendarSyncControllerCreateCalendar` (from `@/api/generated/calendars/calendars`) in a thin `useCreateCalendar()` returning `{ createCalendar(url: string): Promise<{ token: string }>, isPending, isError, reset }`. Build the `CreateCalendarDto` here (`{ url: url.trim(), customData: null }`; `schoolId`/`schoolName`/`name` omitted — see design Non-Goals). Resolve `CreateCalendarRepDto.token`. Mirror `school-selection/data/queries.ts` (the only-generated-hook-import-site comment + state-flag passthrough). No `t()`, no `@react-native-firebase/*`.
- [x] 1.2 Re-export `useCreateCalendar` from `src/features/calendar-sources/data/index.ts` (the existing `data/` sub-barrel).

## 2. Data layer: the pure URL validator (`data/validate-url.ts`, 90%)

- [x] 2.1 Create `src/features/calendar-sources/data/validate-url.ts` exporting a pure `validateIcalUrl(raw: string): string | null` — `null` when acceptable, else a localizable error KEY (not a sentence): empty/whitespace → `"calendarSources.icalUrl.error.empty"`; non-http(s) → `"calendarSources.icalUrl.error.invalid"`; trimmed `http(s)://` → `null`. No `t()`, no backend (golden-path pure-seam; mirror `personal-events/form/validate.ts`). Comment that it is a UX pre-filter — the server `POST /calendars` is the authoritative validator (design D3).
- [x] 2.2 Re-export `validateIcalUrl` from `src/features/calendar-sources/data/index.ts`.
- [x] 2.3 Write `src/features/calendar-sources/data/validate-url.test.ts` covering valid http, valid https, empty, whitespace-only, non-URL (returns the invalid key), and leading/trailing-whitespace trimming — to the 90% logic threshold. Assert the returned values are the literal keys (test-file literal-string exemption applies).

## 3. URL-entry screen (`ui/` sublayer, 70% floor)

- [x] 3.1 Create `src/features/calendar-sources/ui/ical-url-screen.tsx` (presentational). State: a controlled `url` string + an inline `errorKey` + the mutation flags from `useCreateCalendar()`. Render: `ThemedText` title/helper; a labeled RN-core `TextInput` (`accessibilityLabel` via `t()`, `keyboardType="url"`, `autoCapitalize="none"`, `autoCorrect={false}`, NEVER `allowFontScaling={false}`); a submit `Pressable` (role + translated label + ≥44pt/48dp via `hitSlop`/`minHeight`, reusing the welcome accent-border CTA style).
- [x] 3.2 Submit handler: run `validateIcalUrl(url)`; if it returns a key, set the inline `errorKey`, show the translated error (status role), and do NOT call the server (no `recordError`). If valid, call `createCalendar(url)`.
- [x] 3.3 Async states (mirror school-selection / `data.md`): `isPending` → an accessible "importing…" polite live region + disable submit (prevent duplicate submit); on success → stash `setScannedSource({ url: url.trim() })` into the ephemeral holder (import from the `data/` sub-barrel), confirm the imported URL, and `router.back()`; on rejection → catch the create error, `recordError(error, "calendar-sources/ical-import")` via `@/firebase` (never import `@react-native-firebase/*` directly), and show an accessible error alert with a **Retry** control that re-runs the mutation.
- [x] 3.4 Accessibility: all copy via `t()` (no hardcoded strings); inline-error + importing + server-error text use `accessibilityLiveRegion="polite"` + a status role (`text`/`alert`); every touchable has a role + translated label + target. Consume sibling sub-barrels (`@/features/calendar-sources/data`), never the feature barrel (B-2), never the seams directly (B-1).
- [x] 3.5 Export `IcalUrlScreen` from `src/features/calendar-sources/ui/index.ts` (the existing `ui/` sub-barrel) and re-export it from the feature barrel `src/features/calendar-sources/index.ts` (alongside `QrScanScreen`).

## 4. Route + onboarding reachability

- [x] 4.1 Create `src/app/onboarding/ical-url.tsx` as a thin re-export: `export { IcalUrlScreen as default } from "@/features/calendar-sources/ui"` (route-structure rule; no colocated test under `src/app/`).
- [x] 4.2 Confirm the route is reachable under the onboarding `Stack` (sibling under `src/app/onboarding/_layout.tsx`; reachable by `router.push("/onboarding/ical-url")` — no extra `<Stack.Screen>` needed unless header/options are wanted, mirroring `qr-scan.tsx`).
- [x] 4.3 Add an "add by URL" CTA on `src/features/onboarding/ui/welcome-screen.tsx` beside the existing "scan a QR code" CTA, navigating to `/onboarding/ical-url`, reusing the accent-border CTA pattern (role + translated label + ≥44pt/48dp target; the white-on-brand contrast posture — no `primaryStrong` token, R-2). Update `welcome-screen.test.tsx` to assert the new CTA renders + navigates.

## 5. i18n

- [x] 5.1 Add flat keys to `src/i18n/locales/en.json` for every new user-facing string: the screen title/helper, the URL field label + placeholder, the submit label, the two validator error keys (`calendarSources.icalUrl.error.empty` / `.error.invalid`), the importing status, the server-error message, the retry label, the success confirmation, and the welcome CTA (`onboarding.welcome.urlCta` + `onboarding.welcome.urlCtaLabel`).
- [x] 5.2 Add the identical key set (translated, French) to `src/i18n/locales/fr.json` — bidirectional `tsc` parity must pass.

## 6. Jest proof (mock at the `customFetch` mutator seam)

- [x] 6.1 Write `src/features/calendar-sources/ui/ical-url-screen.test.tsx`: render through the real theme + i18n trees and a real `QueryClient` (the school-picker test is the reference); `jest.mock` `@/api/mutator` (the designed seam — never the network); mock `@/firebase` `recordError`.
- [x] 6.2 Assert localized text (not keys); the happy path: type a valid URL, mock `customFetch` to resolve `{ token }`, submit, assert the real generated mutation ran and `setScannedSource` received `{ url }` (spy/mock the holder or read it back) and the screen dismissed.
- [x] 6.3 Assert the inline-validation path: submit empty / a non-URL value → the translated inline error shows, no `customFetch` call, no `recordError`.
- [x] 6.4 Assert the server-failure path: mock `customFetch` to reject → `recordError` is called with the `calendar-sources/ical-import` context and the accessible error + retry renders; tapping retry re-runs the mutation.
- [x] 6.5 Confirm the coverage split holds: `data/create.ts` + `data/validate-url.ts` clear 90% (the `src/features/*/!(ui)/**` glob); the `ui/` screen falls under the 70% global floor.

## 7. Maestro (deterministic part only)

- [x] 7.1 Add a Maestro step (extend `.maestro/onboarding.yaml` or a new `.maestro/ical-import.yaml`) that deep-links onboarding, taps the "add by URL" CTA, asserts the URL-entry screen renders (a stable title/label assertion), and submits empty to assert the inline validation error shows — NO network, deterministic cross-platform. Add a header comment that the actual import round-trip is NOT e2e-driven (no seeded `.ics`; inboxed) — mirror the onboarding.yaml note about the Jest-proven group step.

## 8. Architecture Book + docs (no ADR — growth within ADR 017)

- [x] 8.1 Update `/.claude/rules/mobile/features.md` "School selection / Calendar sources" area: add the iCal-import sublayer to the calendar-sources feature note — `data/create.ts` (the create-calendar seam, the feature's first generated-hook site, B-1), `data/validate-url.ts` (the pure key-returning validator), `ui/ical-url-screen.tsx` (server-POST URL entry, accessible loading/error/retry), reuse of the ship-3 `ScannedCalendarSource` + ephemeral holder, observability ✅ (`recordError` on create failure). Note: URL-only (file-pick deferred), server-POST not client-parse, no new dep/ADR.
- [x] 8.2 Update `/.claude/rules/mobile/data.md` "Generated client / Query runtime": record `POST /calendars` (`useCalendarSyncControllerCreateCalendar`) as a new generated-hook consumer behind the `calendar-sources/data/` seam (B-1), a write mutation NOT added to the offline-persist `shouldDehydrateQuery` set (ADR 013 — only schools/groups reads persist).
- [x] 8.3 Append a live entry to `/.claude/rules/mobile/architecture-changelog.md` (date 2026-06-15, slug `add-mobile-ical-import`): what moved (the create-calendar `data/` seam over the committed `POST /calendars` client, the pure URL validator, the URL-entry screen + onboarding CTA/route, reuse of ship-3's source/holder, observability ✅; URL-only, server-POST, no new dep, **no ADR** — growth within ADR 017 D3), why (Phase-03 ship 4 — the second calendar-source input method), pointers (features.md, data.md, ADR 017).

## 9. Human handoff (inbox)

- [ ] 9.1 (HUMAN: see inbox/2026-06-15-ical-import-dod-manual.md) On-device iCal import round-trip (real `.ics`), server-failure + retry + Crashlytics arrival, inline validation, a11y (VoiceOver/TalkBack), and native-correctness verification on iOS and Android. Skip-and-continue — the inbox note is filed; the dev e2e harness seeds no parseable `.ics`, so the import round-trip can't be Maestro-driven.

## 10. Local verification (run in `mobile/`)

- [x] 10.1 `npx tsc --noEmit` — clean (FR/EN parity included; no generated-type leak into the screen).
- [x] 10.2 `npm run lint` — clean (`--max-warnings 0`; no hardcoded strings, B-1 satisfied — only `data/` imports the generated hook, no direct `@react-native-firebase` import, import order).
- [x] 10.3 `npm test` — green, including the new validator + screen tests and the coverage thresholds (90% logic / 70% global).
- [x] 10.4 `openspec validate add-mobile-ical-import --strict` — passes.
