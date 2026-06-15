# Features — per-feature index

Pointer index for the landed features. The durable, cross-cutting rules each feature
established live in the [topical rule files](./architecture.md#topical-rule-files)
(linked); this file records only what is **feature-specific**. The how-to for building a
new one is the [golden-path exemplar](./golden-path.md); the decisions are in
[`decisions/`](./decisions/README.md). Order and axes are fixed by
[ADR 004](./decisions/004-phase-1-feature-order.md). For the canonical file paths per
feature, see the axis table in [golden-path.md](./golden-path.md).

## Settings — local KV + native controls + i18n

- **Feature folder:** `src/features/settings/prefs/` — the first `src/features/` folder
  (ADR [009](./decisions/009-settings-feature-prefs.md)). Two typed preferences,
  `ThemePreference` and `LanguagePreference`, both default **`"system"`**; reads go through
  **total validators** (any unset/corrupt/legacy value → `"system"`, never throws),
  persisted under flat keys `settings.themePreference` / `settings.languagePreference`.
- **Consumed by infra — the recorded infra→feature edge** (ADR 009; lint boundary B-4):
  `@/hooks/use-color-scheme` resolves the theme override (see [theming.md](./theming.md), C1)
  and `@/i18n` reads the startup locale (see [i18n.md](./i18n.md)). The edge is **allowed,
  not promoted** (a sample of one). The graph stays a DAG: `@/i18n` reads the *store* module
  directly (not the feature barrel) to avoid a cycle.
- **Reactive read:** `useStoredString` in the `@/storage` seam (see [storage.md](./storage.md));
  writes stay on the one imperative path.
- **Screen (`ui/` sublayer):** presentational `src/features/settings/ui/settings-screen.tsx` +
  thin `src/app/settings.tsx` route (re-exports via `@/features/settings/ui`); two native
  `@expo/ui` pickers via the chrome wrapper
  (ADR [010](./decisions/010-expo-ui-chrome-wrapper.md), see [theming.md](./theming.md)),
  reachable as a `Stack` sibling of `(tabs)` from a Profile entry link — **the first real
  product touchable**. Observability ➖ N/A (MMKV reads/writes are synchronous + infallible —
  no error path to record).

## Personal events — device-local CRUD + forms + write error path

- **Sublayers:** `data/` + `form/` + `ui/` under `src/features/personal-events/`.
- **Schema + data layer:** `src/db/schema.ts` `personalEvents` + `src/features/personal-events/data/`
  — see [storage.md](./storage.md) and ADR [011](./decisions/011-personal-event-storage.md).
- **Screens (`ui/` sublayer):** `src/features/personal-events/ui/personal-event-form-screen.tsx`
  (the create/edit/delete form route) + `src/features/personal-events/ui/personal-events-list.tsx`
  (the reactive Home-tab list, imported by `(tabs)/index.tsx` via `@/features/personal-events/ui`).
- **Form layer:** `src/features/personal-events/form/` (90%-gated) — pure `validateEventForm`
  (title required after trim; end strictly after start; returns **localizable error keys, not
  sentences**), pure `buildEventFromForm` (trims strings, drops empty optionals to `undefined`,
  `uid = existing?.uid ?? newEventId()`, `exportedAt = new Date()`; hands `Date`s + the
  `#RRGGBB` string to the domain type and lets `eventToRow` own the ISO/hex encoding — no
  re-encode). Screens hold form state and only **call** the pure logic + the hooks.
- **Native date/time:** `DateTimePicker` via the chrome wrapper
  (ADR [012](./decisions/012-personal-event-datetime-picker.md) — `@expo/ui`'s own control,
  **not** `@react-native-community/datetimepicker`; see [theming.md](./theming.md)).
- **Color:** a preset-palette swatch picker storing the `#RRGGBB` **verbatim** — the one
  allowed cluster of color literals (they are *data* per ADR 011, not chrome styling). **Text:**
  RN-core `TextInput` (never `allowFontScaling={false}`).
- **Observability ✅ wired:** a rejected `upsert`/`remove` is recorded through `@/firebase`
  `recordError` and surfaced as a failure flag — **the first feature where a write can fail**
  (unlike Settings' infallible MMKV).

## School selection (read path) — server read + offline cache + nested nav

- **Sublayers:** `data/` + `store/` + `ui/` under `src/features/school-selection/`.
- **Query + store layers:** `src/features/school-selection/data/` (the **only** generated-hook
  import site; wraps `findSchools` / `findSchoolGroups` over `customFetch`, maps DTOs → small
  domain shapes — `SchoolListItem` carries `id`/`name`/`code`/`imageUrl`; plus the pure `search.ts`
  matcher, below) + `store/` (a typed, defensively-validated, **identity-only** selection store —
  persists only `schoolId` + group `value`(s) (a `string[]` set), never the DTOs; total parsers;
  derived `isOnboardingComplete`, **no separate completion flag**). The query policy + offline
  persister are in [data.md](./data.md) (ADR [013](./decisions/013-query-persister-and-policy.md)).
- **Group step is multi-select with an explicit confirm-commit** (Phase-3 ship 2,
  ADR [016](./decisions/016-school-group-multi-select-commit.md)): each leaf is a **toggle** into a
  pending selection set (accessible `accessibilityState={{ selected }}`), branches expand/collapse
  (not selectable), and one primary **confirm** control persists the **whole set** through the
  unchanged identity-only store (`selectSchool(schoolId)` + `selectGroup([...set])`) in a single
  commit; an **empty confirm is guarded** (accessible message, no commit). The pending set is
  **trivial screen state** in the `ui/` screen — not a `form/` sublayer (R-2). Completion then
  **dismisses the whole onboarding Stack** via `router.dismissTo("/onboarding")` (not
  `router.back()`, which strands the user on the intermediate school list).
- **Accent-insensitive name-or-code search** behind a pure `data/search.ts` helper (90%-gated): a
  `normalize` (lowercase + `normalize("NFD")` + a combining-marks range strip `U+0300–U+036F` +
  space/hyphen strip — **not** `\p{Diacritic}`, which Hermes mishandles; **no new dependency**) and
  `schoolMatches(needle, school)` (empty needle → all; else normalized substring on `name` OR
  `code`), mirroring Flutter `stringIncludes`. The school screen's `useMemo` filters through it,
  staying presentational. See [data.md](./data.md) (pure `data/` logic example).
- **Screens (`ui/` sublayer):** `src/features/school-selection/ui/{school-picker-screen,school-group-picker-screen}.tsx`.
- **Nested onboarding nav:** `src/app/onboarding/` route group (nested `Stack` + thin entrypoints),
  a `Stack` sibling of `(tabs)`, reachable from a Profile link. Since Phase 3 ship 1 the group is
  **welcome-first** (see "Onboarding" below): the school picker route is `onboarding/school`
  (`timecalendar-dev://onboarding/school`), not `index` — the screen in `school-selection/ui/` is
  unchanged, only its route file moved. **Not a startup gate** (gating first paint on "no school
  selected" pulls in the calendar/home dependency — deferred to that step).
- **Observability ➖ N/A:** a failed read is a recoverable TanStack `isError` UI state
  (accessible error + retry), not a crash-worthy throw.

## Onboarding — welcome/brand surface (Phase-3 ship 1)

The first-run framing for the onboarding flow. **A presentation-only feature folder**
`src/features/onboarding/` — just a `ui/` sublayer (no `data/`/`store/`/`form/`), mirroring splash;
the second `ui/`-only feature folder. Load-bearing decisions:
**ADR [015](./decisions/015-onboarding-flow-shape.md)**.

- **The welcome surface — `src/features/onboarding/ui/welcome-screen.tsx`** (presentational, 70%
  floor): a native-default, **static** single-screen brand surface (R-3 — no Flutter carousel /
  illustrations; those are the inboxed designer polish) on the `@/theme` `background` token — the app
  name as a `ThemedText type="title"` (heading role), a tagline, three value-prop lines, and a primary
  "Get started" CTA. It owns no data: render + one navigation only. It imports no seams (B-1) and not
  its own feature barrel (B-2); the CTA does `router.push("/onboarding/school")` (route-path
  coupling). The CTA uses the brand `primary` as an **accent** (a brand-tinted border + the token
  `text` label on `backgroundElement`), **not** white-on-bright-`#E91E63` — deferring the
  `primaryStrong` `#C2185B` token to the first white-on-brand consumer (R-2; inboxed). Static surface
  → reduced-motion trivially met.
- **Welcome-first Stack + deep-link shift:** the `onboarding` group's `index` = welcome
  (`timecalendar-dev://onboarding`), the school picker moved to `onboarding/school`
  (`…/onboarding/school`), `groups` unchanged. The Profile `<Link href="/onboarding">` now lands on
  the welcome surface (its label is "Get started" / "Commencer"). See [navigation.md](./navigation.md)
  and ADR 015.
- **Reachable, not a startup gate** (ADR 015): the first-launch auto-redirect is deferred to the
  calendar/home step that consumes the selection; `school-selection`'s `isOnboardingComplete()` is
  unchanged and ready.
- **Maestro:** `mobile/.maestro/onboarding.yaml` is **extended** — welcome → "Get started" CTA → the
  live `GET /schools` round-trip (the Phase-2 read proof preserved, reached via the CTA).
- **Observability ➖ N/A:** the welcome surface performs no read/write and has no throw path — nothing
  crash-worthy to `recordError`. **Analytics deferred-with-owner:** an "onboarding started" event is
  meaningful but owned by the cross-feature analytics taxonomy step; the CTA `onPress` is the recorded
  firing point.

## Calendar sources — QR scan (camera) + iCal URL (server POST) + the cluster home (Phase-3 ships 3/4)

The first **camera input method** and the home of the "add a calendar source" cluster
(QR · iCal import · durable token persistence — Phase-03 ships 3/4/5). **One feature folder
`src/features/calendar-sources/`**, named for the *concern* so ships 4/5 grow it in place (adding
`data/create` + `store/` sublayers, not new folders). Load-bearing decisions:
**ADR [017](./decisions/017-qr-scan-camera.md)**. The camera dep + plugin are in
[runtime.md](./runtime.md).

- **Sublayers (this ship):** `data/` + `ui/` under `src/features/calendar-sources/`.
- **Parser (`data/parse-source.ts`, 90%-gated):** the pure
  `parseScannedSource(raw): ScannedCalendarSource | null` — trims, accepts `http`/`https`
  **verbatim** (Flutter's verbatim-passthrough: the QR encodes a raw string treated as a calendar
  URL — `QrCodeResult.url = barcode.rawValue`; **not** an iCal-specific shape, ship 4's
  `POST /calendars` is the real validator), rejects empty/whitespace/non-URL → `null`. **The one
  deliberate divergence:** `webcal://` → `https://` is normalized in a single, commented,
  **reversible** branch (the server accepts the http(s) form; delete the branch if it ever needs raw
  `webcal://`). Pure (no camera/`t()`/backend) per ADR 014. The seam ships 4/5 + the Phase 09
  importer consume; `ScannedCalendarSource = { url }`.
- **Ephemeral handoff (`data/scanned-source.ts`):** a module-scoped reactive holder
  (`useSyncExternalStore`) for the parsed source — **NOT MMKV, NOT Drizzle** (durable
  `user_calendars` token persistence is ship 5; this is the seam ship 5 swaps). Labeled ephemeral in
  code.
- **Screen (`ui/qr-scan-screen.tsx`, presentational 70% floor):** drives the full
  `useCameraPermissions` lifecycle (undetermined → request; granted → `CameraView` QR-only +
  `onBarcodeScanned`; denied-can't-ask-again → `Linking.openSettings()`). Single-scan debounce (a
  `scanned` ref). Imports `CameraView` / `useCameraPermissions` **directly** from `expo-camera`
  (**no chrome wrapper** — D5: expo-camera is a stable GA module, not an alpha API). A thin route
  `src/app/onboarding/qr-scan.tsx` re-exports it (route-structure rule); a "Scan a QR code" CTA on
  the welcome screen pushes `/onboarding/qr-scan`.
- **Observability ✅ wired (D8):** a **thrown** scan/parse failure records through `@/firebase`
  `recordError(error, "calendar-sources/qr-scan")` + an accessible failure state — the **second**
  surface that can fail (after personal-events writes). A recoverable **non-calendar QR** (`null`) is
  NOT recorded (re-arm + "not a calendar QR") — noise avoidance (mirrors school-selection's `isError`
  N/A vs. personal-events' write throw ✅).
- **CI vs. manual:** the camera can't be CI/Maestro-driven — the scan→parse→state wiring is proven
  by a Jest test mocking `expo-camera` (`jest/setup-expo-camera.ts` suite-wide + a controllable local
  mock firing a synthetic `onBarcodeScanned`). The real camera + permission dialogs + the
  `expo prebuild` native-config proof are the inbox/DoD on-device pass
  (`inbox/2026-06-15-qr-scan-dod-manual.md`).

### iCal URL import (server POST — Phase-3 ship 4)

The **second** input method, grown in place (sublayers, not a new folder — ADR 017 D3). The
import is a **server `POST /calendars { url } → { token }`**, not a client-side `.ics`
fetch/parse — Flutter parity (`import_ical`'s `loadIcalUrl`); the server owns parsing. **No new
dep, no `app.config.ts`/babel change, no ADR** (growth within ADR 017 + the existing `data/`
+ form-validator patterns).

- **Create seam (`data/create.ts`, 90%-gated):** the feature's **first generated-hook import
  site** (B-1) — wraps the committed `useCalendarSyncControllerCreateCalendar` over the single
  `customFetch` mutator, builds the `CreateCalendarDto` here (`{ url: url.trim(), customData:
  null }`; `schoolId`/`schoolName`/`name` omitted — enrichment deferred to the durable state),
  and exposes a thin `useCreateCalendar()` returning `{ createCalendar(url) → { token },
  isPending, isError, reset }`. Mirrors `school-selection/data/queries.ts`. A **write
  mutation** — NOT added to the offline-persist `shouldDehydrateQuery` set (ADR 013, only
  schools/groups reads persist).
- **URL validator (`data/validate-url.ts`, 90%-gated):** pure `validateIcalUrl(raw): string |
  null` — `null` when acceptable, else a **localizable key** (`calendarSources.icalUrl.error.{empty,invalid}`),
  never a sentence (mirrors `personal-events/form/validate.ts`). **Deliberately lenient** — a UX
  pre-filter for immediate feedback; the **server `POST /calendars` is the authoritative
  validator** (Flutter has no client validation at all).
- **Screen (`ui/ical-url-screen.tsx`, presentational 70% floor):** a labeled RN-core `TextInput`
  (`keyboardType="url"`, `autoCapitalize="none"`, `autoCorrect={false}`, never
  `allowFontScaling={false}`), a submit `Pressable`, and accessible importing / server-error +
  **Retry** states over the create mutation (mirrors school-selection's read flow per
  [data.md](./data.md)). On success it stashes the same `ScannedCalendarSource { url }` into the
  **ship-3 ephemeral holder** (`setScannedSource` — ship 5 swaps it for the durable token store)
  and `router.back()`s; the token is surfaced, not persisted this ship. A thin route
  `src/app/onboarding/ical-url.tsx` re-exports it; an "Add by URL" CTA on the welcome screen
  pushes `/onboarding/ical-url` (same accent-border CTA pattern beside "Scan a QR code").
- **Observability ✅ wired (D5):** an **invalid URL** (client pre-filter) is recoverable — shown
  inline, NOT `recordError`'d (noise avoidance). A **server create failure** (`useMutation`
  rejects) records through `@/firebase` `recordError(error, "calendar-sources/ical-import")` **and**
  surfaces an accessible error + Retry (the URL is syntactically fine — both recorded and
  retryable).
- **CI vs. manual:** the validate→create→handoff wiring + the server-failure → `recordError` +
  retry path are Jest-proven by mocking the `customFetch` mutator (`ical-url-screen.test.tsx`,
  real `QueryClient` + real generated mutation). The real import round-trip can't be
  Maestro-driven (the dev harness seeds no parseable `.ics`; same posture as the camera) — a
  light Maestro step (`.maestro/ical-import.yaml`) asserts render + reachability + empty-submit
  inline validation only; the real import + a11y + Crashlytics arrival is the inbox/DoD on-device
  pass (`inbox/2026-06-15-ical-import-dod-manual.md`).

## Splash

The app's startup overlay + the reusable render-when-ready pattern. **A presentation-only
feature folder** `src/features/splash/` — just a `ui/` sublayer (no `data/`/`store/`/`form/`);
`useAppReady` stays in `src/hooks/use-app-ready.ts` (shared infra, not feature-owned).

- **Overlay over the static native splash.** `SplashScreen.preventAutoHideAsync()` is called in
  **global scope** (module load, not awaited) so the native splash holds until JS is ready; the
  JS overlay (`src/features/splash/ui/splash-screen.tsx`, imported by `_layout.tsx` via
  `@/features/splash/ui`, mounted **above** the root `Stack`, **not** a route) continues it
  (brand from `@/theme` + `t("app.name")`), calls `hideAsync()` on mount, then fades out (or
  cuts under reduced motion) once ready.
- **`useAppReady()` gate** (`src/hooks/use-app-ready.ts`) — the render-when-ready pattern features
  inherit. Resolves once i18n (synchronous), fonts (a no-op seam today), and migrations
  (fire-and-forget) are satisfied. **It MUST always resolve** — an unreached `hideAsync()` hangs
  the splash forever, so every branch terminates and a watchdog timeout caps any future stalled
  gate.
- **Reduced-motion contract** — the app's first animation (see [accessibility.md](./accessibility.md)):
  reads `AccessibilityInfo.isReduceMotionEnabled()` + subscribes to changes; reduced motion → no
  animation, dismiss when ready; otherwise a ~300ms fade. **The final visual frame is identical in
  both branches** — a reduced-motion user loses only motion, never content.
- **Native-splash scheme asymmetry (not debt):** the native static splash keeps one
  `backgroundColor` literal in `app.config.ts` — it runs **pre-JS**, so it can't read theme tokens
  or the OS scheme; the JS overlay corrects to the scheme token within the first frame.

## Feature-module pattern

The layered `src/features/<feature>/<layer>/` shape (sublayers `data/` / `store/` / `form/` /
`ui/`, per-sublayer + feature barrels with **no cycle**, the seam boundaries) is the golden path — see
the [golden-path exemplar](./golden-path.md) and ADR [014](./decisions/014-layered-feature-module-pattern.md).
The boundaries are CI-enforced — [lint-format.md](./lint-format.md), B-1…B-4.
