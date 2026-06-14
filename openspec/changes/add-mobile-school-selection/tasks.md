# Tasks — School selection (read path): TanStack Query read, the offline persister over the MMKV seam, nested onboarding nav, full DoD

All paths are in `mobile/` unless noted. Order follows the Migration Plan in `design.md`.

## 1. Dependencies — the persister packages (pure JS, no native)

- [ ] 1.1 In `mobile/`, install the two TanStack Query persister packages **version-locked to the
  installed `@tanstack/react-query@5.101.0`**: `npm install @tanstack/react-query-persist-client@5.101.0
  @tanstack/query-sync-storage-persister@5.101.0` (the **sync** persister — MMKV is synchronous, ADR
  013 / D1; **do NOT** add `@react-native-async-storage/async-storage` or the async persister). Confirm
  the lockfile updates and no native module is pulled in (these are pure JS — no `app.config.ts` plugin,
  no autolink).

## 2. The MMKV `Storage` adapter in the `@/storage` seam (D1, R-1)

- [ ] 2.1 Add a `Storage`-shaped export to `mobile/src/storage/index.ts` (e.g. `mmkvQueryStorage`) over
  the seam's existing module-scoped instance: `getItem(key): string | null` (→ `getString(key) ?? null`),
  `setItem(key, value): void` (→ `setString`), `removeItem(key): void` (→ `remove`). This is the
  encoded form of "the persister rides the seam, not the backend" — `react-native-mmkv` stays imported
  only inside `src/storage/**` (lint). Comment it (mirroring the existing seam comments): why it lives
  here (the lint ban), and that it is the sync `Storage` shape `createSyncStoragePersister` expects.
- [ ] 2.2 Add `mobile/src/storage/storage.test.ts` coverage (extend the existing seam test): the adapter
  round-trips through the seam (the MMKV in-memory mock from `setup-storage`) — `setItem` then `getItem`
  returns the value; `getItem` of an unset key returns `null` (not `undefined`); `removeItem` clears it.

## 3. The query policy + the persister config (D2, D8 — ADR 013)

