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
  (the reactive list — **relocated off the Home tab** by ADR [022](./decisions/022-home-ia-today-view.md):
  it is now the `/personal-events` Stack route, a thin `src/app/personal-events.tsx` re-export reached
  from a Profile entry link, **not** the Home tab (which is now the today view). The component, its Add
  action, the `/personal-event-form` route, and `usePersonalEvents` are **unchanged** — only the entry
  point moved). Personal events also keep rendering *inside* the Home today view (already merged into
  `useCalendarEvents`).
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

## Calendar sources — QR scan (camera) + iCal URL (server POST) + durable token persistence (Phase-3 ships 3/4/5)

The first **camera input method** and the home of the "add a calendar source" cluster
(QR · iCal import · durable token persistence — Phase-03 ships 3/4/5, **all landed**). **One
feature folder `src/features/calendar-sources/`**, named for the *concern* so the ships grow it in
place (adding `data/` sublayers, not new folders). Load-bearing decisions:
**ADR [017](./decisions/017-qr-scan-camera.md)** (QR/camera) + **ADR
[018](./decisions/018-user-calendar-storage.md)** (durable storage). The camera dep + plugin are in
[runtime.md](./runtime.md); the `user_calendars` schema is in [storage.md](./storage.md).

- **Sublayers:** `data/` (incl. the `user-calendars/` durable sub-module) + `ui/` under
  `src/features/calendar-sources/`.
- **Parser (`data/parse-source.ts`, 90%-gated):** the pure
  `parseScannedSource(raw): ScannedCalendarSource | null` — trims, accepts `http`/`https`
  **verbatim** (Flutter's verbatim-passthrough: the QR encodes a raw string treated as a calendar
  URL — `QrCodeResult.url = barcode.rawValue`; **not** an iCal-specific shape, ship 4's
  `POST /calendars` is the real validator), rejects empty/whitespace/non-URL → `null`. **The one
  deliberate divergence:** `webcal://` → `https://` is normalized in a single, commented,
  **reversible** branch (the server accepts the http(s) form; delete the branch if it ever needs raw
  `webcal://`). Pure (no camera/`t()`/backend) per ADR 014. The seam ships 4/5 + the Phase 09
  importer consume; `ScannedCalendarSource = { url }`.
- **Durable persistence (ship 5):** the ephemeral `data/scanned-source.ts` holder was **removed**
  and replaced by the durable `user_calendars` token store (`data/user-calendars/`, ADR 018) — see
  "Durable token persistence" below. `ScannedCalendarSource = { url }` stays as the pure parser's
  output type.
- **Screen (`ui/qr-scan-screen.tsx`, presentational 70% floor):** drives the full
  `useCameraPermissions` lifecycle (undetermined → request; granted → `CameraView` QR-only +
  `onBarcodeScanned`; denied-can't-ask-again → `Linking.openSettings()`). Single-scan debounce (a
  `scanned` ref). Imports `CameraView` / `useCameraPermissions` **directly** from `expo-camera`
  (**no chrome wrapper** — D5: expo-camera is a stable GA module, not an alpha API). A thin route
  `src/app/onboarding/qr-scan.tsx` re-exports it (route-structure rule); a "Scan a QR code" CTA on
  the welcome screen pushes `/onboarding/qr-scan`. **Ship 5 rewired the success path:** a parsed
  source now `addCalendarFromUrl(source.url)` (the shared durable persist seam) and dismisses on
  success — no ephemeral handoff.
- **Observability ✅ wired:** a failed **persist** (create / token-resolve / `upsert` rejects)
  records through `@/firebase` `recordError(error, "calendar-sources/qr-scan")` + an accessible
  failure state — a real write that can fail. A recoverable **non-calendar QR** (`null`) is NOT
  recorded (re-arm + "not a calendar QR") — noise avoidance (mirrors school-selection's `isError`
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
  **Retry** states over the add operation (mirrors school-selection's read flow per
  [data.md](./data.md)). **Ship 5 rewired the success path:** on submit it now
  `addCalendarFromUrl(url)` (the shared durable persist seam — create → resolve-by-token →
  `upsert`) and `router.back()`s on success; the durable `user_calendars` row is the source of
  truth (no ephemeral handoff). A thin route `src/app/onboarding/ical-url.tsx` re-exports it; an
  "Add by URL" CTA on the welcome screen pushes `/onboarding/ical-url` (same accent-border CTA
  pattern beside "Scan a QR code").
- **Observability ✅ wired:** an **invalid URL** (client pre-filter) is recoverable — shown
  inline, NOT `recordError`'d (noise avoidance). A **persist failure** (create / token-resolve /
  `upsert` rejects) records through `@/firebase` `recordError(error, "calendar-sources/ical-import")`
  **and** surfaces an accessible error + Retry (the URL is syntactically fine — both recorded and
  retryable).
