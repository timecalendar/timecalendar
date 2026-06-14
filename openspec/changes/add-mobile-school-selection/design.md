# Design — School selection (read path): TanStack Query server read, the offline persister over the MMKV seam, nested onboarding nav, full DoD

## Context

This is **Feature C** of the Phase-2 pattern-establishment set (ADR
[004](../../../.claude/rules/mobile/decisions/004-phase-1-feature-order.md)): the **server-data read
flow**, after A (Settings — local KV, merged) and B (Personal events — device-local CRUD, merged). Its
job is to validate one new architectural axis: **server state + offline read + nested navigation**.

What already exists and Feature C builds on (verified in this repo):

- **The data-layer seam.** `mobile/src/api/generated/schools/schools.ts` (committed Orval output)
  exposes `useSchoolControllerFindSchools()` → `FindSchoolsRepDto { schools: SchoolForList[] }`,
  `useSchoolControllerFindSchool(id)`, and `useSchoolGroupControllerFindSchoolGroups(schoolId)` →
  `FindSchoolGroupsRepDto { groups: SchoolGroupItem[] }`, where `SchoolGroupItem = { text, value,
  children: SchoolGroupItem[] }` (a tree). Every operation routes through the single `customFetch`
  mutator (`src/api/mutator.ts`); `fetch`/`axios` are lint-banned outside it. **No regen needed.**
- **The `QueryClient`** is mounted in `src/app/_layout.tsx` with **stock defaults** — the Data-layer
  section says the first server-read feature earns the policy + persister. This is that feature.
- **The `@/storage` MMKV seam** (`src/storage/index.ts`) — one module-scoped `createMMKV()`,
  `getString`/`setString`/`remove`/`useStoredString`; `react-native-mmkv` is **lint-banned outside
  `src/storage/**`** (`storageBackendImportPatterns`).
- **The feature-folder shape** — `src/features/settings/prefs/` (typed store + validators + reactive
  hooks) and `src/features/personal-events/{data,form}/` (a `data/` query/repository layer + a barrel).
  Feature C mirrors `src/features/<feature>/<layer>/`.
- **The route-structure rules** — a tested screen lives in `src/components/<name>.tsx` with a thin
  `src/app/<name>.tsx` re-export (keeps the colocated `*.test.tsx` out of the Metro route tree);
  non-tab routes are `Stack` siblings of `(tabs)` (a bare sibling under the native tabs is unreachable).
- **The `schools` harness surface** — `schools-screen.tsx` / `schools-screen.test.tsx` /
  `src/app/schools.tsx` / `.maestro/schools.yaml`, the live round-trip surface the golden-path doc
  says **dies when real onboarding lands**. Feature C is that onboarding.

Constraints (all binding — Architecture Book): R-1 (encode before document); R-2 (no speculative
divergence); R-3 (the platform is the design reference, not the Flutter onboarding); the K-3 coverage
gate (ADR [003](../../../.claude/rules/mobile/decisions/003-coverage-threshold.md): 90%
lines+branches on `src/{features,hooks,storage,db,i18n,firebase,theme}/**`, 70% global floor — so
**query/store logic lives under `src/features/` (90%), presentational screens under `src/components/`
(70%)**); flat typed i18n keys with `tsc`-typed FR/EN parity; a11y roles/labels/touch targets.

## Goals / Non-Goals

**Goals:**
- A real `GET /schools` + per-school `GET .../school-groups` read via TanStack Query, behind a thin
  feature `data/` query layer (the generated hooks are reached there, not at screens).
- The **earned query policy** (staleTime/gcTime/retry) on the `QueryClient` (D2).
- **Offline cache via a sync TanStack Query persister backed by the `@/storage` MMKV seam** (D1) — a
  cold launch offline shows the last-fetched schools/groups.
- A **nested onboarding flow** (pick school → pick group) as a route group, route-structure-compliant
  (D3).
- **Selection persistence** through `@/storage` (a typed, validated store mirroring Settings prefs),
  readable downstream; onboarding-complete derived from "a selection exists" (D4).
- **Retire the `schools` harness surface**; the onboarding Maestro flow replaces the round-trip proof
  (D5).
