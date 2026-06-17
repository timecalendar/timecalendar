# Tasks — add-mobile-fcm-subscription (Phase 06 Ship B)

Token-to-backend registration + subscription-preferences UI. Server is UNCHANGED — no server
edits. The Orval client is ALREADY generated — consume it, do NOT regenerate. No tap-routing
(Ship C), no local reminders (Ship D), no new native dep / `app.config.ts` / fingerprint change.

## 1. Local preference store (the source of truth — PUT-only API, design Decision 1)

- [x] 1.1 Add `src/features/notifications/data/types.ts`: the three preference types
      (`NotificationFrequency = "immediately" | "hourly" | "daily"`, `nbDaysAhead: number`,
      `isActive: boolean`), the flat storage keys
      (`NOTIFICATION_KEYS = { frequency: "notifications.frequency", nbDaysAhead:
      "notifications.nbDaysAhead", isActive: "notifications.isActive" }`), and **total parsers**
      mirroring `settings/prefs/types.ts`: `parseFrequency` (unknown → `"immediately"`),
      `parseNbDaysAhead` (non-number / NaN / out-of-range → default, else **clamp to [1,30]**),
      `parseIsActive` (unset → `true`). Reuse the generated `NotificationSubscriptionCreateFrequency`
      const union as the source of the three values (do not re-declare the literals).
- [x] 1.2 Add `src/features/notifications/data/prefs.ts`: imperative get/set over the `@/storage`
      seam (`getString`/`setString`, plus `getBoolean`/`setBoolean` or string-encoded — mirror
      `settings/prefs/store.ts`) and the reactive read hooks over `useStoredString` /
      `useStoredBoolean` (add a `useStoredBoolean`/`useStoredNumber` to `@/storage` only if a
      consumer needs it — R-2; otherwise string-encode), each validated through the §1.1 parsers.
      **This is the ONLY place the notifications feature touches `@/storage` (B-1).**
- [x] 1.3 Defaults per design Decision 1: `frequency = "immediately"`, `nbDaysAhead = 7`,
      `isActive = true`. Record the `nbDaysAhead = 7` rationale in a code comment (Flutter's legacy
      `date_limit ?? 14` vs. the conservative week horizon; trivially changed).

## 2. Subscription registration seam (idempotent PUT — design Decisions 3/4/5)

- [x] 2.1 Add `src/features/notifications/data/subscription.ts`: a `useSubscriptionRegistration()`
      hook wrapping the **already-generated**
      `useNotificationSubscriptionControllerCreateOrUpdateSubscription` (PUT) over the single
      `customFetch` mutator. **This is the ONLY generated-client import site for the feature (B-1)
      — do NOT regenerate the client.**
- [x] 2.2 The hook assembles the `NotificationSubscriptionCreate` DTO from: the local prefs
      (`frequency` / `nbDaysAhead` / `isActive`), `getFcmToken()` from `@/firebase`, and
      `calendarIds` = the `user_calendars` rows' **server `id`s** (read via
      `useUserCalendars()` from `@/features/calendar-sources/data` — a cross-feature `data → data`
      read by full `@/` path; the row `id` IS the server calendar id per `fromCalendarForPublic`).
- [x] 2.3 Expose a `register()` that PUTs idempotently (the full DTO computed fresh each call),
      returning/exposing `isPending` / `isError` / a `reset`, mirroring `useAddCalendar`. On a
      **null** token (iOS APNS not ready) it does NOT PUT (Decision 3). On **zero** held
      calendars it STILL PUTs with `calendarIds: []` (Decision 4 — so the server can prune).
- [x] 2.4 A preference mutator (`setFrequency`/`setNbDaysAhead`/`setIsActive`) writes the local
      store first, then triggers `register()` (Decision 5 — every committed change re-PUTs). The
      screen MAY debounce rapid `nbDaysAhead` taps; the wire contract is "every committed change
      re-PUTs". Expose these from the feature (e.g. a `useNotificationPreferences()` hook returning
      the reactive values + the mutators + the registration state).
- [x] 2.5 Wire `onFcmTokenRefresh` (from `@/firebase`) → `register()` with the new token
      (Decision 5). The subscription returns an unsubscribe; clean it up.
