# School selection (read path): the first real server-data read flow — TanStack Query, the offline query persister, nested onboarding navigation, full DoD

## Why

Phase 2's **Feature C — School selection / onboarding** (ADR
[004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md)) is the **third**
pattern-establishment feature and the **first real server-data read flow**. Features A
(Settings — local KV) and B (Personal events — device-local CRUD) are merged; neither read the
server. Feature C exists to validate exactly one new architectural axis: **server state + offline
read + nested navigation**.

This is also **the** feature the foundation deferred two load-bearing decisions to:

- The Architecture Book "Data layer → Query runtime" says the `QueryClient` ships with **stock
  defaults** and *"Query policy (staleTime/retry/offline persister) is deliberately unset — the
  first real server-read feature earns it."* **This is that feature.** It earns the query policy
  **and** the offline persister.
- The "Storage" section records the `@/storage` MMKV seam as wired-but-thin; Feature C is the first
  consumer to back a TanStack Query persister with it.

It also retires the scaffold's throwaway **`schools` harness surface**
(`mobile/src/components/schools-screen.tsx` + `mobile/src/app/schools.tsx` + `.maestro/schools.yaml`)
— the golden-path doc names these as the closest current references and says they **die when real
onboarding lands**. This change is what makes them die: the real onboarding flow becomes the live
server-round-trip surface and its Maestro flow becomes the round-trip proof.

Scope is held tight to the **read + select + persist** path. Calendar consumption of the selected
school/group is Phase 2's calendar (a later step); this change does not build it.

## What Changes

- **A real server read of schools and per-school groups via TanStack Query.** A new
  `src/features/school-selection/` feature folder reads `GET /schools`
  (`useSchoolControllerFindSchools`) and, for the chosen school, its groups
  (`useSchoolGroupControllerFindSchoolGroups(schoolId)` — the `SchoolGroupItem` tree). Feature code
  reaches the generated Orval hooks behind a thin `data/` query layer (mirroring B1's `data/` shape),
  never re-deriving the network call (the `customFetch` seam stays the only fetch path).
- **The earned query policy.** `src/app/_layout.tsx`'s `QueryClient` gets explicit, justified
  defaults (staleTime / gcTime / retry) instead of stock — the policy the Data-layer section
  deferred. Recorded in the ADR (D2).
- **Offline cache via a TanStack Query persister, backed by the existing `@/storage` MMKV seam.**
  `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister` (sync — MMKV is
  synchronous) persist the dehydrated query cache through a small `Storage`-shaped adapter added to
  the `@/storage` seam (so `react-native-mmkv` stays lint-banned outside the seam). The app mounts
  `PersistQueryClientProvider` instead of the bare `QueryClientProvider`. A cold launch offline shows
  the last-fetched schools/groups. No AsyncStorage (D1).
- **Nested onboarding navigation.** A school-selection flow with **nested routes** — pick a school →
  pick a group within that school — under a dedicated route group (e.g. `src/app/onboarding/`), built
  on the existing root `Stack` + `(tabs)` structure (route-as-thin-entrypoint over `@/components`
  modules; non-tab group as a `Stack` sibling of `(tabs)` — the route-structure rules). The shape is
  decided and recorded (D3).
- **Selection persistence.** Selecting a school (then a group) **persists a stored preference**
  through `@/storage` (mirroring Settings' prefs shape — a `school-selection/` feature folder with a
  typed, defensively-validated store), readable downstream by the future calendar. An
  onboarding-complete signal is derived from "a selection exists" (D4) — no separate flag invented.
- **The `schools` harness surface dies.** `mobile/src/components/schools-screen.tsx`,
  `mobile/src/components/schools-screen.test.tsx`, `mobile/src/app/schools.tsx`, the
  `<Stack.Screen name="schools" />` registration, the `schools.*` i18n keys, and
  `mobile/.maestro/schools.yaml` are removed; the new onboarding flow + its Maestro flow replace the
  round-trip proof (D5). The golden-path doc's "closest references" note is updated.
- **Full Definition of Done** walked axis-by-axis (automatable axes done; on-device axes inboxed +
  HUMAN-tagged), plus the Architecture Book "Data layer" + a new "School selection" section, the Rule
  changelog entry, a new **ADR** (the persister + query policy — load-bearing), the ADR README row,
  and the roadmap step-3 update.

## Non-Goals

- **No calendar consumption of the selection.** Reading the chosen school/group to fetch and render a
  timeline is Phase 2's calendar (roadmap step / ADR 005 spike). Feature C ends at "a selection is
  persisted and readable."
- **No server writes, no `SetSchoolGroups` / ical-url calls, no auth/login.** The read path only:
  `findSchools`, `findSchoolGroups`. `useSchoolGroupControllerSetSchoolGroups` /
  `GetSchoolGroupsIcalUrl` and any account flow are out of scope.
- **No school search UI** beyond a client-side filter over the fetched list (the `POST /schools/search`
  SEO endpoint is for web SEO, not onboarding — not wired).
- **No generic offline-sync / mutation-queue framework, no TanStack Query SQLite/Drizzle persister.**
  One read-cache persister over the existing KV seam (R-2); a richer persistence story is earned later.
- **No new `app.config.ts` / native-config change.** The persister + query packages are pure JS; the
  MMKV native module is already linked. (Confirmed at implementation by a clean `expo prebuild`.)
- **No OpenAPI regen / server / web / `app/` change.** The generated schools + school-group hooks and
  DTOs already exist (committed); Feature C consumes them unchanged.
- **No splitting `@/storage` into per-feature stores or a generic query/repository framework** — the
  feature owns its small typed store + query layer, copying the established feature-folder shape (R-2).
