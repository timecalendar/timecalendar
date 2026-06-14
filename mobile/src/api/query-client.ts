import { QueryClient } from "@tanstack/react-query"

// The app-wide read policy (ADR 013 / design D2), the first server-read feature
// (School selection) earns it — the QueryClient previously shipped with stock
// defaults. Set once on defaultOptions.queries so it is the app-wide default; a
// future read needing different freshness overrides per-query.
//
// These are config-shape (not lint-encodable), so the reason rides each constant
// here (R-1 prose-at-the-constant).
export const QUERY_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24h — the persister window.

const queryDefaults = {
  // Schools/groups are near-static — a non-zero staleTime avoids refetching on
  // every screen focus; with the persister, a restored cache within staleTime
  // renders with no network hit at all.
  staleTime: 10 * 60 * 1000, // 10 min
  // MUST be >= the persister's maxAge so an in-memory query isn't garbage-
  // collected before the persister would restore it — a hard constraint the
  // persist-client requires (ADR 013). Kept equal to maxAge.
  gcTime: QUERY_MAX_AGE_MS,
  // A small bounded retry so a flaky mobile network recovers without spinning
  // forever; a genuine failure still surfaces isError (the screens render an
  // accessible error + retry).
  retry: 2,
} as const

// Module-scoped client (one per app), built once. Mounted by the root layout's
// PersistQueryClientProvider.
export const queryClient = new QueryClient({
  defaultOptions: { queries: queryDefaults },
})