- [x] 2.6 A failed PUT → `@/firebase` `recordError(error, "notifications/subscription")` + an
      `isError` flag (Decision 6). The reactive prefs read stays total/infallible (no record).
- [x] 2.7 Add `data/index.ts` (the data sub-barrel) and `index.ts` (the feature barrel), and the
      `ui/index.ts` sub-barrel. Respect B-1..B-4 (the feature never imports its own barrel from a
      sublayer; the generated client + `@/storage` stay in `data/`; the screen reaches seams only
      through the feature `data/`).

## 3. Registration trigger (first PUT — design Decision 3)

- [x] 3.1 Add a `useNotificationRegistration()` once-effect in `data/` (mirroring
      `useStartupSync`): on mount, `requestNotificationPermission()` → `getFcmToken()` → on a
      non-null token `register()`; subscribe `onFcmTokenRefresh` → `register()`. It goes through
      the feature `data/` (never the generated client / `@/db` directly — B-3/B-4) and is
      idempotent across cold starts.
- [x] 3.2 Mount a `<NotificationRegistration />` component (renders `null`) inside the query
      provider in `src/app/_layout.tsx`, next to `<StartupSync />` (it wires the generated
      mutation → needs the QueryClient in context; same rationale).

## 4. Preferences sub-screen + route (navigation.md route-structure rule)

- [x] 4.1 Add `src/features/notifications/ui/notification-settings-screen.tsx` (presentational,
      70% floor): a `frequency` picker (immediately/hourly/daily — via the `@/components/chrome`
      `Picker`, mirroring `settings-screen.tsx`), a bounded **1..30** `nbDaysAhead` control
      (stepper or `+`/`−` — implementer choice within the contract), and an `isActive` toggle
      (`Switch` with `accessibilityRole`), each bound to the §2.4 hook and driving the re-PUT.
- [x] 4.2 Add the accessible failure surface + **Retry** (mirror `ical-url-screen.tsx`'s
      `isError` block: `accessibilityRole="alert"`, `accessibilityLiveRegion="polite"`, a Retry
      `Pressable` calling `register()` again). All controls carry `accessibilityLabel`s; the
      screen title is a `ThemedText type="title"` (heading role — accessibility.md).
- [x] 4.3 Add the thin route `src/app/notification-settings.tsx`:
      `export { NotificationSettingsScreen as default } from "@/features/notifications/ui"`
      (route-structure rule — the screen + its test live under `ui/`, not `src/app/`).
- [x] 4.4 Declare `<Stack.Screen name="notification-settings" />` as a sibling of `(tabs)` in
      `src/app/_layout.tsx` (mirroring `settings` / `hidden-events`).
- [x] 4.5 Add a Profile entry link to the screen (mirror `profile.settings.link`): a
      `<Link href="/notification-settings">` + the `profile.notifications.link` string.

## 5. i18n — FR/EN parity (i18n.md)

- [x] 5.1 Add the `notifications.*` keys to BOTH `mobile/src/i18n/locales/en.json` and `fr.json`
      (flat keys, FR/EN parity — the typed `i18next.d.ts` is regenerated/extended if it is a
      generated union): the screen title, the `frequency` label + the three option labels, the
      `nbDaysAhead` label + accessible inc/dec labels, the `isActive` label, the failure message +
      Retry label, and `profile.notifications.link`. No raw user-facing string in the screen.

## 6. CI proof — write wiring (mock-at-mutator, testing.md)

- [x] 6.1 `data/prefs.test.ts`: the total parsers (defaults / corrupt / out-of-range clamp), the
      write-then-read-back through the real in-memory MMKV mock, and a **restart-simulation** (a
      fresh prefs module reads back a prior write through a stateful Map-backed `@/storage` fake
      surviving `resetModules()` — mirror `hidden-events/data/restart.test.ts`).
