import { is } from "drizzle-orm"
import type { AnySQLiteSelect } from "drizzle-orm/sqlite-core"
import { getTableConfig, SQLiteTable } from "drizzle-orm/sqlite-core"
import { addDatabaseChangeListener } from "expo-sqlite"
import { useEffect, useState } from "react"

// The seam's reactive relational read — a DROP-IN for Drizzle's `useLiveQuery`
// (same `(query, deps?)` signature, same `{ data, error, updatedAt }` return), so
// no consumer changes when the @/db seam swaps its re-export for this. It exists
// because the stock hook re-runs its FULL query on EVERY expo-sqlite change event,
// and expo-sqlite fires that event PER ROW (sqlite3_update_hook) while the Drizzle
// expo driver executes queries SYNCHRONOUSLY on the JS thread: a bulk write of N
// rows to an observed table emits ~2N events → ~2N synchronous whole-table
// re-reads per mounted subscriber → the JS thread pegs for minutes on a real
// calendar (~588 events). This wrapper collapses a change burst into ONE trailing
// re-read (O(N) not O(N²), ADR 021 revisit-trigger fix), and adds the cancellation
// guard the stock hook lacks (a late resolve must not land after unmount / a deps
// change). Only db.select().from(table) queries are observed — every call site is
// a select, never a relational `.query` (D2). Re-verify the query.config.table /
// getTableConfig touchpoints on any drizzle-orm upgrade.

// One frame — a trailing window small enough to be imperceptible yet enough to
// collapse a post-commit burst. The D3 synchronous transaction delivers a bulk
// write's events as one tight burst after COMMIT, so any small value coalesces it;
// pinned by the deterministic burst-then-single-read test.
const COALESCE_WINDOW_MS = 0

export function useLiveQuery<T extends Pick<AnySQLiteSelect, "_" | "then">>(
  query: T,
  deps: unknown[] = [],
): { data: Awaited<T>; error: Error | undefined; updatedAt: Date | undefined } {
  const [data, setData] = useState<Awaited<T>>([] as Awaited<T>)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [updatedAt, setUpdatedAt] = useState<Date | undefined>(undefined)

  // Resolve the observed table (the single drizzle-internal touchpoint) and its
  // name via the public getTableConfig — during render, so the "unsupported query"
  // case surfaces as a derived error rather than a synchronous setState in the
  // effect (which triggers cascading renders). A cheap pure lookup, so it needs no
  // memo. Only db.select().from(table) selects carry `config.table`; anything else
  // yields a null name (no subscription).
  const entity = (query as { config?: { table?: unknown } }).config?.table
  const tableName = is(entity, SQLiteTable) ? getTableConfig(entity).name : null

  useEffect(() => {
    if (tableName === null) return

    // Ignore any in-flight/pending re-read once this effect is torn down (unmount
    // or a deps change): the stock hook removes only the listener, so a late
    // `then` could setData against a stale subscription. `active` closes that gap.
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const runRead = () => {
      query
        .then((rows) => {
          if (!active) return
          setData(rows as Awaited<T>)
          setUpdatedAt(new Date())
        })
        .catch((e: unknown) => {
          if (active) setError(e as Error)
        })
    }

    // The INITIAL read runs immediately so first paint is never delayed; only
    // change-triggered re-reads are coalesced.
    runRead()

    // Each change event for the observed table (re)schedules a SINGLE trailing
    // re-read: a burst collapses to one re-query, and the burst's final event
    // always schedules a read that runs (the guaranteed-final-run).
    const listener = addDatabaseChangeListener(({ tableName: changed }) => {
      if (changed !== tableName) return
      if (timer !== undefined) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = undefined
        runRead()
      }, COALESCE_WINDOW_MS)
    })

    return () => {
      active = false
      if (timer !== undefined) clearTimeout(timer)
      listener.remove()
    }
    // deps is the caller-provided dependency array (the stock hook's contract);
    // query/tableName are intentionally not tracked — same posture as the drizzle
    // hook this replaces.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // An unsupported query (no observed table) has no subscription — surface it as a
  // derived error without ever writing state from the effect.
  const resolvedError =
    tableName === null
      ? new Error("useLiveQuery supports only db.select().from(table) queries")
      : error

  return { data, error: resolvedError, updatedAt }
}