- Full i18n (FR+EN), a11y, the full DoD walked; CI proof tests for the query layer, the store, and the
  screens; a Maestro real-round-trip flow.

**Non-Goals:** calendar consumption of the selection; server writes / `SetSchoolGroups` / ical-url /
auth; an SEO `POST /schools/search` UI; a generic offline-sync / mutation-queue / SQLite-persister
framework; an `app.config.ts`/native change; OpenAPI regen / server / web / `app/` change; a
per-feature `@/storage` split. (See proposal Non-Goals for the full list + rationale.)

## Decisions

### D1 — Offline cache: a **sync** TanStack Query persister backed by the `@/storage` MMKV seam (load-bearing → ADR 013)

The Data-layer section deferred the "offline persister" to this feature. The trade space:

1. **`@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister`, backed by
   MMKV through the `@/storage` seam.** `createSyncStoragePersister` takes a synchronous
   `Storage`-shaped object (`{ getItem(key): string | null; setItem(key, value): void;
   removeItem(key): void }`). **MMKV is synchronous (JSI / Nitro)** — so a *sync* persister is the
   natural, zero-async-overhead fit: persistence happens inline, no `await`, no extra event loop turn.
   We already have the MMKV seam; the persister rides it. Both packages are version-locked to the
   installed `@tanstack/react-query@5.101.0` (`5.101.0`, peer `@tanstack/react-query: ^5.101.0` —
   verified via `npm view`). Pure JS, no native link.