- [x] 6.2 `data/subscription.test.ts` (real `QueryClient` + the real generated mutation, mocking
      the `customFetch` mutator): a PUT-on-change carries the new value; a re-PUT-on-token-refresh
      carries the new token; a null token does NOT PUT; zero calendars PUTs `calendarIds: []`; a
      rejected PUT → `recordError` + the `isError` flag. Mock `@/firebase` (`getFcmToken`,
      `onFcmTokenRefresh`, `recordError`) and `useUserCalendars` per case.
- [x] 6.3 `ui/notification-settings-screen.test.tsx` (real theme + i18n, mocked feature data hook):
      the screen reflects the store, a control change persists + triggers the re-PUT, and the
      failure surface + Retry render and re-fire the PUT. (RNTL 14 `render` is async — `await` it.)
- [x] 6.4 Confirm the K-3 coverage gate (`src/features/**` at 90% on the `data/` glob; the `ui/`
      screen on the 70% floor) lands green; the new `data/` logic is fully exercised by §6.1/§6.2.

## 7. Architecture Book — ADR 027 + Book + changelog (R-1: prose links to the gates)

- [x] 7.1 Write `docs/mobile/architecture-book/decisions/027-fcm-subscription-registration.md`
      (Status / Context / Decision / Consequences / Revisit-if, mirroring ADR 026 rigor):
      the **PUT-only / local-source-of-truth** decision (the API has no GET — MMKV is the source
      of truth, PUT idempotently; "round-trips" = the PUT succeeds), the **first-PUT trigger +
      zero-calendars + re-PUT-on-change/refresh policy**, and the **new `src/features/notifications/`
      module placement** (not Settings, not `@/firebase`).
- [x] 7.2 Add the ADR 027 row to `docs/mobile/architecture-book/decisions/README.md` index.
- [x] 7.3 In `docs/mobile/architecture-book/firebase.md` "Cloud Messaging": record that the
      token + token-refresh helpers now have their first consumer (the subscription registration
      seam) and that subscription preferences are a **local MMKV source of truth** PUT idempotently
      (PUT-only API, no GET). Link to ADR 027.
- [x] 7.4 Add a "Notifications — FCM-token registration + subscription preferences" section to
      `docs/mobile/architecture-book/features.md` (the new feature folder, the local-prefs source
      of truth, the idempotent PUT seam, the failure surface, CI-vs-device split).
- [x] 7.5 Append a dated entry to `docs/mobile/architecture-book/architecture-changelog.md`
      (Ship B; ADR 027; the new feature module; the local-prefs-source-of-truth + idempotent-PUT
      pattern; no native/dep/schema change).

## 8. Human handoff — visual + a11y review (REQUIRED deliverable, NOT a ship)

- [x] 8.1 Write `docs/react-native-migration/inbox/2026-06-17-notification-subscription-review.md`
      (HUMAN note): the visual + manual screen-reader (VoiceOver/TalkBack) review of the
      preferences sub-screen on **both** platforms (DoD native-correctness + a11y axes), and a
      confirmation that a real `PUT /notification-subscription` round-trips against the live server
      from a device (the local store + the server converge) — state what is needed / why / how to
      verify. (HUMAN: device + live server) — `(HUMAN: see inbox/2026-06-17-notification-subscription-review.md)`

## 9. Definition of Done — local verification (foundation isn't done until green)

- [x] 9.1 `cd mobile && npx tsc --noEmit` clean.
- [x] 9.2 `cd mobile && npm run lint` clean (`--max-warnings 0`) — incl. the B-1..B-4 boundaries
      (the generated client + `@/storage` only in `data/`; the screen reaches seams only through
      the feature `data/`).
- [x] 9.3 `cd mobile && npm test` green, coverage gate respected.
- [x] 9.4 Confirm the DoD axes: Architecture (ADR 027 + Book + features + changelog done), Types,
      Lint, Unit tests, Observability (failed PUT → `recordError` + surface), i18n (FR/EN parity —
      all new strings in both catalogs), a11y (labels/roles/heading + the alert live-region),
      Native correctness (N/A — no native change this ship; record the N/A reason), and
      Documentation. The real-server-push-result axis is **inboxed device-only** (Ship A's
      delivery note + task 8.1) — green write wiring + the honest inbox note is the bar; do NOT
      tick a delivery exit criterion off CI green.