- [ ] 3.1 Set the **earned query policy** on the `QueryClient`. Decide where it's cleanest: either add
  `defaultOptions: { queries: { staleTime, gcTime, retry } }` to the `new QueryClient(...)` in
  `src/app/_layout.tsx`, or extract the client to a small `src/api/query-client.ts` infra module and set
  it there (implementer's call — record which). Concrete values within the ADR-013/D2 rationale: a
  non-zero `staleTime` (≈5–15 min), a `gcTime >= maxAge` (the persister window — a hard constraint), a
  bounded `retry` (≈2). Comment each with its reason (R-1 prose at the constant — these are not
  lint-encodable config-shape).
- [ ] 3.2 Build the persister config — `src/features/school-selection/data/persist.ts` (or
  `src/api/persist.ts` — record which): `createSyncStoragePersister({ storage: mmkvQueryStorage, key:
  "<versioned key>" })` (import `mmkvQueryStorage` from `@/storage`), and the `persistOptions` object
  for `PersistQueryClientProvider`: `{ persister, maxAge, buster, dehydrateOptions: {
  shouldDehydrateQuery } }`. `shouldDehydrateQuery` SHALL return true **only** for the schools +
  school-groups query keys (match by the generated query-key prefix — see
  `getSchoolControllerFindSchoolsQueryKey` / `getSchoolGroupControllerFindSchoolGroupsQueryKey`). Set
  `buster` to a cache-version string (bump it on any persisted-shape change). `gcTime` (3.1) ≥ `maxAge`.
- [ ] 3.3 Swap the provider in `src/app/_layout.tsx`: replace `<QueryClientProvider client={queryClient}>`
  with `<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>` (from
  `@tanstack/react-query-persist-client`). The sync persister restores synchronously — **no async
  restore gate / `isRestoring` handling** (D8). Preserve the existing `import "@/i18n"`, `void
  runMigrations()`, `<SplashScreen />`, and `<ThemeProvider>` wiring untouched. Keep `_layout.tsx` thin.

## 4. The feature query layer — `src/features/school-selection/data/` (90% coverage glob)

- [ ] 4.1 `data/types.ts`: the small domain shapes the screens consume (e.g. a `SchoolListItem`
  projection of `SchoolForList` — `{ id, name, imageUrl }` — and a `SchoolGroupNode` mirror of
  `SchoolGroupItem` `{ text, value, children }`). Keep minimal — only what the screens render + what the
  store persists (R-2).
- [ ] 4.2 `data/queries.ts`: `useSchools()` wrapping `useSchoolControllerFindSchools()` →
  `{ schools: SchoolListItem[]; isLoading; isError; refetch }`; `useSchoolGroups(schoolId: string)`
  wrapping `useSchoolGroupControllerFindSchoolGroups(schoolId)` → `{ groups; isLoading; isError;
  refetch }`. **The only place the generated hooks are imported** (screens import `@/features/school-
  selection`). Map the rep DTOs to the domain shapes; pass through TanStack's state flags.
- [ ] 4.3 `data/persist.ts` (if placed here per 3.2) — the persister + `persistOptions` (3.2). If placed
  in `src/api/`, note it in the barrel/imports instead.
- [ ] 4.4 `data/index.ts` (or fold into the feature barrel §6.4): re-export `useSchools`,
  `useSchoolGroups`, the persist config, the domain types.

## 5. The selection store — `src/features/school-selection/store/` (90% coverage glob, mirrors Settings prefs)

- [ ] 5.1 `store/types.ts`: the persisted selection shape + flat namespaced keys (e.g.
  `schoolSelection.schoolId`, `schoolSelection.groupValues`) + **defensive validators / parsers** — a
  read is total (unset/corrupt → "no selection"). The group selection is a JSON-encoded string of the
  selected group `value`(s); the store owns the JSON encode/parse + validation (the one place it lives).
  Persist only identity (`schoolId` + group `value`(s)), **not** the full DTOs (D4).
- [ ] 5.2 `store/store.ts`: imperative `getSelection()` / `selectSchool(schoolId)` /
  `selectGroup(values)` / `clearSelection()` over `@/storage` `getString`/`setString`/`remove`; a pure
  `hasSelection()` / `isOnboardingComplete()` derived predicate (no separate flag — D4). Mirror
  `settings/prefs/store.ts`'s shape (pure, total reads).
- [ ] 5.3 `store/hooks.ts`: a reactive `useSelectedSchool()` (and group) over `@/storage`'s
  `useStoredString`, so consumers re-render when the selection changes (mirroring `useThemePreference`).
- [ ] 5.4 `store/index.ts` (or fold into the feature barrel).

## 6. Feature barrel — no import cycle

- [ ] 6.1 `src/features/school-selection/index.ts`: re-export the public surface — `useSchools`,
  `useSchoolGroups`, the persist config, `useSelectedSchool`, `selectSchool`/`selectGroup`/
  `clearSelection`/`isOnboardingComplete`, the domain + selection types. Verify **no import cycle** (the
  `data/` and `store/` sub-modules import `@/api/generated` / `@/storage`, not each other or the barrel —
  mirror the personal-events `data`/`form` two-sub-barrel pattern).

## 7. i18n catalogs (FR + EN) — `src/i18n/locales/{en,fr}.json`

- [ ] 7.1 Add flat dotted `onboarding.*` keys to **both** `en.json` and `fr.json` (FR/EN parity is
  `tsc`-typed bidirectionally — a missing/extra key in either fails the typecheck). At minimum:
  - School step: `onboarding.school.title`, `onboarding.school.loading`, `onboarding.school.error`,
    `onboarding.school.empty`, `onboarding.school.retry`, `onboarding.school.rowLabel`,
    `onboarding.school.search` (if a filter is added).
  - Group step: `onboarding.group.title`, `onboarding.group.loading`, `onboarding.group.error`,
    `onboarding.group.empty`, `onboarding.group.retry`, `onboarding.group.nodeLabel`,
    `onboarding.group.confirm`.
  - Entry: `profile.onboarding.link` (the Profile→onboarding entry control label).
  Final key names at the implementer's discretion **following the existing flat convention**. Pick
  natural FR + EN copy.
- [ ] 7.2 **Remove** the orphaned `schools.*` keys from both catalogs (the harness screen is deleted —
  §9). Verify no other consumer references them (grep `t("schools.`) before removing; `tsc` parity
  catches a stale reference.

## 8. Nested onboarding navigation — routes + screens (D3, D6)

- [ ] 8.1 Presentational screens under `src/components/onboarding/` (70% floor, behavior-tested):
  - `school-picker-screen.tsx` — the list over `useSchools()` (`@/features/school-selection`):
    accessible rows (role + translated label + ≥44/48 hit area) navigating to
    `/onboarding/groups?schoolId=<id>` on select; loading/error (with accessible **retry** → `refetch`)/
    empty states (polite live region + status role — D7); optional client-side text filter. `@/theme`
    tokens, `ThemedText`/`ThemedView`, `SafeAreaView`, `FlatList`. No `allowFontScaling={false}`.
  - `school-group-picker-screen.tsx` — read the `schoolId` route param (`useLocalSearchParams`);
    `useSchoolGroups(schoolId)`; render the `SchoolGroupItem` tree (a leaf selectable, a branch
    expandable — proportionate, D7); selecting a leaf calls `selectSchool`/`selectGroup` (persist, D4)
    and completes the flow (navigate back / to Home). Same a11y + states + tokens.
  - (Optional) extract `school-row.tsx` / `group-node.tsx` if it aids testing/clarity.
- [ ] 8.2 Thin routes under `src/app/onboarding/`:
  - `src/app/onboarding/_layout.tsx` — a nested `<Stack>` (the nested-nav layout; no colocated test —
    route layout).
  - `src/app/onboarding/index.tsx` — `export { default } from "@/components/onboarding/school-picker-screen"`.
  - `src/app/onboarding/groups.tsx` — `export { default } from "@/components/onboarding/school-group-picker-screen"`.
- [ ] 8.3 Register the group as a root `Stack` sibling: in `src/app/_layout.tsx` add
  `<Stack.Screen name="onboarding" />` as a sibling of `<Stack.Screen name="(tabs)" />` / `settings` /
  `personal-event-form` (route-structure rule — a non-tab route group is a `Stack` sibling of `(tabs)`).
- [ ] 8.4 Profile entry control: in `src/app/(tabs)/profile.tsx` add an accessible "Choose your school"
  entry — an Expo-Router `<Link href="/onboarding" asChild>` over a `Pressable` with
  `accessibilityRole="link"` + a translated `accessibilityLabel` + a ≥44pt/48dp hit area (mirroring the
  A2 Profile→Settings link). All strings via `t()`.
- [ ] 8.5 Confirm reachability via the dev deep links `timecalendar-dev://onboarding` (school step — the
  Maestro target) and `timecalendar-dev://onboarding/groups?schoolId=<id>` (the nested step).

## 9. Retire the `schools` harness surface (D5)

- [ ] 9.1 Delete `mobile/src/components/schools-screen.tsx` and `mobile/src/components/schools-screen.test.tsx`.
- [ ] 9.2 Delete `mobile/src/app/schools.tsx` and remove `<Stack.Screen name="schools" />` from
  `src/app/_layout.tsx`.
- [ ] 9.3 Delete `mobile/.maestro/schools.yaml` (replaced by `onboarding.yaml`, §11).
- [ ] 9.4 Remove the orphaned `schools.*` i18n keys (§7.2) — confirm `tsc` parity + lint stay green
  after removal (no dangling `t("schools.")`).
- [ ] 9.5 Confirm nothing else references the deleted surface (grep `schools-screen`, `app/schools`,
  `schools.yaml`).

## 10. CI proof tests (R-1)

- [ ] 10.1 `src/features/school-selection/data/queries.test.ts` (90%): mock at the **`customFetch`
  mutator seam** (`jest.mock("@/api/mutator")`, the established posture — see the now-deleted
  `schools-screen.test.tsx` for the reference) and drive the real generated hook + a real `QueryClient`;
  assert `useSchools()` maps a success response to the domain shape and exposes `isLoading`/`isError`/
  `refetch`; assert `useSchoolGroups(schoolId)` likewise. Cover the error branch.
- [ ] 10.2 `src/features/school-selection/data/persist.test.ts` (90%): `shouldDehydrateQuery` returns
  true for a schools/groups query key and **false** for an unrelated query key; the `buster`/`maxAge`/
  `key` are set as configured. (Pure config — no render.)
- [ ] 10.3 `src/features/school-selection/store/store.test.ts` (90%): round-trip the selection through the
  real `@/storage` seam (the MMKV in-memory mock); a total read on unset/corrupt → "no selection";
  `isOnboardingComplete()` derives correctly (no selection → false; school (+group) selected → true);
  the JSON group encode/parse is total.
- [ ] 10.4 `src/features/school-selection/store/hooks.test.ts` (90%): `useSelectedSchool()` reflects the
  current selection and re-renders reactively when `selectSchool`/`selectGroup` writes (mirror the
  settings `hooks.test.ts`).
- [ ] 10.5 `src/components/onboarding/school-picker-screen.test.tsx` (70%): renders rows from a mocked
  `useSchools` (or mocked at the mutator seam) through the real theme + i18n trees; loading/error/empty
  states render; the retry triggers `refetch`; selecting a school navigates to the group step with the
  id (assert via a mocked router `push`).
- [ ] 10.6 `src/components/onboarding/school-group-picker-screen.test.tsx` (70%): renders the group tree
  from a mocked `useSchoolGroups`; selecting a leaf calls the selection store (persists the group value).
- [ ] 10.7 Confirm the **K-3 coverage gate stays green**: `src/features/school-selection/**` meets 90%
  lines+branches; the `src/components/onboarding/**` screens fall under the 70% floor. `jest.config.js`
  `coverageThreshold` SHALL NOT change. (Deleting `schools-screen.tsx` + its test removes a `components`
  surface from the 70% pool — verify the floor still clears.)

## 11. Maestro flow — `mobile/.maestro/onboarding.yaml` (replaces schools.yaml)

- [ ] 11.1 Create `mobile/.maestro/onboarding.yaml` mirroring the (deleted) `schools.yaml` /
  `settings.yaml` shape: `appId: fr.samuelprak.timecalendar.dev`; `launchApp` → `stopApp` → `openLink:
  timecalendar-dev://onboarding` → the iOS-only `tapOn: "Open"` (in `runFlow when: platform: iOS`) →
  `extendedWaitUntil visible: <school step title>` (generous 60s timeout) → `extendedWaitUntil visible:
  "My Gaming Academia"` (the `visible: true` ASCII seeded fixture from
  `server/src/modules/school/fixtures/school.fixtures.yml` — the live `GET /schools` round-trip
  assertion; same fixture `schools.yaml` used). **Optionally** tap the school row → assert the nested
  group step opens (a second live `GET .../school-groups` read — only if a stable selector exists; do
  not ship a flaky step). Header comment: it proves the real onboarding read flow end-to-end (app →
  generated client → `customFetch` → NestJS → Postgres), replacing `schools.yaml`; requires the harness
  server up (`ci/e2e-server.sh up`) + a release-config dev-variant build (`mobile/e2e/run_e2e.sh`).

## 12. Definition-of-Done walk — automatable axes (do them)

C1 is the **third feature through the full DoD** and the **first server-data read flow**. Each axis is
✅ a task, ➖ N/A-with-reason, or deferred to the inbox (§13). No third state (`definition-of-done.md`).

- [ ] 12.1 **Architecture** — follows the Architecture Book (Data-layer seam + the now-set query policy
  + persister; route-structure for the nested route group; the logic-in-`features` / presentation-in-
  `components` split). Load-bearing decisions in `design.md` (D1–D8); the persister + query policy
  recorded as **ADR 013** (§14). Respects boundaries: generated hooks only in `data/queries.ts`;
  `react-native-mmkv` only in `@/storage` (the persister rides the seam adapter); Expo Router the only
  nav API.
- [ ] 12.2 **Types** — `npx tsc --noEmit` clean in `mobile/`; no unjustified `any` (the generated DTOs +
  the persister generics cover it).
- [ ] 12.3 **Lint** — `npm run lint` clean (`--max-warnings 0`): no hardcoded strings, a11y props on
  every touchable (school rows, group nodes, retry, the Profile entry link), no `fetch`/`axios` outside
  the mutator, no `react-native-mmkv` outside `@/storage`, no `@react-navigation/*`, no parent-relative
  imports, routes not imported from tests, import order.
- [ ] 12.4 **Unit/component tests** — the §10 proofs green; the **90% logic glob**
  (`src/features/school-selection/**`) green via the queries/persist/store/hooks tests; the **70%
  floor** holds for the onboarding screens; the K-3 gate unchanged (12.4 / 10.7).
- [ ] 12.5 **E2E** — `mobile/.maestro/onboarding.yaml` (§11) is the real-round-trip flow replacing
  `schools.yaml`; runs on iOS + Android via `ci-mobile-e2e.yml` (on-demand) — confirmed in §13 (on-device).
- [ ] 12.6 **i18n** — zero hardcoded strings (lint); FR + EN complete (`tsc` bidirectional parity); the
  orphaned `schools.*` keys removed. ✅ via §7.
- [ ] 12.7 **Accessibility (automatable half)** — a11y lint passes; every interactive control declares a
  role + translated label + a ≥44pt/48dp hit target; loading/error states carry a polite live region +
  status role; the error state offers an accessible retry; `allowFontScaling` not disabled. Manual
  screen-reader / touch-by-finger / contrast halves → §13 (inbox).
- [ ] 12.8 **Native correctness (automatable half)** — RN-core list/pressable primitives + Expo Router
  nested stack (the platform's push/back nav — R-3); the on-device feel/native-correctness review (both
  platforms, light/dark) is §13 (inbox).
- [ ] 12.9 **Performance** — the school list uses `FlatList` with keyed rows; the persister keeps the
  cold-launch read off the critical path (cache restored synchronously, D8); Reassure / low-end-Android
  jank check is the on-device half → §13.
- [ ] 12.10 **Observability** — ➖ **N/A with reason**: the read path's failures surface as TanStack
  `isError` states the screens render (an accessible error + retry) — a failed *read* is a normal,
  recoverable UI state, not a crash-worthy event, and there is no write/throw path to `recordError`
  here (unlike B2's DB write). The global JS error handler (`@/firebase` auto-installed) still catches
  any unexpected throw. A genuinely crash-worthy read failure (e.g. a malformed DTO that throws in
  mapping) would reach Crashlytics via that handler. Record this N/A in the DoD record (no silent skip).
- [ ] 12.11 **Product analytics** — **deferred-with-owner** (not silent N/A): a "school selected" /
  "onboarding completed" event is meaningful, but its firing point is the selection store's
  `selectSchool`/`selectGroup` (unit-provable through `@/firebase` when wired) and verifying arrival
  needs on-device DebugView; the analytics taxonomy is owned by the cross-feature step that defines it
  (mirroring A2's `settings_changed` / B2's event deferral). C1 does not add the event; the selection
  setters are the recorded firing point. Record in the DoD record.
- [ ] 12.12 **Theming / light-dark** — the onboarding screens render scheme-appropriate `@/theme`
  tokens; no raw color literals (school images come from the DTO `imageUrl`); loading/error/empty use
  token colors. On-device contrast eyeball → §13.
- [ ] 12.13 **Documentation** — Architecture Book updates + changelog (§14); ADR 013 (§14); the
  golden-path doc updated (§14.5). Record that the DoD axes are walked here (this §12 + §13 is the audit
  trail).
- [ ] 12.14 **Native config sanity** — run `npx expo prebuild --clean` and a dev build; confirm the app
  launches with `PersistQueryClientProvider`, the onboarding flow reads + caches, and **no native module
  was added** (the persister packages are pure JS — design D1 / §1.1). If a native change unexpectedly
  appears, stop and record it (it would contradict D1).

## 13. Definition-of-Done walk — manual on-device axes (inboxed, HUMAN-tagged)

Irreducibly on-device; implementer/reviewer **skip-and-continue** (do not block). All items, with
what/why/how-to-verify, in `docs/react-native-migration/inbox/2026-06-14-school-selection-dod-manual.md`.

- [ ] 13.1 Manual **VoiceOver** pass (iOS) — school list (rows, retry, filter), the nested group tree
  (selectable/expandable nodes), the Profile entry link; focus order + announcement quality. (HUMAN: see
  inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.2 Manual **TalkBack** pass (Android). (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.3 On-device **nested-navigation feel / native-correctness** — push school→group, back, both
  platforms, light + dark. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.4 **Offline behavior on a real device** — load schools online, kill the network, cold-launch,
  confirm the persisted cache renders (the persister's real proof CI can't assert). (HUMAN: see
  inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.5 **Touch-target by finger** — school rows, group nodes, retry, the Profile entry link. (HUMAN:
  see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.6 **Color-contrast** eyeball — list/group text on background, both schemes, against the
  documented AA pairs in `tokens.ts`. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.7 **Performance / no-jank** — scroll the school list + expand a deep group tree on a low-end
  Android. (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)
- [ ] 13.8 **E2E** — run `mobile/.maestro/onboarding.yaml` (+ confirm `settings.yaml` /
  `personal-events.yaml` still pass; `schools.yaml` is gone) through `ci-mobile-e2e.yml` (on-demand,
  `run-e2e` label / on main). Optionally evaluate whether the nested group-step assertion is reliable
  enough to keep (design D5 / §11). (HUMAN: see inbox/2026-06-14-school-selection-dod-manual.md)

## 14. Docs + ADR (R-1 pointers + ownership)

- [ ] 14.1 **ADR** `.claude/rules/mobile/decisions/013-query-persister-and-policy.md` (copy this
  change's `adr-013-query-persister-and-policy.md`; next free number — B2 took 012): the offline
  persister (MMKV-seam sync persister vs. AsyncStorage async / SQLite — chosen sync-over-the-seam), the
  dehydrate policy (maxAge/buster/shouldDehydrateQuery), and the now-earned query policy (staleTime/
  gcTime≥maxAge/retry); Consequences (every later server read inherits it; the `@/storage`
  `Storage`-adapter export) + Revisit-if. Add the index row to
  `.claude/rules/mobile/decisions/README.md`.
- [ ] 14.2 **Architecture Book — "Data layer → Query runtime"**: update the "query policy deliberately
  unset — the first server-read feature earns it" note to record that **Feature C earned it** — the
  explicit query policy + the MMKV-seam-backed sync persister (`PersistQueryClientProvider`), pointer to
  ADR 013. Note the `@/storage` seam gained the `mmkvQueryStorage` adapter.
- [ ] 14.3 **Architecture Book — add a "School selection" section** (under the Phase-2 features,
  mirroring the Settings/Personal-events sections): the feature folder shape
  (`data/queries`+`persist`, `store/`); the nested onboarding route group + the thin entrypoints; the
  selection store (identity-only, total reads, derived onboarding-complete); the retirement of the
  `schools` harness surface; what CI proves (query mapping, persist predicate, store, screens) vs.
  on-device (offline behavior, nested-nav feel). Pointer style (R-1), not duplication.
- [ ] 14.4 Append an entry to `.claude/rules/mobile/architecture-changelog.md` (Live section): School
  selection (read path) — the first server read flow; the earned query policy + the MMKV-seam sync
  persister + `PersistQueryClientProvider` (ADR 013); the `mmkvQueryStorage` seam adapter; nested
  onboarding nav; the selection store; the `schools` harness surface retired (and `schools.yaml`
  replaced by `onboarding.yaml`). Note it is the first feature to read the server + persist a query
  cache offline.
- [ ] 14.5 **Update `.claude/rules/mobile/golden-path.md`** — the "closest real references today" list:
  replace the `schools-screen.tsx` / `schools-screen.test.tsx` / `.maestro/schools.yaml` references
  (now deleted) with the onboarding screens (`src/components/onboarding/`), their tests, the feature
  query layer (`src/features/school-selection/data/`), and `mobile/.maestro/onboarding.yaml`.
- [ ] 14.6 Update `docs/react-native-migration/01-roadmap/02-pattern-establishment.md` step 3: Feature C
  (School selection read path) landed — TanStack Query server read, the offline persister (ADR 013),
  nested onboarding nav, the selection store, the `schools` harness retired; **Feature C's full DoD pass
  is pending the inboxed on-device axes** (§13).
- [ ] 14.7 Create `docs/react-native-migration/inbox/2026-06-14-school-selection-dod-manual.md` (mirror
  `2026-06-14-personal-events-ui-dod-manual.md`): the §13 items, each with What / Why / How-to-verify /
  Blocks (per the inbox README convention).

## 15. Local verification (gates)

- [ ] 15.1 `npx tsc --noEmit` clean in `mobile/`.
- [ ] 15.2 `npm run lint` clean in `mobile/` (`--max-warnings 0`).
- [ ] 15.3 `npm test` green in `mobile/` (all §10 proofs + existing suites; the K-3 gate green, 90%
  logic + 70% floor; the deleted `schools-screen.test.tsx` removed cleanly).
- [ ] 15.4 `npx expo prebuild --clean` succeeds and a dev build launches with the persister + onboarding
  flow; **no native module added** (§12.14).

## 16. Validate

- [ ] 16.1 `npx openspec validate add-mobile-school-selection --strict` passes.