2. **`@tanstack/query-async-storage-persister` + `@react-native-async-storage/async-storage`.** The
   TanStack RN docs' default pairing. Rejected: it adds a **new native dependency** (AsyncStorage) and
   a second KV backend alongside the MMKV seam we already own — the storage step's whole point was one
   swappable KV seam; introducing AsyncStorage *only* for the query cache fragments that. MMKV is also
   faster (synchronous JSI vs. AsyncStorage's async bridge). No concrete reason to pay that cost.
3. **A Drizzle/SQLite-backed query persister.** Over-built for a read cache (R-2) — the `@/db` seam is
   for structured relational data (personal events), not a dehydrated-blob cache. Deferred.

**Decision: option (1) — the sync persister over the MMKV seam.** Because `react-native-mmkv` is
lint-banned outside `src/storage/**`, the `Storage`-shaped adapter the persister needs **lives in the
`@/storage` seam** — a small added export (e.g. `mmkvQueryStorage: { getItem, setItem, removeItem }`
over the seam's existing module-scoped instance, mapping `getItem → getString ?? null`, `setItem →
setString`, `removeItem → remove`). This is the encoded form of "the persister rides the seam, not the
backend." The persister itself (`createSyncStoragePersister({ storage: mmkvQueryStorage, key })`) is
constructed in the query infra (`src/features/school-selection/data/` or a small `src/api/persist.ts`
infra module — see D6) and handed to `PersistQueryClientProvider` in `_layout.tsx`.

**Dehydrate / serialize policy (recorded so it isn't re-derived):**
- **`maxAge`** — how long a persisted cache is restored before being discarded (e.g. 24h). Stale data
  is still better than a blank onboarding offline; a network reconnect refetches.
- **`buster`** — a cache-version string (e.g. the persist key includes a schema version) so a shape
  change invalidates old caches rather than rehydrating an incompatible blob.
- **`dehydrateOptions.shouldDehydrateQuery`** — persist **only** the schools + school-groups queries
  (matched by query-key prefix), not the whole cache, so unrelated transient queries aren't written to
  disk. Keeps the persisted blob small and intentional.
- Default JSON serialize/deserialize (the DTOs are plain JSON — `SchoolForList`, `SchoolGroupItem`).

**This is load-bearing and cross-cutting** — every future server read inherits this persister + the
query policy (D2). It earns an **ADR (013)**: the choice of MMKV-seam-backed sync persister over
AsyncStorage, the dehydrate policy, and the now-set query policy, with the rejected alternatives.

### D2 — The earned query policy (staleTime / gcTime / retry), recorded with the persister (ADR 013)

The `QueryClient` defaults were deliberately stock; this feature sets them. The policy (concrete
numbers finalized by the implementer within this rationale):
- **`staleTime`** — schools/groups change rarely (a school list is near-static), so a non-zero
  `staleTime` (e.g. 5–15 min) avoids refetching on every screen focus; with the persister, a restored
  cache within `staleTime` renders without a network hit at all.
- **`gcTime`** — at least `maxAge` (≥ the persister window) so an in-memory query isn't garbage-
  collected before the persister would restore it; the TanStack persist-client docs require
  `gcTime >= maxAge`. Recorded as a constraint, not a free choice.
- **`retry`** — a small bounded retry (e.g. 2) with the default backoff, so a flaky mobile network
  recovers without spinning forever; `isError` still surfaces a real failure (the screens render an
  error + retry affordance).
- Policy is set on the `QueryClient`'s `defaultOptions.queries` (one place), not per-hook, so it's the
  app-wide read default Feature C establishes. A future read needing different freshness overrides
  per-query.

Recorded in ADR 013 alongside the persister (one cross-cutting "how the app reads + caches the server"
decision). Rejected: leaving stock defaults (then the persister window and `gcTime` mismatch, and
offline-first doesn't actually hold — `staleTime: 0` refetches and shows the error state online-flaky);
aggressive `staleTime: Infinity` (a school list *does* change occasionally — a bounded window + refetch
is right).

### D3 — Nested onboarding navigation: a route group `src/app/onboarding/` with thin entrypoints over `@/components` modules

The axis Feature C must exercise includes **nested navigation**. The shape, reconciled with the
existing root `Stack` + `(tabs)`:

- **An `onboarding` route group** — `src/app/onboarding/_layout.tsx` declaring a **nested `Stack`**,
  with two routes: `index.tsx` (pick a school) and `groups.tsx` (pick a group within the chosen
  school, taking the `schoolId` as a route param). This is a `Stack` **sibling of `(tabs)`** at the
  root (registered as `<Stack.Screen name="onboarding" />` in `src/app/_layout.tsx`), so it's
  reachable and the nested stack gives the real push/back nav between school → group (the axis).
- **Each route is a thin entrypoint** — `src/app/onboarding/index.tsx` = `export { default } from
  "@/components/onboarding/school-picker-screen"`, `src/app/onboarding/groups.tsx` = `export { default
  } from "@/components/onboarding/school-group-picker-screen"` — keeping the tested screens and their
  `*.test.tsx` out of the Metro route tree (route-structure rule). The `_layout.tsx` for the group is a
  thin route layout (no test).
- **Entry + deep links.** The flow is reachable from the Profile tab (an accessible "Choose your
  school" link, mirroring A2's Profile→Settings link) and via dev deep links
  `timecalendar-dev://onboarding` (school list — the Maestro target, replacing the `schools` deep link)
  and `timecalendar-dev://onboarding/groups?schoolId=<id>` (the nested step). The school picker
  navigates to `onboarding/groups?schoolId=<id>` on selection (the push); selecting a group persists
  the selection (D4) and pops back / returns to the entry.

*Whether it's a tab vs. modal vs. onboarding gate (open question, resolved):* **not a tab** (school
selection isn't a primary destination — it's a one-time-ish flow) and **not a hard startup gate** this
change (gating first paint on "no school selected" pulls in the calendar/home dependency and is a
larger product decision — R-2; the read path is the scope). It's a **reachable nested Stack flow** off
Profile + deep link. The "onboarding gate" (force the flow on first launch) is recorded as a deferral
owned by the calendar/home step that actually needs a selected school. Rejected: a single flat screen
with both pickers (no nested nav — fails the axis the feature exists to validate); putting the screens
in `src/features/.../screens/` (drags presentation under the 90% gate — contra ADR 003 / the
route-structure `src/components/` home).

### D4 — What "selecting a school" persists: a typed, validated `@/storage` store (mirroring Settings prefs); onboarding-complete derived, not flagged

Selecting a school (and then a group) **persists a stored preference** through `@/storage`, mirroring
`src/features/settings/prefs/` exactly:
- A `src/features/school-selection/store/` (or `prefs/`) layer: `types.ts` (the persisted shape +
  flat namespaced keys `schoolSelection.schoolId` / `schoolSelection.groupValues` + **defensive
  validators** — a read is total, an unset/corrupt value reads as "no selection"), `store.ts`
  (imperative get/set over `@/storage` `getString`/`setString`), `hooks.ts` (reactive
  `useSelectedSchool()` over `useStoredString`, so a consumer re-renders when the selection changes).
- **What's stored:** the selected `schoolId` (string), and the selected group path — `SchoolGroupItem`
  is a tree and a selection is a path/leaf, so persist the selected group `value`(s) as a JSON-encoded
  string under one key (the seam stores strings; the store owns the JSON encode/parse + validation,
  the one place it lives). Minimal — the `id`/`value`s the future calendar needs to fetch a timeline,
  not the whole DTO (which the query cache already holds + the persister restores).
- **Onboarding-complete is derived, not a separate boolean** (R-2): "complete" = "a `schoolId` (and,
  for group-requiring schools, a group) is selected." No invented `onboardingComplete` flag — the
  selection's existence *is* the signal. The future startup gate (deferred — D3) reads this derived
  predicate.

