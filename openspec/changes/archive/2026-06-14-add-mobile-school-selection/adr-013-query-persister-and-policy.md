# 013 — Offline query cache: a sync TanStack Query persister over the MMKV `@/storage` seam, plus the now-earned query policy

> Origin: the `add-mobile-school-selection` change (TIM-134 / C1), design D1 + D2.
> Phase-2 Feature C, the first real server-data read flow. The full wiring lives in
> the Architecture Book "Data layer → Query runtime" and the new "School selection"
> section; this is the load-bearing decision. Discharges the foundation deferral
> "Query policy (staleTime/retry/offline persister) is deliberately unset — the first
> real server-read feature earns it."

## Status

Accepted.

## Context

Feature C (School selection, ADR [004](./004-phase-1-feature-order.md)) is Phase 2's third feature and
the **first to read the server**. The Architecture Book's "Data layer → Query runtime" deliberately
shipped the `QueryClient` with **stock defaults** and recorded that the offline persister and the query
policy (staleTime/retry/gcTime) are **unset until the first real server-read feature earns them**
(migration-approach principle 5). This is that feature, so two cross-cutting decisions — copied by every
later server read and costly to reverse — earn an ADR (R-4):

1. **How the query cache is persisted for offline read.** TanStack Query offers two persister families:
   a **sync** persister (`createSyncStoragePersister`, a synchronous `Storage`-shaped backend) and an
   **async** persister (`createAsyncStoragePersister`, typically over `@react-native-async-storage/
   async-storage`). The app already owns a **synchronous** MMKV key-value seam (`@/storage`, over
   `react-native-mmkv` v4 / Nitro), with `react-native-mmkv` lint-banned outside `src/storage/**`.
2. **The query policy** — staleTime / gcTime / retry — the Data-layer section deferred to here.

## Decision

**(1) A sync persister backed by the MMKV `@/storage` seam.** Use
`@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister` (version-locked to
the installed `@tanstack/react-query@5.101.0` — both `5.101.0`, peer `^5.101.0`, pure JS, no native
link). MMKV is synchronous (JSI), so `createSyncStoragePersister` is the natural fit — persistence is
inline, no async restore gate. Because `react-native-mmkv` is lint-banned outside the seam, the
`Storage`-shaped adapter the persister needs (`{ getItem, setItem, removeItem }`) **lives in the
`@/storage` seam** (e.g. `mmkvQueryStorage`, mapping to `getString ?? null` / `setString` / `remove`);
the persister rides the seam, never the backend. The root layout mounts
`PersistQueryClientProvider`. **Dehydrate policy:** a `maxAge` window (restore-then-discard), a `buster`
cache-version string (a shape change discards old caches rather than rehydrating an incompatible blob),
and `shouldDehydrateQuery` persisting **only** the schools + school-groups queries (a small, intentional
blob — not the whole cache).

**(2) The earned query policy** on `QueryClient.defaultOptions.queries` (one place, app-wide default):
a non-zero `staleTime` (schools/groups are near-static — avoid refetch-on-focus; a restored cache within
`staleTime` renders with no network hit), a `gcTime >= maxAge` (so an in-memory query isn't collected
before the persister would restore it — a hard constraint the persist-client requires), and a bounded
`retry` (a flaky mobile network recovers; a genuine failure still surfaces `isError` + an accessible
retry). Per-query overrides are available for a future read with different freshness.

*Rejected:* (1a) the **async persister over AsyncStorage** — adds a new native KV dependency and a second
KV backend alongside the MMKV seam we already own, for no gain (MMKV is faster and synchronous; the
storage step's point was one swappable KV seam — R-2). (1b) a **Drizzle/SQLite query persister** —
over-built for a dehydrated read-cache blob; `@/db` is for structured relational data (R-2), deferred.
(2a) **leaving stock defaults** — then `gcTime`/`maxAge` mismatch and offline-first doesn't hold
(`staleTime: 0` refetches and shows the error wall on a flaky network). (2b) `staleTime: Infinity` — a
school list *does* change occasionally; a bounded window + refetch is correct.

## Consequences

- Every later server read inherits this persister + policy. The query policy is one edit
  (`QueryClient.defaultOptions`); the persisted set grows by adding a query-key prefix to
  `shouldDehydrateQuery`.
- The `@/storage` seam gains a `Storage`-shaped export (`mmkvQueryStorage`) — the encoded form of "the
  persister rides the seam, not the backend"; `react-native-mmkv` stays banned outside the seam (lint).
- Two pure-JS dependencies enter `mobile/package.json` (the two persister packages); **no native link,
  no `app.config.ts`/babel change** (confirmed by a clean `expo prebuild`).
- A persisted-cache shape change is handled by bumping the `buster` (old caches discarded). Recorded so a
  future editor bumps it rather than debugging a rehydrated incompatible blob.
- A cold launch offline shows last-known data instead of a blank/error onboarding; a genuinely-failed
  first-ever fetch (no cache) shows the error + retry. Both paths are CI-tested at the `customFetch` seam.
- The K-3 gate covers the persist config's dehydrate predicate (90% logic glob) + the query layer.

## Revisit if

- The persisted cache grows large enough that synchronous MMKV writes cause jank (move to the async
  persister, or to a SQLite-backed persister — the backend swaps behind the `@/storage` adapter / the
  persister config, not at call sites).
- A read genuinely needs offline *mutation* queuing / sync (this read-only persister doesn't cover writes
  — that's a later, separate decision).
- The query policy's `staleTime`/`retry` proves wrong for a later, more dynamic server read (override
  per-query, or re-weigh the app-wide default here).