- **CI vs. manual:** the validate→create→handoff wiring + the server-failure → `recordError` +
  retry path are Jest-proven by mocking the `customFetch` mutator (`ical-url-screen.test.tsx`,
  real `QueryClient` + real generated mutation). The real import round-trip can't be
  Maestro-driven (the dev harness seeds no parseable `.ics`; same posture as the camera) — a
  light Maestro step (`.maestro/ical-import.yaml`) asserts render + reachability + empty-submit
  inline validation only; the real import + a11y + Crashlytics arrival is the inbox/DoD on-device
  pass (`inbox/2026-06-15-ical-import-dod-manual.md`).

### Durable token persistence (Phase-3 ship 5 — the load-bearing identity ship)

The **token IS the user's identity, no server backup** — so the ephemeral handoff became a durable
`user_calendars` SQLite store mirroring the Flutter `toDbMap()` verbatim (Phase-09 importer target).
Schema, migration, and the full `data/` layer are in [storage.md](./storage.md) ("User-calendar
identity store"); the storage-backend + verbatim-schema decision is
**ADR [018](./decisions/018-user-calendar-storage.md)**.

- **Durable layer (`data/user-calendars/`, 90%-gated):** the `UserCalendar` domain type + pure
  mappers (`rowToCalendar`/`calendarToRow` + `fromCalendarForPublic`, the only generated-DTO import
  — B-1), the repository over `@/db` (`findAll`/`getById`/`getByToken`/`upsert`-by-id/`remove`/
  `setVisible`), the `newId()` uid wrapper, the reactive `useUserCalendars()` (replacing the removed
  ephemeral holder), and `add-calendar.ts` (the shared `useAddCalendar`/`addCalendarFromUrl` persist
  seam both screens use: POST `/calendars` → resolve `GET /calendars/by-token/{token}` →
  `fromCalendarForPublic` → `upsert`).
- **Observability ✅:** the **first calendar-sources write that can fail** — a failed
  create/resolve/`upsert` is recorded through `@/firebase` `recordError` + an accessible failure
  surface on each screen.
- **CI vs. manual:** CI proves the mappers (round-trip, **importer-fidelity verbatim**, canonical
  UTC, null/boolean), the repository query shape, the persist wiring (success + failure at the
  `customFetch` seam), and a **restart-simulation** (a fresh repository module reads back a prior
  write through a stateful Map-backed `@/db` fake). On-disk SQLite survival across restart/kill/
  cache-clear is the on-device manual pass (`inbox/2026-06-16-calendar-restart-durability.md` — no
  list UI ships, so no Maestro post-relaunch assertion target).

## Calendar — day/week timeline + agenda + sync (Phase-04 items 1–3)

The heart of the app — the **day / week / agenda** rendering surface, now fed by **real synced
data**, plus the **read-only event details** view reached by tapping an event. The day/week
timeline, the agenda/planning view, **calendar sync**, and **read-only event details** have all
landed. **One feature folder `src/features/calendar/`** (`data/` + `data/sync/` + `ui/`). Load-bearing
decisions: **ADR [019](./decisions/019-calendar-rendering-adopt-calendar-kit.md)** (adopt
`@howljs/calendar-kit` v2 behind a seam + salvage the primitives), **ADR
[020](./decisions/020-calendar-kit-seam.md)** (the chrome-wrapper seam form), and **ADR
[021](./decisions/021-calendar-event-storage-and-sync.md)** (the `calendar_events` schema, JSON
columns, transactional drop+replace, observability split). The full rules are in
[calendar.md](./calendar.md); the schema + `data/sync/` layer in [storage.md](./storage.md); the
seam + ban in [theming.md](./theming.md) / [lint-format.md](./lint-format.md).

- **Renderer + seam:** `@howljs/calendar-kit` (pure-JS, no fingerprint bump) reached **only**
  through `src/components/chrome/calendar-kit.tsx` (lint-banned elsewhere — ADR 020, banned for
  swap-reversibility not alpha churn). A `GestureHandlerRootView` is mounted at the app root
  (`src/app/_layout.tsx`) — app infra calendar-kit requires, not behind the seam.
- **Salvaged primitives (`data/`, 90%-gated, owned regardless of the renderer):**
  `overlap-layout.ts` (`layoutOverlaps` — the unbounded-column packing) + `time-grid.ts` (the
  7:00–21:00 Flutter-parity constants + minute→pixel/height/labels/now-indicator math). The
  de-risking insurance behind the seam; the home today-grid renders through them (the agenda
  list uses its own `groupEventsByDay`, not column packing — a list has no intra-day geometry).
- **Domain + events-source seam:** `data/types.ts` `CalendarEvent` (designed against the sync
  `calendar_event.toDbMap()` model, **now persisted** in `calendar_events`) + `data/events.ts`
  `useCalendarEvents(range)` — the **single source seam**. The **sync ship swapped the source
  behind the unchanged hook**: it now reads `useSyncedEvents()` (reactive `useLiveQuery` over
  `calendar_events`, row→domain mapped) merged with the personal-events read, range-filtered once
  here; the dense-week fixture (`data/fixtures.ts`) is dev/test-only now.
- **Sync sublayer (`data/sync/`, 90%-gated — ADR 021):** the third Drizzle table
  `calendar_events` + the full layer (the **verbatim** `dtoToRow` write mapper + the lossy
  `rowToCalendarEvent` rendering read with defensive JSON decode, the **transactional
  drop+replace** repository taking verbatim rows, the reactive `useSyncedEvents`, the
  `useSyncCalendars` orchestrator over `customFetch`, the `useStartupSync` once-effect). Schema/migration/layer detail is in
  [storage.md](./storage.md) "Calendar events store"; the sync flow + triggers in
  [calendar.md](./calendar.md) "Calendar sync". **Triggers:** fire-and-forget startup sync
  (`_layout.tsx`) + pull-to-refresh on the screen (accessible refreshing / error + retry).
- **Observability split (ADR 021 / D6):** a recoverable **fetch** failure → `isError` UI state,
  **NOT** recorded (mirrors the read path); a crash-worthy local **`replaceAll` transaction**
  failure → `@/firebase` `recordError(error, "calendar/sync")` + `isError`. The first place the
  calendar feature touches the firebase seam.
- **Screen (`ui/calendar-screen.tsx`, presentational 70% floor):** a brand surface (R-3) — the
  `theme` from `@/theme` tokens (now-indicator → brand `primary`), a **3-way day/week/agenda view
  switch** (day/week = 1 / 5 days through calendar-kit, weekends-off default; agenda = the bounded
  visible week through `AgendaList`), accessible tiles + controls + empty state. **Pull-to-refresh**
  (a brand-tinted `RefreshControl` on the agenda `SectionList`) + an accessible sync-error + retry
  banner across all views drive `useSyncCalendars().sync()`; otherwise read-only (no event-write).
  A thin route `src/app/calendar.tsx` (Stack sibling of `(tabs)`).
- **Agenda / planning view (`add-mobile-calendar-agenda`, Phase-04 item 1b):** the **third
  in-place view mode** — a day-grouped React Native core **`SectionList`** (`ui/agenda-list.tsx`,
  **zero new dep** — NOT calendar-kit, the custom "easy half" ADR 019 anticipated). Two new pure
  90%-gated `data/` helpers: `groupEventsByDay` (the agenda analog of `layoutOverlaps`, local-day
  bucketing, the deliberate divergence from the Flutter `endsAt`-carry quirk) + the locale-aware
  **display-only** `date-fns` formatter (`format.ts` — day headers + time ranges; **roadmap item 6
  pulled early**; `date-fns`/`date-fns-tz` are pure-JS, **no fingerprint bump**). Themed event
  tiles (radius/shadow/`#RRGGBB` color tint) + a brand-`primary` now/upcoming indicator. Reuses the
  **unchanged** `useCalendarEvents` seam + the salvaged primitives. **No new ADR** (D5 — the
  load-bearing call is ADR 019; the `SectionList`-over-FlashList + `date-fns`-display-only choices
  are `design.md` decisions, the FlashList swap a recorded sync-ship trigger). **Observability ➖
  N/A** (read-only). The agenda branch needs **no calendar-kit mock** (a plain `SectionList`); CI
  proves the two helpers (90%) + the screen's events→sections→tiles wiring; visual/perf folds into
  the existing calendar on-device pass. See [calendar.md](./calendar.md) "Agenda / planning view".
- **Read-only event details (`add-mobile-event-details`, Phase-04 item 3):** the view reached by
  **tapping a synced event** — the **first consumer of ADR 021's verbatim row**. A new rich read in
  `data/` (`event-details.ts`, 90%-gated): a pure `rowToEventDetails` (the rich counterpart to the
  lossy `rowToCalendarEvent` — keeps `groupColor`/`type`/`exportedAt`/the full `tags{name,color,icon}`
  the rendering projection drops, decoding the JSON columns defensively by **reusing** the sync
  mapper's `decodeJsonArray`/`decodeFields`), a `getByUid` read (the only `@/db` import site for it,
  reusing `eq`), and a reactive `useEventDetails(uid)` (loading vs. not-found). The rich `EventDetails`
  is **separate** — the rendering `CalendarEvent` is **not** widened (D3). Two new display-only
  `format.ts` formatters (full date+time range + the footer date — **no new dep**). A presentational
  read-only `ui/event-details-screen.tsx` (70% floor): title block (labeled swatch + heading + full
  date/time), tag bubbles (name+color; **no icon-font dep** — R-3 parity gap recorded), content lines
  (location / calendar name when 2+ calendars via `useUserCalendars` / teachers / description), the
  "Updated …" footer, and an accessible **not-found** state. **Read-only with respect to the
  event's CONTENT — no edit/delete/checklist** (D1; the checklist sibling is deferred —
  `inbox/2026-06-16-event-details-deferrals.md`); the screen now carries the **hide / un-hide
  visibility action** (a header action for synced events — the hidden-events capability, Phase 05
  Ship A; see "Hidden events" below). The **tap-through**: the agenda tile became a
  `button` Pressable; the grid wires `onPressEvent` on `CalendarContainer` through the chrome seam
  (the calendar-kit ban holds); routing is keyed on **origin** — a synced event (`userCalendarId` set)
  → `/event-details/<uid>`, a personal event (no `userCalendarId`) → its existing edit form. New thin
  route `src/app/event-details/[uid].tsx` (a `Stack` sibling, deep-linkable). **No new ADR / dep /
  schema** (D8). **Observability ➖ N/A** (read-only — a `getByUid` miss is a recoverable not-found
  state). See [calendar.md](./calendar.md) "Event details (read-only)".