Rejected: storing the full `SchoolForList`/group DTO (duplicates the query cache — store only the
identity); a separate `onboardingComplete` flag (redundant state that can desync from the actual
selection — derive it); putting the store under `src/storage/school-selection.ts` (that's the *backend*
seam, not a feature — the selection is the feature's domain, mirroring ADR 009's reasoning).

### D5 — Retire the `schools` harness surface; the onboarding Maestro flow becomes the round-trip proof

The golden-path doc names `schools-screen.tsx` / `schools-screen.test.tsx` / `.maestro/schools.yaml` /
`src/app/schools.tsx` as the closest references and says they **die when real onboarding lands**.
Feature C makes them die:
- **Delete** `mobile/src/components/schools-screen.tsx`, `mobile/src/components/schools-screen.test.tsx`,
  `mobile/src/app/schools.tsx`; **remove** `<Stack.Screen name="schools" />` from `_layout.tsx`; remove
  the now-orphaned `schools.*` i18n keys from `en.json`/`fr.json` (verify no other consumer); **delete**
  `mobile/.maestro/schools.yaml`.
- **Replace the round-trip proof** with `mobile/.maestro/onboarding.yaml`: cold-launch the dev variant,
  deep-link `timecalendar-dev://onboarding`, assert the seeded school **"My Gaming Academia"** (the
  `visible: true` fixture in `server/src/modules/school/fixtures/school.fixtures.yml`, ASCII-only —
  same assertion `schools.yaml` used) renders from the **live** `GET /schools` (app → generated client →
  `customFetch` → NestJS → Postgres, nothing mocked). Optionally tap the school → assert the nested
  groups step opens (a second live read of `GET .../school-groups`). The flow proves the new real
  read flow end-to-end exactly as `schools.yaml` proved the harness.
- **Update the golden-path doc** — the "closest references today" list points at the new onboarding
  screens/test/Maestro flow (the schools-surface references are gone).

This is deliberate: the harness surface was always a placeholder for this feature (its file headers and
the Architecture Book say so). Rejected: keeping `schools-screen.tsx` alongside the real flow (dead
duplicate surface + a second Maestro flow asserting the same thing — the golden-path doc explicitly
says it dies).

### D6 — Feature folder layout: query layer in `data/`, store in `store/` (90%-gated); screens presentational (70% floor)

