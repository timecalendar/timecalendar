import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import type { Query } from "@tanstack/react-query"
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client"

import {
  getSchoolControllerFindSchoolsQueryKey,
  getSchoolGroupControllerFindSchoolGroupsUrl,
} from "@/api/generated/schools/schools"
import { QUERY_MAX_AGE_MS } from "@/api/query-client"
import { mmkvQueryStorage } from "@/storage"

// The offline query persister (ADR 013 / design D1) — a SYNC persister backed by
// the @/storage MMKV seam (via the seam's mmkvQueryStorage adapter, never the
// backend directly). MMKV is synchronous, so restore is inline — no async gate.
// Pure JS, no native link.

// Bump this on ANY persisted-shape change so old caches are discarded rather
// than rehydrating an incompatible blob (the buster — design D1).
const PERSIST_BUSTER = "v1"

// The single persisted-cache key in the @/storage seam.
const PERSIST_KEY = "rq.schoolSelection.cache"

const persister = createSyncStoragePersister({
  storage: mmkvQueryStorage,
  key: PERSIST_KEY,
})

// The schools list query key prefix: ["/schools"].
const SCHOOLS_KEY = getSchoolControllerFindSchoolsQueryKey()[0]
// The per-school groups query key always ends in this suffix
// (["/schools/<id>/school-group"]) — match by suffix so any schoolId qualifies
// while the single-school query (/schools/<id>) is NOT persisted.
const GROUPS_KEY_SUFFIX = getSchoolGroupControllerFindSchoolGroupsUrl("").slice(
  -"/school-group".length,
)

// Persist ONLY the schools + school-groups queries (a small, intentional blob —
// not the whole cache), matched by the generated query-key shape.
export function shouldDehydrateQuery(query: Query): boolean {
  const first = query.queryKey[0]
  if (typeof first !== "string") return false
  return first === SCHOOLS_KEY || first.endsWith(GROUPS_KEY_SUFFIX)
}

export const persistOptions: Omit<PersistQueryClientOptions, "queryClient"> = {
  persister,
  // How long a persisted cache is restored before being discarded — stale data
  // beats a blank onboarding offline; a reconnect refetches. == gcTime (ADR 013).
  maxAge: QUERY_MAX_AGE_MS,
  buster: PERSIST_BUSTER,
  dehydrateOptions: { shouldDehydrateQuery },
}