- **CI vs. manual:** the calendar-kit Reanimated grid is mocked suite-wide
  (`jest/setup-calendar-kit.ts` — the mocked body invokes `renderEvent` per event), so CI proves
  the primitives (90%), the events-source seam, the screen's event→tile/mapping/theme/label +
  refresh/error/retry wiring, and the **full sync layer** (mappers + defensive JSON decode, the
  transactional drop+replace, the `customFetch`-seam sync wiring with the observability split, a
  restart-simulation — see [storage.md](./storage.md)). The dense-overlap visual correctness +
  **low-end-Android frame rate + Reassure baselines on real synced data** (ADR 019's gate —
  `inbox/2026-06-16-calendar-low-end-android-perf.md`), the **brand visual review**
  (`inbox/2026-06-16-calendar-visual-brand-review.md`), and the **sync on-device proofs** (real
  synced render / offline-after-sync / drop+replace atomicity after a mid-sync kill / Crashlytics
  arrival — `inbox/2026-06-16-calendar-sync-on-device.md`; the populated event-details render +
  manual VoiceOver/TalkBack — `inbox/2026-06-16-event-details-on-device.md`) are the on-device
  manual pass. The event-details wiring (mapper/formatters at 90%, the screen render + not-found,
  the origin-correct tap routing — the calendar-kit mock now invokes the container's `onPressEvent`)
  is CI-proven. Maestro (`.maestro/calendar.yaml`) asserts render + reachability — incl. the
  event-details route via a not-found deep link (no seeded synced backend — recorded).

## Hidden events — hide / un-hide synced events, persisted in MMKV (Phase 05 Ship A)

Full Flutter `hidden_event` parity: hide a **synced** event by **this instance** (uid) or **by
name** (all of the same title), persist the hidden set durably, filter hidden events out of every
view, un-hide from a reachable surface. **A new `src/features/hidden-events/` feature folder**
(`data/` + `ui/`), the home of the hide/un-hide concern. Load-bearing decision: the **storage
backend** (MMKV-over-Drizzle, a single verbatim blob for importer fidelity) — **ADR
[023](./decisions/023-hidden-events-storage.md)**. The store is in [storage.md](./storage.md)
"Hidden events store"; the filter + hide-action wiring in [calendar.md](./calendar.md) "Hidden
events".

- **Data layer — `src/features/hidden-events/data/` (90%-gated):** the single MMKV blob
  `{ uidHiddenEvents, namedHiddenEvents }` under one flat key `hiddenEvents.set` (the Flutter
  `toMap()` shape verbatim — importer fidelity, no server backup), a **total defensive parser**
  (`parseHiddenEvents` — corrupt/absent → empty, never throws), the four-mutator write path
  (`hideByUid`/`hideByName`/`unhideUid`/`unhideName`, deduped, the **only** `@/storage` import site
  — B-1), `useHiddenEvents()` (the reactive read over `useStoredString`), and `useHideActions()`
  (the four mutators wrapped with `recordError` + an accessible `failed` flag — the one UI write
  path).
- **The filter** rides the **unchanged** events-source seam (`useCalendarEvents` reads
  `useHiddenEvents()` and excludes hidden uids/titles on the merged list) — no calendar-view consumer
  change; the merged-list filter means a hidden *name* also hides a same-titled personal event
  (Flutter parity), while the hide **action** is **synced-only** (so a personal event is never
  *deliberately* hidden). See [calendar.md](./calendar.md).
- **The hide action** grows the read-only event-details screen — a header action offered only for a
  synced event, a native-default `Alert` chooser (hide-this-instance vs hide-by-name), or **un-hide**
  when the viewed event is currently hidden (never a one-way trap). See [calendar.md](./calendar.md).
- **The management screen (`ui/hidden-events-screen.tsx`, 70% floor)** — a `/hidden-events` Stack
  sibling of `(tabs)` reached from a Profile entry link (required because hide-by-name has no
  per-event details surface). Lists the name-hidden titles + the uid-hidden events that **still
  resolve** to a synced event (resolved via `useSyncedEvents()` — Flutter parity, a stale uid is not
  orphaned), each with an un-hide control + an accessible empty state. Themed from `@/theme` (R-3 —
  heading-role section titles, ≥44pt un-hide touchables, polite live-region error/empty states).
- **Observability ✅:** a failed hidden-set **write** is crash-worthy (no server backup) → `@/firebase`
  `recordError(error, "hidden-events/<action>")` + an accessible failure surface; the filter **read**
  is total/infallible (corrupt/absent → empty set, no record).
- **CI vs. manual:** CI proves the parser totality, the four mutators (append/dedup/remove/no-op),
  the **verbatim importer-fidelity blob**, the **write/read-back + restart-simulation** (a fresh
  store module reads back a prior write through a stateful Map-backed `@/storage` fake — the
  irreplaceable-data rigor of user_calendars / calendar_events), the seam filter, the synced-only
  hide/un-hide wiring, the management-screen lists + un-hide + empty state, and the observability
  path. On-disk **MMKV survival** across restart/kill/cache-clear + manual VoiceOver/TalkBack are the
  on-device pass (`inbox/2026-06-16-hidden-events-on-device.md`). Maestro
  (`.maestro/hidden-events.yaml`) asserts the management route renders its empty state + reachability
  (no seeded hidden set — recorded). **No new dependency, no `app.config.ts`/babel/native change, no
  Drizzle schema/migration** (a new MMKV key under the existing seam).

## Home / today view — the landing surface (Phase-04 item 4)

The Home tab's today / next-up view — the surface a TimeCalendar user opens to. **A new
`src/features/home/` feature folder** (`data/` selectors + `ui/` screen), the landing surface
**composing** the landed calendar + personal-events seams — it is NOT a calendar view mode
(day/week/agenda are in-place modes of the `/calendar` screen). Load-bearing decision: the IA
call (the Home tab becomes the today view; the standalone personal-events list relocates) is
**ADR [022](./decisions/022-home-ia-today-view.md)**; the rendering is composition of landed
primitives (ADRs 019/021/014), not a new pattern.

- **IA (ADR 022):** `src/app/(tabs)/index.tsx` re-exports `HomeScreen` from `@/features/home/ui`
  (was `PersonalEventsList`). The standalone personal-events list **relocated** to the
  `/personal-events` Stack route reached from Profile (see the Personal-events section above) —
  create/edit/delete preserved, not dropped. Personal events also render *within* the today view
  (already merged into `useCalendarEvents`).
- **Data layer — `src/features/home/data/selectors.ts` (90%-gated):** the only new logic, three
  pure selectors (no React/`@/db`/`t()`): `displayedDay(events, now)` — Flutter
  `dayDisplayedOnHomePageProvider` parity: **today** if any event `endsAt > now` on today's local
  day (the **deliberate `endsAt > now` refinement** over Flutter's `startsAt.isAfter(today)` — an
  in-progress class counts; recorded so it isn't "fixed" back), else the local day of the first
  event starting after `now`, else today; `eventsForDay(events, day)` — the day's events (local-day
  bucketing, sorted by start, stable id tie-break, mirroring `groupEventsByDay`); `dynamicHourRange(events)`
  — min start hour .. max end hour + 1, clamped `[0,24]`, fallback `{8,18}` (Flutter `today_events`
  parity). It imports `CalendarEvent` from `@/features/calendar/data` (a cross-feature `data → data`
  read by full `@/` path — the legitimate consumer pattern the sync orchestrator already uses, D3).
- **UI layer (`ui/`, 70% floor):** `home-screen.tsx` (`HomeScreen` — reads `useCalendarEvents` over a
  displayed-day window, computes the selectors, renders the header [`app.name` heading + `formatFullDay`
  date + the pluralized `home.header.count` line / `home.header.empty`], the `UpcomingScroller`, the
  `home.today.title` section header, and the `TodayTimeline`; wires `useSyncCalendars` → pull-to-refresh
  + the accessible error/retry banner reused from the calendar screen; routes taps by origin —
  synced→`/event-details/<uid>`, personal→`/personal-event-form?uid=<uid>` — and an "Add personal event"
  Link); `upcoming-scroller.tsx` (a horizontal RN-core `ScrollView` of the day's event cards, renders
  nothing when empty — D6); `today-timeline.tsx` (**the salvaged overlap engine's FIRST rendering
  consumer** — an absolute-positioned grid, NOT calendar-kit (D5): event tiles placed by `layoutOverlaps`
  + `minuteToPixel`/`eventHeight` at the Flutter-parity 70px/hour, the hours column from `hourLabels`,
  a brand-`primary` now-indicator via `nowIndicatorPosition` only when the displayed day is today,
  `MIN_TILE_WIDTH` text-hiding reused for narrow columns). All themed from `@/theme` (R-3).
- **`formatFullDay` (closes roadmap item 5):** the today header's full localized date was added to
  `calendar/data/format.ts` (date-fns `PPPP` over the existing `LOCALES` map, display-only) — the
  date-fns seam now covers calendar/agenda/details/home; **roadmap item 5 (date/time) is closed**
  (relative-time + ICU remain the existing earned-when-needed i18n debt).
- **Observability ➖ N/A:** the home surface performs no write of its own; the only write it triggers
  is `useSyncCalendars().sync()` (pull-to-refresh), whose observability split is owned by ADR 021 (a
  fetch failure is a recoverable `isError`, not recorded). The selectors are pure and total (empty →
  fallbacks, never throw). No new `@/firebase` call.
- **CI vs. manual:** the selectors are 90%-tested per branch (empty / in-progress / all-past → next
  day / future-only / cross-hour / the 8–18 fallback / the `[0,24]` clamp / the local-day boundary);
  the screen test (mock the events-source + sync seams, real theme + i18n) proves the header + empty
  state, the scroller + timeline render with events, origin-correct tap routing, and pull-to-refresh
  → `sync()` (no calendar-kit on home, so no calendar-kit mock). The populated dense-overlap render +
  frame rate stay the on-device visual pass (folded into the existing calendar visual review note — no
  new inbox note). `.maestro/home.yaml` asserts the Home tab renders (heading + empty-day state) +
  pull-to-refresh reachability (seeded-data limitation noted in the file, same posture as calendar).

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