Mirroring B1/B2 and the K-3 gate (ADR 003 — the forcing function):
- **Logic — `src/features/school-selection/`** (90% glob):
  - `data/queries.ts` — the thin query layer: `useSchools()` (wraps `useSchoolControllerFindSchools`,
    returns `{ schools, isLoading, isError, refetch }` mapped to a small domain shape) and
    `useSchoolGroups(schoolId)` (wraps `useSchoolGroupControllerFindSchoolGroups`). The **only** place
    the generated hooks are imported — screens consume `@/features/school-selection`. (A future
    feature-boundary lint, TIM-135, formalizes "only `data/` touches generated hooks"; until then,
    review + this layout.)
  - `data/persist.ts` (or `src/api/persist.ts` — implementer's call, recorded) — `createSyncStoragePersister`
    over the seam adapter + the `persistOptions` (maxAge/buster/shouldDehydrateQuery). Pure config,
    unit-testable (the dehydrate predicate is the bit worth a test).
  - `store/types.ts` / `store/store.ts` / `store/hooks.ts` — the selection store (D4).
  - `index.ts` — the barrel (`useSchools`, `useSchoolGroups`, `useSelectedSchool`, `selectSchool`/
    `selectGroup`, the persist config, the types).
- **The `Storage` adapter** lives in `src/storage/index.ts` (the seam — D1), exported as e.g.
  `mmkvQueryStorage`. The persister imports it from `@/storage`.
- **Presentation — `src/components/onboarding/`** (70% floor, behavior-tested):
  `school-picker-screen.tsx` (the list over `useSchools()` — loading/error/empty + accessible rows +
  an optional client-side text filter), `school-group-picker-screen.tsx` (the nested `SchoolGroupItem`
  tree over `useSchoolGroups(schoolId)` — a selectable, expandable group list), and a small
  `school-row.tsx` / `group-tree.tsx` if extraction helps. Each screen holds only render + navigation
  + calls into the feature barrel.

Rejected: query hooks inline in screens (untestable-without-render, loses the 90% guarantee on the
mapping logic + the persist predicate); screens under `src/features/.../screens/` (contra ADR 003 / the
route-structure `src/components/` home).

### D7 — Loading / error / offline UX (a11y), and the SchoolGroupItem tree rendering

- **Loading / error / empty** states on both screens carry `accessibilityLiveRegion="polite"` + a
  status role (mirroring the retiring `schools-screen.tsx` — the one good a11y pattern it leaves
  behind), translated. The error state offers an accessible **retry** (calls the query's `refetch`).
- **Offline:** with the persister, a cold launch offline rehydrates the last cache and renders it; the
  screen shows the data (optionally a subtle "showing saved data" affordance — recorded as optional, not
  required for the read-path MVP). No crash, no blank — the persister + the bounded `retry` cover it.
- **The group tree:** `SchoolGroupItem` is `{ text, value, children[] }`. The group picker renders the
  tree — a leaf (`children: []`) is selectable; a branch expands. Keep it proportionate: a single-level
  or simple expandable list is fine for the MVP (the axis is *nested navigation + server read*, not a
  rich tree widget — R-3). Selecting a leaf persists the group `value` (D4) and completes the flow.

### D8 — `PersistQueryClientProvider` in `_layout.tsx`; restore is non-blocking past the splash

`src/app/_layout.tsx` swaps the bare `<QueryClientProvider client={queryClient}>` for
`<PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>` (from
`@tanstack/react-query-persist-client`). With the **sync** persister the restore is synchronous, so
there's no async restore gate to coordinate with the splash — the existing `useAppReady()` /
`<SplashScreen />` wiring is untouched (the splash already gates first paint; the cache is restored by
the time queries run). The `queryClient` keeps its module-scope; the persister + `persistOptions` are
module-scoped too (built once). The existing `import "@/i18n"` + `void runMigrations()` +
`<SplashScreen />` wiring is preserved.

Rejected: the async persister + the `PersistQueryClientProvider` `onSuccess`/`isRestoring` blocking gate
(unnecessary with a sync persister — adds a loading state for a restore that's instant; the sync
persister is exactly why this stays simple — reinforces D1).

## Risks / Trade-offs

- **The persister + query policy are cross-cutting and copied by every future read.** Highest-leverage
  decision here. Mitigated by ADR 013 (recorded rationale + revisit-if) and by keeping the policy in
  one place (`QueryClient.defaultOptions`) so a change is one edit.
- **A persisted-cache shape change could rehydrate an incompatible blob.** Mitigated by the `buster`
  (cache version) — a bump discards old caches. Recorded in the dehydrate policy (D1).
- **MMKV value size for the persisted cache.** The schools list + a few group trees are small JSON; MMKV
  handles it fine. `shouldDehydrateQuery` keeps only the intended queries on disk. If a cache ever grows
  large, that's the revisit trigger (ADR 013) — not a problem at this scale.
- **Deleting the `schools` harness is irreversible-ish in spirit** (it was the golden-path reference).
  Mitigated: the new onboarding flow + Maestro flow *are* the replacement reference (golden-path doc
  updated); a plain `git revert` restores the files if needed (no schema/data).
- **`SchoolGroupItem` tree depth varies by school.** Some schools have a flat group list, some nested.
  Mitigated by the proportionate expandable-list render (D7) — not a bespoke deep-tree widget (R-2);
  the seeded fixtures (e.g. Université Gustave Eiffel, `assistant: groups`) exercise a real tree in the
  Maestro flow.
- **Online-flaky vs. offline.** The bounded `retry` + the persisted cache mean a flaky network degrades
  to "last-known data" rather than an error wall; a genuinely-failed first-ever fetch (no cache) shows
  the error + retry. Both paths are CI-tested (mock the query hook's states).
- **No startup onboarding gate this change.** A user can open the app without selecting a school. Accepted
  — gating first paint is the calendar/home step's decision (D3 deferral); Feature C's scope is the read
  + select + persist path, reachable from Profile + deep link.

## Migration Plan

Additive + one deletion (the harness surface); rollback = revert (no schema, no migration, no native
hand-edits, no data — the new routes/components/store/keys/persister disappear and the `schools` files
come back). Order: install the two persister packages (`npm install` in `mobile/`, version-locked to
react-query 5) → add the `mmkvQueryStorage` adapter to `src/storage/index.ts` + its seam test → set the
`QueryClient` query policy + build the persister config (`persist.ts`) + its dehydrate-predicate test →
swap `_layout.tsx` to `PersistQueryClientProvider` → build `src/features/school-selection/data/queries.ts`
(the query layer over the generated hooks) + `store/` (the selection store, mirroring prefs) + their 90%
tests → add FR/EN `onboarding.*` i18n keys → build `src/components/onboarding/` screens + the thin
`src/app/onboarding/` routes + the nested `_layout.tsx` + the Profile entry link → register
`<Stack.Screen name="onboarding" />` in `_layout.tsx` → **delete the `schools` harness surface**
(component, test, route, Stack registration, i18n keys) → write the screen proof tests → write
`mobile/.maestro/onboarding.yaml` (replacing `schools.yaml`) → confirm a clean `expo prebuild` + dev
build (persister is pure JS — no native change expected) → ADR 013 + README row, Architecture Book
("Data layer → Query runtime/persister" + a new "School selection" section + the golden-path doc update)
+ changelog, roadmap step 3, inbox file. Gate on `npx tsc --noEmit`, `npm run lint` (zero warnings),
`npm test` (all proofs + K-3 gate green). No `app.config.ts`/babel change; no OpenAPI regen; no
server/web/`app/` touch.

## Open Questions

Resolved by judgment (recorded for sanity-check):
- **Persister: MMKV-seam sync vs. AsyncStorage async** → MMKV-seam sync (D1), because MMKV is synchronous
  and already the app's KV seam; AsyncStorage would add a second native KV backend for no gain. (The one
  call most worth a second look — flagged in the return note.)
- **Onboarding shape: tab vs. modal vs. gate** → a reachable nested `Stack` route group off Profile +
  deep link, **not** a startup gate (D3) — the gate pulls in the calendar/home dependency (R-2); deferred
  to that step.
- **Store the full DTO or just identity** → just `schoolId` + selected group `value`(s) (D4); the query
  cache + persister hold the DTOs.

Deferred (recorded, not built): the startup onboarding gate (calendar/home step — D3); calendar
consumption of the selection (Phase 2 calendar — Non-Goals); a richer offline-sync/mutation-queue or
SQLite query persister (R-2 — D1); a school-search SEO UI (Non-Goals); the manual on-device DoD axes
(inbox — tasks §10).
