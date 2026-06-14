import type { Query } from "@tanstack/react-query"

import { QUERY_MAX_AGE_MS } from "@/api/query-client"

import { persistOptions, shouldDehydrateQuery } from "./persist"

// Pure config — no render. Asserts the dehydrate predicate persists ONLY the
// schools/groups queries, and that maxAge/buster/key are set as configured.
const queryWithKey = (queryKey: readonly unknown[]) =>
  ({ queryKey }) as unknown as Query

describe("shouldDehydrateQuery", () => {
  it("persists the schools list query", () => {
    expect(shouldDehydrateQuery(queryWithKey(["/schools"]))).toBe(true)
  })

  it("persists a per-school groups query (any schoolId)", () => {
    expect(
      shouldDehydrateQuery(queryWithKey(["/schools/univeiffel/school-group"])),
    ).toBe(true)
  })

  it("does NOT persist an unrelated query", () => {
    expect(shouldDehydrateQuery(queryWithKey(["/calendars"]))).toBe(false)
  })

  it("does NOT persist the single-school detail query", () => {
    expect(shouldDehydrateQuery(queryWithKey(["/schools/univeiffel"]))).toBe(
      false,
    )
  })

  it("returns false for a non-string query key", () => {
    expect(shouldDehydrateQuery(queryWithKey([123]))).toBe(false)
  })
})

describe("persistOptions", () => {
  it("sets maxAge to the configured window, a buster, and a persister", () => {
    expect(persistOptions.maxAge).toBe(QUERY_MAX_AGE_MS)
    expect(persistOptions.buster).toBe("v1")
    expect(persistOptions.persister).toBeDefined()
    expect(persistOptions.dehydrateOptions?.shouldDehydrateQuery).toBe(
      shouldDehydrateQuery,
    )
  })
})
